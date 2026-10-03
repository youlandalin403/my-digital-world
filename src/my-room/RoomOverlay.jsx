import { useEffect, useRef } from 'react';

// A native modal traps focus and makes the still-mounted room inert.
export default function RoomOverlay({ label, children }) {
  const dialog = useRef();
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    element.querySelector('button')?.focus();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className="room-overlay" aria-label={label} onCancel={event => {
    event.preventDefault();
    // Reuse the editor's close path: Esc respects draft protection and saving.
    dialog.current.querySelector('button')?.click();
  }}>{children}</dialog>;
}
