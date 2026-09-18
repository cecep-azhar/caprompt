# Berkontribusi ke CAPrompt

Terima kasih sudah tertarik berkontribusi. CAPrompt adalah proyek AGPL-3.0 — lihat [LICENSE](LICENSE)
dan bagian "Apa artinya AGPL-3.0 di sini" di bawah sebelum mengirim kontribusi.

## Prinsip proyek

- **Tanpa build step, tanpa dependensi npm di klien.** Kebutuhan baru diselesaikan dengan
  JavaScript standar (ES modules asli), bukan framework/bundler.
- **`js/engine.js` adalah satu-satunya mesin render yang sah.** Perubahan perilaku render hanya
  boleh terjadi di sana; Go dan Rust memanggil jalur ini atau membuktikan hasilnya byte-identik.
- **`js/seed.js` dibuat otomatis** oleh `tools/build-seed.mjs` dari `prompts/*.md`. Jangan
  mengeditnya dengan tangan — perubahan akan hilang saat sinkron berikutnya.
- **Server Go tetap stdlib, tanpa dependensi eksternal.**

## Alur kontribusi

1. Fork repo, buat branch dari `main`.
2. Untuk perubahan kode: sertakan tes yang benar-benar meng-assert (buktikan sendiri dengan
   sengaja merusak kode sampai tes merah, lalu kembalikan — sama seperti disiplin yang dipakai
   di seluruh proyek ini).
3. Jalankan sebelum membuka PR:
   ```bash
   node --test
   gofmt -l .        # harus kosong
   go vet ./...
   go build ./...
   ```
4. Setiap commit **wajib** ditandatangani DCO (Developer Certificate of Origin):
   ```bash
   git commit -s -m "pesan commit"
   ```
   Ini menambahkan baris `Signed-off-by: Nama Anda <email@anda>` yang menyatakan Anda berhak
   mengirim kontribusi tersebut di bawah lisensi proyek. PR tanpa sign-off tidak akan diterima.
5. Jelaskan di deskripsi PR: apa yang berubah, kenapa, dan bagaimana Anda membuktikannya (perintah
   + output, bukan hanya "sudah saya coba").

## Apa artinya AGPL-3.0 di sini

Kalau Anda menjalankan versi modifikasi CAPrompt sebagai layanan yang diakses pengguna lain lewat
jaringan (termasuk sebagai SaaS), Anda wajib menyediakan source code versi modifikasi itu kepada
pengguna tersebut. Fork komersial tidak boleh menjadi SaaS tertutup. Lihat teks lengkap di
[LICENSE](LICENSE) — ringkasan ini bukan pengganti teks hukumnya.

## Melaporkan bug atau kerentanan

- Bug biasa: buka issue di GitHub.
- Kerentanan keamanan: **jangan** buka issue publik — ikuti [SECURITY.md](SECURITY.md).
