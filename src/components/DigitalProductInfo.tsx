export function DigitalProductInfo() {
  return (
    <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="text-base font-semibold text-slate-800">Cara Pakai ResiCraft</h3>
      
      <div className="mt-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">1</div>
          <div>
            <p className="text-sm font-medium text-slate-800">Isi Data Toko & Pembeli</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Masukin nama toko, alamat, nomor HP di bagian atas. Terus scroll ke bawah buat isi data pembeli (nama, alamat lengkap, kota, kode pos).
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">2</div>
          <div>
            <p className="text-sm font-medium text-slate-800">Tambah Produk</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Klik "Tambah Item", masukin nama barang, qty, dan harga. Bisa tambah beberapa item sekaligus. Total otomatis kehitung.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">3</div>
          <div>
            <p className="text-sm font-medium text-slate-800">Pilih Kurir & Layanan</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Pilih kurir (JNE, J&T, SiCepat, dll) dan jenis layanan (REG, OKE, YES). Ongkir diisi manual sesuai yang ditampilin aplikasi marketplace.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">4</div>
          <div>
            <p className="text-sm font-medium text-slate-800">Atur Format Cetak</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Pilih mau cetak A4 (buat invoice lengkap) atau Thermal 80mm/58mm (buat label tempel paket). Preview langsung muncul di sebelah kanan.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">5</div>
          <div>
            <p className="text-sm font-medium text-slate-800">Cetak atau Simpan PDF</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Klik tombol "Cetak" buat print langsung, atau "Simpan PDF" buat export file. Nomor resi sama barcode otomatis ke-generate.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">Tips:</span> Semua data tersimpan otomatis di browser, jadi kalo refresh halaman gak ilang. Bisa dipakai offline juga kok.
        </p>
      </div>
    </div>
  );
}