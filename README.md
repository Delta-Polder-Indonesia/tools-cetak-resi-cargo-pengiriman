# ResiCraft UMKM - Generator Invoice + Shipping Label Offline

Aplikasi web untuk membuat invoice dan label pengiriman internal UMKM secara cepat, rapi, dan bisa dipakai offline (tanpa backend).

## 1. Fitur Utama

- Input data toko dan pembeli.
- Input multi produk (qty, harga, total otomatis).
- Pengiriman fleksibel: ekspedisi umum, cargo, bus, kereta, kurir lokal, dan lain-lain.
- Nomor resi otomatis + barcode garis (CODE128).
- Mode pembayaran: Lunas / COD.
- Mode cetak: Auto, A4, A4 Compact, Label 10x15, Label 10x10, Thermal 80mm, Thermal 58mm.
- Riwayat transaksi (simpan, cari, filter, cetak ulang, PDF ulang).
- Export CSV khusus transaksi cargo.
- Perhitungan berat volumetrik dan berat tertagih otomatis.
- Validasi cargo sebelum simpan ke riwayat.
- Penyimpanan lokal otomatis via `localStorage`.

## 2. Catatan Penggunaan

- Tool ini untuk pencatatan penjualan dan label pengiriman internal.
- Bukan sistem resmi ekspedisi dan bukan untuk pemalsuan resi kurir resmi.

## 3. Kebutuhan Sistem

- Node.js 18+ (disarankan 20+).
- npm 9+.
- Browser modern (Chrome, Edge, Firefox).

## 4. Cara Menjalankan (Development)

1. Install dependency.

```bash
npm install
```

2. Jalankan server development.

```bash
npm run dev
```

3. Buka URL yang tampil di terminal (biasanya `http://localhost:5173`).

## 5. Cara Build Production

1. Build project.

```bash
npm run build
```

2. (Opsional) Preview hasil build.

```bash
npm run preview
```

## 6. Alur Pemakaian Lengkap

### Step 1 - Data Toko / Pembeli

Isi data berikut:
- Nama toko
- Alamat toko
- Kota/Kabupaten toko
- Kode pos toko
- No HP toko
- Nama pembeli
- Alamat pembeli
- Kota/Kabupaten pembeli
- Kode pos pembeli
- No HP pembeli

Tips:
- Isi alamat sejelas mungkin agar label mudah dibaca kurir.

### Step 2 - Detail Produk

- Tambah produk sebanyak yang dibutuhkan.
- Isi nama produk, qty, dan harga per item.
- Total per baris akan dihitung otomatis.

Tips:
- Jika nama produk panjang, gunakan nama ringkas + varian penting.

### Step 3 - Pengiriman

Isi:
- Metode/Kurir pengiriman.
- Layanan pengiriman (Reguler, Express, dsb).
- Nomor resi (otomatis, bisa regenerate).
- Ongkir.
- Opsi gratis ongkir (harga ongkir dicoret + label GRATIS).
- Status pembayaran: Lunas / COD.
- Berat aktual barang (gram).
- Jumlah koli dan catatan paket.

### Step 4 - Detail Cargo

Gunakan jika bukan pengiriman reguler.

Isi:
- Cargo Type (`REGULER`, `CARGO_KECIL`, `CARGO_SEDANG`, `CARGO_BESAR`, `CARGO_KHUSUS`).
- Dimensi paket (P, L, T dalam cm).
- Nilai asuransi.
- Checklist handling: Fragile, Temperature Controlled, Dangerous Goods.

Perhitungan otomatis:
- Berat volumetrik = `(P x L x T) / 5000` (kg).
- Berat tertagih = nilai maksimum antara berat aktual (kg) dan volumetrik.

Aturan validasi cargo:
- Jika cargoType bukan `REGULER`, minimal 2 dimensi harus diisi (> 0).
- Jika `fragile` aktif, asuransi wajib > 0.
- Jika `dangerousGoods` aktif, akan muncul warning dokumen MSDS.
- Berat tertagih wajib > 0.

## 7. Cetak dan PDF

### Mode Cetak

Pilih mode sesuai media:
- Auto (ikut ukuran printer + auto-fit)
- A4
- A4 Full (Font Auto-Kecil)
- Label 10x15
- Label 10x10
- Thermal 80mm
- Thermal 58mm

### Tombol yang tersedia

- `Cek Muat 1 Lembar`: memeriksa apakah layout aman 1 halaman.
- `PRINT`: cetak langsung.
- `Download PDF`: ekspor dokumen ke PDF.

Nama file PDF:
- Umum: mengikuti format invoice/resi.
- Cargo: `{invoiceNo}-{cargoType}-{receiptNo}.pdf` + metadata cargo.

## 8. Riwayat Transaksi

Fungsi riwayat:
- Simpan transaksi aktif ke riwayat.
- Cari transaksi (invoice, resi, nama toko/pembeli, termasuk dimensi seperti `30x30x30`).
- Filter status dan tipe cargo.
- Muat ulang transaksi lama.
- Cetak ulang dan PDF ulang dari riwayat.
- Hapus per item atau hapus semua.

## 9. Export Cargo Manifest (CSV)

Tombol `Export Cargo CSV` menghasilkan file CSV berisi transaksi cargo dengan kolom:
- `invoiceNo`
- `cargoType`
- `chargeableWeight`
- `dimensions`
- `courier`
- `status`

## 10. Penyimpanan Data dan Migrasi

Data disimpan otomatis di browser (`localStorage`):
- Form aktif: `umkm_invoice_shipping_tool_v3`
- Riwayat: `umkm_invoice_shipping_history_v2`

Saat aplikasi pertama kali dibuka, sistem akan mencoba migrasi data dari versi key lama ke key baru agar data lama tetap terbaca.

## 11. Struktur Folder (Ringkas)

```text
src/
  components/
    InputPanel.tsx
    PrintPreview.tsx
    DigitalProductInfo.tsx
    InfoTooltip.tsx
  constants/
    appConfig.ts
  models/
    formSnapshot.ts
  types/
    transaction.ts
  utils/
    cargoValidation.ts
    format.ts
    print.ts
    storage.ts
    weight.ts
  App.tsx
```

## 12. Troubleshooting

1. Hasil print terpotong
- Pilih mode cetak yang sesuai kertas.
- Gunakan tombol `Cek Muat 1 Lembar` sebelum print.
- Di dialog print browser, set margin default/none sesuai kebutuhan printer.

2. Barcode tidak terbaca
- Pastikan nomor resi tidak kosong.
- Gunakan kertas dengan kontras baik.
- Hindari scale print terlalu kecil.

3. Data tidak tersimpan
- Pastikan browser tidak dalam mode private/incognito.
- Cek apakah penyimpanan `localStorage` diblokir extension.

4. PDF terlihat blur
- Coba ulang download setelah data final.
- Hindari zoom browser ekstrem saat generate PDF.

## 13. Rekomendasi Operasional UMKM

- Gunakan mode `A4 Full (Font Auto-Kecil)` untuk alamat panjang.
- Gunakan `Label 10x15` untuk stiker paket standar.
- Simpan transaksi ke riwayat setelah final, lalu cetak dari riwayat jika perlu reprint.

## 14. Lisensi dan Tanggung Jawab

- Gunakan untuk operasional internal bisnis secara legal.
- Pastikan data pengiriman yang dimasukkan adalah data transaksi nyata.