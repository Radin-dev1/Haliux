// Roblox Open Cloud deploy helper. Key stays in browser localStorage. No account linking, no server storage.
// Docs: https://create.roblox.com/docs/open-cloud
export type RobloxConfig = { apiKey: string; universeId: string };

const KEY = "haliux.roblox";

export function loadRobloxConfig(): RobloxConfig {
  if (typeof window === "undefined") return { apiKey: "", universeId: "" };
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"apiKey":"","universeId":""}');
  } catch {
    return { apiKey: "", universeId: "" };
  }
}

export function saveRobloxConfig(c: RobloxConfig) {
  localStorage.setItem(KEY, JSON.stringify(c));
}

// Publish Luau to Open Cloud. Called from client so the key never hits our server.
export async function publishLuau(cfg: RobloxConfig, placeId: string, luauSource: string) {
  const res = await fetch(
    `https://apis.roblox.com/universes/v1/${cfg.universeId}/places/${placeId}/scripts`,
    {
      method: "POST",
      headers: { "x-api-key": cfg.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ script: luauSource })
    }
  );
  if (!res.ok) throw new Error(`Roblox publish failed: ${res.status}`);
  return res.json();
}
