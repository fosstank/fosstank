package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_576630152")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(3, []byte(`{
			"hidden": true,
			"id": "file4082798890",
			"maxSelect": 1,
			"maxSize": 0,
			"mimeTypes": [
				"audio/wav"
			],
			"name": "referenceAudio",
			"presentable": false,
			"protected": false,
			"required": false,
			"system": false,
			"thumbs": [],
			"type": "file"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(4, []byte(`{
			"autogeneratePattern": "",
			"hidden": true,
			"id": "text3423044380",
			"max": 0,
			"min": 0,
			"name": "referenceAudioText",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_576630152")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("file4082798890")

		// remove field
		collection.Fields.RemoveById("text3423044380")

		return app.Save(collection)
	})
}
