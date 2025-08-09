# Fosstank

Free and open source 24/7 streaming server inspired by [fishtank.live](https://fishtank.live)

## Overview

### Origin

The origin directory contains code to read from local rtsp streams(e.g. from a PoE camera) and uses ffmpeg to convert those streams to 1080p HLS. It uses the AV1 codec, because the bandwith is way better and I'm not rich enough to stream h264. The downside is not everything will play AV1(*cough* *cough* apple). Again though, I'm not rich enough to stream h264 so it'll do(I think).

The origin server doesn't support hardware encoding yet, but support is planned. It is meant to be run on a local machine, no public access.

### Uplink

The uplink directory contains the public facing side of things. It houses the UI as well as all the server code for user accounts, live chat, fosstoys, etc. It's just a pocketbase app really. I'd like to get a proper k8s setup at some point but for now pocketbase is perfect.

## Building

The `docker-bake.hcl` file contains the build configuration for building docker images.

Run `docker buildx bake` to build and tag all images.

## Running

The `docker-compose.yaml` file contains a setup to run both the origin and uplink servers, as well as a local S3 server(MinIO) for local testing. The MinIO bucket creation isn't automated yet, so before using it you'll need to open the MinIO admin panel and create a bucket manually.