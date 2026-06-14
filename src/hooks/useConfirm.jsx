import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

export function useConfirm() {
  const [state, setState] = useState({ open: false, message: "", title: "" });
  const resolverRef = useRef(null);

  const confirm = useCallback((message, title = "Confirmar") => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, message, title });
    });
  }, []);

  function handleConfirm() {
    setState({ open: false, message: "", title: "" });
    resolverRef.current?.(true);
  }

  function handleCancel() {
    setState({ open: false, message: "", title: "" });
    resolverRef.current?.(false);
  }

  const ConfirmNode = state.open ? (
    <ConfirmDialog
      message={state.message}
      title={state.title}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, ConfirmNode };
}
