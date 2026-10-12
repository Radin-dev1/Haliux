"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gear, Wrench, FolderSimple, Plus, ArrowRight, Download, Upload, Check, X } from "@phosphor-icons/react";
import { FREE_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { describe3DFile } from "@/lib/model3d";
import { MECHANIC_LIBRARY, GAME_TEMPLATES, enhancePrompt, validateLuau, loadProject, saveProject, type MechNode, type Snapshot } from "@/lib/project";

type Msg = { role: "user" | "assistant"; text: string };
const QUICK = ["Create claimable plots", "Add timed rounds", "Add a building system"];

let nid = 10;
const uid = () => `n${nid++}`;

export default function Builder() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [tab, setTab] = useState<"agent" | "explore">("agent");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(120);
  const [nodes, setNodes] = useState<MechNode[]>([{ id: "core", label: "project", x: 46, y: 44, status: "idea" }]);
  const [sel, setSel] = useState("core");
  const [showGoals, setShowGoals] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [goals, setGoals] = useState(["First playable draft", "Publish check"]);
  const [done, setDone] = useState<boolean[]>([false, false]);
  const [image, setImage] = useState<string | null>(null);
  const [ref3d, setRef3d] = useState("");
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [health, setHealth] = useState("checking");
  const [lastCode, setLastCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNodes(loadProject().nodes);
    try {
      setSnaps(JSON.parse(localStorage.getItem("haliux.snaps") || "[]"));
      const h = JSON.parse(localStorage.getItem("haliux.history") || "[]");
      if (h.length) setMsgs([{ role: "assistant", text: `Recent: ${String(h[0]).slice(0, 90)}` }]);
    } catch { /* fresh */ }
    fetch("/api/health").then((r) => r.json()).then((j) => setHealth(j.ollama ? `ollama on (${(j.models || []).length} local)` : "ollama off, cloud or template")).catch(() => setHealth("offline"));
  }, []);

  useEffect(() => { saveProject(nodes); }, [nodes]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, busy]);

  const links = Math.max(0, nodes.length - 1);

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
        body: JSON.stringify({ prompt: enhancePrompt(q), model, image, ref3d })
      });
      const data = await res.json();
      const code = String(data.luau || data.error || "No output").slice(0, 6000);
      setLastCode(code);
      setIssues(validateLuau(code));
      setMsgs((m) => [...m, { role: "assistant", text: code }]);
      const h = [q, ...JSON.parse(localStorage.getItem("haliux.history") || "[]")].slice(0, 5);
      localStorage.setItem("haliux.history", JSON.stringify(h));
      setNodes((ns) => ns.map((n) => (n.id === sel ? { ...n, status: "draft" } : n)));
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", text: String(e?.message || e) }]);
    }
    setBusy(false);
  }

  function addNode(label: string) {
    const n: MechNode = { id: uid(), label, x: 20 + Math.random() * 55, y: 25 + Math.random() * 45, status: "idea" };
    setNodes((ns) => [...ns, n]);
    setSel(n.id);
    send(`Add mechanic: ${label}. Keep existing systems working.`);
  }

  function snapshot() {
    if (!lastCode) return;
    const s: Snapshot = { id: uid(), at: Date.now(), label: `v${snaps.length + 1}`, code: lastCode };
    const next = [s, ...snaps].slice(0, 8);
    setSnaps(next);
    localStorage.setItem("haliux.snaps", JSON.stringify(next));
  }

  function exportProject() {
    const blob = new Blob([JSON.stringify({ nodes, msgs: msgs.slice(-20), goals, model }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "haliux-project.json";
    a.click();
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
        <Link href="/studio" title="Studio" className="rounded-md border border-white/10 p-1.5 text-white/50"><FolderSimple size={16} /></Link>
        <span className="mt-auto flex flex-col items-center gap-4 text-white/50">
          <Gear size={18} /><Wrench size={18} />
          <button onClick={exportProject} title="Export project JSON" className="hover:text-white"><Download size={18} /></button>
          <label title="Import brief" className="cursor-pointer hover:text-white"><Upload size={18} /><input type="file" accept=".json,.txt" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) send(await f.text()); }} /></label>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">B</span>
        </span>
      </aside>

      <section className="relative min-w-0 flex-1">
        <header className="absolute left-4 right-4 top-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141416] px-3 py-2 text-[13px]">
            <span className="font-medium">project</span>
            <span className="text-sky-400">{nodes.length - 1} systems - {links} links</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141416] px-3 py-2 text-[13px]">
            <button onClick={() => setTab("agent")} className={tab === "agent" ? "text-white" : "text-white/40"}>Agent</button>
            <span className="relative h-5 w-9 rounded-full bg-white/10" onClick={() => setTab(tab === "agent" ? "explore" : "agent")}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${tab === "agent" ? "left-0.5" : "left-5"}`} />
            </span>
            <button onClick={() => setTab("explore")} className={tab === "explore" ? "text-white" : "text-white/40"}>Explore</button>
          </div>
          <button onClick={() => setShowTemplates(true)} className="rounded-xl border border-white/10 bg-[#141416] px-3 py-2 text-[13px] text-white/70">Templates</button>
          <button onClick={() => setShowLib(!showLib)} className="rounded-xl border border-white/10 bg-[#141416] px-3 py-2 text-[13px] text-white/70">Mechanics</button>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowGoals(!showGoals)} className="rounded-xl border border-white/10 bg-[#141416] px-4 py-2 text-[13px]">Goals {done.filter(Boolean).length}/{goals.length}</button>
              {showGoals && (
                <div className="absolute right-0 top-11 z-10 w-64 rounded-xl border border-white/10 bg-[#141416] p-3">
                  {goals.map((g, i) => (
                    <label key={g} className="flex items-center gap-2 py-1 text-[13px] text-white/70">
                      <input type="checkbox" checked={done[i]} onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))} />{g}
                    </label>
                  ))}
                  <button onClick={() => { setGoals([...goals, `Step ${goals.length + 1}`]); setDone([...done, false]); }} className="mt-2 text-xs text-sky-300">Add goal</button>
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-xl bg-[#e8e8e6] px-4 py-2 text-[13px] font-medium text-black">
              Import game
              <input type="file" accept=".rbxm,.rbxl,.lua,.luau" className="hidden" onChange={(e) => send(`Import ${e.target.files?.[0]?.name || "file"} and summarize its systems`)} />
            </label>
          </div>
        </header>

        {(showLib || showTemplates) && (
          <div className="absolute left-4 top-16 z-10 grid max-w-lg grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#141416] p-3">
            <div className="col-span-2 flex items-center justify-between px-1 text-xs text-white/50">
              <span>{showTemplates ? "Game templates" : "Mechanic library, click to add node"}</span>
              <button onClick={() => { setShowLib(false); setShowTemplates(false); }}><X size={14} /></button>
            </div>
            {(showTemplates ? GAME_TEMPLATES.map((t) => t.label) : MECHANIC_LIBRARY).map((label) => (
              <button key={label} onClick={() => { const t = GAME_TEMPLATES.find((g) => g.label === label); addNode(label); if (t) send(t.text); setShowLib(false); setShowTemplates(false); }} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[13px] hover:bg-white/10">{label}</button>
            ))}
          </div>
        )}

        <div
          className="h-full w-full"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.4px)", backgroundSize: `${18 * zoom / 120}px ${18 * zoom / 120}px` }}
          onDoubleClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const n: MechNode = { id: uid(), label: `system ${nodes.length}`, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, status: "idea" };
            setNodes((ns) => [...ns, n]); setSel(n.id);
          }}
        >
          <svg className="absolute inset-0 h-full w-full">
            {nodes.slice(1).map((n) => (
              <line key={n.id} x1={`${nodes[0].x}%`} y1={`${nodes[0].y}%`} x2={`${n.x}%`} y2={`${n.y}%`} stroke="rgba(255,255,255,0.12)" />
            ))}
          </svg>
          {nodes.map((n) => (
            <button key={n.id} onClick={() => setSel(n.id)} onDoubleClick={() => setNodes((ns) => ns.map((x) => (x.id === n.id ? { ...x, status: x.status === "done" ? "idea" : "done" } : x)))} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border text-sm font-bold ${sel === n.id ? "border-sky-400 bg-[#1d2b33] text-sky-200" : "border-white/15 bg-[#1a1a1d] text-white/80"}`}>
                {n.label.slice(0, 1).toUpperCase()}
              </span>
              <span className="mx-auto mt-2 flex w-fit items-center gap-1 rounded-full border border-white/10 bg-[#141416] px-3 py-1 text-xs">
                {n.status === "done" && <Check size={12} className="text-emerald-300" />}{n.label}
              </span>
            </button>
          ))}
        </div>

        <div className="absolute bottom-5 left-4 flex items-center gap-1 rounded-xl border border-white/10 bg-[#141416] px-2 py-1.5 text-[13px]">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="rounded-md px-2 hover:bg-white/10">-</button>
          <span className="min-w-12 text-center">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="rounded-md px-2 hover:bg-white/10">+</button>
        </div>
        <p className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-xs text-white/30 md:block">Double click empty canvas for a node, double click node to toggle done</p>
      </section>

      <section className="flex w-full max-w-[420px] shrink-0 flex-col border-l border-white/10 bg-[#101012]">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[15px] font-medium">Chat</h2>
          <div className="flex items-center gap-2 text-[13px]">
            <span title={health} className="rounded-lg bg-white/5 px-3 py-1.5 text-white/60">{health.includes("on") ? "Local on" : "Free"}</span>
            <button onClick={snapshot} disabled={!lastCode} className="rounded-lg bg-white/5 px-3 py-1.5 text-white/60 disabled:opacity-40">Snapshot</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5">
          {msgs.length === 0 ? (
            <div className="pt-32 text-center">
              <p className="font-display text-[26px] tracking-tight">Welcome, builder</p>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => send(q)} className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-white/80 hover:bg-white/10"><Plus size={14} />{q}</button>
                ))}
              </div>
              <div className="mx-auto mt-4 max-w-72 space-y-1.5 text-left text-xs text-white/40">
                {["Pick a template", "Add 2 mechanics as nodes", "Generate, snapshot, publish"].map((s, i) => <p key={s}>{i + 1}. {s}</p>)}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
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
              {issues.length > 0 && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
                  {issues.map((s) => <p key={s}>- {s}</p>)}
                </div>
              )}
              {snaps.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {snaps.map((s) => (
                    <button key={s.id} onClick={() => { setLastCode(s.code); setMsgs((m) => [...m, { role: "assistant", text: s.code }]); }} className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{s.label}</button>
                  ))}
                </div>
              )}
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
              <button onClick={() => send(enhancePrompt(input))} disabled={busy} title="Enhance then send" className="rounded-full bg-white/5 px-3 py-2 text-[13px] text-white/70">Polish</button>
              <button onClick={() => send(input)} disabled={busy} className="ml-auto rounded-full bg-[#d7e94c] p-2.5 text-black disabled:opacity-40"><ArrowRight size={16} weight="bold" /></button>
            </div>
          </div>
          {(image || ref3d) && <button onClick={() => { setImage(null); setRef3d(""); }} className="mt-2 text-xs text-white/40 underline">Clear attachments</button>}
        </div>
      </section>
    </main>
  );
}
