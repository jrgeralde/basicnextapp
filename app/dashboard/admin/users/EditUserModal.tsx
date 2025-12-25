"use client";

import { useState, useRef, useEffect } from "react";
import { X, GripHorizontal } from "lucide-react";
import { User } from "./actions";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: {
    id: string;
    email: string;
    name: string;
    fullname: string;
    birthdate: string;
    gender: string;
  }) => Promise<void>;
  user: User | null;
}

export default function EditUserModal({ isOpen, onClose, onEdit, user }: EditUserModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fullname, setFullname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [active, setActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentTranslate = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && user) {
      setEmail(user.email);
      setName(user.name);
      setFullname(user.fullname || "");
      // Format date to YYYY-MM-DD for input[type="date"]
      setBirthdate(user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : "");
      setGender(user.gender || "");
      setActive(user.active);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim() || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await onEdit({ 
        id: user.id, 
        email, 
        name, 
        fullname, 
        birthdate, 
        gender 
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header - Amber for Edit */}
        <div 
          className="flex items-center justify-between bg-amber-500 px-4 py-3 text-white cursor-move select-none"
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-5 w-5 opacity-70" />
            <h2 className="text-lg font-semibold">Edit User</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (Username) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthdate
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
             <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input 
                    type="checkbox" 
                    checked={active} 
                    readOnly 
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                    disabled
                />
                Active (Read Only)
             </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
