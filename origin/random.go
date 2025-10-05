package main

import (
	crand "crypto/rand"
	"encoding/base64"
	mrand "math/rand"
)

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func generateRandomString(length int) string {
	result := make([]byte, length)
	for i := range result {
		result[i] = alphabet[mrand.Intn(len(alphabet))]
	}

	return string(result)
}

func cryptoGenerateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := crand.Read(bytes)
	if err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
