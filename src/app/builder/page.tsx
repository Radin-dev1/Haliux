"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gear, Wrench, FolderSimple, Plus, ArrowRight } from "@phosphor-icons/react";
import { FREE_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { describe3DFile } from "@/lib/model3d";

type Msg = { role: "user" | "assistant"; text: string };

const QUICK = ["Create claimable plots", "Add timed rounds", "Add a building system"];

export default function Builder() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [tab, setTab] = useState<"agent" | "explore">("agent");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(120);
  const [node, setNode] = useState({ x: 46, y: 44 });
  const [goals] = useState(["First playable draft", "Publish check"]);
  const [done, setDone] = useState<boolean[]>([false, false]);
  const [showGoals, setShowGoals] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [ref3d, setRef3d] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, busy]);

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
    <main className="flex h-[100dvh] w-full overflow-hidden bg-[#0a0a0b] text-white">
      <aside className="flex w-14 shrink-0 flex-col items-center gap-5 border-r border-white/10 py-4">
        <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-display text-sm font-bold text-black">H</Link>
        <span className="rounded-md border border-white/10 p-1.5 text-white/50"><FolderSimple size={16} /></span>
        <span className="mt-auto flex flex-col items-center gap-4 text-white/50">
          <Gear size={18} /><Wrench size={18} /><FolderSimple size={18} />
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">B</span>
        </span>
      </aside>

      <section className="relative min-w-0 flex-1">
        <header className="absolute left-4 right-4 top-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141416] px-3 py-2 text-[13px]">
            <span className="font-medium">project</span>
            <span className="text-sky-400">0 systems - 0 links</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141416] px-3 py-2 text-[13px]">
            <button onClick={() => setTab("agent")} className={tab === "agent" ? "text-white" : "text-white/40"}>Agent</button>
            <span className={`relative h-5 w-9 rounded-full ${tab === "agent" ? "bg-white/20" : "bg-white/10"}`} onClick={() => setTab(tab === "agent" ? "explore" : "agent")}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${tab === "agent" ? "left-0.5" : "left-5"}`} />
            </span>
            <button onClick={() => setTab("explore")} className={tab === "explore" ? "text-white" : "text-white/40"}>Explore</button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowGoals(!showGoals)} className="rounded-xl border border-white/10 bg-[#141416] px-4 py-2 text-[13px]">
                Goals {done.filter(Boolean).length}/{goals.length}
              </button>
              {showGoals && (
                <div className="absolute right-0 top-11 z-10 w-64 rounded-xl border border-white/10 bg-[#141416] p-3">
                  {goals.map((g, i) => (
                    <label key={g} className="flex items-center gap-2 py-1 text-[13px] text-white/70">
                      <input type="checkbox" checked={done[i]} onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))} />{g}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-xl bg-[#e8e8e6] px-4 py-2 text-[13px] font-medium text-black">
              Import game
              <input type="file" accept=".rbxm,.rbxl,.lua,.luau" className="hidden" onChange={(e) => send(`Import ${e.target.files?.[0]?.name || "file"} and summarize its systems`)} />
            </label>
          </div>
        </header>

        <div
          className="h-full w-full"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.4px)", backgroundSize: `${18 * zoom / 120}px ${18 * zoom / 120}px` }}
          onDoubleClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setNode({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-[#1a1a1d] text-xl font-bold text-sky-300">H</div>
            <div className="mx-auto mt-3 w-fit rounded-full border border-white/10 bg-[#141416] px-4 py-1.5 text-[13px]">project</div>
          </div>
        </div>

        <div className="absolute bottom-5 left-4 flex items-center gap-1 rounded-xl border border-white/10 bg-[#141416] px-2 py-1.5 text-[13px]">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="rounded-md px-2 hover:bg-white/10">-</button>
          <span className="min-w-12 text-center">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="rounded-md px-2 hover:bg-white/10">+</button>
        </div>
      </section>

      <section className="flex w-full max-w-[420px] shrink-0 flex-col border-l border-white/10 bg-[#101012]">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[15px] font-medium">Chat</h2>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="rounded-lg bg-white/5 px-3 py-1.5 text-white/60">Free</span>
            <button onClick={() => setMsgs([])} className="rounded-lg bg-white/5 px-3 py-1.5 text-white/60">History</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5">
          {msgs.length === 0 ? (
            <div className="pt-40 text-center">
              <p className="font-display text-[26px] tracking-tight">Welcome, builder</p>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => send(q)} className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-white/80 hover:bg-white/10">
                    <Plus size={14} />{q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <p className="text-center font-display text-xl">Welcome, builder</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => send(q)} className="shrink-0 whitespace-nowrap rounded-full border border-white/10 px-4 py-1.5 text-[13px] text-white/70">{q}</button>
                ))}
              </div>
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "user" ? "ml-10 rounded-2xl bg-white/10 p-3 text-[13px]" : "mr-6 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[13px] text-white/85"}>
                  <pre className="whitespace-pre-wrap font-body">{m.text}</pre>
                </div>
              ))}
              {busy && <p className="text-[13px] text-white/40">Drafting with {model}.</p>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="rounded-3xl border-2 border-sky-400/80 bg-[#161618] p-3">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} rows={2} placeholder="Connect your Roblox key in Studio first" className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/30" />
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="rounded-full bg-white/5 p-2.5 text-white/70 hover:bg-white/10"><Plus size={16} /></button>
              <input ref={fileRef} type="file" accept="image/*,.obj,.glb,.gltf,.fbx" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <select value={model} onChange={(e) => setModel(e.target.value)} className="max-w-44 rounded-full bg-white/5 px-3 py-2 text-[13px] text-white/80 outline-none">
                {FREE_MODELS.map((m) => <option key={m.id} value={m.id} className="text-black">{m.label}</option>)}
              </select>
              <button onClick={() => send(input)} disabled={busy} className="ml-auto rounded-full bg-[#d7e94c] p-2.5 text-black disabled:opacity-40"><ArrowRight size={16} weight="bold" /></button>
            </div>
          </div>
          {(image || ref3d) && <button onClick={() => { setImage(null); setRef3d(""); }} className="mt-2 text-xs text-white/40 underline">Clear attachments</button>}
        </div>
      </section>
    </main>
  );
}
