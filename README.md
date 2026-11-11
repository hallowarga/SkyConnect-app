# SkyConnect Technology - Aplikasi Pelanggan

Aplikasi web (PWA) untuk pelanggan SkyConnect: login ID WiFi, saldo, bayar tagihan, katalog CCTV/APK, order dan bantuan via WhatsApp. Tanpa build, semua file diletakkan di satu folder (root repository).

## File
index.html, style.css, app.js, manifest.webmanifest, sw.js, logo.png, mark.png, icon-192.png, icon-512.png, README.md

## Online lewat GitHub Pages
Settings > Pages > Source: Deploy from a branch > Branch: main, folder: / (root) > Save.

## Jadi APK
Buka https://www.pwabuilder.com, masukkan link GitHub Pages, pilih Android, unduh paketnya.

## Akun demo (hapus sebelum dipakai sungguhan)
Pelanggan SKY001 / sky123 (juga SKY002, SKY003). Admin: ADMIN / 1234. Super admin: SUPER / super123.
Data demo ada di variabel DEF pada app.js.

## Catatan
Prototipe: data di localStorage tiap perangkat dan sandi belum di-hash. Hubungkan ke backend sebelum dipakai pelanggan sungguhan.
