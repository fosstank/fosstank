package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
)

var ErrNotFound = errors.New("not found")

const STREAMS_FILE = "streams.json"

type Streams []*Stream

type Stream struct {
	Id      string  `json:"id"`
	Name    string  `json:"name"`
	Source  string  `json:"source"`
	Encoder Encoder `json:"encoder"`

	SubprocessCancelFunc context.CancelFunc `json:"-"`
}

func LoadStreams() (Streams, error) {
	data, err := os.ReadFile(DATA_DIR + "/" + STREAMS_FILE)
	if err == os.ErrPermission {
		return nil, err
	} else if err != nil {
		log.Println("No existing streams file found, creating new one.")
		streams := Streams{
			{
				Id:      generateRandomString(16),
				Name:    "Stream 1",
				Source:  "",
				Encoder: EncoderLibX264,
			},
		}
		err = streams.Save()
		if err != nil {
			return nil, err
		}
		return streams, nil
	}

	var streams Streams
	err = json.Unmarshal(data, &streams)
	if err != nil {
		return nil, err
	}

	return streams, nil
}

func (s Streams) Save() error {
	data, err := json.MarshalIndent(s, "", "\t")
	if err != nil {
		return err
	}
	return os.WriteFile(DATA_DIR+"/"+STREAMS_FILE, data, 0644)
}

func (s Streams) Get(id string) (*Stream, error) {
	for _, stream := range s {
		if stream.Id == id {
			return stream, nil
		}
	}
	return nil, ErrNotFound
}

func (s Streams) Add(stream *Stream) Streams {
	return append(s, stream)
}

func (s Streams) Remove(id string) (Streams, error) {
	for i, stream := range s {
		if stream.Id == id {
			return append(s[:i], s[i+1:]...), nil
		}
	}
	return nil, ErrNotFound
}

func (s Streams) Update(newStream *Stream) (Streams, error) {
	for i, stream := range s {
		if stream.Id == newStream.Id {
			s[i] = newStream
			return s, nil
		}
	}
	return nil, ErrNotFound
}
