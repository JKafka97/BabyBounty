package main

import (
	"net/http"
	"testing"
	"time"
)

// Start the server for testing
func startServer() {
	go func() {
		// Use the StartServer function from main.go
		StartServer()
	}()

	// Give the server a moment to start.
	time.Sleep(500 * time.Millisecond) // Wait for server to start
}

// Test the homeHandler to make sure it responds with the expected message.
func TestHomeHandler(t *testing.T) {
	// Start the server once
	startServer()

	// Send a request to the server.
	resp, err := http.Get("http://localhost:8080")
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Check if the status code is 200 OK
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200 OK, got %v", resp.StatusCode)
	}

	// Check if the response body is as expected
	expected := "Welcome to BabyBounty! 🎁"
	if resp.Body == nil {
		t.Errorf("Expected body %v, got nil", expected)
	}
}

// Test that the HTTP server starts automatically
func TestServerStart(t *testing.T) {
	// Start the server once
	startServer()

	// Send a request to the running server.
	resp, err := http.Get("http://localhost:8080")
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Check if the status code is 200 OK
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200 OK, got %v", resp.StatusCode)
	}
}
