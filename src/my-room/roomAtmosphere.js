// Shared atmosphere palette; no placement or interaction data belongs here.
export const PALETTE = Object.freeze({
  wall: '#eee6d7', ceiling: '#f4eee2', floor: '#b89a73',
  wood: '#a17a51', woodShade: '#826142', cream: '#e8dfcc', paper: '#d8cbb0',
  green: '#72836a', sage: '#99a68b', diary: '#536c55', soil: '#645344',
  metal: '#93816a', sky: '#d8e5e8', distance: '#bdcdd0', foliage: '#9aaf99',
  sunlight: '#fff0d7', bounce: '#e1d5c0',
});
const families = {
  Wood: 'wood', Wood1: 'wood', Wood2: 'woodShade', DarkWood: 'woodShade',
  Cushing: 'cream', PillowCover: 'cream', Mattress: 'paper',
  Comforter: 'green', ComforterLight: 'sage', Pages: 'paper',
  Metal: 'metal', LightMetal: 'metal', White: 'cream',
};
export const SHADOW_CASTERS = new Set(['desk', 'chair', 'bed', 'bookcase', 'closet', 'nightstand', 'plant']);

// Clone once per source material, never mutate the useGLTF cache or source files.
export function atmosphereModel(scene, name) {
  const model = scene.clone(true), materials = new Map();
  function adjust(source) {
    if (materials.has(source)) return materials.get(source);
    const material = source.clone();
    let family = families[source.name];
    if (name === 'plant') family = { Black: 'cream', Brown: 'soil', DarkGreen: 'green', LightOrange: 'paper' }[source.name];
    if (name === 'rug') family = source.name === 'DarkRed' ? 'sage' : 'paper';
    if (name === 'mug') family = 'cream';
    if (name === 'window') family = source.color.getHSL({}).l > .5 ? 'sky' : 'wood';
    if (family) material.color.set(PALETTE[family]);
    else if (name !== 'tea') {
      const hsl = material.color.getHSL({});
      material.color.setHSL(hsl.h, Math.min(hsl.s, .25), Math.max(hsl.l, .13));
    }
    material.metalness = /Metal/.test(source.name) ? .2 : 0;
    material.roughness = name === 'tea' ? .38 : name === 'mug' ? .55 : .86;
    materials.set(source, material);
    return material;
  }
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(adjust) : adjust(mesh.material);
    mesh.castShadow = SHADOW_CASTERS.has(name);
    mesh.receiveShadow = name !== 'window' && name !== 'tea';
  });
  return { model, materials: [...materials.values()] };
}
