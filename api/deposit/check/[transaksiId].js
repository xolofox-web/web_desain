// api/deposit/check/[transaksiId].js
// Vercel Serverless Function — GET /api/deposit/check/:transaksiId

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
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, status: "error", message: "Method not allowed" });
  }

  try {
    const { transaksiId } = req.query;
    if (!transaksiId) {
      return res.status(400).json({ success: false, status: "error", message: "transaksiId wajib diisi" });
    }

    const API_KEY = process.env.AUSTIN_API_KEY;
    const API_SECRET = process.env.AUSTIN_API_SECRET;

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({ success: false, status: "error", message: "Konfigurasi server belum lengkap" });
    }

    const path = `/api/deposit/check/${transaksiId}`;
    const { timestamp, signature } = signRequest("GET", path, "", API_SECRET);
    const url = `https://austinstore.id${path}?apikey=${API_KEY}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Timestamp": timestamp,
        "X-Signature": signature
      }
    });

    const responseText = await response.text();
    console.log("Check response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({ success: false, status: "error", message: "Response invalid", detail: responseText });
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Error check:", err);
    return res.status(500).json({ success: false, status: "error", message: err.message });
  }
}
