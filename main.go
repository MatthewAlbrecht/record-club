package main

import (
	"fmt"
	"net/http"
	t "record-club/templates"

	"github.com/a-h/templ"
)

func main() {
	handleRequests()
}

func handleRequests() {
	component := t.Hello("Matthew")

	http.Handle("/", templ.Handler(component))

	fmt.Println("Listening on :8080")
	http.ListenAndServe(":8080", nil)
}
