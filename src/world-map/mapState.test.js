import test from "node:test";
import assert from "node:assert/strict";
import {
  initialMapState,
  mapReducer,
  PLACES,
  NAVIGATION,
} from "./mapConfig.js";

test("each public navigation destination resolves to a focus and a placeholder", () => {
  for (const id of NAVIGATION.filter((id) => id !== "map")) {
    const focused = mapReducer(initialMapState, { type: "SELECT", id });
    assert.deepEqual(focused, { mode: "focus", selectedPlace: id });
    const entering = mapReducer(focused, { type: "ENTER" });
    assert.equal(entering.mode, "transition");
    assert.deepEqual(mapReducer(entering, { type: "ARRIVE" }), {
      mode: "placeholder",
      selectedPlace: id,
    });
  }
});
test("locked and protected places can be focused but cannot enter", () => {
  for (const [id, place] of Object.entries(PLACES).filter(
    ([, p]) => p.access !== "public",
  )) {
    const focused = mapReducer(initialMapState, { type: "SELECT", id });
    assert.equal(focused.selectedPlace, id);
    assert.deepEqual(
      mapReducer(focused, { type: "ENTER" }),
      focused,
      place.name,
    );
  }
});
test("returning to the map cancels selection and ignores a stale arrival", () => {
  const entering = mapReducer(
    mapReducer(initialMapState, { type: "SELECT", id: "gallery" }),
    { type: "ENTER" },
  );
  const overview = mapReducer(entering, { type: "MAP" });
  assert.deepEqual(overview, initialMapState);
  assert.deepEqual(mapReducer(overview, { type: "ARRIVE" }), initialMapState);
});
test("invalid destinations and ENTER without a focus cannot change mode", () => {
  assert.deepEqual(
    mapReducer(initialMapState, { type: "SELECT", id: "diary" }),
    initialMapState,
  );
  assert.deepEqual(
    mapReducer(initialMapState, { type: "ENTER" }),
    initialMapState,
  );
});
