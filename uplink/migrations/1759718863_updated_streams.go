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
		if err := collection.Fields.AddMarshaledJSONAt(5, []byte(`{
			"exceptDomains": [],
			"hidden": true,
			"id": "url1602912115",
			"name": "source",
			"onlyDomains": [],
			"presentable": false,
			"required": false,
			"system": false,
			"type": "url"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(6, []byte(`{
			"hidden": true,
			"id": "select580179152",
			"maxSelect": 1,
			"name": "encoder",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
				"libsvtav1",
				"libx264"
			]
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
		collection.Fields.RemoveById("url1602912115")

		// remove field
		collection.Fields.RemoveById("select580179152")

		return app.Save(collection)
	})
}
