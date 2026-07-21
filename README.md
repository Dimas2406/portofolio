# Portfolio — Dimas Al Gazali

Personal portfolio website built as a lightweight static site. No database or paid CMS is required.

## Menjalankan di laptop

1. Buka Terminal, lalu masuk ke folder ini:
   `cd /Users/macintoshhd/portofolio`
2. Jalankan: `npm run dev`
3. Buka alamat yang muncul (biasanya `http://localhost:3000`).
4. Berhenti dengan menekan `Control + C`.

## Mengubah isi

Semua teks, proyek, pengalaman, skill, email, dan link sosial berada di `content.js`. Buka file tersebut di VS Code, ubah isi di antara tanda kutip, lalu simpan. Refresh browser untuk melihat hasilnya.

- Tambah proyek: salin satu blok di dalam `projects: [...]`, pisahkan dengan koma.
- Link proyek: isi bagian `link: ""` dengan URL GitHub atau website.
- GitHub/LinkedIn: ganti URL placeholder di bagian `socials`.
- Foto: ganti `assets/profile.png` memakai foto baru dengan nama file yang sama.
- CV: ganti `assets/CV_Dimas_Al_Gazali_EN.pdf` memakai CV baru dengan nama file yang sama.

## Publikasi gratis

Cara termudah adalah GitHub Pages:

1. Buat repository baru di GitHub.
2. Upload seluruh isi folder ini ke repository tersebut.
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**, branch **main**, folder **/(root)**, lalu Save.
5. GitHub akan memberikan alamat publik seperti `https://username.github.io/nama-repository/`.

Alternatif: drag & drop folder ini ke Netlify Drop. Untuk domain sendiri, beli domain lalu sambungkan lewat pengaturan domain GitHub Pages atau Netlify.

## Sebelum dipublikasikan

Isi URL GitHub dan LinkedIn yang benar di `content.js`, tambahkan link/demo dan gambar proyek bila tersedia, lalu pastikan email dan nomor kontak memang ingin ditampilkan publik.
