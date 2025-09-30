from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from pathlib import Path
from uuid import uuid4, UUID
import json
import asyncio
import os
from dotenv import load_dotenv
from typing import Awaitable, Callable, Optional, Any

from celery import Celery
import redis.asyncio as aioredis
from redis.asyncio.client import Redis as AsyncRedis

from prompts import CODEGEN_PROMPT, STORYBOARD_PROMPT, EDITGEN_PROMPT
from pipeline import query_anthropic, render, get_anthropic_client, extract_codeblock

load_dotenv()

app = FastAPI()

DUMMY_MODE = False
STREAM = False

redice = aioredis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"), db=1, decode_responses=True
)
brocolli = Celery(
    "brocolli",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "alive"}


@app.get("/ping")
async def ping():
    return {"message": "pong"}


async def set_job_status(
    redis_client: AsyncRedis,
    job_id: UUID | str,
    status: str,
    error: Optional[str] = None,
):
    await redis_client.set(f"job:{job_id}:status", status)
    if error:
        return await redis_client.set(f"job:{job_id}:status:error", error)


def redis_flush_stream(
    redis_client: AsyncRedis, stream_path: str
) -> Callable[[str], Awaitable[Any]]:
    async def f(delta: str):
        await redis_client.rpush(stream_path, delta)  # type: ignore

    return f


async def dummy(
    fp: str,
    stream: bool = False,
    stream_handler: Optional[Callable[[str], Awaitable[Any]]] = None,
):
    path = Path(fp)
    if not path.exists():
        raise FileNotFoundError(f"Dummy file {fp} not found.")

    text = path.read_text(encoding="utf8")

    if not stream:
        return text

    for line in text.splitlines():
        if stream_handler:
            await stream_handler(line + "\n")
            await asyncio.sleep(0.01)

    return text


async def _pipeline(redis_client: AsyncRedis, job_id: UUID, base_prompt: str):
    client = await get_anthropic_client()

    job_dir = Path("renders") / str(job_id)
    iteration_dir = job_dir / "0"
    job_dir.mkdir(parents=True, exist_ok=True)
    iteration_dir.mkdir(parents=True, exist_ok=True)

    in_fp, out_fp = iteration_dir / "out.py", iteration_dir

    # CODEGEN -> store locally -> serve on GET /retrieve
    try:
        await set_job_status(redis_client, job_id, "storyboarding")

        # dummy for local testing
        if DUMMY_MODE:
            if STREAM:
                board = await dummy(
                    "dummy/storyboard.txt",
                    stream=True,
                    stream_handler=redis_flush_stream(
                        redis_client, f"job:{job_id}:stream:storyboard"
                    ),
                )
            else:
                board = await dummy("dummy/storyboard.txt")
                await redis_client.rpush(f"job:{job_id}:stream:storyboard", board)  # type: ignore

            await set_job_status(redis_client, job_id, "code-generating")

            if STREAM:
                code = await dummy(
                    "dummy/codegen.txt",
                    stream=True,
                    stream_handler=redis_flush_stream(
                        redis_client, f"job:{job_id}:stream:codegen"
                    ),
                )
            else:
                code = await dummy("dummy/codegen.txt")
                await redis_client.rpush(f"job:{job_id}:stream:codegen", code)  # type: ignore

        else:
            board = await query_anthropic(
                client,
                base_prompt,
                STORYBOARD_PROMPT,
                stream=True,
                stream_handler=redis_flush_stream(
                    redis_client, f"job:{job_id}:stream:storyboard"
                ),
            )

            await set_job_status(redis_client, job_id, "code-generating")

            code = await query_anthropic(
                client,
                board,
                CODEGEN_PROMPT,
                stream=True,
                stream_handler=redis_flush_stream(
                    redis_client, f"job:{job_id}:stream:codegen"
                ),
            )

        # write locally for now
        # TODO: write to s3 bucket
        if DUMMY_MODE:
            code = extract_codeblock(code[:-4])  # some weird errror with dummy file
            in_fp.write_text(extract_codeblock(code), encoding="utf8")
        (job_dir / "out.py").write_text(in_fp.read_text(), encoding="utf8")

        await set_job_status(redis_client, job_id, "rendering")
        await render(str(in_fp), str(out_fp))  # mp4 animation
        await set_job_status(redis_client, job_id, "done")
    except Exception as e:
        await set_job_status(redis_client, job_id, "error", error=str(e))
    finally:
        await client.close()
        await redis_client.aclose()


