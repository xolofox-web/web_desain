// api/check-payment.js
// Vercel Serverless Function — POST /api/check-payment
// Fungsi: Cek status pembayaran QRIS

import crypto from "node:crypto";

/* =========================================================
   FUNGSI SIGNATURE HMAC SHA256
   ========================================================= */
function signRequest(method, path, body, secret) {
  const timestamp = Date.now().toString();
  const payload = `${method}\n${path}\n${body}\n${timestamp}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return { timestamp, signature };
}

/* =========================================================
   HANDLER UTAMA
   ========================================================= */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId wajib diisi" });
    }

    const API_KEY = process.env.AUSTIN_API_KEY;
    const API_SECRET = process.env.AUSTIN_API_SECRET;

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({
        error: "Konfigurasi server belum lengkap"
      });
    }

    // Endpoint cek status (sesuaikan jika berbeda di dokumentasi AustinStore)
    const path = "/api/deposit/status";
    const body = JSON.stringify({ order_id: orderId });

    const { timestamp, signature } = signRequest(
      "POST",
      path,
      body,
      API_SECRET
    );

    const response = await fetch(`https://austinstore.id${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "X-Timestamp": timestamp,
        "X-Signature": signature
      },
      body
    });

    const data = await response.json();

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