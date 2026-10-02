// api/deposit/history.js
// Vercel Serverless Function — GET /api/deposit/history?page=1
// Fungsi: Mengambil riwayat deposit dari AustinStore

export default async function handler(req, res) {
  /* =========================================================
     CORS HEADERS
     ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Gunakan GET."
    });
  }

  try {
    const API_KEY = process.env.AUSTIN_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        message: "AUSTIN_API_KEY belum di-set di Vercel"
      });
    }

    // Ambil parameter page dari query frontend (default 1)
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    /* =========================================================
       REQUEST KE AUSTINSTORE
       ========================================================= */
    const params = new URLSearchParams({
      apikey: API_KEY,
      page: String(page),
      limit: String(limit)
    });

    const url = `https://austinstore.id/api/deposit/history?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" }
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Response dari AustinStore tidak valid",
        detail: responseText
      });
    }

    /* =========================================================
       KEMBALIKAN RESPONSE APA ADANYA
       Format:
       {
         "success": true,
         "data": [ { id, transaction_id, amount, fee, status, ... } ],
         "total": 5, "page": 1, "limit": 10, "pages": 1
       }
       ========================================================= */
    return res.status(response.status).json(data);

  } catch (err) {
    console.error("Error history transaksi:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}