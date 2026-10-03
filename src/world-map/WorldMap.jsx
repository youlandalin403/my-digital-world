import { useReducer, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MAP_CONFIG as C,
  PLACES,
  NAVIGATION,
  mapReducer,
  initialMapState,
} from "./mapConfig";
import MapCamera from "./MapCamera";
import MapTerrain from "./MapTerrain";
import MapBuildings from "./MapBuildings";
import CentralCourtyard from "./CentralCourtyard";
import MapVegetation from "./MapVegetation";
import MapLabels, { LabelPositions } from "./MapLabels";
import Diagnostics from "../world/Diagnostics";
import "./worldMap.css";
import { navigate } from '../navigation';

function Ready({ onReady, onError }) {
  const frames = useRef(0),
    gl = useThree((s) => s.gl);
  useFrame(() => {
    if (++frames.current === 3) onReady();
  });
  useEffect(() => {
    const lost = (e) => {
      e.preventDefault();
      onError();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onError]);
  return null;
}
export default function WorldMap({ reducedMotion }) {
  const [state, dispatch] = useReducer(mapReducer, initialMapState),
    [ready, setReady] = useState(false),
    [hovered, setHovered] = useState(null);
  const labelNodes = useRef({});
  const [failed, setFailed] = useState(false),
    returnButton = useRef();
  const selected = PLACES[state.selectedPlace],
    select = (id) => dispatch({ type: id === "map" ? "MAP" : "SELECT", id });
  useEffect(() => {
    if (state.mode !== "transition") return;
    const timer = setTimeout(
      () => ['gallery', 'laboratory', 'observatory', 'constellation', 'guestbook'].includes(state.selectedPlace) ? navigate(`/${state.selectedPlace}`) : dispatch({ type: "ARRIVE" }),
      reducedMotion ? 450 : 2200,
    );
    return () => clearTimeout(timer);
  }, [state.mode, state.selectedPlace, reducedMotion]);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape") dispatch({ type: "MAP" });
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const covered = state.mode === "transition" || state.mode === "placeholder";
  useEffect(() => {
    if (state.mode === "placeholder")
      returnButton.current?.focus({ preventScroll: true });
  }, [state.mode]);
  if (failed)
    return (
      <div className="fallback">
        <p>The world is resting.</p>
        <span>The 3D connection was interrupted.</span>
        <button onClick={() => location.reload()}>Reload the world</button>
      </div>
    );
  return (
    <section
      className={`world-map ${ready ? "map-ready" : ""}`}
      data-mode={state.mode}
      data-selected={state.selectedPlace || "map"}
      aria-label="Public World Map"
    >
      <div
        className="map-canvas"
        style={{
          cursor: hovered ? "pointer" : "default",
          pointerEvents: covered ? "none" : "auto",
        }}
      >
        <Canvas
          shadows
          frameloop={state.mode === "placeholder" ? "never" : "always"}
          dpr={C.dpr}
          camera={{
            position: C.camera.position,
            fov: C.camera.fov,
            near: 0.5,
            far: 600,
          }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[C.colors.sky]} />
          <fog attach="fog" args={[C.colors.sky, 180, 360]} />
          <hemisphereLight args={["#e2eae4", "#727d5b", C.lighting.ambient]} />
          <directionalLight
            position={C.lighting.sun}
            intensity={C.lighting.intensity}
            color="#fff6e4"
            castShadow
            shadow-mapSize={[C.lighting.shadowSize, C.lighting.shadowSize]}
            shadow-camera-left={-105}
            shadow-camera-right={105}
            shadow-camera-top={110}
            shadow-camera-bottom={-100}
            shadow-camera-far={260}
            shadow-normalBias={0.12}
          />
          <MapTerrain />
          <CentralCourtyard />
          <MapBuildings
            selected={state.selectedPlace}
            onSelect={select}
            onHover={setHovered}
          />
          <MapVegetation reducedMotion={reducedMotion} />
          <MapCamera state={state} reducedMotion={reducedMotion} />
          <LabelPositions nodes={labelNodes} />
          <Ready
            onReady={() => setReady(true)}
            onError={() => setFailed(true)}
          />
          {import.meta.env.DEV && <Diagnostics />}
        </Canvas>
      </div>
      <MapLabels
        nodes={labelNodes}
        selected={state.selectedPlace}
        onSelect={select}
        onHover={setHovered}
        covered={covered}
      />
      <header className="map-header" inert={covered ? true : undefined}>
        <span className="map-wordmark">
          Yunhan Lin<span>MY DIGITAL WORLD</span>
        </span>
        <nav aria-label="World navigation">
          {NAVIGATION.map((id) => (
            <button
              key={id}
              aria-pressed={
                id === "map" ? !state.selectedPlace : state.selectedPlace === id
              }
              onClick={() => select(id)}
            >
              {id === "map" ? "Map" : PLACES[id].name}
            </button>
          ))}
        </nav>
      </header>
      <div
        className="map-caption"
        aria-live="polite"
        key={state.selectedPlace || "overview"}
        inert={covered ? true : undefined}
      >
        <p className="map-eyebrow">
          {selected ? selected.status || "PUBLIC WORLD" : "MY DIGITAL WORLD"}
        </p>
        <h2>{selected ? selected.name : "Public World"}</h2>
        <p className="map-meaning">
          {selected ? selected.description : "Follow a path. Choose a place."}
        </p>
        {selected && selected.access === "public" && (
          <button
            className="map-enter"
            onClick={() => dispatch({ type: "ENTER" })}
            disabled={covered}
          >
            ENTER <span aria-hidden="true">↗</span>
          </button>
        )}
        {selected && (
          state.selectedPlace === 'room' && <button className="map-return" onClick={() => navigate('/my-room')}>Owner access →</button>
        )}
        {selected && (
          state.selectedPlace === 'garden' && <button className="map-return" onClick={() => navigate('/idea-garden')}>View public seeds ↗</button>
        )}
        {selected && (
          <button
            className="map-return"
            onClick={() => dispatch({ type: "MAP" })}
          >
            Back to map
          </button>
        )}
      </div>
      {!selected && (
        <div className="courtyard-caption">
          Central Courtyard<span>THE ANCIENT TREE</span>
        </div>
      )}
      <div
        className={`map-arrival ${covered ? "covered" : ""}`}
        aria-hidden={!covered}
      >
        {state.mode === "placeholder" && (
          <div>
            <p>{selected.name} begins here.</p>
            <button
              ref={returnButton}
              onClick={() => dispatch({ type: "MAP" })}
            >
              Return to map
            </button>
          </div>
        )}
      </div>
      <div
        className={`map-reveal ${ready ? "ready" : ""}`}
        aria-hidden="true"
      />
    </section>
  );
}
