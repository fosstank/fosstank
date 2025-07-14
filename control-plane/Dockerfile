FROM alpine:3.22 AS build
WORKDIR /build

RUN apk add go
ADD . .
RUN go build .

FROM alpine:3.22
WORKDIR /

RUN apk add ffmpeg
COPY --from=build /build/control-plane .
ENTRYPOINT [ "/control-plane" ]