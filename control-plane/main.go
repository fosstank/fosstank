package main

import (
	"context"
	"log"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"sync"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	_ "control-plane/migrations"
)

func main() {
	// 1. Create config for input video which will be cli arg passed to ffmpeg
	//    Include in the config a param to set the camera name
	// 2. Call ffmpeg cli to convert input from input format to HLS fmp4 AV1
	// 3. Send HLS to CDN. Send camera name and playlist url(in CDN) to remote server

	app := pocketbase.New()

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		streams, err := app.FindAllRecords("streams")
		if err != nil {
			return err
		}

		const output_dir = "streams"
		err = os.MkdirAll(output_dir, 0755)
		if err != nil {
			return err
		}

		for _, stream := range streams {
			wg.Add(1)
			go encodeStream(ctx, &wg, output_dir, stream)
		}

		return e.Next()
	})

	app.OnTerminate().BindFunc(func(e *core.TerminateEvent) error {
		cancel()
		wg.Wait()
		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

func encodeStream(ctx context.Context, wg *sync.WaitGroup, outputDir string, stream *core.Record) error {
	defer wg.Done()

	name := stream.GetString("name")
	rtspUrl := stream.GetString("rtspUrl")

	subfolder := strings.ReplaceAll(name, " ", "_")
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
		"-i", rtspUrl,
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
		outputDir+"/"+subfolder+"/"+name+".m3u8",
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
