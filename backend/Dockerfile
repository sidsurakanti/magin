FROM manimcommunity/manim:stable

# run as root to install deps into /venv/ cus it's owned by root
USER root
RUN apt-get update && apt-get install -y --no-install-recommends clang

WORKDIR /app

# install app deps into the existing manim venv.
# manim itself is already provided by the base image (in /opt/venv), so we don't need to install it separatly from pyproject.toml).
COPY pyproject.toml ./
RUN /opt/venv/bin/pip install --no-cache-dir .

COPY . .

RUN mkdir -p /app/renders && chown -R manimuser:manimuser /app


USER manimuser
