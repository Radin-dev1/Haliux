"use client";
import { useEffect, useState } from "react";
import { FREE_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { loadRobloxConfig, saveRobloxConfig } from "@/lib/roblox";
import { describe3DFile } from "@/lib/model3d";

export default function Studio() {
  const [prompt, setPrompt] = useState("Obby with 12 stages, checkpoints, lava reset, coin counter");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [image, setImage] = useState<string | null>(null);
  const [ref3d, setRef3d] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [universeId, setUniverseId] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = loadRobloxConfig();
    setApiKey(c.apiKey); setUniverseId(c.universeId);
  }, []);

  async function onImage(f: File | undefined) {
    if (!f) return;
    const buf = await f.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64").slice(0, 400000);
    setImage(`data:${f.type};base64,${b64}`);
  }

  async function on3D(f: File | undefined) {
    if (!f) return;
    setRef3d(await describe3DFile(f));
  }

  async function generate() {
    setBusy(true); setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, image, ref3d })
      });
      const data = await res.json();
      setOutput(data.luau || data.error || "No output");
    } catch (e: any) { setOutput(String(e?.message || e)); }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl tracking-tighter">Studio</h1>
      <p className="mt-2 max-w-[65ch] text-gray-600">Free models only. No credits. Key auto connects from this browser.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border bg-white p-8">
          <label className="text-sm font-medium">Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-2 w-full rounded-xl border p-3">
            {FREE_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <label className="mt-6 block text-sm font-medium">Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} className="mt-2 w-full rounded-xl border p-3" />
          <div className="mt-4 grid gap-3">
            <label className="text-sm">Image reference <input type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0])} className="mt-1 block" /></label>
            <label className="text-sm">3D reference (.obj .glb) <input type="file" accept=".obj,.glb,.gltf,.fbx" onChange={(e) => on3D(e.target.files?.[0])} className="mt-1 block" /></label>
          </div>
          {ref3d && <p className="mt-3 text-xs text-gray-500">{ref3d}</p>}
          <button onClick={generate} disabled={busy} className="mt-6 rounded-full bg-ink px-6 py-3 text-white disabled:opacity-50">
            {busy ? "Generating" : "Generate Luau"}
          </button>
        </div>

        <div className="rounded-3xl border bg-white p-8">
          <h2 className="font-display text-xl">Roblox connection</h2>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Open Cloud API key" type="password" className="mt-3 w-full rounded-xl border p-3" />
          <input value={universeId} onChange={(e) => setUniverseId(e.target.value)} placeholder="Universe ID" className="mt-3 w-full rounded-xl border p-3" />
          <button onClick={() => saveRobloxConfig({ apiKey, universeId })} className="mt-3 rounded-full border px-5 py-2">Save locally</button>
          <p className="mt-3 text-xs text-gray-500">Stored only in localStorage. Clear it by emptying these fields and saving.</p>
          <h2 className="mt-6 font-display text-xl">Output</h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-green-200">{output || "Output appears here"}</pre>
        </div>
      </div>
    </main>
  );
}
