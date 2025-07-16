FROM alpine:3.22 AS build
WORKDIR /build

RUN apk add go npm
ADD . .
RUN cd ui && npm run build
RUN go build .

FROM alpine:3.22
WORKDIR /
EXPOSE 8080

RUN apk add ffmpeg
COPY --from=build /build/control-plane .
ENTRYPOINT ["/control-plane", "serve", "--http=0.0.0.0:8090"]