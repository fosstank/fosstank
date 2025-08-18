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
		se.Router.GET("/{path...}", func(c *core.RequestEvent) error {
			if strings.HasPrefix(c.Request.URL.Path, "/static/") {
				c.Response.Header().Add("Cache-Control", "public, max-age=31536000, immutable")
			}
			return apis.Static(public, false)(c)
		})
		return se.Next()
	})

	// Deduct user balance on TTS order creation
	app.OnRecordCreateRequest("tts_orders").BindFunc(func(e *core.RecordRequestEvent) error {
		option, err := app.FindRecordById(e.Collection.Name, e.Record.GetString("option"))
		if err != nil {
			return err
		}

		e.Auth.Set("balance", e.Auth.GetInt("balance")-option.GetInt("cost"))
		app.Save(e.Auth)
		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
