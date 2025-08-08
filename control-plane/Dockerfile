FROM alpine:3.22 AS ui-build
WORKDIR /build
RUN apk add npm

COPY --from=ui package.json package-lock.json ./
RUN npm install
COPY --from=ui . .
RUN npm run build

FROM alpine:3.22 AS go-build
WORKDIR /build
RUN apk add go

COPY go.mod go.sum *.go ./
COPY migrations/. ./migrations
COPY --from=ui-build /build/out ./ui/out
RUN go build .

FROM alpine:3.22
WORKDIR /
EXPOSE 8080

RUN apk add ffmpeg
COPY --from=go-build /build/control-plane .
ENTRYPOINT ["/control-plane", "serve", "--http=0.0.0.0:8090"]