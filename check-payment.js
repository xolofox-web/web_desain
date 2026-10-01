// api/check-payment.js
// Vercel Serverless Function — POST /api/check-payment
// Fungsi: Cek status pembayaran QRIS ke AustinStore
//
// Cara pakai dari frontend:
//   fetch('/api/check-payment', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ orderId: 'APG-1751000000' })
//   })

export default async function handler(req, res) {
  /* =========================================================
     CORS HEADERS
     ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Hanya izinkan POST & GET
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    /* =========================================================
       AMBIL ORDER ID
       - Dari body kalau POST
       - Dari query string kalau GET
       ========================================================= */
    let orderId;

    if (req.method === "POST") {
      orderId = req.body?.orderId;
    } else {
      orderId = req.query?.orderId;
    }

    if (!orderId) {
      return res.status(400).json({
        error: "orderId wajib diisi",
        message: "Contoh: APG-1751000000"
      });
    }

    /* =========================================================
       CEK API KEY
       ========================================================= */
    const API_KEY = process.env.AUSTIN_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        error: "Konfigurasi server belum lengkap",
        message: "AUSTIN_API_KEY belum di-set di Vercel"
      });
    }

    /* =========================================================
       KIRIM REQUEST KE AUSTINSTORE
       ========================================================= */
    const url = `https://austinstore.id/api/deposit/check/${encodeURIComponent(orderId)}?apikey=${API_KEY}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    /* =========================================================
       BACA RESPONSE
       ========================================================= */
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error: "Response dari AustinStore tidak valid",
        detail: responseText
      });
    }

    /* =========================================================
       JIKA GAGAL
       ========================================================= */
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gagal cek status pembayaran",
        detail: data
      });
    }

    /* =========================================================
       BERHASIL — Kembalikan data ke frontend
       ========================================================= */
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error("Error check-payment:", err);
    return res.status(500).json({
      error: "Terjadi kesalahan server",
      message: err.message
    });
  }
}