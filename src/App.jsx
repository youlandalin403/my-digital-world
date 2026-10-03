import { useState, useEffect, lazy, Suspense } from "react";
import { navigate, usePathname } from './navigation';
const ProjectPage = lazy(() => import('./projects/ProjectPage'));
const ObservatoryPage = lazy(() => import('./observatory/ObservatoryPage'));
const ConstellationPage = lazy(() => import('./constellation/ConstellationPage'));
const GuestbookPage = lazy(() => import('./guestbook/GuestbookPage'));
const MyRoom = lazy(() => import('./my-room/MyRoom'));
const GuestInvite = lazy(() => import('./my-room/GuestInvite'));
const Experience = lazy(() => import("./world/Experience"));
const loadWorldMap = () => import("./world-map/WorldMap");
const WorldMap = lazy(loadWorldMap);
import WelcomeOverlay from "./ui/WelcomeOverlay";
import LoadingScreen from "./ui/LoadingScreen";
import SceneBoundary, { SceneFallback } from "./ui/SceneBoundary";
export default function App() {
  const path = usePathname();
  const [phase, setPhase] = useState("loading");
  useEffect(() => {
    if (path === '/') setPhase('loading');
  }, [path]);
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  if (path === '/guestbook' || path === '/guestbook/')
    return <Suspense fallback={<LoadingScreen visible />}><GuestbookPage /></Suspense>;
  if (path === '/room/invite' || path === '/room/invite/')
    return <Suspense fallback={<LoadingScreen visible />}><GuestInvite /></Suspense>;
  if (['/room', '/room/', '/my-room', '/my-room/'].includes(path))
    return <Suspense fallback={<LoadingScreen visible />}><MyRoom /></Suspense>;
  if (path === '/constellation' || path === '/constellation/')
    return <Suspense fallback={<LoadingScreen visible />}><ConstellationPage /></Suspense>;
  if (path === '/observatory' || path === '/observatory/')
    return <Suspense fallback={<LoadingScreen visible />}><ObservatoryPage /></Suspense>;
  if (path === '/gallery' || path.startsWith('/gallery/') || path === '/laboratory' || path === '/laboratory/' || path === '/idea-garden' || path === '/idea-garden/' || path.startsWith('/projects/'))
    return <Suspense fallback={<LoadingScreen visible />}><ProjectPage path={path} /></Suspense>;
  if (path === '/map' || phase === "map")
    return (
      <main data-phase="map" aria-label="Yunhan Lin's Digital World">
        <SceneBoundary>
          <Suspense fallback={<LoadingScreen visible />}>
            <WorldMap reducedMotion={reducedMotion} />
          </Suspense>
        </SceneBoundary>
      </main>
    );
  return (
    <main
      aria-label="Entrance to Yunhan Lin's Digital World"
      data-phase={phase}
    >
      <SceneBoundary onError={() => setPhase("error")}>
        <Suspense fallback={null}>
          <Experience
            active={phase !== "loading"}
            ended={phase === "end"}
            entering={phase === "entering"}
            onReady={() => setPhase((p) => (p === "loading" ? "journey" : p))}
            onReveal={() => setPhase((p) => (p === "journey" ? "welcome" : p))}
            onEnd={() => { setPhase("map"); navigate('/map'); }}
            onError={() => setPhase("error")}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </SceneBoundary>
      {phase === "error" && <SceneFallback />}
      <div className="readability" aria-hidden="true" />
      <LoadingScreen visible={phase === "loading"} />
      <WelcomeOverlay
        visible={phase === "welcome"}
        onEnter={() => {
          loadWorldMap();
          setPhase("entering");
        }}
      />
      <div
        className={`ending ${phase === "entering" || phase === "end" ? "is-visible" : ""}`}
        aria-hidden={phase !== "end"}
      ></div>
    </main>
  );
}
