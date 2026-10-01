// api/deposit/check/[transaksiId].js
// Vercel Serverless Function — GET /api/deposit/check/:transaksiId

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      status: "error",
      message: "Method not allowed"
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

    const url = `https://austinstore.id/api/deposit/check/${encodeURIComponent(
      transaksiId
    )}?apikey=${API_KEY}`;

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
        status: "error",
        message: "Response dari AustinStore tidak valid",
        detail: responseText
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Error check transaksi:", err);
    return res.status(500).json({
      success: false,
      status: "error",
      message: err.message
    });
  }
}
