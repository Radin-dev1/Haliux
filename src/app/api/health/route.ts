export async function GET() {
  try {
    const r = await fetch("http://localhost:11434/api/tags", { cache: "no-store" });
    if (!r.ok) return Response.json({ ollama: false });
    const j = await r.json();
    return Response.json({ ollama: true, models: (j.models || []).map((m: any) => m.name) });
  } catch {
    return Response.json({ ollama: false });
  }
}
