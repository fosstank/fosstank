package main

import (
	"context"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"regexp"
	"strings"
	"sync"
	"syscall"
)

func main() {
	// 1. Create config for input video which will be cli arg passed to ffmpeg
	//    Include in the config a param to set the camera name
	// 2. Call ffmpeg cli to convert input from input format to HLS fmp4 AV1
	// 3. Send HLS to CDN. Send camera name and playlist url(in CDN) to remote server

	config := &Config{}
	config.LoadFromFile("config.json")

	const output_dir = "streams"
	err := os.MkdirAll(output_dir, 0755)
	if err != nil {
		log.Fatalf("failed to create streams directory: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup
	for _, streamConfig := range config.Streams {
		wg.Add(1)
		go encodeStream(ctx, &wg, output_dir, streamConfig)
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigChan
	log.Println("Received signal ", sig)

	cancel()
	wg.Wait()
}

func encodeStream(ctx context.Context, wg *sync.WaitGroup, outputDir string, sc StreamConfig) error {
	defer wg.Done()

	subfolder := strings.ReplaceAll(sc.Name, " ", "_")
	re := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
	subfolder = re.ReplaceAllString(subfolder, "")
	subfolder = strings.TrimLeft(subfolder, ".")

	err := os.MkdirAll(outputDir+"/"+subfolder, 0755)
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(ctx,
		"ffmpeg",
		"-loglevel", "error",
		"-rtsp_transport", "tcp",
		"-i", sc.RTSPUri,
		"-c:a", "aac",
		"-s", "hd1080",
		"-c:v", "libsvtav1",
		"-svtav1-params", "verbosity=ERROR",
		"-preset", "10",
		"-b:v", "500k",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_list_size", "5",
		"-hls_segment_type", "fmp4",
		"-hls_flags", "delete_segments",
		outputDir+"/"+subfolder+"/"+sc.Name+".m3u8",
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
