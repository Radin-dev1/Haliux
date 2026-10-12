# Haliux

Free open-model Roblox builder. Original code, not a copy of any existing product.

- Models: Gemma 3, Qwen 2.5 Coder, DeepSeek R1, LLaVA and Moondream for images. Local Ollama first, OpenRouter free tier optional.
- Inputs: text prompt, image reference, 3D reference (.obj vertex and face stats, .glb size heuristic).
- No credits, no accounts. Roblox Open Cloud key stays in browser localStorage and publishes from the client.
- Private by default. `X-Robots-Tag: noindex` is set.

## Run

```bash
npm install
npm run dev
# optional local models
ollama pull qwen2.5-coder:7b
ollama pull gemma3:4b
ollama pull moondream:1.8b
```

Set `OPENROUTER_API_KEY` in `.env.local` only if you want cloud free models.

## Push to GitHub

```bash
cd C:/Users/kazem/Projects/Haliux
git init -b main
git add .
git commit -m "Haliux 0.1: free open-model studio"
git remote add origin https://github.com/Radin-dev1/Haliux.git
git push -u origin main
```

## Legal

Built from scratch. No assets copied from lemonade.gg. Roblox trademark belongs to Roblox Corporation.
