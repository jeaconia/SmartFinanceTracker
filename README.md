<div align="center">

# Moni: Smart Personal Finance Tracker

<img src="FrontEnd\assets\Moni-Logo.png" width="200" />

</div>

---

## Deskripsi Proyek
Sering bingung uang habis untuk apa saja? Moni hadir untuk membantu menjawabnya! Smart Personal Finance Tracker ini tidak hanya mencatat pemasukan dan pengeluaran, tetapi juga membantu pengguna memahami kebiasaan finansial mereka melalui insight dan rekomendasi yang relevan. Dengan Moni, mengatur keuangan menjadi lebih mudah, terarah, dan tidak lagi sekadar menebak-nebak.

---
## Fitur Aplikasi
# Smart Finance Tracker

Aplikasi pencatat keuangan pribadi berbasis web dengan fitur analisis AI, budgeting otomatis, dan visualisasi data keuangan.

---

## Fitur

### 1. Dashboard
- **Sisa Budget:** Menampilkan sisa anggaran bulan berjalan beserta total pemasukan dan pengeluaran.
- **Insight Harian (AI):** Analisis pola keuangan harian berbasis AI dengan label status seperti *balanced* atau *spender*, dilengkapi tingkat akurasi.
- **Label Pola Spending:** Pie chart yang mengelompokkan pengeluaran berdasarkan kategori bulan ini.
- **Grafik Analisis Bulanan:** Grafik batang perbandingan pemasukan dan pengeluaran sepanjang tahun.
- **Notifikasi Pengeluaran Rutin:** Pengingat otomatis untuk transaksi rutin yang sudah dijadwalkan.

### 2. Grafik & Ringkasan
- **Analisis per Periode:** Filter rentang waktu 3 bulan, 6 bulan, atau 1 tahun untuk melihat tren keuangan.
- **Pengeluaran & Pemasukan per Kategori:** Visualisasi pie chart dengan persentase dan nominal tiap kategori.
- **Transaksi Terbaru:** Daftar transaksi terkini dengan label kategori, tanggal, dan nominal.
- **Prediksi Bulan Depan (AI):** Proyeksi total pengeluaran bulan berikutnya berdasarkan pola historis pengguna.

### 3. Budgeting
- **Reminder Overbudget:** Peringatan otomatis ketika pengeluaran suatu kategori melampaui anggaran yang ditetapkan.
- **Rekomendasi Anggaran Otomatis (AI):** Saran batas anggaran ideal berdasarkan UMR daerah pengguna, menggunakan pembagian Kebutuhan 60% / Keinginan 20% / Tabungan 20%.
- **Distribusi Anggaran:** Pie chart proporsi anggaran per kategori yang sudah dialokasikan.

### 4. Catatan Keuangan
- **Pemasukan:** Daftar semua catatan pendapatan (gaji, hadiah, reimburse, dll.) per bulan.
- **Pengeluaran:** Daftar semua catatan pengeluaran beserta kategori dan tanggal.
- **Rutin:** Pencatatan khusus untuk transaksi berulang setiap bulan sebagai dasar notifikasi pengingat.

### 5. Pengaturan
- Edit profil pengguna
- Toggle dark mode
- Pilihan bahasa: Indonesia / English

### 6. Profil
- Informasi akun pengguna
- Edit profil
- Log out

---
## Deployment Aplikasi
Produk akhir telah dideploy dalam bentuk aplikasi web yang mengintegrasikan komponen front-end, back-end, serta model machine learning. Aplikasi dapat diakses melalui tautan berikut:
<div align="center">

### [Link Deployment Aplikasi Moni](https://smart-finance-tracker-phi.vercel.app/)

</div>

Produk akhir telah berhasil dideploy dan dapat diakses secara publik melalui aplikasi web Moni. Seluruh komponen sistem telah terintegrasi secara menyeluruh, mencakup front-end, back-end, database, dan model machine learning. Dengan integrasi tersebut, proses pengelolaan data, penyimpanan ke database, serta analisis dan prediksi berbasis machine learning dapat berjalan secara otomatis dalam satu platform yang terpadu.

---
## Kontributor
1. **CDCC284D6X2658 - Rudh Renata - Data Scientist:** Melakukan pre-processing data, EDA (Exploratory Data Analysis), menjawab pertanyaan bisnis, serta melakukan deploy
2. **CACC014D6X0953 - Elsa Amelia Tampubolon - AI Engineer:** Melaukan scraping data dan membangun model 
3. **CACC014D6Y2314 - Ketut Bayu Dharma Purusha - AI Engineer:** Membangun model
4. **CFCC014D6X1961 - Jeaconia Elfrida Tiono - Full-Stack Web Developer:** Membangun seluruh fitur pada front-end web.
5. **CFCC014D6X2054 - Alexa Paramitha - Full-Stack Web Developer:** Membangun seluruh fitur pada back-end web.