async def _editgen(redis_client: AsyncRedis, job_id: str, edit_prompt: str):
    await set_job_status(redis_client, job_id, "editing")
    client = await get_anthropic_client()

    try:
        current_iter = int(await redis_client.get(f"job:{job_id}:iteration") or 0)
        next_iter = current_iter + 1
        await redis_client.set(f"job:{job_id}:iteration", next_iter)

        job_dir = Path("renders") / str(job_id)
        iteration_dir = job_dir / str(next_iter)
        iteration_dir.mkdir(parents=True, exist_ok=True)

        latest_fp = job_dir / "out.py"
        curr_code = latest_fp.read_text()

        full_prompt = f"""
The following Manim CE code is the current state of the scene:

```python
{curr_code}
```

Apply the following edits:
{edit_prompt}
"""

        await redis_client.delete(f"job:{job_id}:stream:codegen")

        code = await query_anthropic(
            client,
            full_prompt,
            EDITGEN_PROMPT,
            stream=True,
            stream_handler=redis_flush_stream(
                redis_client, f"job:{job_id}:stream:codegen"
            ),
        )

        # write locally for now
        # TODO: write to s3 bucket
        (iteration_dir / "out.py").write_text(extract_codeblock(code), encoding="utf8")
        latest_fp.write_text(extract_codeblock(code), encoding="utf8")

        await set_job_status(redis_client, job_id, "rendering")
        await render(str(iteration_dir / "out.py"), str(iteration_dir))
        await set_job_status(redis_client, job_id, "done")
    except Exception as e:
        await set_job_status(redis_client, job_id, "error", error=str(e))
    finally:
        await client.close()
        await redis_client.aclose()


@brocolli.task
def pipeline(job_id: UUID, base_prompt: str):
    redis_client = aioredis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"), db=1, decode_responses=True
    )
    asyncio.run(_pipeline(redis_client, job_id, base_prompt))


@brocolli.task
def editgen(job_id: str, edit_prompt: str):
    redis_client = aioredis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"), db=1, decode_responses=True
    )
    asyncio.run(_editgen(redis_client, job_id, edit_prompt))


class SubmitRequest(BaseModel):
    base_prompt: str


@app.post("/submit/")
async def submit(request: SubmitRequest):
    job_id = uuid4()
    pipeline.delay(job_id, request.base_prompt)  # type: ignore
    await set_job_status(redice, job_id, "pending")
    await redice.set(f"job:{job_id}:iteration", 0)
    return {
        "job_id": str(job_id),
        "type": "new_task",
        "result": "success",
        "base_prompt": request.base_prompt,
    }


class EditRequest(BaseModel):
    job_id: str
    base_prompt: str


@app.post("/edit/")
def edit(req: EditRequest):
    editgen.delay(req.job_id, req.base_prompt)  # type: ignore
    return {
        "job_id": str(req.job_id),
        "type": "new_task",
        "result": "success",
        "prompt": req.base_prompt,
    }


@app.get("/events/{job_id}")
async def sse(job_id: str):
    async def event_generator():
        while True:
            status = await redice.get(f"job:{job_id}:status")
            storyboard = await redice.lrange(f"job:{job_id}:stream:storyboard", 0, -1)  # type: ignore
            codegen = await redice.lrange(f"job:{job_id}:stream:codegen", 0, -1)  # type: ignore
            error = await redice.get(f"job:{job_id}:status:error")
            iteration = await redice.get(f"job:{job_id}:iteration")

            payload = {
                "job_id": job_id,
                "status": status,
                "iteration": iteration,
                "error": error,
                "stream": {
                    "storyboard": "".join(storyboard),
                    "codegen": "".join(codegen),
                },
            }

            if status:
                yield f"data: {json.dumps(payload)}\n\n"

                if status in ("done", "error"):
                    break

            await asyncio.sleep(0.2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Connection": "keep-alive",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/retrieve/{job_id}/{iteration}", response_class=FileResponse)
def retrieve(job_id: str, iteration: int):
    fp = (
        Path("renders")
        / job_id
        / str(iteration)
        / "videos"
        / "out"
        / "720p30"
        / "out.mp4"
    )
    return FileResponse(path=fp)
