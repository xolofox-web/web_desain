// api/create-payment.js
// Vercel Serverless Function — POST /api/create-payment
// Versi: API Key di QUERY STRING + Signature HMAC di header

import crypto from "node:crypto";

function signRequest(method, path, body, secret) {
  const timestamp = Date.now().toString();
  const payload = `${method}\n${path}\n${body}\n${timestamp}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return { timestamp, signature };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      status: "error",
      message: "Method not allowed"
    });
  }

  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 1000) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: "Minimal pembayaran Rp1.000"
      });
    }

    const API_KEY = process.env.AUSTIN_API_KEY;
    const API_SECRET = process.env.AUSTIN_API_SECRET;

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Konfigurasi server belum lengkap"
      });
    }

    // ============================================
    // SIAPKAN PAYLOAD
    // ============================================
    const path = "/api/deposit/create";
    const body = JSON.stringify({
      amount: Number(amount),
      method: "qris"
    });

    // Buat signature HMAC
    const { timestamp, signature } = signRequest("POST", path, body, API_SECRET);

    // ============================================
    // KIRIM KE AUSTINSTORE
    // API Key di QUERY STRING (seperti endpoint check)
    // Signature di HEADER
    // ============================================
    const url = `https://austinstore.id${path}?apikey=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Timestamp": timestamp,
        "X-Signature": signature
      },
      body
    });

    const responseText = await response.text();
    console.log("AustinStore response:", responseText);
    console.log("Status code:", response.status);

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

    // Kalau gagal, kirim pesan ASLI dari AustinStore
    if (!response.ok || data.success === false) {
      return res.status(response.status).json({
        success: false,
        status: "error",
        message: data.message || data.error || "Gagal membuat QRIS",
        detail: data
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Error create-payment:", err);
    return res.status(500).json({
      success: false,
      status: "error",
      message: err.message
    });
  }
}
