import { useEffect, useState } from "react";
import { Button } from "./ui";

// Two-step delete: first click arms the button, second click within 3s confirms.
export function ConfirmButton({ onConfirm, children, disabled }: { onConfirm: () => void; children: string; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      type="button"
      variant="danger"
      disabled={disabled}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
    >
      {armed ? "Click again to confirm" : children}
    </Button>
  );
}
