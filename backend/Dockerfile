FROM manimcommunity/manim:stable

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.4.9 /uv /bin/uv

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen

COPY . .

