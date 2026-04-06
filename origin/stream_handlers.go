package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
)

func StreamCreateHandler(streams *Streams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stream := &Stream{}
		err := json.NewDecoder(r.Body).Decode(stream)
		if err != nil {
			log.Println("Error parsing JSON data", err)
			http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
			return
		}

		if stream.Id == "" {
			stream.Id = generateRandomString(16)
		} else {
			_, err := streams.Get(stream.Id)
			if err == nil {
				log.Println("Stream with this ID already exists")
				http.Error(w, "Stream with this ID already exists", http.StatusBadRequest)
				return
			}
		}

		err = os.MkdirAll(DATA_DIR+"/"+STREAM_OUTPUT_DIR+"/"+stream.Id, 0755)
		if err != nil {
			log.Println("Error creating stream directory", err)
			http.Error(w, "Error creating stream directory", http.StatusInternalServerError)
		}

		if stream.Source != "" && stream.Encoder != "" {
			encodingCtx, encodingCancel := context.WithCancel(encodersCtx)
			stream.SubprocessCancelFunc = encodingCancel
			go encodeStream(encodingCtx, stream)

			stream.Url, err = stream.PublicUrl()
			if err != nil {
				log.Println("Error generating public url", err)
				http.Error(w, "Error generating public url", http.StatusInternalServerError)
				return
			}

			stream.ThumbnailUrl, err = stream.PublicThumbnailUrl()
			if err != nil {
				log.Println("Error generating public thumbnail url", err)
				http.Error(w, "Error generating public thumbnail url", http.StatusInternalServerError)
				return
			}
		}

		*streams = (*streams).Add(stream)
		err = streams.Save()
		if err != nil {
			log.Println("Error saving streams", err)
			http.Error(w, "Error saving streams", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(stream)
		if err != nil {
			log.Println("Error encoding JSON data", err)
			http.Error(w, "Error encoding JSON data", http.StatusInternalServerError)
			return
		}
	}
}

func StreamRetrieveHandler(streams *Streams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		stream, err := streams.Get(id)
		if err != nil {
			log.Println("Stream not found", err)
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(stream)
		if err != nil {
			log.Println("Error encoding JSON data", err)
			http.Error(w, "Error encoding JSON data", http.StatusInternalServerError)
			return
		}
	}
}

func StreamUpdateHandler(streams *Streams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		newStream := &Stream{}
		err := json.NewDecoder(r.Body).Decode(newStream)
		if err != nil {
			log.Println("Error parsing JSON data", err)
			http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
			return
		}

		id := r.PathValue("id")
		stream, err := streams.Get(id)
		if err != nil {
			log.Println("Stream not found", err)
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		if newStream.Source != stream.Source || newStream.Encoder != stream.Encoder {
			if stream.SubprocessCancelFunc != nil {
				stream.SubprocessCancelFunc()
			}
			if newStream.Source != "" && newStream.Encoder != "" {
				encodingCtx, encodingCancel := context.WithCancel(context.Background())
				stream.SubprocessCancelFunc = encodingCancel
				go encodeStream(encodingCtx, stream)
			}
		}

		if newStream.Source != "" && newStream.Encoder != "" {
			if newStream.Id != id || newStream.Url == "" {
				newStream.Url, err = newStream.PublicUrl()
				if err != nil {
					log.Println("Error generating public url", err)
					http.Error(w, "Error generating public url", http.StatusInternalServerError)
					return
				}
			}

			if newStream.Id != id || newStream.ThumbnailUrl == "" {
				newStream.ThumbnailUrl, err = newStream.PublicThumbnailUrl()
				if err != nil {
					log.Println("Error generating public thumbnail url", err)
					http.Error(w, "Error generating public thumbnail url", http.StatusInternalServerError)
					return
				}
			}
		}

		*streams, err = (*streams).Update(id, newStream)
		if err != nil {
			log.Println("Error updating stream", err)
			http.Error(w, "Error updating stream", http.StatusInternalServerError)
			return
		}

		err = streams.Save()
		if err != nil {
			log.Println("Error saving streams", err)
			http.Error(w, "Error saving streams", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(stream)
		if err != nil {
			log.Println("Error encoding JSON data", err)
			http.Error(w, "Error encoding JSON data", http.StatusInternalServerError)
			return
		}
	}
}

func StreamDeleteHandler(streams *Streams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		stream, err := streams.Get(id)
		if err != nil {
			log.Println("Stream not found", err)
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		if stream.SubprocessCancelFunc != nil {
			stream.SubprocessCancelFunc()
		}

		*streams, err = (*streams).Remove(id)
		if err != nil {
			log.Println("Stream not found", err)
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		err = streams.Save()
		if err != nil {
			log.Println("Error saving streams", err)
			http.Error(w, "Error saving streams", http.StatusInternalServerError)
			return
		}

		err = os.RemoveAll(DATA_DIR + "/" + STREAM_OUTPUT_DIR + "/" + id)
		if err != nil {
			log.Println("Error deleting stream directory", err)
			http.Error(w, "Error deleting stream directory", http.StatusInternalServerError)
			return
		}
	}
}

func StreamTTSHandler(streams *Streams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		stream, err := streams.Get(id)
		if err != nil {
			log.Println("Stream not found", err)
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		if stream.AudioSink == "" {
			log.Println("Stream does not have an audio sink")
			http.Error(w, "Stream does not have an audio sink", http.StatusBadRequest)
			return
		}

		// TODO: Queue TTS requests
		voice := r.PathValue("voice")
		audioURL := fmt.Sprintf("http://tts:8000/tts/%s", voice)

		// Send HTTP request to get the audio stream
		resp, err := http.Post(audioURL, "application/json", r.Body)
		if err != nil {
			log.Println("Failed to fetch audio stream", err)
			http.Error(w, "Failed to fetch audio stream", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		// Check if the response is valid
		if resp.StatusCode != http.StatusOK {
			log.Println("TTS HTTP request failed")
			http.Error(w, "TTS HTTP request failed", http.StatusInternalServerError)
			return
		}

		// Set up the paplay command to play the audio stream
		cmd := exec.Command("paplay", "--device", stream.AudioSink)
		cmd.Stdin = resp.Body // Pipe the HTTP response body to paplay
		var cmdOut bytes.Buffer
		cmd.Stdout = &cmdOut
		cmd.Stderr = &cmdOut

		// Start the command to play audio
		err = cmd.Start()
		if err != nil {
			log.Println("Failed to start audio player", err)
			http.Error(w, "Failed to start audio player", http.StatusInternalServerError)
			return
		}

		// Wait for the audio player to finish playing
		err = cmd.Wait()
		if err != nil {
			log.Println("Audio player failed", err, cmdOut.String())
			http.Error(w, "Audio player failed", http.StatusInternalServerError)
			return
		}
	}
}
