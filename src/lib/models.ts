// Free open-model registry. No credits. Resolved in order: local Ollama, then OpenRouter free tier.
// All entries are open weights and have generous free access.
export type ModelEntry = {
  id: string;
  label: string;
  provider: "ollama" | "openrouter";
  vision: boolean;
  coder: boolean;
  context: string;
};

export const FREE_MODELS: ModelEntry[] = [
  { id: "qwen2.5-coder:7b", label: "Qwen 2.5 Coder 7B", provider: "ollama", vision: false, coder: true, context: "32k" },
  { id: "deepseek-r1:8b", label: "DeepSeek R1 8B", provider: "ollama", vision: false, coder: true, context: "64k" },
  { id: "gemma3:4b", label: "Gemma 3 4B", provider: "ollama", vision: false, coder: true, context: "32k" },
  { id: "llava:7b", label: "LLaVA 7B (images)", provider: "ollama", vision: true, coder: false, context: "4k" },
  { id: "moondream:1.8b", label: "Moondream 1.8B (images)", provider: "ollama", vision: true, coder: false, context: "4k" },
  { id: "qwen/qwen2.5-coder-32b-instruct:free", label: "Qwen 2.5 Coder 32B (cloud free)", provider: "openrouter", vision: false, coder: true, context: "32k" },
  { id: "google/gemma-3-12b-it:free", label: "Gemma 3 12B (cloud free)", provider: "openrouter", vision: true, coder: true, context: "96k" },
  { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (cloud free)", provider: "openrouter", vision: false, coder: true, context: "64k" }
];

export const DEFAULT_MODEL = "qwen2.5-coder:7b";
