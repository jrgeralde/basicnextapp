"use client";

import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, CheckCircle, GripHorizontal } from "lucide-react";
import { User } from "./actions";

interface ActDeactUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: (id: string, newStatus: boolean) => Promise<void>;
  user: User | null;
}

export default function ActDeactUserModal({ isOpen, onClose, onToggle, user }: ActDeactUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentTranslate = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    
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

  const handleToggle = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await onToggle(user.id, !user.active);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  const isDeactivating = user.active;
  const headerColor = isDeactivating ? "bg-red-600" : "bg-green-600";
  const btnColor = isDeactivating ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700";
  const Icon = isDeactivating ? AlertTriangle : CheckCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div 
          className={`flex items-center justify-between ${headerColor} px-4 py-3 text-white cursor-move select-none`}
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-5 w-5 opacity-70" />
            <h2 className="text-lg font-semibold">
              {isDeactivating ? "Deactivate User" : "Activate User"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`rounded-full p-3 ${isDeactivating ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">
                Are you sure you want to {isDeactivating ? "deactivate" : "activate"} this user?
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold">Name:</span> {user.name}</p>
                <p><span className="font-semibold">Email:</span> {user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleToggle}
              disabled={isSubmitting}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${btnColor}`}
            >
              {isSubmitting 
                ? (isDeactivating ? "Deactivating..." : "Activating...") 
                : (isDeactivating ? "Yes, Deactivate" : "Yes, Activate")
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
