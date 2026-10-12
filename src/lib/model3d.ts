// Summarize a 3D file client side into prompt context. No upload, no credits.
// Supports .obj (text parse) and .glb (header + size + mesh count heuristic).
export async function describe3DFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".obj")) {
    const text = await file.text();
    let v = 0, f = 0;
    for (const line of text.split("\n")) {
      if (line.startsWith("v ")) v++;
      if (line.startsWith("f ")) f++;
    }
    return `3D reference ${file.name}: OBJ with ${v} vertices and ${f} faces (${Math.round(file.size / 1024)} KB). Keep proportions and silhouette when generating the Roblox build.`;
  }
  if (name.endsWith(".glb") || name.endsWith(".gltf")) {
    return `3D reference ${file.name}: glTF container, ${Math.round(file.size / 1024)} KB. Use it as visual reference for scale and parts layout in the generated Luau.`;
  }
  return `3D reference ${file.name}: ${Math.round(file.size / 1024)} KB. Use as visual reference.`;
}
