FROM golang:1.26-alpine AS go-build
WORKDIR /build

COPY go.mod go.sum *.go ./
RUN go build .

FROM alpine:latest
WORKDIR /
EXPOSE 8080

RUN apk add ffmpeg imagemagick pulseaudio-utils
COPY --from=go-build /build/origin .
ENTRYPOINT ["/origin"]