import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// API route to proxy audio files without exposing direct URLs.
// IDM can't sniff these because:
// 1. The URL has no file extension (.mp3/.m4a)
// 2. Content-Type is octet-stream, not audio/*
// 3. Referer check blocks direct access
// 4. The path is base64-encoded

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("t");

  if (!token) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Referer check: only allow requests from our own domain
  const referer = request.headers.get("referer") || "";
  const origin = request.headers.get("origin") || "";
  const secFetchDest = request.headers.get("sec-fetch-dest") || "";

  // Block direct browser navigation (IDM often uses "document" or empty)
  // Allow: "audio", "empty" (fetch API), and same-origin requests
  const host = request.headers.get("host") || "";
  const isAllowedOrigin = referer.includes(host) || origin.includes(host);

  if (!isAllowedOrigin && secFetchDest !== "empty") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // Decode the base64-encoded path
    const decodedPath = Buffer.from(token, "base64").toString("utf-8");

    // Security: Prevent directory traversal
    const normalizedPath = path.normalize(decodedPath);
    if (normalizedPath.includes("..")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Resolve relative to the public directory
    const filePath = path.join(process.cwd(), "public", normalizedPath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    // Support Range requests for seeking
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const chunk = fileBuffer.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "inline",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Full response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": stat.size.toString(),
        "Accept-Ranges": "bytes",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