---
## Menjalankan Proyek Secara Lokal

### Prasyarat

Pastikan tools berikut sudah terinstall di sistem kamu:

| Tool | Versi Minimum | Keterangan |
|------|--------------|------------|
| [Node.js](https://nodejs.org/) | `>= 18.0.0` | Untuk BackEnd & FrontEnd |
| [Python](https://www.python.org/) | `>= 3.11` | Untuk ML Model API |
| [Docker](https://www.docker.com/) *(opsional)* | — | Alternatif untuk menjalankan ML Model |

---

### Struktur Proyek

```
SmartFinanceTracker/
├── BackEnd/                      # REST API (Express.js)
├── FrontEnd/                     # Antarmuka pengguna (React + Vite)
├── AutoBudgetingModel/api/       # ML Model: Auto Budgeting (FastAPI)
├── SpendingPersonaModel/api/     # ML Model: Spending Persona Classifier (FastAPI)
└── ExpensePredictionModel/api/   # ML Model: Expense Prediction (FastAPI)
```

---

### 1. Clone Repositori

```bash
git clone https://github.com/jeaconia/SmartFinanceTracker.git
cd SmartFinanceTracker
```

---

### 2. Konfigurasi Environment Variables

#### BackEnd

Buat file `.env` di dalam folder `BackEnd/`:

```env
# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# URL ML Model
MODEL1_SERVICE_URL=http://localhost:8001   # Spending Persona Model
MODEL2_SERVICE_URL=http://localhost:8002   # Auto Budgeting Model
AI_SERVICE_URL=http://localhost:8003       # Expense Prediction Model

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=no-reply@yourdomain.com

# URL Frontend (untuk CORS)
FRONTEND_URL=http://localhost:3000
```

> Kredensial Supabase dapat diperoleh dari **Supabase Dashboard → Project Settings → API**.

#### FrontEnd

Buat file `.env` di dalam folder `FrontEnd/`:

```env
VITE_API_URL=http://localhost:3001
```

---

### 3. Menjalankan BackEnd

```bash
cd BackEnd
npm install
npm run dev
```

Server akan berjalan di **`http://localhost:3001`**.

> Gunakan `npm start` untuk mode produksi (tanpa hot-reload).

---

### 4. Menjalankan FrontEnd

```bash
cd FrontEnd
npm install
npm run dev
```

Aplikasi akan terbuka otomatis di **`http://localhost:3000`**.

---

### 5. Menjalankan ML Model API

Terdapat **tiga model** yang perlu dijalankan secara terpisah, masing-masing di port yang berbeda.

#### Pilihan A: Menggunakan Python (pip)

**Model 1: Spending Persona Classifier** (port `8001`):

```bash
cd SpendingPersonaModel/api
pip install -r requirements.txt
uvicorn spending_persona_api_v2:app --host 0.0.0.0 --port 8001 --reload
```

**Model 2: Auto Budgeting Model** (port `8002`):

```bash
cd AutoBudgetingModel/api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

**Model 3: Expense Prediction Model** (port `8003`):

```bash
cd ExpensePredictionModel/api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

#### Pilihan B: Menggunakan Docker

**Model 1: Spending Persona Classifier:**

```bash
cd SpendingPersonaModel/api
docker build -t spending-persona-model .
docker run -p 8001:8000 spending-persona-model
```

**Model 2: Auto Budgeting Model:**

```bash
cd AutoBudgetingModel/api
docker build -t auto-budgeting-model .
docker run -p 8002:8000 auto-budgeting-model
```

**Model 3: Expense Prediction Model:**

```bash
cd ExpensePredictionModel/api
docker build -t expense-prediction-model .
docker run -p 8003:8000 expense-prediction-model
```

---

### 6. Ringkasan Port

| Layanan | Port | Env Variable |
|---------|------|-------------|
| FrontEnd (Vite Dev Server) | `3000` | — |
| BackEnd (Express.js) | `3001` | — |
| Spending Persona Model | `8001` | `MODEL1_SERVICE_URL` |
| Auto Budgeting Model | `8002` | `MODEL2_SERVICE_URL` |
| Expense Prediction Model | `8003` | `AI_SERVICE_URL` |

---

### Catatan

- Pastikan **semua layanan sudah berjalan** sebelum menggunakan fitur AI di aplikasi.
- File `.env` **tidak boleh** di-commit ke repositori — pastikan sudah terdaftar di `.gitignore`.
- Ketiga model ML berjalan secara independen; jika hanya ingin mengembangkan BackEnd/FrontEnd, model yang tidak dibutuhkan bisa dilewati (fitur terkait akan mengembalikan error).
