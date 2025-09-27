## Prerequisites
```bash
brew install redis # or similar
```

## Usage
```bash
# rename .env.example to .env and replace ANTHROPIC_API_KEY
ANTHROPIC_API_KEY=""
```

```bash
uv sync --frozen && source .venv/bin/activate
```
```bash
# ensure everything related to manim is installed
uv run manim checkhealth
```
```bash
# spin up redis db
redis-server
```

```bash
# spin up celery
celery -A api.brocolli worker --log-level=info
```

```bash
# spin up api server
fastapi run dev
```

Visit api docs @ `http:localhost:8000/docs`
