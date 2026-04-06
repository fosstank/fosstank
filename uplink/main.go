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
	"encoding/json"
	"io/fs"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	_ "github.com/fosstank/fosstank/uplink/migrations"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

//go:embed all:ui/out
var client embed.FS

var app = pocketbase.New()

func main() {
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

	// Deduct user balance on TTS/SFX/Fosstoy order creation
	app.OnRecordCreateRequest("tts_orders", "sfx_orders", "fosstoy_orders").BindFunc(func(e *core.RecordRequestEvent) error {
		errs := app.ExpandRecord(e.Record, []string{"option"}, nil)
		if len(errs) > 0 {
			return apis.NewBadRequestError("Failed to expand option relation", errs)
		}
		option := e.Record.ExpandedOne("option")

		balance := e.Auth.GetInt("balance")
		cost := option.GetInt("cost")
		if balance < cost {
			return apis.NewBadRequestError("Insufficient balance", nil)
		}

		// Send TTS request to origin server
		if e.Record.Collection().Name == "tts_orders" {
			streamId := e.Record.GetString("stream")
			voice := option.GetString("title")
			prompt := e.Record.GetString("message")
			err := originClient.SendTTS(streamId, voice, prompt)
			if err != nil {
				return apis.NewInternalServerError("Error sending TTS", err)
			}
		}

		// The user balance field has a min of 0, so this will error if they don't have enough.
		// We've already checked their balance above anyway though.
		e.Auth.Set("balance", balance-cost)
		err := app.Save(e.Auth)
		if err != nil {
			return err
		}
		return e.Next()
	})

	// Make sure the poll options and votes are in the correct json structure
	app.OnRecordValidate("polls").BindFunc(func(e *core.RecordEvent) error {
		// Validate options field is an array of strings
		options := []string{}
		err := e.Record.UnmarshalJSONField("options", &options)
		if err != nil {
			return apis.NewBadRequestError("Poll options must be an array of strings", err)
		}

		if e.Record.GetString("votes") == "null" {
			// Initialize votes to an array of zeros with the same length as options
			e.Record.Set("votes", make([]int, len(options)))
		} else {
			// Ensure votes length matches options length
			votes := []int{}
			err = e.Record.UnmarshalJSONField("votes", &votes)
			if err != nil || len(votes) != len(options) {
				return apis.NewBadRequestError("Poll votes must be an array of integers with the same length as options", err)
			}
		}

		return e.Next()
	})

	// Handle updating the poll vote totals and deducting user balance when a vote is created
	app.OnRecordCreateRequest("poll_votes").BindFunc(func(e *core.RecordRequestEvent) error {
		balance := e.Auth.GetInt("balance")
		tokens := e.Record.GetInt("tokens")
		if balance < tokens {
			return apis.NewBadRequestError("Insufficient balance", nil)
		}

		// Running the ExpandRecord call in the transaction is important!!
		// Running it outside the transaction allows a race condition where
		// similarly timed poll vote creation events may overwrite each other's changes to the poll votes field.
		err := app.RunInTransaction(func(txApp core.App) error {
			errs := txApp.ExpandRecord(e.Record, []string{"poll"}, nil)
			if len(errs) > 0 {
				return apis.NewBadRequestError("Failed to expand poll relation", errs)
			}
			poll := e.Record.ExpandedOne("poll")

			votes := []int{}
			err := poll.UnmarshalJSONField("votes", &votes)
			if err != nil {
				return apis.NewInternalServerError("Failed to parse poll votes", err)
			}

			option := e.Record.GetInt("option")
			if option < 0 || option >= len(votes) {
				return apis.NewBadRequestError("Invalid poll option", nil)
			}

			votes[option] += tokens
			poll.Set("votes", votes)

			err = txApp.Save(poll)
			if err != nil {
				return err
			}

			// The user balance field has a min of 0, so this will error if they don't have enough.
			// We've already checked their balance above anyway though.
			e.Auth.Set("balance", balance-tokens)
			err = txApp.Save(e.Auth)
			if err != nil {
				return err
			}
			return nil
		})
		if err != nil {
			return err
		}

		return e.Next()
	})

	// Cron job to calculate each stream's viewer count every minute
	app.Cron().MustAdd("viewer-count", "* * * * *", func() {
		// window should match the client's heartbeat interval to prevent ghost viewers
		window := time.Now().UTC().Add(-1 * time.Minute).Format("2006-01-02 15:04:05")
		_, err := app.DB().Update("streams", dbx.Params{
			"viewers": dbx.NewExp("(SELECT COUNT(DISTINCT session_id) FROM heartbeats WHERE heartbeats.stream = streams.id AND heartbeats.created >= {:cutoff})", dbx.Params{
				"cutoff": window,
			}),
		}, nil).Execute()
		if err != nil {
			log.Println("Failed to update stream viewer counts:", err)
			return
		}

		streamsHeartbeat := struct {
			Viewers int            `json:"viewers" db:"viewers"`
			Streams []*core.Record `json:"streams"`
		}{}

		// TODO: This count is sent to all clients every minute,
		// but not when users first load the page. When they first load the page
		// they do have the viewer count for each individual stream,
		// so I cheat and sum those values to approximate the total viewer count.
		// Should probably get the real value to the user on initial page load properly at some point.
		streamsHeartbeat.Viewers = app.SubscriptionsBroker().TotalClients()
		streamsHeartbeat.Streams, err = app.FindAllRecords("streams")
		if err != nil {
			log.Println("Failed to fetch streams for heartbeat:", err)
			return
		}

		data, err := json.Marshal(streamsHeartbeat)
		if err != nil {
			log.Println("Failed to marshal streams heartbeat:", err)
			return
		}

		message := subscriptions.Message{
			Name: "streams_heartbeat",
			Data: data,
		}

		chunks := app.SubscriptionsBroker().ChunkedClients(300)
		var wg sync.WaitGroup
		for _, chunk := range chunks {
			wg.Go(func() {
				for _, client := range chunk {
					if !client.HasSubscription("streams_heartbeat") {
						continue
					}

					client.Send(message)
				}
			})
		}

		wg.Wait()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
