// Visual transforms in metres/radians. Floor-centred pivots compensate for pack origins.
// Interaction anchors and solid footprints remain in roomConfig.js.
const base = import.meta.env?.BASE_URL ?? '/';
const original = (name, position) => ({ url: `${base}models/my-room/original/${name}.glb`, position, rotation: [0, 0, 0], scale: [1, 1, 1] });
export const ROOM_ASSETS = {
  desk: {
    url: base + "models/my-room/library/Furniture Pack-glb/Desk.glb",
    position: [2.4,0,-0.4], rotation: [0, -1.5707963267948966, 0],
    scale: [0.987761165580849,0.8563694983004143,0.9449261016503818], pivot: [0,0.0007023370042261008,0.0290952890287689],
  },
  chair: {
    url: base + "models/my-room/library/Furniture Pack-glb/Chair.glb",
    position: [1.55,0,-0.4], rotation: [0, 1.5707963267948966, 0],
    scale: [0.8871382554967528,0.8909078846506527,0.7909582016099885], pivot: [-1.1641531988404452e-8,0.006554224222411601,0.049395730399385246],
  },
  bed: {
    url: base + "models/my-room/library/Furniture Pack-glb/Bed Twin.glb",
    position: [-1.9,0,-1.85], rotation: [0, 1.5707963267948966, 0],
    scale: [0.49978515518611727,0.5007925653382929,0.5001722120910328], pivot: [-0.0012319087982177734,0.011820959301653014,-0.5997903401564503],
  },
  bookcase: {
    url: base + "models/my-room/library/Furniture Pack-glb/Bookcase with Books.glb",
    position: [1.65,0,-2.19], rotation: [0, 0, 0],
    scale: [0.5320490276692376,0.5339179233066226,0.5418375468471984], pivot: [-0.004233969375491142,0.018219390855225538,-0.04565330471118567],
  },
  closet: {
    url: base + "models/my-room/library/Furniture Pack-glb/Closet.glb",
    position: [-2.62,0,1.65], rotation: [0, 1.5707963267948966, 0],
    scale: [0.6054740166300039,0.6045321556031935,0.6091882113071236], pivot: [0.000688701868057251,0.007872697586849933,-0.004796009831800091],
  },
  nightstand: {
    url: base + "models/my-room/library/Furniture Pack-glb/Night Stand.glb",
    position: [-0.55,0,-1.9], rotation: [0, 0, 0],
    scale: [0.8507604798840662,0.9379774020254659,0.9276592930551687], pivot: [0,0.002340029032691441,4.217557694752294e-8],
  },
  plant: {
    url: base + "models/my-room/library/Ultimate House Interior Pack-glb/Houseplant.glb",
    position: [-0.55,0.48,-1.9], rotation: [0, 0, 0],
    scale: [0.9978021923286629,1.0002806286202635,0.9978020996820938], pivot: [0,-0.0010514371330044988,1.6061160332259128e-8],
  },
  lamp: {
    url: base + "models/my-room/library/Ultimate House Interior Pack-glb/Table Lamp.glb",
    position: [2.48,0.79,0.25], rotation: [0, 0, 0],
    scale: [0.5987458220224715,0.6027647906164322,0.5987456476012852], pivot: [-0.00000235741026699543,6.041957633060133e-8,5.126797962551333e-8],
  },
  rug: {
    url: base + "models/my-room/library/Ultimate House Interior Pack-glb/Round Rug.glb",
    position: [-0.15,0.004,0.15], rotation: [0, 0, 0],
    scale: [0.7220990454321543,0.7625655824117984,0.7229808872003124], pivot: [6.984919300734305e-7,3.039649522903038e-7,3.27020011958723e-7],
  },
  window: original('window', [0, 1.55, -2.47]),
  mug: original('mug', [0, 0, 0]),
  tea: { ...original('tea', [0, 0, 0]), levels: { 2: .055, 1: -.015 } },
};
export const FURNISHINGS = ["desk","chair","bed","bookcase","closet","nightstand","plant","lamp","rug"];
