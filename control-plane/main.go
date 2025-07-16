package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	_ "control-plane/migrations"
)

//go:embed ui/out/*
var client embed.FS

const STREAM_OUTPUT_DIR = "streams"

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

	// Serve ui
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		public, err := fs.Sub(client, "ui/out")
		if err != nil {
			return err
		}
		se.Router.GET("/{path...}", apis.Static(public, false))
		return se.Next()
	})

	// Create stream output dir
	err := os.MkdirAll(STREAM_OUTPUT_DIR, 0755)
	if err != nil {
		log.Fatal(err)
	}

	// Serve stream output dir
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/"+STREAM_OUTPUT_DIR+"/{path...}", apis.Static(os.DirFS(STREAM_OUTPUT_DIR), false))
		return se.Next()
	})

	// Start ffmpeg processes
	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		streams, err := app.FindAllRecords("streams")
		if err != nil {
			log.Fatal(err)
		}

		for _, stream := range streams {
			wg.Add(1)
			go encodeStream(ctx, &wg, stream)
		}
		return e.Next()
	})

	// Kill ffmpeg processes
	app.OnTerminate().BindFunc(func(e *core.TerminateEvent) error {
		cancel()
		wg.Wait()
		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

func encodeStream(ctx context.Context, wg *sync.WaitGroup, stream *core.Record) error {
	defer wg.Done()

	source := stream.GetString("source")

	cmd := exec.CommandContext(ctx,
		"ffmpeg",
		"-loglevel", "error",
		"-rtsp_transport", "tcp",
		"-i", source,
		"-c:a", "aac",
		"-s", "hd1080",
		"-c:v", "libsvtav1",
		"-preset", "10",
		"-b:v", "500k",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_list_size", "5",
		"-hls_segment_type", "fmp4",
		"-hls_flags", "delete_segments",
		STREAM_OUTPUT_DIR+"/"+stream.Id+".m3u8",
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
