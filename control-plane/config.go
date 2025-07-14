package main

import (
	"encoding/json"
	"os"
)

type Config struct {
	Streams []StreamConfig `json:"streams"`
}

var DefaultConfig = Config{
	Streams: []StreamConfig{
		{
			Name:    "default",
			RTSPUri: "rtsp://",
		},
	},
}

func (c *Config) LoadFromFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			defaultConfigData, err := json.MarshalIndent(DefaultConfig, "", "\t")
			if err != nil {
				return err
			}

			err = os.WriteFile(path, defaultConfigData, 0755)
			if err != nil {
				return err
			}
			c = &Config{}
			return nil
		} else {
			return err
		}
	}

	err = json.Unmarshal(data, c)
	if err != nil {
		return err
	}
	return nil
}

type StreamConfig struct {
	Name    string `json:"name"`
	RTSPUri string `json:"rtspUri"`
}
