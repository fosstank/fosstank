// Fosstank: 24/7 live streaming platform
// Copyright (C) 2025 Pierre Morrel

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package main

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const DATA_DIR = "ogn_data"
const STREAM_OUTPUT_DIR = "streams"
const S3_BUCKET_NAME = "fosstank-streams"

var CDN_ENDPOINT = os.Getenv("CDN_ENDPOINT")

var s3Client *minio.Client
var encodersWg sync.WaitGroup
var encodersCtx context.Context
var encodersCancel context.CancelFunc

func main() {
	if _, err := os.Stat(DATA_DIR); errors.Is(err, fs.ErrNotExist) {
		log.Println("Data directory not found, creating it.")
		err := os.Mkdir(DATA_DIR, 0755)
		if err != nil {
			log.Fatal(err)
		}
	}

	streams, err := LoadStreams()
	if err != nil {
		log.Fatal(err)
	}

	config, err := LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	if config.ApiKey == "" {
		log.Fatal("API key not set in config")
	}

	s3Endpoint := os.Getenv("S3_ENDPOINT")
	s3AccessKey := os.Getenv("S3_ACCESS_KEY")
	s3SecretKey := os.Getenv("S3_SECRET_KEY")
	if s3Endpoint != "" && s3AccessKey != "" && s3SecretKey != "" {
		s3Client, err = minio.New(s3Endpoint, &minio.Options{
			Creds:  credentials.NewStaticV4(s3AccessKey, s3SecretKey, ""),
			Secure: false,
		})
		if err != nil {
			log.Fatal(err)
		}

		// Make sure the bucket exists
		exists, err := s3Client.BucketExists(context.Background(), S3_BUCKET_NAME)
		if err != nil {
			log.Fatal(err)
		}
		if !exists {
			err = s3Client.MakeBucket(context.Background(), S3_BUCKET_NAME, minio.MakeBucketOptions{})
			if err != nil {
				log.Fatal(err)
			}
			fmt.Printf("Created S3 bucket: %s\n", S3_BUCKET_NAME)

			// Set bucket policy to allow public read access
			bucketPolicy := fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Principal": "*",
						"Action": "s3:GetObject",
						"Resource": "arn:aws:s3:::%s/*"
					}
				]
			}`, S3_BUCKET_NAME)

			err = s3Client.SetBucketPolicy(context.Background(), S3_BUCKET_NAME, bucketPolicy)
			if err != nil {
				log.Printf("Warning: Failed to set bucket policy: %v", err)
			} else {
				fmt.Printf("Set public read policy for bucket: %s\n", S3_BUCKET_NAME)
			}
		}
	}

	mux := http.NewServeMux()
	server := &http.Server{
		Addr:    ":8090",
		Handler: mux,
	}

	mux.Handle("POST /streams", ApiKeyMiddleware(StreamCreateHandler(&streams), config))
	mux.Handle("GET /streams/{id}", ApiKeyMiddleware(StreamRetrieveHandler(&streams), config))
	mux.Handle("PUT /streams/{id}", ApiKeyMiddleware(StreamUpdateHandler(&streams), config))
	mux.Handle("DELETE /streams/{id}", ApiKeyMiddleware(StreamDeleteHandler(&streams), config))
	// Serve stream output dir
	fs := http.FileServer(http.Dir(DATA_DIR + "/" + STREAM_OUTPUT_DIR))
	mux.Handle("/artifacts/", ApiKeyMiddleware(http.StripPrefix("/artifacts/", fs), config))

	// Start ffmpeg processes
	encodersCtx, encodersCancel = context.WithCancel(context.Background())
	for _, stream := range streams {
		if stream.Source == "" {
			continue
		}

		err = os.MkdirAll(DATA_DIR+"/"+STREAM_OUTPUT_DIR+"/"+stream.Id, 0755)
		if err != nil {
			log.Fatal(err)
		}

		encodingCtx, encodingCancel := context.WithCancel(encodersCtx)
		stream.SubprocessCancelFunc = encodingCancel
		go encodeStream(encodingCtx, stream)
	}

	gracefulShutdown := make(chan struct{})
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt)
		<-sigint

		// We received an interrupt signal, shut down.
		fmt.Println("Shutting down ffmpeg subprocesses...")
		encodersCancel()
		encodersWg.Wait()

		fmt.Println("Shutting down HTTP server...")
		if err := server.Shutdown(context.Background()); err != nil {
			// Error from closing listeners, or context timeout:
			log.Printf("HTTP server Shutdown: %v", err)
		}
		close(gracefulShutdown)
		fmt.Println("Shutdown complete.")
	}()

	fmt.Println("Server started on", server.Addr)
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
