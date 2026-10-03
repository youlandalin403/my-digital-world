// Independent of the completed entrance: map coordinates are metres, north is -Z.
export const MAP_CONFIG = {
  camera: {
    position: [65, 98, 115],
    target: [5, 5, 5],
    fov: 43,
    focusOffset: [29, 35, 43],
    duration: 1.65,
  },
  colors: {
    sky: "#cedbd8",
    ground: "#78856a",
    stone: "#e9e7d9",
    path: "#c5c4ae",
    shadow: "#798577",
    bronze: "#747861",
  },
  lighting: {
    sun: [-65, 95, 50],
    intensity: 3,
    ambient: 1.6,
    shadowSize: 2048,
  },
  vegetation: {
    seed: 411,
    perimeterTrees: 85,
    leavesPerCrown: 160,
    grass: 6500,
  },
  dpr: [1, 1.5],
};
export const PLACES = {
  gallery: {
    name: "Gallery",
    position: [-26, 0, -14],
    label: [-31, 16, -12],
    description: "Things made, finished, and shared.",
    access: "public",
    focusHeight: 5,
  },
  laboratory: {
    name: "Laboratory",
    position: [26, 0, -14],
    label: [26, 15, -12],
    description: "Things currently being tested, studied, and built.",
    access: "public",
    focusHeight: 5,
  },
  observatory: {
    name: "Observatory",
    position: [0, 4, -43],
    label: [0, 25, -40],
    description: "A place to observe the passing of time.",
    access: "public",
    focusHeight: 12,
  },
  constellation: {
    name: "Constellation",
    position: [0, 30, -43],
    label: [17, 36, -43],
    description: "Explore the branches of my interests.",
    access: "public",
    focusHeight: 1,
  },
  garden: {
    name: "Idea Garden",
    position: [-31, 0, 26],
    label: [-31, 10, 28],
    description: "Still growing.",
    status: "LOCKED / STILL GROWING",
    access: "locked",
    focusHeight: 3,
  },
  archive: {
    name: "Memory Archive",
    position: [29, 0, 26],
    label: [29, 5, 30],
    description: "Access restricted.",
    status: "LOCKED",
    access: "locked",
    focusHeight: -1,
  },
  guestbook: {
    name: "Guestbook",
    position: [0, 0, 59],
    label: [0, 7, 60],
    description: "Leave a little of yourself before you go.",
    access: "public",
    focusHeight: 2,
  },
  room: {
    name: "My Room",
    position: [63, 3, 20],
    label: [63, 12, 22],
    description: "A private room for the owner.",
    status: "OWNER ONLY",
    access: "protected",
    focusHeight: 3,
  },
};
export const NAVIGATION = [
  "gallery",
  "laboratory",
  "observatory",
  "constellation",
  "map",
  "guestbook",
];
export const initialMapState = { mode: "map", selectedPlace: null };
export function mapReducer(state, action) {
  switch (action.type) {
    case "SELECT":
      return PLACES[action.id]
        ? { mode: "focus", selectedPlace: action.id }
        : state;
    case "MAP":
      return initialMapState;
    case "ENTER":
      return state.mode === "focus" &&
        PLACES[state.selectedPlace]?.access === "public"
        ? { ...state, mode: "transition" }
        : state;
    case "ARRIVE":
      return state.mode === "transition"
        ? { ...state, mode: "placeholder" }
        : state;
    default:
      return state;
  }
}
