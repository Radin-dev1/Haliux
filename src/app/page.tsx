import Link from "next/link";

export default function Home() {
  return (
    <main className="w-full max-w-full overflow-x-hidden bg-paper text-ink">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <span className="font-display text-xl font-bold tracking-tight">Haliux</span>
        <div className="flex items-center gap-3">
          <Link href="/studio" className="rounded-full bg-ink px-5 py-2 text-sm text-white">
            Open Studio
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-24">
        <h1 className="max-w-5xl font-display text-4xl leading-none tracking-tighter md:text-6xl">
          Describe the Roblox game. Haliux drafts it with free open models.
        </h1>
        <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-gray-600">
          Type a prompt, attach an image or a 3D reference, pick Gemma, Qwen or DeepSeek. No credits. No account. Paste a Roblox Open Cloud key once and publish directly.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/studio" className="rounded-full bg-accent px-6 py-3 text-white">
            Start building
          </Link>
          <a href="https://github.com/Radin-dev1/Haliux" className="rounded-full border border-ink/20 px-6 py-3">
            GitHub
          </a>
        </div>
        <p className="mt-6 text-sm text-gray-500">Original implementation. Not affiliated with Lemonade or Roblox.</p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-32 md:grid-cols-2">
        <div className="rounded-[2.5rem] border border-slate-200/50 bg-white p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <h2 className="font-display text-2xl tracking-tight">Prompt plus files</h2>
          <p className="mt-3 text-gray-600">Text, images and OBJ or GLB references become one build spec. Vision models describe the image. Geometry stats ground the scale.</p>
        </div>
        <div className="rounded-[2.5rem] border border-slate-200/50 bg-ink p-10 text-white">
          <h2 className="font-display text-2xl tracking-tight">Publish with your key</h2>
          <p className="mt-3 text-white/70">Key stays in your browser. Haliux calls Roblox Open Cloud from the client. Delete it anytime. Nothing is sent to our servers.</p>
        </div>
      </section>

      <footer className="border-t border-ink/10 py-10 text-center text-sm text-gray-500">
        Haliux is a free learning tool. Roblox is a trademark of Roblox Corporation.
      </footer>
    </main>
  );
}
