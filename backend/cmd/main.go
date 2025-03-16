package main

import (
	"fmt"
	"log"
	"net/http"
)

// HomeHandler handles the root URL.
func homeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Welcome to BabyBounty! 🎁")
}

// StartServer starts the HTTP server.
func StartServer() {
	port := ":8080"
	http.HandleFunc("/", homeHandler)

	log.Printf("Starting BabyBounty server on http://localhost%s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// main function starts the server only when it's executed directly.
func main() {
	StartServer()
}