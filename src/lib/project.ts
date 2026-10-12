// Project model: nodes, snapshots, validation, templates. All local, no credits.
export type MechNode = { id: string; label: string; x: number; y: number; status: "idea" | "draft" | "done" };
export type Snapshot = { id: string; at: number; label: string; code: string };

const PKEY = "haliux.project.v1";

export const MECHANIC_LIBRARY = [
  "Claimable plots", "Timed rounds", "Building system", "Checkpoints", "Coin counter",
  "Pet multipliers", "Rebirth", "Dropper", "Conveyor", "Quest board", "Daily rewards", "Trading"
];

export const GAME_TEMPLATES = [
  { label: "Obby", text: "Obby with 12 stages, checkpoints, lava reset, coin counter, kill plane, skip stage product" },
  { label: "Simulator", text: "Coin simulator with click to earn, 5 pets with multipliers, 3 zones, rebirth at 100k" },
  { label: "Tycoon", text: "Tycoon starter with dropper, conveyor, 3 buttons, cash display, DataStore save" },
  { label: "obby bike", text: "Bike obby with speed pads, bounce pads, moving platforms, stage saves" },
  { label: "Horror", text: "Horror round game with lobby, monster AI chase, hiding spots, timed escape" },
  { label: "Battlegrounds", text: "Battlegrounds with combat dummy, dash, block, 3 abilities with cooldowns" }
];

export function enhancePrompt(q: string): string {
  const base = q.trim();
  if (base.length > 220) return base;
  return `${base}. Server authoritative, Config table, leaderstats, DataStore save, mobile buttons, 60fps budget, no admin backdoors. Split into Services, Config, State, Mechanics, Remotes.`;
}

export function validateLuau(code: string): string[] {
  const issues: string[] = [];
  if (!code.trim()) return ["Empty output"];
  if (!/Config\s*=/m.test(code)) issues.push("Missing Config table on top");
  if ((code.match(/\bfunction\b/g) || []).length > (code.match(/\bend\b/g) || []).length) issues.push("Unbalanced function and end");
  if (/while\s+true\s+do/i.test(code) && !/task\.wait|wait\(\)/i.test(code)) issues.push("Busy loop without wait");
  if (/loadstring|require\(.*http/i.test(code)) issues.push("Blocked: remote code load");
  return issues;
}

export function loadProject(): { nodes: MechNode[] } {
  try {
    const raw = localStorage.getItem(PKEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fresh */ }
  return { nodes: [{ id: "core", label: "project", x: 46, y: 44, status: "idea" }] };
}

export function saveProject(nodes: MechNode[]) {
  localStorage.setItem(PKEY, JSON.stringify({ nodes }));
}
