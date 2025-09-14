# Fosstank

Free and open source 24/7 streaming server inspired by [fishtank.live](https://fishtank.live)

## Overview

Fosstank is a complete live streaming platform built with Go and Next.js, featuring real-time chat, interactive features, and multiple monetization options.

### Architecture

The project consists of two main services:

#### Origin Server (`origin/`)
The origin server handles media processing and stream management:
- Reads from local RTSP streams (e.g., PoE cameras)
- Converts streams to 1080p HLS using FFmpeg
- Uses AV1 codec for bandwidth efficiency
- PocketBase backend for stream metadata

**Key Files:**
- `main.go` - Main server application
- `migrations/` - Database schema migrations
- `streams/` - HLS stream output directory

#### Uplink Server (`uplink/`)
The uplink server provides the public-facing platform:
- **Backend**: PocketBase application with Go
- **Frontend**: Next.js 15 with React 19 and Tailwind CSS
- **Features**:
  - User authentication and accounts
  - Live chat and messaging
  - Text-to-Speech (TTS) orders
  - Sound effects (SFX) orders
  - Fosstoys (interactive elements)
  - Polls and voting system
  - Announcements
  - Token bundles and monetization
  - Stripe integration for payments
  - Season/participant management

**Directory Structure:**
- `main.go` - PocketBase server with custom routes
- `stripe.go` - Payment processing
- `migrations/` - Database schema migrations
- `ui/` - Next.js frontend application
  - `src/app/` - Next.js app router pages
  - `src/components/` - React components
  - `src/lib/` - Utility libraries

### Storage

#### S3 Integration (`s3/`)
- Local docker-compose uses MinIO for S3-compatible storage
- Production supports any S3-compatible service
- Stores stream recordings and user-generated content

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Make (optional, for shortcuts)

### Building

Build all Docker images:
```bash
make build
# or
docker buildx bake
```

### Running

1. Start all services:
```bash
docker-compose up -d
```

2. **For local development**: Create a MinIO bucket
   - Open MinIO admin panel at http://localhost:9001
   - Login with `minioadmin`/`minioadmin`
   - Create a bucket named "streams"
   - Configure S3 credentials in PocketBase admin dashboard

### Services

After starting with Docker Compose:
- **Origin Server**: http://localhost:8090
- **Origin Server Admin UI (PocketBase)**: http://localhost:8090/_/
- **Uplink Server**: http://localhost:8091  
- **Uplink Server Admin UI (PocketBase)**: http://localhost:8091/_/
- **MinIO Admin**: http://localhost:9001
- **MinIO API**: http://localhost:9000

## Running Without Docker

If you prefer to run the services directly without Docker:

### Prerequisites
- Go 1.25+ 
- Node.js 20+ and npm
- FFmpeg (for the origin server)

### Origin Server
```bash
cd origin
go run .
```

### Uplink Server
```bash
# Terminal 1: Start the backend
cd uplink
go run . --http=127.0.0.1:8091

# Terminal 2: Start the frontend (development)
cd uplink/ui
npm install
npm run dev
```

The uplink backend will serve the built frontend in production, but for development you'll want to run both the Go server and the Next.js dev server.

## Production Considerations

### Storage Backend

**Important**: MinIO is only recommended for local development and testing. For production deployments, you should use a proper cloud storage service. If no S3 storage is configured, the local filesystem will be used.

Configure your production S3 credentials in the PocketBase admin dashboard under the S3 settings.

### Additional Production Recommendations

#### Security
- **HTTPS/TLS**: Always use HTTPS in production with proper SSL certificates. Pocketbase can handle this for you ![automatically](https://pocketbase.io/docs/going-to-production/#minimal-setup)
- **Pocketbase**: See the "![Going to Production](https://pocketbase.io/docs/going-to-production/)" guide

#### Performance & Scaling
- **CDN**: Use a Content Delivery Network (CDN) for serving HLS streams and static assets
- **Hardware Encoding**: Configure hardware-accelerated video encoding on the origin server for better performance(WIP)

## Features

- **Live Streaming**: HLS streaming with AV1 codec
- **Real-time Chat**: WebSocket-based messaging
- **Interactive Elements**: 
  - Text-to-Speech orders
  - Sound effects
  - Custom "Fosstoys"
  - Live polls
- **Monetization**:
  - Token-based economy
  - Stripe payment integration
- **Administration**:
  - User management
  - Content moderation(WIP)

## Technology Stack

- **Backend**: Go, PocketBase
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Streaming**: FFmpeg, HLS, AV1
- **Database**: SQLite (via PocketBase)
- **Storage**: S3-compatible (MinIO for local dev)
- **Payments**: Stripe