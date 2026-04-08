package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
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
			Id:        e.Record.Id,
			Title:     e.Record.GetString("title"),
			Source:    e.Record.GetString("source"),
			Encoder:   Encoder(e.Record.GetString("encoder")),
			AudioSink: e.Record.GetString("audio_sink"),
		})
		if err != nil {
			return err
		}
		e.Record.Set("url", createdStream.Url)
		e.Record.Set("thumbnail_url", createdStream.ThumbnailUrl)
		return e.Next()
	})

	// TODO: Validate encoder is available on origin server
	app.OnRecordUpdate("streams").BindFunc(func(e *core.RecordEvent) error {
		updatedStream, err := originClient.UpdateStream(&Stream{
			Id:        e.Record.Id,
			Title:     e.Record.GetString("title"),
			Source:    e.Record.GetString("source"),
			Encoder:   Encoder(e.Record.GetString("encoder")),
			AudioSink: e.Record.GetString("audio_sink"),
		})
		if err != nil {
			return err
		}
		e.Record.Set("url", updatedStream.Url)
		e.Record.Set("thumbnail_url", updatedStream.ThumbnailUrl)
		return e.Next()
	})

	app.OnRecordDelete("streams").BindFunc(func(e *core.RecordEvent) error {
		err := originClient.DeleteStream(e.Record.Id)
		if err != nil {
			return err
		}
		return e.Next()
	})

	app.OnRecordCreate("tts_options").BindFunc(func(e *core.RecordEvent) error {
		audioFile := e.Record.GetString("referenceAudio")
		var audioFileReader io.ReadCloser
		if audioFile != "" {
			fsys, r, err := getFileReader(e.Record, audioFile)
			if err != nil {
				return err
			}
			defer fsys.Close()
			defer r.Close()
			audioFileReader = r
		}
		if err := originClient.SyncTTSVoice(e.Record.GetString("title"), audioFileReader, audioFile, e.Record.GetString("referenceText")); err != nil {
			return err
		}
		return e.Next()
	})

	app.OnRecordUpdate("tts_options").BindFunc(func(e *core.RecordEvent) error {
		audioFile := e.Record.GetString("referenceAudio")
		var audioFileReader io.ReadCloser
		if audioFile != "" {
			fsys, r, err := getFileReader(e.Record, audioFile)
			if err != nil {
				return err
			}
			defer fsys.Close()
			defer r.Close()
			audioFileReader = r
		}
		if err := originClient.SyncTTSVoice(e.Record.GetString("title"), audioFileReader, audioFile, e.Record.GetString("referenceText")); err != nil {
			return err
		}
		return e.Next()
	})

	app.OnRecordDelete("tts_options").BindFunc(func(e *core.RecordEvent) error {
		if err := originClient.DeleteTTSVoice(e.Record.GetString("title")); err != nil {
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
				Id:        record.Id,
				Title:     record.GetString("title"),
				Source:    record.GetString("source"),
				Encoder:   Encoder(record.GetString("encoder")),
				AudioSink: record.GetString("audio_sink"),
			}
			_, err := originClient.CreateStream(stream)
			if err != nil {
				app.Logger().Error("Failed to sync stream %s to origin: %v", record.Id, err)
			}
		}

		return e.Next()
	})

	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Sync existing TTS voices to origin
		ttsOptions, err := e.App.FindAllRecords("tts_options")
		if err != nil {
			app.Logger().Error("Failed to load TTS options", "error", err)
			return err
		}

		for _, record := range ttsOptions {
			audioFile := record.GetString("referenceAudio")
			var audioFileReader io.ReadCloser
			if audioFile != "" {
				fsys, r, err := getFileReader(record, audioFile)
				if err != nil {
					app.Logger().Error("Failed to get audio file reader for TTS option", "record", record.Id, "error", err)
					return err
				}
				defer fsys.Close()
				defer r.Close()
				audioFileReader = r
			}
			if err := originClient.SyncTTSVoice(record.GetString("title"), audioFileReader, audioFile, record.GetString("referenceText")); err != nil {
				app.Logger().Error("Failed to sync TTS voice to origin", "record", record.Id, "error", err)
				return err
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
	Id           string  `json:"id"`
	Title        string  `json:"title"`
	Url          string  `json:"url"`
	ThumbnailUrl string  `json:"thumbnailUrl"`
	Source       string  `json:"source"`
	Encoder      Encoder `json:"encoder"`
	AudioSink    string  `json:"audioSink"`
}

// type TTSOption struct {
// 	Title          string `json:"title"`
// 	ReferenceAudio string `json:"referenceAudio"`
// 	ReferenceText  string `json:"referenceText"`
// }

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

func getFileReader(record *core.Record, path string) (*filesystem.System, io.ReadCloser, error) {
	filePath := record.BaseFilesPath() + "/" + path

	fsys, err := app.NewFilesystem()
	if err != nil {
		return nil, nil, err
	}

	r, err := fsys.GetReader(filePath)
	if err != nil {
		closeErr := fsys.Close()
		if closeErr != nil {
			return nil, nil, fmt.Errorf("failed to get reader: %v, also failed to close filesystem: %v", err, closeErr)
		}
		return nil, nil, err
	}
	return fsys, r, nil
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

func (c *OriginClient) SyncTTSVoice(title string, audioFileReader io.Reader, audioFileName string, referenceText string) error {
	type syncRequest struct {
		ReferenceAudio *string `json:"reference_audio,omitempty"`
		ReferenceText  *string `json:"reference_text,omitempty"`
	}

	body := syncRequest{}
	if referenceText != "" {
		body.ReferenceText = &referenceText
	}
	if audioFileReader != nil {
		audioBytes, err := io.ReadAll(audioFileReader)
		if err != nil {
			return err
		}
		b64 := base64.StdEncoding.EncodeToString(audioBytes)
		body.ReferenceAudio = &b64
	}

	data, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPut, c.Url+"/tts-options/"+title, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to sync TTS voice: %s", resp.Status)
	}
	return nil
}

func (c *OriginClient) DeleteTTSVoice(title string) error {
	resp, err := c.doRequest("DELETE", "/tts-options/"+title, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to delete TTS option: %s", resp.Status)
	}
	return nil
}

func (c *OriginClient) SendTTS(streamId string, optionTitle string, prompt string) error {
	data, err := json.Marshal(map[string]string{"prompt": prompt})
	if err != nil {
		return err
	}

	resp, err := c.doRequest("POST", "/streams/"+streamId+"/tts/"+optionTitle, bytes.NewReader(data))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to TTS stream: %s", resp.Status)
	}

	return nil
}
