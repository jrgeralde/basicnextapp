"use client";

import { useEffect, useRef, useCallback } from "react";
import { createRoot, Root } from "react-dom/client";

type ModalProps = {
  message: string;
  resolve: (value: boolean) => void;
  okText?: string;
  cancelText?: string;
  okColor?: string;
  cancelColor?: string;
};

function ConfirmModalComponent({
  message,
  resolve,
  okText = "OK",
  cancelText = "Cancel",
  okColor = "bg-blue-600 hover:bg-blue-700",
  cancelColor = "bg-gray-400 hover:bg-gray-500",
}: ModalProps) {
  const okButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleOk = useCallback(() => resolve(true), [resolve]);
  const handleCancel = useCallback(() => resolve(false), [resolve]);

  // Focus OK button and prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    okButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Keyboard shortcuts: Enter = OK, ESC = Cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleOk();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOk, handleCancel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50"></div>
      {/* Modal content */}
      <div className="relative bg-white p-6 rounded-xl shadow-lg w-96 text-center border border-gray-200">
        <p className="mb-4 text-gray-800 font-medium">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            className={`px-4 py-2 rounded text-white ${cancelColor}`}
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            ref={okButtonRef} // Autofocus OK button
            className={`px-4 py-2 rounded text-white ${okColor}`}
            onClick={handleOk}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmModal(
  message: string,
  options?: Partial<ModalProps>
): Promise<boolean> {
  return new Promise((resolve) => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    const root: Root = createRoot(div);

    const cleanup = () => {
      root.unmount();
      div.remove();
    };

    root.render(
      <ConfirmModalComponent
        message={message}
        resolve={(value) => {
          resolve(value);
          cleanup();
        }}
        {...options}
      />
    );
  });
}
