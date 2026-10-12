"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FREE_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { describe3DFile } from "@/lib/model3d";

type Msg = { role: "user" | "assistant"; text: string };

const QUICK = ["Create claimable plots", "Add timed rounds", "Add a building mechanic"];

export default function Builder() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: "Welcome. Describe the game and I will draft the Luau. Attach images or 3D refs with the plus button." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [node, setNode] = useState({ x: 50, y: 42 });
  const [goals, setGoals] = useState<string[]>(["First playable draft", "Roblox publish check"]);
  const [done, setDone] = useState<boolean[]>([false, false]);
  const [image, setImage] = useState<string | null>(null);
  const [ref3d, setRef3d] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("haliux.history") || "[]");
      if (h.length) setMsgs((m) => [...m, { role: "assistant", text: `Recent: ${h[0].slice(0, 90)}` }]);
    } catch { /* empty */ }
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, model, image, ref3d })
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", text: String(data.luau || data.error || "No output").slice(0, 4000) }]);
      const h = [q, ...JSON.parse(localStorage.getItem("haliux.history") || "[]")].slice(0, 5);
      localStorage.setItem("haliux.history", JSON.stringify(h));
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", text: String(e?.message || e) }]);
    }
    setBusy(false);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.type.startsWith("image/")) {
      const buf = await f.arrayBuffer();
      setImage(`data:${f.type};base64,${Buffer.from(buf).toString("base64").slice(0, 400000)}`);
      setMsgs((m) => [...m, { role: "assistant", text: `Image attached: ${f.name}. It will ground the next draft.` }]);
    } else {
      setRef3d(await describe3DFile(f));
      setMsgs((m) => [...m, { role: "assistant", text: `3D attached: ${f.name}. Geometry stats will ground the next draft.` }]);
    }
  }

  return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-zinc-950 text-white">
      <aside className="flex w-12 flex-col items-center gap-4 border-r border-white/10 py-4">
        <Link href="/" className="font-display text-lg font-bold">H</Link>
        <Link href="/studio" className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70">S</Link>
        <span className="mt-auto rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-300">Free</span>
      </aside>

      <section className="relative flex-1">
        <header className="absolute left-4 right-4 top-4 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm">
            <span className="font-medium">project</span>
            <span className="text-white/40">0 mechanics - 0 links</span>
          </div>
          <div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-white/70">Agent mode</div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDone(done.map(() => true))}
              className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm"
            >
              Goals {done.filter(Boolean).length}/{goals.length}
            </button>
            <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm text-black">
              Import game
              <input type="file" accept=".rbxm,.rbxl,.lua,.luau" className="hidden" onChange={(e) => send(`Import ${e.target.files?.[0]?.name || "file"} and summarize its systems`)} />
            </label>
          </div>
        </header>

        <div
          className="h-full w-full"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)", backgroundSize: `${20 * zoom / 100}px ${20 * zoom / 100}px` }}
          onDoubleClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setNode({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
        >
          <div className="absolute" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-zinc-900 text-2xl">H</div>
            <div className="mt-2 rounded-full border border-white/10 bg-zinc-900 px-4 py-1 text-center text-sm">project</div>
          </div>
        </div>

        <div className="absolute bottom-6 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-2 py-1 text-sm">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="px-2">-</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="px-2">+</button>
        </div>
        <p className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-xs text-white/30 md:block">Double click canvas to move the project node</p>
      </section>

      <section className="flex w-full max-w-md flex-col border-l border-white/10 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-medium">Chat</h2>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">No credits</span>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 py-3">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} className="whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5">{q}</button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-auto px-5 py-2">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ml-8 rounded-2xl bg-white/10 p-3 text-sm" : "mr-8 rounded-2xl border border-white/10 p-3 text-sm text-white/85"}>
              <pre className="whitespace-pre-wrap font-body">{m.text}</pre>
            </div>
          ))}
          {busy && <p className="text-sm text-white/40">Drafting with {model}.</p>}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-3xl border border-sky-400/60 p-3">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder="Describe the next mechanic" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" />
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="rounded-full border border-white/15 px-3 py-2 text-sm">+</button>
              <input ref={fileRef} type="file" accept="image/*,.obj,.glb,.gltf,.fbx" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-full border border-white/15 bg-transparent px-3 py-2 text-sm">
                {FREE_MODELS.map((m) => <option key={m.id} value={m.id} className="text-black">{m.label}</option>)}
              </select>
              <button onClick={() => send(input)} disabled={busy} className="ml-auto rounded-full bg-lime-300 px-4 py-2 text-sm text-black disabled:opacity-50">Send</button>
            </div>
          </div>
          {(image || ref3d) && <button onClick={() => { setImage(null); setRef3d(""); }} className="mt-2 text-xs text-white/40 underline">Clear attachments</button>}
          <div className="mt-2 space-y-1">
            {goals.map((g, i) => (
              <label key={g} className="flex items-center gap-2 text-xs text-white/60">
                <input type="checkbox" checked={done[i]} onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))} />{g}
              </label>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
