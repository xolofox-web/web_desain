// api/deposit/cancel/[transaksiId].js
// Vercel Serverless Function — POST /api/deposit/cancel/:transaksiId

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
    const API_SECRET = process.env.AUSTIN_API_SECRET;

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Konfigurasi server belum lengkap"
      });
    }

    const path = `/api/deposit/cancel/${transaksiId}`;
    const body = ""; // POST cancel tidak pakai body

    const { timestamp, signature } = signRequest("POST", path, body, API_SECRET);

    const url = `https://austinstore.id${path}?apikey=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "X-Timestamp": timestamp,
        "X-Signature": signature
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