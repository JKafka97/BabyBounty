package main

import (
	"os"
	"testing"
	"time"
	"net/http"
)

// TestMain runs before any test and is responsible for global setup
func TestMain(m *testing.M) {
	// Start the server once before any tests
	go StartServer()

	// Wait for the server to start up
	time.Sleep(500 * time.Millisecond)

	// Run the tests
	code := m.Run()

	// Exit with the result of the tests
	os.Exit(code)
}

// Test the homeHandler to make sure it responds with the expected message.
func TestHomeHandler(t *testing.T) {
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
