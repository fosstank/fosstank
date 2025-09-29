package main

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/google/uuid"
)

func StreamCreateHandler(streams *Streams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := uuid.New()
		err := os.MkdirAll(STREAM_OUTPUT_DIR+"/"+id.String(), 0755)
		if err != nil {
			http.Error(w, "Error creating stream directory", http.StatusInternalServerError)
		}

		stream := &Stream{}
		err = json.NewDecoder(r.Body).Decode(stream)
		if err != nil {
			http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
			return
		}
		stream.Id = id.String()
		newStreams := (*streams).Add(stream)
		streams = &newStreams
		err = streams.Save()
		if err != nil {
			http.Error(w, "Error saving streams", http.StatusInternalServerError)
			return
		}
	}
}
