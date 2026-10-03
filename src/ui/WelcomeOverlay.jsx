export default function WelcomeOverlay({ visible, onEnter }) {
  return (
    <section
      className={`welcome ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <h1>
        <span>Welcome to </span>Yunhan Lin's Digital World.
      </h1>
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        disabled={!visible}
        onClick={onEnter}
      >
        ENTER
        <span aria-hidden="true" className="button-line" />
      </button>
    </section>
  );
}
