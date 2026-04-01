FROM python:3.13-slim AS build
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends build-essential

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.13-slim
WORKDIR /app
EXPOSE 8000

# TODO: Download models here instead of at runtime.
# Otherwise every container restart must redownload the models
RUN mkdir -p /.cache/huggingface && chmod -R 777 /.cache && \
  mkdir /.modelscope && chmod -R 777 /.modelscope
COPY --from=build /build/.venv /app/.venv
COPY main.py .

ENTRYPOINT ["/app/.venv/bin/python", "main.py"]
