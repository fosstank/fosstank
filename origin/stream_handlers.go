package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
)

func StreamCreateHandler(streams *Streams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stream := &Stream{}
		err := json.NewDecoder(r.Body).Decode(stream)
		if err != nil {
			http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
			return
		}

		if stream.Id == "" {
			stream.Id = generateRandomString(16)
		} else {
			_, err := streams.Get(stream.Id)
			if err == nil {
				http.Error(w, "Stream with this ID already exists", http.StatusBadRequest)
				return
			}
		}

		err = os.MkdirAll(DATA_DIR+"/"+STREAM_OUTPUT_DIR+"/"+stream.Id, 0755)
		if err != nil {
			http.Error(w, "Error creating stream directory", http.StatusInternalServerError)
		}

		*streams = (*streams).Add(stream)
		err = streams.Save()
		if err != nil {
			http.Error(w, "Error saving streams", http.StatusInternalServerError)
			return
		}

		encodingCtx, encodingCancel := context.WithCancel(encodersCtx)
		stream.SubprocessCancelFunc = encodingCancel
		go encodeStream(encodingCtx, stream)

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(stream)
		if err != nil {
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
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(stream)
		if err != nil {
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
			http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
			return
		}

		id := r.PathValue("id")
		stream, err := streams.Get(id)
		if err != nil {
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

		*streams, err = (*streams).Update(id, newStream)
		if err != nil {
			http.Error(w, "Error updating stream", http.StatusInternalServerError)
			return
		}

		err = streams.Save()
		if err != nil {
			http.Error(w, "Error saving streams", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(stream)
		if err != nil {
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
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		if stream.SubprocessCancelFunc != nil {
			stream.SubprocessCancelFunc()
		}

		*streams, err = (*streams).Remove(id)
		if err != nil {
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}

		err = streams.Save()
		if err != nil {
			http.Error(w, "Error saving streams", http.StatusInternalServerError)
			return
		}

		err = os.RemoveAll(DATA_DIR + "/" + STREAM_OUTPUT_DIR + "/" + id)
		if err != nil {
			http.Error(w, "Error deleting stream directory", http.StatusInternalServerError)
			return
		}
	}
}
