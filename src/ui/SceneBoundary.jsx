import { Component } from "react";
export const SceneFallback = () => (
  <div className="fallback">
    <p>This world needs a little more light.</p>
    <span>The 3D scene couldn’t start. Try a browser with WebGL enabled.</span>
    <button onClick={() => location.reload()}>Try again</button>
  </div>
);
export default class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? <SceneFallback /> : this.props.children;
  }
}
