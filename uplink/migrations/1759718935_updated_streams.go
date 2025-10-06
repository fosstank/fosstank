package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2662073616")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(3, []byte(`{
			"exceptDomains": [],
			"hidden": false,
			"id": "url2170429563",
			"name": "thumbnail_url",
			"onlyDomains": [],
			"presentable": false,
			"required": false,
			"system": false,
			"type": "url"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2662073616")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("url2170429563")

		return app.Save(collection)
	})
}
