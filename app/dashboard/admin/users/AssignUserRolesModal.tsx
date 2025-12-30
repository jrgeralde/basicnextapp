"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, GripHorizontal, Shield, Plus, Trash2, CheckCheck, Trash } from "lucide-react";
import { User, Role, getAllRoles, getUserRoles, assignRole, removeRole } from "./actions";
import { showMessage } from "@/components/MessageModal";
import ConfirmModal from "@/components/ConfirmModal";

interface AssignUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function AssignUserRolesModal({ isOpen, onClose, user }: AssignUserRolesModalProps) {
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [assignedRoleFilter, setAssignedRoleFilter] = useState("");
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentTranslate = useRef({ x: 0, y: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [roles, userRoles] = await Promise.all([
        getAllRoles(),
        getUserRoles(user.id)
      ]);
      setAllRoles(roles);
      setAssignedRoleIds(userRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      showMessage("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      setPosition({ x: 0, y: 0 });
      currentTranslate.current = { x: 0, y: 0 };
      setRoleFilter("");
      setAssignedRoleFilter("");
      fetchData();
    }
  }, [isOpen, user, fetchData]);

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

  const handleAssignRole = async (roleId: string) => {
    if (!user) return;
    try {
      await assignRole(user.id, roleId);
      setAssignedRoleIds(prev => [...prev, roleId]);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message === "SessionMismatch" || error.message.includes("SessionMismatch"))) {
        await showMessage("Session changed in another tab. Reloading...");
        window.location.reload();
        return;
      }
      console.error(error);
      showMessage("Failed to assign role.");
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!user) return;
    try {
      await removeRole(user.id, roleId);
      setAssignedRoleIds(prev => prev.filter(id => id !== roleId));
    } catch (error: unknown) {
      if (error instanceof Error && (error.message === "SessionMismatch" || error.message.includes("SessionMismatch"))) {
        await showMessage("Session changed in another tab. Reloading...");
        window.location.reload();
        return;
      }
      console.error(error);
      showMessage("Failed to remove role.");
    }
  };

  const handleAddAll = async () => {
    if (!user || availableRoles.length === 0) return;
    
    const confirmed = await ConfirmModal(`Are you sure you want to assign all ${availableRoles.length} filtered roles to ${user.name}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await Promise.all(availableRoles.map(role => assignRole(user.id, role.id)));
      setAssignedRoleIds(prev => [...prev, ...availableRoles.map(r => r.id)]);
      showMessage(`Successfully assigned ${availableRoles.length} roles.`);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message === "SessionMismatch" || error.message.includes("SessionMismatch"))) {
        await showMessage("Session changed in another tab. Reloading...");
        window.location.reload();
        return;
      }
      console.error(error);
      showMessage("Failed to assign some roles.");
    } finally {
        setLoading(false);
    }
  };

  const handleRemoveAll = async () => {
    if (!user || assignedRoles.length === 0) return;

    const confirmed = await ConfirmModal(`Are you sure you want to remove all ${assignedRoles.length} filtered roles from ${user.name}?`);
    if (!confirmed) return;

    try {
        setLoading(true);
        await Promise.all(assignedRoles.map(role => removeRole(user.id, role.id)));
        const removedIds = assignedRoles.map(r => r.id);
        setAssignedRoleIds(prev => prev.filter(id => !removedIds.includes(id)));
        showMessage(`Successfully removed ${assignedRoles.length} roles.`);
    } catch (error: unknown) {
        if (error instanceof Error && (error.message === "SessionMismatch" || error.message.includes("SessionMismatch"))) {
            await showMessage("Session changed in another tab. Reloading...");
            window.location.reload();
            return;
        }
        console.error(error);
        showMessage("Failed to remove some roles.");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const assignedRoles = allRoles
    .filter(r => assignedRoleIds.includes(r.id))
    .filter(r => 
        r.id.toLowerCase().includes(assignedRoleFilter.toLowerCase()) || 
        (r.description && r.description.toLowerCase().includes(assignedRoleFilter.toLowerCase()))
    );
  const availableRoles = allRoles
    .filter(r => !assignedRoleIds.includes(r.id))
    .filter(r => 
        r.id.toLowerCase().includes(roleFilter.toLowerCase()) || 
        (r.description && r.description.toLowerCase().includes(roleFilter.toLowerCase()))
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header - Teal for Roles */}
        <div 
          className="flex items-center justify-between bg-teal-600 px-4 py-3 text-white cursor-move select-none"
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-5 w-5 opacity-70" />
            <Shield className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Assign Roles: {user.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-auto bg-gray-50">
          {loading ? (
             <div className="flex justify-center items-center h-40">Loading roles...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              
              {/* Available Roles */}
              <div className="bg-white border rounded-lg shadow-sm flex flex-col">
                <div className="p-3 border-b bg-gray-100 font-semibold text-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span>Available Roles</span>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{availableRoles.length}</span>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <input 
                        type="text" 
                        placeholder="Filter roles..." 
                        className="w-full text-sm border rounded px-2 py-1 pr-7 focus:outline-none focus:border-teal-500"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        />
                        {roleFilter && (
                            <button 
                                onClick={() => setRoleFilter("")}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleAddAll}
                        disabled={availableRoles.length === 0}
                        className="p-1 rounded bg-teal-100 text-teal-700 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add All Filtered"
                    >
                        <CheckCheck className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-auto flex-1 p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableRoles.length === 0 ? (
                        <tr>
                           <td colSpan={2} className="px-4 py-4 text-center text-sm text-gray-500">No available roles</td>
                        </tr>
                      ) : (
                        availableRoles.map(role => (
                          <tr key={role.id} className="hover:bg-teal-50 transition-colors">
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                {role.id}
                                {role.description && <div className="text-xs text-gray-500 font-normal">{role.description}</div>}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              <button
                                onClick={() => handleAssignRole(role.id)}
                                className="text-teal-600 hover:text-teal-800 p-1 rounded hover:bg-teal-100 transition-colors"
                                title="Assign Role"
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assigned Roles */}
              <div className="bg-white border rounded-lg shadow-sm flex flex-col">
                <div className="p-3 border-b bg-gray-100 font-semibold text-gray-700 flex flex-col gap-2">
                   <div className="flex justify-between items-center">
                    <span>Assigned Roles</span>
                    <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-xs">{assignedRoles.length}</span>
                   </div>
                   <div className="relative flex items-center gap-2">
                     <div className="relative flex-1">
                        <input 
                        type="text" 
                        placeholder="Filter assigned..." 
                        className="w-full text-sm border rounded px-2 py-1 pr-7 focus:outline-none focus:border-teal-500"
                        value={assignedRoleFilter}
                        onChange={(e) => setAssignedRoleFilter(e.target.value)}
                        />
                        {assignedRoleFilter && (
                            <button 
                                onClick={() => setAssignedRoleFilter("")}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                     </div>
                     <button
                        onClick={handleRemoveAll}
                        disabled={assignedRoles.length === 0}
                        className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove All Filtered"
                    >
                        <Trash className="h-4 w-4" />
                    </button>
                   </div>
                </div>
                <div className="overflow-auto flex-1 p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {assignedRoles.length === 0 ? (
                        <tr>
                           <td colSpan={2} className="px-4 py-4 text-center text-sm text-gray-500">No assigned roles</td>
                        </tr>
                      ) : (
                        assignedRoles.map(role => (
                          <tr key={role.id} className="hover:bg-red-50 transition-colors">
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                {role.id}
                                {role.description && <div className="text-xs text-gray-500 font-normal">{role.description}</div>}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              <button
                                onClick={() => handleRemoveRole(role.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                                title="Remove Role"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-100 border-t flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}
