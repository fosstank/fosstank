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

package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE UNIQUE INDEX `+"`"+`idx_tokenKey__pb_users_auth_`+"`"+` ON `+"`"+`users`+"`"+` (`+"`"+`tokenKey`+"`"+`)",
				"CREATE UNIQUE INDEX `+"`"+`idx_email__pb_users_auth_`+"`"+` ON `+"`"+`users`+"`"+` (`+"`"+`email`+"`"+`) WHERE `+"`"+`email`+"`"+` != ''",
				"CREATE UNIQUE INDEX `+"`"+`idx_0mOaXsj6O8`+"`"+` ON `+"`"+`users`+"`"+` (`+"`"+`username`+"`"+`)"
			],
			"oauth2": {
				"mappedFields": {
					"name": ""
				}
			},
			"passwordAuth": {
				"identityFields": [
					"email",
					"username"
				]
			}
		}`), &collection); err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(6, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text1579384326",
			"max": 255,
			"min": 0,
			"name": "username",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": true,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE UNIQUE INDEX `+"`"+`idx_tokenKey__pb_users_auth_`+"`"+` ON `+"`"+`users`+"`"+` (`+"`"+`tokenKey`+"`"+`)",
				"CREATE UNIQUE INDEX `+"`"+`idx_email__pb_users_auth_`+"`"+` ON `+"`"+`users`+"`"+` (`+"`"+`email`+"`"+`) WHERE `+"`"+`email`+"`"+` != ''"
			],
			"oauth2": {
				"mappedFields": {
					"name": "name"
				}
			},
			"passwordAuth": {
				"identityFields": [
					"email"
				]
			}
		}`), &collection); err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(6, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text1579384326",
			"max": 255,
			"min": 0,
			"name": "name",
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
	})
}
