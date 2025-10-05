package main

import (
	"encoding/json"
	"errors"
	"io/fs"
	"log"
	"os"
)

const CONFIG_FILE = "config.json"

type Config struct {
	ApiKey string `json:"apiKey"`
}

func LoadConfig() (*Config, error) {
	if _, err := os.Stat(DATA_DIR + "/" + CONFIG_FILE); errors.Is(err, fs.ErrNotExist) {
		log.Println("No existing config file found, creating new one.")
		apiKey, err := cryptoGenerateRandomString(32)
		if err != nil {
			return nil, err
		}

		config := &Config{
			ApiKey: apiKey,
		}

		err = config.Save()
		if err != nil {
			return nil, err
		}
		return config, nil
	} else if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(DATA_DIR + "/" + CONFIG_FILE)
	if err != nil {
		return nil, err
	}

	var config Config
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

func (c Config) Save() error {
	data, err := json.MarshalIndent(c, "", "\t")
	if err != nil {
		return err
	}
	return os.WriteFile(DATA_DIR+"/"+CONFIG_FILE, data, 0644)
}
