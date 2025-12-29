"use client";

import { useEffect, useRef, useCallback } from "react";
import { createRoot, Root } from "react-dom/client";

let isModalOpen = false;

type ModalProps = {
  message: string;
  resolve: (value: boolean) => void;
  okText?: string;
  okColor?: string;
};

// Internal Component (Not exported)
function MessageModalComponent({
  message,
  resolve,
  okText = "OK",
  okColor = "bg-blue-600 hover:bg-blue-700",
}: ModalProps) {
  const okButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleOk = useCallback(() => resolve(true), [resolve]);

  // Focus OK button and prevent body scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    okButtonRef.current?.focus();
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Keyboard shortcuts: Enter = OK
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleOk();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOk]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      {/* Modal content */}
      <div className="relative bg-white p-6 rounded-xl shadow-2xl w-96 text-center animate-in fade-in zoom-in duration-200">
        <p className="mb-6 text-gray-800 text-lg font-medium">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            ref={okButtonRef}
            className={`px-6 py-2 rounded-lg text-white font-semibold transition-all active:scale-95 ${okColor}`}
            onClick={handleOk}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * USE THIS FUNCTION TO CALL THE MODAL
 * Changed from 'export default' to a named export to avoid Next.js build errors.
 */
export async function showMessage(
  message: string,
  options?: Partial<Omit<ModalProps, "message" | "resolve">>
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // 2. If a modal is already open, just exit immediately
  if (isModalOpen) return false; 
  
  isModalOpen = true; // Mark as open

  return new Promise((resolve) => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root: Root = createRoot(div);

    const cleanup = () => {
      setTimeout(() => {
        root.unmount();
        if (div.parentNode) document.body.removeChild(div);
        isModalOpen = false; // 3. RESET when closed
      }, 0);
    };

    root.render(
      <MessageModalComponent
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