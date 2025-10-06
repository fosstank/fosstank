package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase/core"
)

var ORIGIN_URL string = os.Getenv("ORIGIN_URL")
var ORIGIN_API_KEY string = os.Getenv("ORIGIN_API_KEY")
var originClient *OriginClient

func init() {
	if ORIGIN_URL == "" {
		app.Logger().Warn("ORIGIN_URL env var is not set, origin integration will be disabled")
		return
	}

	if ORIGIN_API_KEY == "" {
		app.Logger().Warn("ORIGIN_API_KEY env var is not set, origin integration will be disabled")
		return
	}

	originClient = NewOriginClient(ORIGIN_URL, ORIGIN_API_KEY)

	// TODO: Validate encoder is available on origin server
	app.OnRecordCreate("streams").BindFunc(func(e *core.RecordEvent) error {
		createdStream, err := originClient.CreateStream(&Stream{
			Id:      e.Record.Id,
			Title:   e.Record.GetString("title"),
			Source:  e.Record.GetString("source"),
			Encoder: Encoder(e.Record.GetString("encoder")),
		})
		if err != nil {
			return err
		}
		e.Record.Set("url", createdStream.Url)
		return e.Next()
	})

	// TODO: Validate encoder is available on origin server
	app.OnRecordUpdate("streams").BindFunc(func(e *core.RecordEvent) error {
		updatedStream, err := originClient.UpdateStream(&Stream{
			Id:      e.Record.Id,
			Title:   e.Record.GetString("title"),
			Source:  e.Record.GetString("source"),
			Encoder: Encoder(e.Record.GetString("encoder")),
		})
		if err != nil {
			return err
		}
		e.Record.Set("url", updatedStream.Url)
		return e.Next()
	})

	app.OnRecordDelete("streams").BindFunc(func(e *core.RecordEvent) error {
		err := originClient.DeleteStream(e.Record.Id)
		if err != nil {
			return err
		}
		return e.Next()
	})

	// TODO: Validate encoder is available on origin server
	// TODO: Upsert existing streams instead of just creating
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Sync existing streams to origin
		streams, err := e.App.FindAllRecords("streams")
		if err != nil {
			return err
		}

		for _, record := range streams {
			stream := &Stream{
				Id:      record.Id,
				Title:   record.GetString("title"),
				Source:  record.GetString("source"),
				Encoder: Encoder(record.GetString("encoder")),
			}
			_, err := originClient.CreateStream(stream)
			if err != nil {
				app.Logger().Error("Failed to sync stream %s to origin: %v", record.Id, err)
			}
		}

		return e.Next()
	})
}

type OriginClient struct {
	Url    string
	ApiKey string
}

// TODO: The encoder and stream types are copy-paste from the origin server, should make a shared package
type Encoder string

const (
	EncoderSVTAV1  Encoder = "libsvtav1"
	EncoderLibX264 Encoder = "libx264"
)

type Stream struct {
	Id      string  `json:"id"`
	Title   string  `json:"title"`
	Url     string  `json:"url"`
	Source  string  `json:"source"`
	Encoder Encoder `json:"encoder"`
}

func NewOriginClient(url, apiKey string) *OriginClient {
	return &OriginClient{
		Url:    url,
		ApiKey: apiKey,
	}
}

func (c *OriginClient) doRequest(method, path string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequest(method, c.Url+path, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	return client.Do(req)
}

func (c *OriginClient) CreateStream(stream *Stream) (*Stream, error) {
	data, err := json.Marshal(stream)
	if err != nil {
		return nil, err
	}

	resp, err := c.doRequest("POST", "/streams", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to create stream: %s", resp.Status)
	}

	var createdStream Stream
	err = json.NewDecoder(resp.Body).Decode(&createdStream)
	if err != nil {
		return nil, err
	}

	return &createdStream, nil
}

func (c *OriginClient) GetStream(id string) (*Stream, error) {
	resp, err := c.doRequest("GET", "/streams/"+id, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get stream: %s", resp.Status)
	}

	var stream Stream
	err = json.NewDecoder(resp.Body).Decode(&stream)
	if err != nil {
		return nil, err
	}

	return &stream, nil
}

func (c *OriginClient) UpdateStream(stream *Stream) (*Stream, error) {
	data, err := json.Marshal(stream)
	if err != nil {
		return nil, err
	}

	resp, err := c.doRequest("PUT", "/streams/"+stream.Id, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to update stream: %s", resp.Status)
	}

	var updatedStream Stream
	err = json.NewDecoder(resp.Body).Decode(&updatedStream)
	if err != nil {
		return nil, err
	}

	return &updatedStream, nil
}

func (c *OriginClient) DeleteStream(id string) error {
	resp, err := c.doRequest("DELETE", "/streams/"+id, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to delete stream: %s", resp.Status)
	}

	return nil
}
