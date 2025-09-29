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
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

const STREAM_OUTPUT_DIR = "streams"

func main() {
	streams, err := LoadStreams()
	if err != nil {
		log.Println("No existing streams.json found, creating new one.")
		streams = Streams{}
		err = streams.Save()
		if err != nil {
			log.Fatal(err)
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

		err = os.MkdirAll(STREAM_OUTPUT_DIR+"/"+stream.Id, 0755)
		if err != nil {
			log.Fatal(err)
		}

		go encodeStream(ctx, &wg, stream)
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
	fs := http.FileServer(http.Dir(STREAM_OUTPUT_DIR))
	mux.Handle("/"+STREAM_OUTPUT_DIR+"/", http.StripPrefix("/"+STREAM_OUTPUT_DIR, fs))

	fmt.Println("Server started on", server.Addr)
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func syncS3(app *pocketbase.PocketBase, stream *core.Record, watcher *fsnotify.Watcher) {
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				continue
			}

			// ffmpeg writes the .m3u8 to a .tmp file before committing it. We don't care about these events.
			if filepath.Ext(event.Name) == ".tmp" {
				continue
			}

			if event.Has(fsnotify.Create) {
				// When ffmpeg updates the .m3u8 playlist file, we know it is done writing the latest .ts file.
				// Any other create events we don't care about.
				if filepath.Ext(event.Name) != ".m3u8" {
					continue
				}

				playlistData, err := os.ReadFile(event.Name)
				if err != nil {
					// retry?
					log.Println("error reading playlist data:", event.Name)
					continue
				}

				b := bytes.TrimRight(playlistData, "\r\n")
				lines := bytes.Split(b, []byte("\n"))
				latestSegment := string(lines[len(lines)-1])

				// Upload segment to S3
				f, err := filesystem.NewFileFromPath(STREAM_OUTPUT_DIR + "/" + stream.Id + "/" + latestSegment)
				// Pocketbase will automatically add random chars to the end of the filename.
				// The .m3u8 playlist requires we keep the name as is.
				f.Name = f.OriginalName
				if err != nil {
					log.Println("error creating filesystem for segment:", latestSegment)
					continue
				}
				stream.Set("artifacts+", f)
				err = app.Save(stream)
				if err != nil {
					// FIXME: retry?
					log.Println("error saving segment to S3:", latestSegment)
					continue
				}

				// After segment upload, upload playlist to S3
				f, err = filesystem.NewFileFromPath(event.Name)
				// Pocketbase will automatically add random chars to the end of the filename.
				// The .m3u8 playlist requires we keep the name as is.
				f.Name = f.OriginalName
				if err != nil {
					log.Println("error creating filesystem for playlist:", filepath.Base(event.Name))
					continue
				}
				stream.Set("artifacts+", f)
				err = app.Save(stream)
				if err != nil {
					// FIXME: retry?
					log.Println("error saving playlist to S3:", filepath.Base(event.Name))
					continue
				}
			} else if event.Has(fsnotify.Remove) {
				// ffmpeg has deleted a file(because of the -hls_list_size flag).
				// We need to delete it in S3.
				stream.Set("artifacts-", filepath.Base(event.Name))
				err := app.Save(stream)
				if err != nil {
					// FIXME: retry?
					log.Println("error deleting segment from S3:", filepath.Base(event.Name))
					continue
				}
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				continue
			}
			log.Println("error:", err)
		}
	}
}
