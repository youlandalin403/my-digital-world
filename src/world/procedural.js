import {
  BufferGeometry,
  Float32BufferAttribute,
  CanvasTexture,
  RepeatWrapping,
} from "three";
export function random(seed = 731) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function leafGeometry() {
  const g = new BufferGeometry();
  const outline = [
      [0, 0, 0],
      [-0.19, 0.2, 0],
      [-0.28, 0.45, 0],
      [-0.19, 0.72, 0],
      [0, 1, 0],
      [0.19, 0.72, 0],
      [0.28, 0.45, 0],
      [0.19, 0.2, 0],
    ],
    vertices = [];
  for (let i = 0; i < outline.length; i++)
    vertices.push(
      ...outline[i],
      ...outline[(i + 1) % outline.length],
      0,
      0.47,
      0.045,
    );
  g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  g.computeVertexNormals();
  return g;
}
export function grassGeometry() {
  const g = new BufferGeometry();
  g.setAttribute(
    "position",
    new Float32BufferAttribute(
      [
        -0.055, 0, 0, 0.055, 0, 0, -0.03, 0.5, 0.02, 0.055, 0, 0, 0.04, 0.5,
        0.02, -0.03, 0.5, 0.02, -0.03, 0.5, 0.02, 0.04, 0.5, 0.02, 0.12, 1,
        0.06,
      ],
      3,
    ),
  );
  g.computeVertexNormals();
  return g;
}
export function stoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d"),
    data = ctx.createImageData(256, 256),
    rng = random(17);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 220 + rng() * 35;
    data.data.set([v, v, v - 3, 255], i);
  }
  ctx.putImageData(data, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}
export function terrainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d"),
    rng = random(330);
  ctx.fillStyle = "#a8ad96";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3600; i++) {
    const x = rng() * 512,
      y = rng() * 512,
      r = 1 + rng() * 30;
    ctx.fillStyle = i % 2 ? "rgba(56,64,38,.035)" : "rgba(227,222,180,.035)";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(14, 14);
  return texture;
}
// Small vertex displacement, with no extra render passes.
export function windMaterial(shader, uniform, strength) {
  shader.uniforms.uWindTime = uniform;
  shader.vertexShader = "uniform float uWindTime;\n" + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
    #ifdef USE_INSTANCING
      float phase = instanceMatrix[3].x * .7 + instanceMatrix[3].z * .41;
      transformed.x += sin(uWindTime * 1.15 + phase) * pow(max(position.y,0.0),2.0) * ${strength.toFixed(3)};
    #endif`,
  );
}
