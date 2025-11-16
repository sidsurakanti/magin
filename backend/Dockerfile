FROM manimcommunity/manim:stable

USER root
RUN apt-get update && apt-get install -y --no-install-recommends clang

WORKDIR /app

RUN chown -R manimuser:manimuser /app

COPY --from=ghcr.io/astral-sh/uv:0.4.9 /uv /bin/uv
COPY pyproject.toml uv.lock ./

USER manimuser
RUN uv sync

COPY . .

USER root
RUN chown -R manimuser:manimuser /app
USER manimuser
