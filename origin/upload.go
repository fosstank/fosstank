package main

import (
	"bytes"
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/fsnotify/fsnotify"
	"github.com/minio/minio-go/v7"
)

func syncS3(client *minio.Client, stream *Stream, watcher *fsnotify.Watcher) {
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
				// TODO: use a proper context
				_, err = client.FPutObject(context.Background(), "fosstank-streams", stream.Id+"/"+latestSegment, DATA_DIR+"/"+STREAM_OUTPUT_DIR+"/"+stream.Id+"/"+latestSegment, minio.PutObjectOptions{ContentType: "video/mp2t"})
				if err != nil {
					// FIXME: retry?
					log.Println("error saving segment to S3:", latestSegment)
					continue
				}

				// After segment upload, upload playlist to S3
				_, err = client.FPutObject(context.Background(), "fosstank-streams", stream.Id+"/"+filepath.Base(event.Name), event.Name, minio.PutObjectOptions{ContentType: "application/vnd.apple.mpegurl"})
				if err != nil {
					// FIXME: retry?
					log.Println("error saving playlist to S3:", filepath.Base(event.Name))
					continue
				}
			} else if event.Has(fsnotify.Remove) {
				// ffmpeg has deleted a file(because of the -hls_list_size flag).
				// We need to delete it in S3.
				err := client.RemoveObject(context.Background(), "fosstank-streams", stream.Id+"/"+filepath.Base(event.Name), minio.RemoveObjectOptions{})
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
