FROM alpine:3.22 AS build
WORKDIR /build

RUN apk add go
ADD . .
RUN go build .

FROM alpine:3.22
WORKDIR /
EXPOSE 8080

RUN apk add ffmpeg
COPY --from=build /build/control-plane .
ENTRYPOINT ["/control-plane", "serve", "--http=0.0.0.0:8090"]