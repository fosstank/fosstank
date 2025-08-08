package main

import (
	"embed"
	"io/fs"
	"log"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

//go:embed ui/out/*
var client embed.FS

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

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
