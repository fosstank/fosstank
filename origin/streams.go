package main

import (
	"encoding/json"
	"errors"
	"os"
)

var ErrNotFound = errors.New("not found")

type Streams []*Stream

type Stream struct {
	Id      string  `json:"id"`
	Name    string  `json:"name"`
	Source  string  `json:"source"`
	Encoder Encoder `json:"encoder"`
}

func LoadStreams() (Streams, error) {
	data, err := os.ReadFile("streams.json")
	if err != nil {
		return nil, err
	}

	var streams Streams
	err = json.Unmarshal(data, &streams)
	if err != nil {
		return nil, err
	}

	return streams, nil
}

func (s Streams) Save() error {
	data, err := json.Marshal(s)
	if err != nil {
		return err
	}
	return os.WriteFile("streams.json", data, 0644)
}

func (s Streams) GetId(id string) (*Stream, error) {
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

func (s Streams) RemoveId(id string) (Streams, error) {
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
