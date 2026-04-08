FROM ubuntu:24.04 AS deps
WORKDIR /build

RUN apt-get update && apt-get install -y build-essential curl && \
  rm -rf /var/lib/apt/lists/*
RUN curl -fLO https://releases.astral.sh/github/uv/releases/download/0.11.3/uv-x86_64-unknown-linux-gnu.tar.gz && \
  echo "c0f3236f146e55472663cfbcc9be3042a9f1092275bbe3fe2a56a6cbfd3da5ce  uv-x86_64-unknown-linux-gnu.tar.gz" | sha256sum -c - && \
  tar -xzf uv-x86_64-unknown-linux-gnu.tar.gz --strip-components=1 -C /usr/local/bin

ENV UV_PYTHON_INSTALL_DIR=/opt/uv/python

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --managed-python --frozen --no-dev

FROM nvidia/cuda:13.1.1-runtime-ubuntu24.04
WORKDIR /app
EXPOSE 8000

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY --from=deps /opt/uv/python /opt/uv/python
COPY --from=deps /build/.venv /app/.venv
COPY main.py .

RUN mkdir -p /home/ubuntu/.cache && \
  chown -R ubuntu:ubuntu /home/ubuntu/.cache

ENTRYPOINT ["/app/.venv/bin/python", "main.py"]
