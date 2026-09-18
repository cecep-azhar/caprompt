// DIBUAT OTOMATIS oleh tools/build-seed.mjs dari prompts/*.md — jangan diedit tangan (R6).
export const SEED_TEMPLATES = [
  {
    "id": "example-summarize",
    "title": "Ringkasan Dokumen",
    "runVariables": [
      {
        "key": "DOCUMENT_TOPIC",
        "type": "text",
        "value": "<tempel topik atau isi dokumen di sini>",
        "isPlaceholder": true,
        "help": ""
      },
      {
        "key": "OUTPUT_LANG",
        "type": "select",
        "options": [
          "Bahasa Indonesia",
          "English"
        ],
        "value": "Bahasa Indonesia",
        "help": ""
      },
      {
        "key": "TONE",
        "type": "select",
        "options": [
          "Formal",
          "Santai",
          "Teknis"
        ],
        "value": "Formal",
        "help": "gaya bahasa ringkasan"
      },
      {
        "key": "INCLUDE_ACTION_ITEMS",
        "type": "select",
        "options": [
          "Ya",
          "Tidak"
        ],
        "value": "Ya",
        "help": "sertakan daftar tindak lanjut di akhir ringkasan"
      }
    ],
    "body": "Anda adalah asisten yang meringkas dokumen dengan akurat tanpa menambah informasi yang tidak ada di sumber.\n\nTopik/isi dokumen:\n{{DOCUMENT_TOPIC}}\n\nTulis ringkasan dalam {{OUTPUT_LANG}} dengan gaya {{TONE}}.\n\n{{#if INCLUDE_ACTION_ITEMS}}\nSetelah ringkasan, tambahkan daftar tindak lanjut (action items) dalam bentuk poin-poin.\n{{/if}}\n\nDibuat: {{date}}",
    "mustacheVars": [
      "DOCUMENT_TOPIC",
      "OUTPUT_LANG",
      "TONE"
    ],
    "sourceFile": "example-summarize.md"
  }
];
