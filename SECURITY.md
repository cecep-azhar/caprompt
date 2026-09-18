# Kebijakan Keamanan CAPrompt

## Melaporkan kerentanan

**Jangan** melaporkan kerentanan keamanan lewat issue publik GitHub. Kirim email ke:

**cecep.azhtech@gmail.com**

Sertakan sebisa mungkin:
- Deskripsi kerentanan dan dampaknya (kebocoran data, akses tidak sah, dll.)
- Langkah reproduksi atau proof-of-concept
- Versi/commit CAPrompt yang terdampak

## Target respons (best-effort, bukan SLA kontraktual)

- Pengakuan awal: dalam 5 hari kerja.
- Penilaian awal (valid/tidak, tingkat keparahan): dalam 14 hari kerja.
- Perbaikan untuk temuan S0/S1 (lihat definisi severity di `qa.md`): diprioritaskan di atas
  pekerjaan fitur lain.

Ini proyek yang dikelola perorangan (solo maintainer) — target di atas adalah upaya terbaik,
bukan jaminan kontraktual.

## Ruang lingkup

Berlaku untuk kode di repo ini (`caprompt`): aplikasi klien, `server.go`, dan cangkang Tauri.
Layanan cloud (share link, akun, marketplace) belum ada pada versi ini — kebijakan akan
diperbarui saat layanan tersebut dirilis.

## Pengungkapan

Kami mengikuti pengungkapan terkoordinasi (coordinated disclosure): mohon beri waktu untuk
perbaikan sebelum mempublikasikan detail kerentanan secara publik.
