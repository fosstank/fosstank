# Fosstank

Free and open source 24/7 streaming server inspired by [fishtank.live](https://fishtank.live)

## Overview

### Control Plane

The control-plane directory contains code to read from local rtsp streams(e.g. from a PoE camera) and uses ffmpeg to convert those streams to 1080p HLS. It uses the AV1 codec, because the bandwith is way better and I'm not rich enough to stream h264. The downside is not everything will play AV1(looking at you apple). Again though, I'm not rich enough to stream h264 so it'll do(I think).

The control plane still needs code to monitor those HLS output files and keep them in sync with a remote S3 bucket, and needs to be improved to support hardware encoding as well. It is meant to be run on a local machine, no public access.

### Server

The server directory contains the public facing side of things. It houses the UI as well as all the server code for user accounts, live chat, fosstoys, etc. It's just a pocketbase app really. I'd like to get a proper k8s setup at some point but for now pocketbase does everything we need.

The server directory is also noticeably empty at the moment(since I haven't started it yet), and git won't commit empty folders, so you'll just have to take my word that it exists.