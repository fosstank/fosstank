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
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const DATA_DIR = "ogn_data"
const STREAM_OUTPUT_DIR = "streams"

func main() {
	err := os.Mkdir(DATA_DIR, 0755)
	if err != nil && !os.IsExist(err) {
		log.Fatal(err)
	}

	streams, err := LoadStreams()
	if err == os.ErrPermission {
		log.Fatal(err)
	} else if err != nil {
		log.Println("No existing streams.json found, creating new one.")
		streams = Streams{
			{
				Id:      uuid.NewString(),
				Name:    "Stream 1",
				Source:  "",
				Encoder: EncoderLibX264,
			},
		}
		err = streams.Save()
		if err != nil {
			log.Fatal(err)
		}
	}

	var s3Client *minio.Client
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
		exists, err := s3Client.BucketExists(context.Background(), "fosstank-streams")
		if err != nil {
			log.Fatal(err)
		}
		if !exists {
			err = s3Client.MakeBucket(context.Background(), "fosstank-streams", minio.MakeBucketOptions{})
			if err != nil {
				log.Fatal(err)
			}
			fmt.Println("Created S3 bucket: fosstank-streams")
		}
	}

	mux := http.NewServeMux()
	server := &http.Server{
		Addr:    ":8090",
		Handler: mux,
	}

	mux.HandleFunc("POST /streams", StreamCreateHandler(&streams))

	// Start ffmpeg processes
	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup
	for _, stream := range streams {
		if stream.Source == "" {
			continue
		}

		err = os.MkdirAll(DATA_DIR+"/"+STREAM_OUTPUT_DIR+"/"+stream.Id, 0755)
		if err != nil {
			log.Fatal(err)
		}

		go encodeStream(ctx, &wg, s3Client, stream)
	}

	gracefulShutdown := make(chan struct{})
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt)
		<-sigint

		// We received an interrupt signal, shut down.
		fmt.Println("Shutting down ffmpeg subprocesses...")
		cancel()
		wg.Wait()

		fmt.Println("Shutting down HTTP server...")
		if err := server.Shutdown(context.Background()); err != nil {
			// Error from closing listeners, or context timeout:
			log.Printf("HTTP server Shutdown: %v", err)
		}
		close(gracefulShutdown)
		fmt.Println("Shutdown complete.")
	}()

	// Serve stream output dir
	fs := http.FileServer(http.Dir(DATA_DIR + "/" + STREAM_OUTPUT_DIR))
	mux.Handle("/"+STREAM_OUTPUT_DIR+"/", http.StripPrefix("/"+STREAM_OUTPUT_DIR, fs))

	fmt.Println("Server started on", server.Addr)
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
