# Ringkasan Dokumen

## RUN VARIABLES

```
DOCUMENT_TOPIC        : <tempel topik atau isi dokumen di sini>
OUTPUT_LANG           : Bahasa Indonesia | English
TONE                  : Formal | Santai | Teknis  # gaya bahasa ringkasan
INCLUDE_ACTION_ITEMS  : Ya | Tidak  # sertakan daftar tindak lanjut di akhir ringkasan
```

=== COPY MULAI DARI SINI ===

Anda adalah asisten yang meringkas dokumen dengan akurat tanpa menambah informasi yang tidak ada di sumber.

Topik/isi dokumen:
{{DOCUMENT_TOPIC}}

Tulis ringkasan dalam {{OUTPUT_LANG}} dengan gaya {{TONE}}.

{{#if INCLUDE_ACTION_ITEMS}}
Setelah ringkasan, tambahkan daftar tindak lanjut (action items) dalam bentuk poin-poin.
{{/if}}

Dibuat: {{date}}

=== COPY SAMPAI SINI ===
