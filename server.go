// SPDX-License-Identifier: AGPL-3.0-only
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	addr := os.Getenv("CAPROMPT_ADDR")
	if addr == "" {
		addr = ":8787"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", handleHealthz)
	mux.Handle("/", noCache(http.FileServer(http.Dir("."))))

	log.Printf("caprompt server mendengarkan di %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

// noCache memaksa revalidasi tiap request (bukan "jangan simpan sama sekali").
// http.FileServer tetap membalas 304 lewat If-Modified-Since saat berkas tidak
// berubah, jadi ini tetap murah tapi tidak pernah menyajikan JS/CSS basi setelah
// deploy (qa.md §3.3: "muat ulang satu kali sudah memakai CSS/JS baru").
func noCache(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")
		h.ServeHTTP(w, r)
	})
}

func handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}
