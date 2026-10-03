import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import SceneBoundary from '../ui/SceneBoundary';
import FirstPersonController from './FirstPersonController';
import InteractionManager from './InteractionManager';
import RoomGeometry from './RoomGeometry';
import { ROOM } from './roomConfig';
import { PALETTE } from './roomAtmosphere';

const cameraOptions = { position: ROOM.spawn, fov: ROOM.fov, near: .05, far: 30 };

// Read-only development diagnostics; no camera setters or interaction bypass.
function DevelopmentPose() {
  const { camera, gl } = useThree();
  useFrame(() => {
    gl.domElement.dataset.position = camera.position.toArray().map(value => value.toFixed(4)).join(',');
    gl.domElement.dataset.look = [camera.rotation.x, camera.rotation.y, camera.rotation.z].map(value => value.toFixed(4)).join(',');
  });
  return null;
}

export default function RoomExperience({ suspended, tea, drinkTea, openDiary, openGuestbook, canOpenDiary = false }) {
  const [canvas, setCanvas] = useState(null), [locked, setLocked] = useState(false);
  const [focused, setFocused] = useState(null), [error, setError] = useState(''), [requesting, setRequesting] = useState(false);
  const enter = useRef(), blocked = useRef(suspended);
  blocked.current = suspended;
  const created = useCallback(({ gl }) => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    setCanvas(gl.domElement);
  }, []);
  useEffect(() => {
    if (!canvas) return;
    const changed = () => {
      const ownsLock = document.pointerLockElement === canvas;
      if (ownsLock && blocked.current) { document.exitPointerLock(); return; }
      setLocked(ownsLock); setRequesting(false);
      if (ownsLock) setError('');
      else { setFocused(null); if (!blocked.current) enter.current?.focus({ preventScroll: true }); }
    };
    const failed = () => { setRequesting(false); setError('Mouse control was not granted. Click Enter Room to retry, or use a desktop browser that supports pointer lock.'); };
    const release = () => { if (document.pointerLockElement === canvas) document.exitPointerLock(); };
    const escape = event => { if (event.code === 'Escape' && document.pointerLockElement === canvas) release(); };
    const visibility = () => { if (document.hidden) release(); };
    document.addEventListener('pointerlockchange', changed); document.addEventListener('pointerlockerror', failed);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', release);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerlockchange', changed); document.removeEventListener('pointerlockerror', failed);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', release); release();
      document.removeEventListener('keydown', escape);
    };
  }, [canvas]);
  useEffect(() => {
    if (suspended) {
      setFocused(null);
      if (canvas && document.pointerLockElement === canvas) document.exitPointerLock();
    } else enter.current?.focus({ preventScroll: true });
  }, [suspended, canvas]);
  async function requestControl() {
    if (!canvas || suspended) return;
    if (!canvas.requestPointerLock) { setError('First-person controls require a desktop browser with pointer lock and a keyboard.'); return; }
    setRequesting(true); setError('');
    try { await canvas.requestPointerLock(); }
    catch { setError('Mouse control was not granted. Click Enter Room to retry.'); setRequesting(false); }
  }
  const active = locked && !suspended;
  return <>
    <p className="room-instructions">WASD to walk · Mouse to look · E to interact · Esc to release control</p>
    <div className="room-scene" data-locked={active}>
      <SceneBoundary><Canvas shadows="percentage" camera={cameraOptions} dpr={[1, 1.5]} onCreated={created}>
        <color attach="background" args={[PALETTE.sky]} />
        <hemisphereLight args={[PALETTE.sky, PALETTE.bounce, 2.6]} />
        <directionalLight position={[-1, 4, -3]} color={PALETTE.sunlight} intensity={1.6}
          castShadow shadow-mapSize={[1024, 1024]} shadow-radius={3} shadow-bias={-.0003} shadow-normalBias={.025}
          shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4}
          shadow-camera-near={.1} shadow-camera-far={12} />
        <FirstPersonController active={active} />
        <InteractionManager active={active} onFocus={setFocused}>
          <RoomGeometry tea={tea} drinkTea={drinkTea} openDiary={openDiary} openGuestbook={openGuestbook} canOpenDiary={canOpenDiary} />
        </InteractionManager>
        {import.meta.env.DEV && <DevelopmentPose />}
      </Canvas></SceneBoundary>
      {active && <span className="room-reticle" aria-hidden="true">+</span>}
      {active && focused && <p className="room-prompt" role="status">[E] {focused.label}</p>}
      {!active && !suspended && <div className="room-entry"><button ref={enter} disabled={!canvas || requesting} onClick={requestControl}>{requesting ? 'Entering…' : 'Enter Room'}</button><span>Click to capture the mouse. Esc releases it.</span></div>}
    </div>
    {error && <p role="alert">{error}</p>}
  </>;
}
