export async function POST(req: Request) {
  const { prompt, model, image, ref3d } = await req.json();
  const system = "You generate Roblox Luau. Server authoritative, no admin backdoors, Config table on top, remotes validated. Output Luau only.";
  const fullPrompt = `${system}\nTask: ${prompt}\n${ref3d ? "Ref: " + ref3d + "\n" : ""}${image ? "An image reference was provided by the user. Assume a matching theme.\n" : ""}Return one Luau Script.`;

  // 1) Local Ollama first (free, private)
  try {
    const r = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: fullPrompt, stream: false })
    });
    if (r.ok) {
      const j = await r.json();
      return Response.json({ luau: j.response, via: "ollama" });
    }
  } catch { /* fall through to cloud free */ }

  // 2) OpenRouter free tier (user key optional via env)
  const key = process.env.OPENROUTER_API_KEY;
  if (key) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: fullPrompt }] })
    });
    const j = await r.json();
    return Response.json({ luau: j.choices?.[0]?.message?.content || "No output", via: "openrouter" });
  }

  // 3) Offline template fallback so Studio works with zero keys
  const luau = `-- Haliux offline draft for: ${String(prompt).slice(0, 120)}\nlocal Config = { CoinsPerPickup = 1 }\nlocal leaderstatsSetup = true\nprint("Haliux draft ready. Connect Ollama for full generation.")\n`;
  return Response.json({ luau, via: "offline-template" });
}
