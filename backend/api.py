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


async def _pipeline(redis_client: AsyncRedis, job_id: UUID, base_prompt: str):
    client = await get_anthropic_client()

    job_dir = Path("renders") / str(job_id)
    job_dir.mkdir(parents=True, exist_ok=True)

    in_fp, out_fp = str(job_dir / "out.py"), str(job_dir)

    # CODEGEN -> store locally -> serve on GET /retrieve
    try:
        await set_job_status(redis_client, job_id, "storyboarding")

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
        with open(in_fp, "w", encoding="utf8") as file:
            file.write(extract_codeblock(code))

        await set_job_status(redis_client, job_id, "rendering")
        await render(in_fp, out_fp)  # mp4 animation

        # on successfull render
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
        job_dir = Path("renders") / str(job_id)
        in_fp, out_fp = str(job_dir / "out.py"), str(job_dir)

        with open(in_fp, "r", encoding="utf8") as file:
            curr_code = file.read()

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
        with open(in_fp, "w", encoding="utf8") as file:
            file.write(extract_codeblock(code))

        await set_job_status(redis_client, job_id, "rendering")
        await render(in_fp, out_fp)  # mp4 animation
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

            payload = {
                "job_id": job_id,
                "status": status,
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


@app.get("/retrieve/{job_id}", response_class=FileResponse)
def retrieve(job_id: str):
    fp = Path("renders") / job_id / "videos" / "out" / "720p30" / "out.mp4"
    return FileResponse(path=fp)
