"use client";

import { useState, useRef, useEffect } from "react";
import { X, GripHorizontal } from "lucide-react";

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (roleName: string, description: string) => Promise<void>;
}

export default function AddRoleModal({ isOpen, onClose, onAdd }: AddRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  
  const roleNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentTranslate = useRef({ x: 0, y: 0 });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRoleName("");
      setDescription("");
      setIsCapsLock(false);
      // Center the modal initially or reset position
      setPosition({ x: 0, y: 0 }); 
    }
  }, [isOpen]);

  const checkCaps = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.getModifierState) {
        setIsCapsLock(e.getModifierState("CapsLock"));
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      // currentTranslate is maintained across renders
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      const newX = currentTranslate.current.x + dx;
      const newY = currentTranslate.current.y + dy;
      
      setPosition({ x: newX, y: newY });
  };

  const onMouseUp = (e: MouseEvent) => {
      if (isDragging.current) {
          // Update the baseline for the next drag
          const dx = e.clientX - dragStart.current.x;
          const dy = e.clientY - dragStart.current.y;
          currentTranslate.current = {
              x: currentTranslate.current.x + dx,
              y: currentTranslate.current.y + dy
          };
          
          isDragging.current = false;
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
      }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd(roleName, description);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {/* Header - Draggable Area */}
        <div 
          className="bg-blue-600 px-4 py-3 border-b flex items-center justify-between cursor-move select-none"
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-2 text-white font-semibold">
            <GripHorizontal size={20} className="text-white/70" />
            <span>Add New Role</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-blue-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Role Name (ID)</label>
            <input
              ref={roleNameRef}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase placeholder:normal-case"
              placeholder="e.g. EDITOR"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value.toUpperCase())}
              onKeyUp={checkCaps}
              onKeyDown={(e) => {
                checkCaps(e);
                if (e.key === "Enter") {
                  e.preventDefault();
                  descriptionRef.current?.focus();
                }
              }}
              onClick={checkCaps}
              autoFocus
              required
            />
            <p className="text-xs text-gray-500">Role IDs are typically uppercase.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              ref={descriptionRef}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-24"
              placeholder="Describe the permissions for this role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyUp={checkCaps}
              onKeyDown={(e) => {
                checkCaps(e);
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitBtnRef.current?.focus();
                }
              }}
              onClick={checkCaps}
            />
          </div>

          {/* Caps Lock Indicator */}
          <div className="h-6 flex items-center justify-center text-[10px] font-bold">
            {isCapsLock ? (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 animate-pulse">
                ⚠️ CAPS LOCK IS ON
              </div>
            ) : (
              <span className="text-gray-300 font-normal uppercase tracking-wider">CAPSLOCK Detection Active</span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={isSubmitting || !roleName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? "Adding..." : "Add Role"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
