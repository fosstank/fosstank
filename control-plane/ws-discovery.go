package main

import (
	"fmt"
	"net"
	"strings"
	"time"
)

// Untested code for ws-discovery since I need to be wired into ethernet to test this.
// Not a requirement atm since I'm having the user supply rtsp urls manually.
// Just a nice to have if I get this working in the future.

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
