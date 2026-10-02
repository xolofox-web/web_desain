// api/deposit/cancel/[transaksiId].js
// Vercel Serverless Function — POST /api/deposit/cancel/:transaksiId
// Fungsi: Membatalkan deposit QRIS yang masih pending

export default async function handler(req, res) {
  /* =========================================================
     CORS HEADERS
     ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      status: "error",
      message: "Method not allowed. Gunakan POST."
    });
  }

  try {
    const { transaksiId } = req.query;

    if (!transaksiId) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: "transaksiId wajib diisi"
      });
    }

    const API_KEY = process.env.AUSTIN_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "AUSTIN_API_KEY belum di-set di Vercel"
      });
    }

    /* =========================================================
       REQUEST KE AUSTINSTORE
       ========================================================= */
    const url = `https://austinstore.id/api/deposit/cancel/${encodeURIComponent(
      transaksiId
    )}?apikey=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json"
      }
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        success: false,
        status: "error",
        message: "Response dari AustinStore tidak valid",
        detail: responseText
      });
    }

    /* =========================================================
       KEMBALIKAN RESPONSE APA ADANYA
       Format sukses:
       { "success": true, "status": "cancel", "message": "Deposit berhasil dibatalkan" }
       Format gagal:
       { "success": false, "message": "Deposit tidak bisa dibatalkan (status: paid)" }
       ========================================================= */
    return res.status(response.status).json(data);

  } catch (err) {
    console.error("Error cancel transaksi:", err);
    return res.status(500).json({
      success: false,
      status: "error",
      message: err.message
    });
  }
}