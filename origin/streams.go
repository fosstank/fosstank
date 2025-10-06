package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/url"
	"os"
)

var ErrNotFound = errors.New("not found")

const STREAMS_FILE = "streams.json"

type Streams []*Stream

type Stream struct {
	Id      string  `json:"id"`
	Title   string  `json:"title"`
	Url     string  `json:"url"`
	Source  string  `json:"source"`
	Encoder Encoder `json:"encoder"`

	SubprocessCancelFunc context.CancelFunc `json:"-"`
}

func LoadStreams() (Streams, error) {
	if _, err := os.Stat(DATA_DIR + "/" + STREAMS_FILE); errors.Is(err, fs.ErrNotExist) {
		log.Println("No existing streams file found, creating new one.")
		streams := Streams{
			{
				Id:      generateRandomString(16),
				Title:   "Stream 1",
				Source:  "",
				Encoder: EncoderLibX264,
			},
		}
		err = streams.Save()
		if err != nil {
			return nil, err
		}
		return streams, nil
	} else if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(DATA_DIR + "/" + STREAMS_FILE)
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

func (s Streams) Update(id string, newStream *Stream) (Streams, error) {
	stream, err := s.Get(newStream.Id)
	if err != nil {
		return nil, err
	}

	if stream.Id != newStream.Id {
		stream.Id = newStream.Id
	}

	if stream.Title != newStream.Title {
		stream.Title = newStream.Title
	}

	if stream.Url != newStream.Url {
		stream.Url = newStream.Url
	}

	if stream.Source != newStream.Source {
		stream.Source = newStream.Source
	}

	if stream.Encoder != newStream.Encoder {
		stream.Encoder = newStream.Encoder
	}

	return s, nil
}

func (s *Stream) PublicUrl() (string, error) {
	endpoint := CDN_ENDPOINT
	if endpoint == "" && s3Client != nil {
		endpoint = s3Client.EndpointURL().String()
	}
	u, err := url.Parse(endpoint)
	if err != nil {
		return "", err
	}

	joinedUrl := u.JoinPath(S3_BUCKET_NAME, s.Id, fmt.Sprintf("%s.m3u8", s.Id))
	return joinedUrl.String(), nil
}
