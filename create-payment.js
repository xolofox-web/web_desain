// api/create-payment.js
// Vercel Serverless Function — POST /api/create-payment
// Fungsi: Membuat QRIS otomatis via AustinStore API

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
  // CORS — izinkan dari domain sendiri
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Hanya izinkan POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Ambil amount dari body request
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 1000) {
      return res.status(400).json({
        error: "Amount tidak valid",
        message: "Minimal pembayaran Rp1.000"
      });
    }

    // 2. Cek environment variables
    const API_KEY = process.env.AUSTIN_API_KEY;
    const API_SECRET = process.env.AUSTIN_API_SECRET;

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({
        error: "Konfigurasi server belum lengkap",
        message: "AUSTIN_API_KEY atau AUSTIN_API_SECRET belum di-set di Vercel"
      });
    }

    // 3. Siapkan payload ke AustinStore
    const path = "/api/deposit/create";
    const body = JSON.stringify({
      amount: Number(amount),
      method: "qris"
    });

    // 4. Buat signature
    const { timestamp, signature } = signRequest(
      "POST",
      path,
      body,
      API_SECRET
    );

    // 5. Kirim ke AustinStore
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

    // 6. Baca response
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

    // 7. Cek jika gagal
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gagal membuat QRIS di AustinStore",
        detail: data
      });
    }

    // 8. Kembalikan data ke frontend
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error("Error create-payment:", err);
    return res.status(500).json({
      error: "Terjadi kesalahan server",
      message: err.message
    });
  }
}