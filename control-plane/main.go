package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

// For ws-discovery, unused for now
const (
	multicastAddr = "239.255.255.250:3702"
	probeMessage  = `<?xml version="1.0" encoding="UTF-8"?>
<e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope"
            xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing"
            xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery">
  <e:Header>
    <w:MessageID>uuid:12345678-1234-1234-1234-123456789abc</w:MessageID>
    <w:To>urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>
    <w:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action>
  </e:Header>
  <e:Body>
    <d:Probe>
      <d:Types>dn:NetworkVideoTransmitter</d:Types>
    </d:Probe>
  </e:Body>
</e:Envelope>`
)

func main() {
	// 1. Create config for input video which will be cli arg passed to ffmpeg
	//    Include in the config a param to set the camera name
	// 2. Call ffmpeg cli to convert input from input format to HLS fmp4 AV1
	// 3. Send HLS to CDN. Send camera name and playlist url(in CDN) to remote server

	config := &Config{}
	config.LoadFromFile("config.json")

	const output_dir = "streams"
	err := os.MkdirAll(output_dir, 0755)
	if err != nil {
		log.Fatalf("failed to create streams directory: %v", err)
	}

	// TODO: goroutines, needed for multiple cameras
	for _, streamConfig := range config.Streams {
		// ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		// defer cancel()
		ctx := context.Background()

		subfolder := strings.ReplaceAll(streamConfig.Name, " ", "_")
		re := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
		subfolder = re.ReplaceAllString(subfolder, "")
		subfolder = strings.TrimLeft(subfolder, ".")

		err := os.MkdirAll(output_dir+"/"+subfolder, 0755)
		if err != nil {
			log.Fatalf("failed to create '%s' directory: %v", output_dir+"/"+subfolder, err)
		}

		cmd := exec.CommandContext(ctx,
			"ffmpeg",
			"-loglevel", "error",
			"-rtsp_transport", "tcp",
			"-i", streamConfig.RTSPUri,
			"-c:a", "aac",
			"-s", "hd1080",
			"-c:v", "libsvtav1",
			"-preset", "10",
			"-b:v", "500k",
			"-f", "hls",
			"-hls_time", "6",
			"-hls_list_size", "5",
			"-hls_segment_type", "fmp4",
			"-hls_flags", "delete_segments",
			output_dir+"/"+subfolder+"/"+streamConfig.Name+".m3u8",
		)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		err = cmd.Run()
		if err != nil {
			log.Printf("error running ffmpeg: %s", err)
		}
	}
}

// ws-discovery, unused for now
func discover() {
	addr, err := net.ResolveUDPAddr("udp4", multicastAddr)
	if err != nil {
		panic(err)
	}

	conn, err := net.ListenUDP("udp4", &net.UDPAddr{
		IP:   net.IPv4zero,
		Port: 0,
	})
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	conn.SetReadDeadline(time.Now().Add(10 * time.Second))

	_, err = conn.WriteToUDP([]byte(probeMessage), addr)
	if err != nil {
		panic(err)
	}

	fmt.Println("Sent WS-Discovery probe. Waiting for responses...")

	buf := make([]byte, 8192)
	for {
		n, addr, err := conn.ReadFromUDP(buf)
		if err != nil {
			fmt.Println("Done listening.")
			break
		}
		fmt.Printf("\nResponse from %s:\n", addr)
		fmt.Println(strings.TrimSpace(string(buf[:n])))
	}
}
