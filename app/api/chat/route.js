import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { messages } = await req.json();
    
    const models = [
      "tngtech/deepseek-r1t2-chimera:free", 
      "arcee-ai/trinity-large-preview:free", // Cadangan paling stabil
      "upstage/solar-pro-3:free"
    ];

    let lastError = "Gagal menghubungi semua provider.";

    for (const modelId of models) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://danish-portfolio.com",
            "X-Title": "Danish Portfolio Bot",
          },
          body: JSON.stringify({ model: modelId, messages }),
        });

        const data = await response.json();

        // VALIDASI EXTRA: Cek apakah content benar-benar ada dan tidak kosong
        const botContent = data.choices?.[0]?.message?.content;

        if (response.ok && botContent && botContent.trim() !== "") {
          return NextResponse.json(data);
        }

        console.warn(`Model ${modelId} memberikan jawaban kosong, mencoba model lain...`);
      } catch (err) {
        continue;
      }
    }

    return NextResponse.json({ error: "Semua model sedang sibuk." }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: "Kesalahan sistem." }, { status: 500 });
  }
}
