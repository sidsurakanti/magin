FROM manimcommunity/manim:stable

WORKDIR /app

USER root

RUN apt-get update && apt-get install -y --no-install-recommends clang

USER manimuser

COPY --from=ghcr.io/astral-sh/uv:0.4.9 /uv /bin/uv

COPY pyproject.toml uv.lock ./


RUN uv sync

COPY . .

