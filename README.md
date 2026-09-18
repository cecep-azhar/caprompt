# CAPrompt

Prompt studio lokal-first: PWA JavaScript murni (tanpa build step, tanpa dependensi npm) ditemani server Go stdlib.

**Status: bootstrap awal (BOOT-01).** Baru mendukung 2 dari 8 alur (Pustaka, Rakit) dan render dasar
(substitusi variabel, `{{#if}}/{{#unless}}`, token tanggal). Lihat `task-opsi-b.md` di folder catatan
proyek untuk backlog lengkap dan `§Butuh keputusan pemilik` untuk hal yang masih menunggu spesifikasi.

## Menjalankan

1. Bangkitkan `js/seed.js` dari template di `prompts/` (jangan edit `js/seed.js` dengan tangan):

   ```bash
   node tools/build-seed.mjs
   ```

2. Jalankan server statis (Go stdlib, tanpa dependensi eksternal):

   ```bash
   go run server.go
   ```

3. Buka `http://localhost:8787` di browser.

## Tes

```bash
node --test
```

(bukan `node --test test/` — pada Node v24.9.0 di environment ini, argumen posisi berupa
nama direktori diperlakukan sebagai berkas tunggal, bukan pola pencarian; tanpa argumen,
test runner otomatis menemukan seluruh `test/**/*.test.mjs`.)

## Arsitektur singkat

- `js/parser.js` — parse `.md` (blok `RUN VARIABLES`, penanda `=== COPY ... ===`, variabel mustache `{{VAR}}`)
- `js/engine.js` — **satu-satunya mesin render** (substitusi variabel, `{{#if}}/{{#unless}}`, token tanggal WIB)
- `js/store.js` — IndexedDB `caprompt`, store: `templates`, `presets`, `runs`, `projects`, `kv`
- `js/seed.js` — **dibuat otomatis** oleh `tools/build-seed.mjs`, jangan diedit tangan
- `server.go` — server statis + `/healthz`, Go stdlib, tanpa dependensi eksternal

## Catatan

Sistem "profil eksekusi" (knob & addon) untuk `js/engine.js` **belum diimplementasikan** —
spesifikasinya (nama knob, nama addon, format blok keluaran) belum tersedia di dokumen mana pun.
Lihat `§Butuh keputusan pemilik` di `task-opsi-b.md`.
