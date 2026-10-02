// api/deposit/history.js
// Vercel Serverless Function — GET /api/deposit/history?page=1

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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Gunakan GET."
    });
  }

  try {
    const API_KEY = process.env.AUSTIN_API_KEY;
    const API_SECRET = process.env.AUSTIN_API_SECRET;

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Konfigurasi server belum lengkap"
      });
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    // Path signature tanpa query string
    const path = `/api/deposit/history`;
    const body = ""; // GET tidak pakai body

    const { timestamp, signature } = signRequest("GET", path, body, API_SECRET);

    const params = new URLSearchParams({
      apikey: API_KEY,
      page: String(page),
      limit: String(limit)
    });

    const url = `https://austinstore.id${path}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
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
        message: "Response dari AustinStore tidak valid",
        detail: responseText
      });
    }

    return res.status(response.status).json(data);

  } catch (err) {
    console.error("Error history transaksi:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}