package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"sync"
)

type Encoder string

const (
	EncoderSVTAV1  Encoder = "libsvtav1"
	EncoderLibX264 Encoder = "libx264"
)

var EncodingFlags = map[string][]string{
	"libsvtav1": {
		"-c:v", "libsvtav1",
		"-preset", "10",
		"-b:v", "500k",
	},
	"libx264": {
		"-c:v", "libx264",
		"-crf", "32",
		"-preset", "veryfast",
		"-tune", "zerolatency",
	},
}

func encodeStream(ctx context.Context, wg *sync.WaitGroup, stream *Stream) error {
	wg.Add(1)
	defer wg.Done()

	// Sync stream outputs to S3 bucket
	// if app.Settings().S3.Enabled {
	// 	watcher, err := fsnotify.NewWatcher()
	// 	if err != nil {
	// 		log.Fatal(err)
	// 	}
	// 	defer watcher.Close()

	// 	go syncS3(app, stream, watcher)

	// 	err = watcher.Add(STREAM_OUTPUT_DIR + "/" + stream.Id)
	// 	if err != nil {
	// 		log.Fatal(err)
	// 	}
	// }

	if stream.Source == "" {
		return fmt.Errorf("no source provided for stream %s", stream.Id)
	}

	flags, exists := EncodingFlags[string(stream.Encoder)]
	if !exists {
		return fmt.Errorf("unsupported encoder: %s", stream.Encoder)
	}

	// FIXME: This will leak credentials if they are in the source url and ffmpeg decides to log it(e.g. if the rtsp device is off)
	// https://trac.ffmpeg.org/ticket/11247
	args := []string{
		"ffmpeg",
		"-loglevel", "error",
		"-rtsp_transport", "tcp",
		"-i", stream.Source,
		"-c:a", "aac",
		"-s", "hd1080",
	}

	// Add encoder-specific flags
	args = append(args, flags...)

	// Add remaining output flags
	args = append(args, []string{
		"-f", "hls",
		"-hls_time", "6",
		"-hls_list_size", "5",
		"-hls_segment_type", "fmp4",
		"-hls_flags", "delete_segments",
		STREAM_OUTPUT_DIR + "/" + stream.Id + "/" + stream.Id + ".m3u8",
	}...)

	cmd := exec.CommandContext(ctx, args[0], args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
