"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FREE_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { loadRobloxConfig, saveRobloxConfig, publishLuau } from "@/lib/roblox";
import { describe3DFile } from "@/lib/model3d";

const TEMPLATES = [
  { label: "Obby", text: "Obby with 12 stages, checkpoints, lava reset, coin counter" },
  { label: "Coin simulator", text: "Coin simulator with click to earn, 5 pets with multipliers, rebirth at 100k" },
  { label: "Tycoon starter", text: "Tycoon starter with dropper, conveyor, 3 buttons, save with DataStore" }
];

export default function Studio() {
  const [prompt, setPrompt] = useState(TEMPLATES[0].text);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [imageName, setImageName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [file3dName, setFile3dName] = useState("");
  const [ref3d, setRef3d] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [universeId, setUniverseId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [output, setOutput] = useState("");
  const [via, setVia] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const c = loadRobloxConfig();
    setApiKey(c.apiKey); setUniverseId(c.universeId);
    try { setHistory(JSON.parse(localStorage.getItem("haliux.history") || "[]")); } catch { /* empty */ }
  }, []);

  const active = useMemo(() => FREE_MODELS.find((m) => m.id === model), [model]);
  const lines = useMemo(() => (output ? output.split("\n").length : 0), [output]);

  async function onImage(f: File | undefined) {
    if (!f) return;
    setImageName(f.name);
    const buf = await f.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64").slice(0, 400000);
    setImage(`data:${f.type};base64,${b64}`);
  }

  async function on3D(f: File | undefined) {
    if (!f) return;
    setFile3dName(f.name);
    setRef3d(await describe3DFile(f));
  }

  async function generate() {
    if (!prompt.trim()) { setNotice("Write a prompt first."); return; }
    setBusy(true); setNotice(""); setOutput(""); setVia("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, image, ref3d })
      });
      const data = await res.json();
      setOutput(data.luau || data.error || "No output");
      setVia(data.via || "");
      const next = [prompt, ...history].slice(0, 5);
      setHistory(next);
      localStorage.setItem("haliux.history", JSON.stringify(next));
    } catch (e: any) { setNotice(String(e?.message || e)); }
    setBusy(false);
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setNotice("Copied to clipboard.");
  }

  function download() {
    if (!output) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
    a.download = "haliux-build.luau";
    a.click();
  }

  async function publish() {
    if (!output) { setNotice("Generate output first."); return; }
    if (!apiKey || !universeId || !placeId) { setNotice("Save API key plus Universe ID, then add a Place ID."); return; }
    try {
      setNotice("Publishing to Roblox.");
      await publishLuau({ apiKey, universeId }, placeId, output);
      setNotice("Published to Roblox.");
    } catch (e: any) { setNotice(String(e?.message || e)); }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">Haliux</Link>
        <span className="text-sm text-gray-500">Free models only. No credits.</span>
      </div>

      <h1 className="mt-4 font-display text-4xl tracking-tighter">Studio</h1>
      <p className="mt-2 max-w-[65ch] text-gray-600">Prompt on the left, connection plus output on the right. Key stays in this browser.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl border border-slate-200/60 bg-white p-8 lg:col-span-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Model</label>
            {active && <span className="text-xs text-gray-500">{active.vision ? "Reads images" : "Text plus 3D stats"} | {active.context}</span>}
          </div>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-2 w-full rounded-xl border border-ink/15 p-3">
            {FREE_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>

          <div className="mt-4 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.label} onClick={() => setPrompt(t.text)} className="rounded-full border border-ink/15 px-4 py-1.5 text-sm hover:bg-zinc-100">{t.label}</button>
            ))}
          </div>

          <label className="mt-6 block text-sm font-medium">Prompt <span className="font-normal text-gray-400">({prompt.length} chars)</span></label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-ink/15 p-3" />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block cursor-pointer rounded-2xl border border-dashed border-ink/20 p-4 text-sm hover:bg-zinc-50">
              <span className="font-medium">Image reference</span>
              <span className="block text-xs text-gray-500">{imageName || "PNG or JPG, described by vision model"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
            </label>
            <label className="block cursor-pointer rounded-2xl border border-dashed border-ink/20 p-4 text-sm hover:bg-zinc-50">
              <span className="font-medium">3D reference</span>
              <span className="block text-xs text-gray-500">{file3dName || "OBJ or GLB, parsed locally"}</span>
              <input type="file" accept=".obj,.glb,.gltf,.fbx" className="hidden" onChange={(e) => on3D(e.target.files?.[0])} />
            </label>
          </div>
          {ref3d && <p className="mt-3 text-xs text-gray-500">{ref3d}</p>}
          {(imageName || file3dName) && (
            <button onClick={() => { setImage(null); setImageName(""); setFile3dName(""); setRef3d(""); }} className="mt-2 text-xs text-gray-500 underline">Clear attachments</button>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button onClick={generate} disabled={busy} className="rounded-full bg-ink px-6 py-3 text-white disabled:opacity-50">
              {busy ? "Generating" : "Generate Luau"}
            </button>
            {history.length > 0 && (
              <select onChange={(e) => e.target.value && setPrompt(e.target.value)} defaultValue="" className="rounded-full border border-ink/15 px-4 py-2 text-sm">
                <option value="">Recent</option>
                {history.map((h, i) => <option key={i} value={h}>{h.slice(0, 40)}</option>)}
              </select>
            )}
          </div>
          {notice && <p className="mt-3 text-sm text-gray-600">{notice}</p>}
        </section>

        <section className="flex flex-col rounded-3xl bg-ink p-8 text-white lg:col-span-2">
          <h2 className="font-display text-xl">Roblox connection</h2>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Open Cloud API key" type="password" className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/40" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input value={universeId} onChange={(e) => setUniverseId(e.target.value)} placeholder="Universe ID" className="w-full rounded-xl border border-white/15 bg-white/5 p-3 placeholder:text-white/40" />
            <input value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="Place ID" className="w-full rounded-xl border border-white/15 bg-white/5 p-3 placeholder:text-white/40" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { saveRobloxConfig({ apiKey, universeId }); setNotice("Key saved in this browser."); }} className="rounded-full border border-white/20 px-5 py-2 text-sm">Save locally</button>
            <button onClick={publish} className="rounded-full bg-accent px-5 py-2 text-sm text-white">Publish</button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-display text-xl">Output {lines > 0 && <span className="text-sm font-normal text-white/50">{lines} lines {via && `via ${via}`}</span>}</h2>
          </div>
          <pre className="mt-3 max-h-[420px] min-h-40 flex-1 overflow-auto rounded-2xl bg-black/40 p-4 text-xs leading-relaxed text-green-200">{output || "Output appears here"}</pre>
          <div className="mt-3 flex gap-2">
            <button onClick={copy} disabled={!output} className="rounded-full border border-white/20 px-5 py-2 text-sm disabled:opacity-40">Copy</button>
            <button onClick={download} disabled={!output} className="rounded-full border border-white/20 px-5 py-2 text-sm disabled:opacity-40">Download .luau</button>
          </div>
          <p className="mt-4 text-xs text-white/50">Key never leaves your browser except direct calls to Roblox Open Cloud.</p>
        </section>
      </div>
    </main>
  );
}
