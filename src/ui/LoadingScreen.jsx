export default function LoadingScreen({ visible }) {
  return (
    <div
      className={`loading ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <p role="status">A world is taking shape.</p>
    </div>
  );
}
