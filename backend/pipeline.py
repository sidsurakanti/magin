from anthropic import AsyncAnthropic
from anthropic.types import TextBlock
import os
from dotenv import load_dotenv
from typing import Callable, Optional, Any
import asyncio

load_dotenv()

DEFAULT_MODEL = "claude-sonnet-4-20250514"
DEFAULT_MAX_TOKENS = 5024
DEFAULT_TEMPERATURE = 0.7


async def get_anthropic_client() -> AsyncAnthropic:
    client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return client


async def query_anthropic(
    client: AsyncAnthropic,
    base_prompt: str,
    system_prompt: Optional[str] = None,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    temperature: float = DEFAULT_TEMPERATURE,
    stream: bool = False,
    stream_handler: Optional[Callable[[str], Any]] = None,
):
    message_content = [
        {
            "type": "text",
            "text": base_prompt,
        }
    ]
    message_params = {
        "model": DEFAULT_MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": message_content}],
        "system": system_prompt,
    }

    if not stream:
        res = await client.messages.create(**message_params)
        final = "".join(
            block.text for block in res.content if isinstance(block, TextBlock)
        )
        return final
    async with client.messages.stream(**message_params) as flow:
        async for delta in flow.text_stream:
            if stream_handler:
                stream_handler(delta)

    final = await flow.get_final_message()
    return "".join(b.text for b in final.content if isinstance(b, TextBlock))


def extract_codeblock(text: str):
    if text.startswith("```python"):
        text = text[len("```python") :].lstrip()
    if text.endswith("```"):
        text = text[:-3].rstrip()
    return text


async def render(input_dir: str, output_dir: str):
    SCENE_NAME = "scn"
    # manim out.py scn -ql --media_dir ./renders --output_file h.mp4
    proc = await asyncio.create_subprocess_exec(
        "manim",
        input_dir,
        SCENE_NAME,
        "-qm",
        "--media_dir",
        output_dir,
        "--output_file",
        "out.mp4",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    _, stderror = await proc.communicate()

    if proc.returncode != 0:
        raise RuntimeError(f"RENDER FAILED:\n{stderror.decode()}")
