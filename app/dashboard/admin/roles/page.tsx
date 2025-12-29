"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { showMessage } from '@/components/MessageModal';
import { getRoles, addRole, deleteRole, updateRole, Role } from "./actions";
import AddRoleModal from "./AddRoleModal";
import DeleteRoleModal from "./DeleteRoleModal";
import EditRoleModal from "./EditRoleModal";
import PageGuardWrapper from "@/components/PageGuardWrapper";
import ModalGuardWrapper from "@/components/ModalGuardWrapper";

export default function Page() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

    useEffect(() => {
        if (!isPending && !session) {
             router.push("/");
        }
    }, [session, isPending, router]);

    const fetchRoles = useCallback(() => {
        getRoles()
            .then(setRoles)
            .catch(console.error)
            .finally(() => setLoadingRoles(false));
    }, []);

    useEffect(() => {
        if (session) {
            fetchRoles();
        }
    }, [session, fetchRoles]);

    const handleAddRole = async (id: string, description: string) => {
        try {
            await addRole(id, description);
            await showMessage("Role added successfully!");
            fetchRoles();
        } catch (error) {
            console.error(error);
            await showMessage("Failed to add role.");
        }
    };

    const handleDeleteRole = async (id: string) => {
        try {
            await deleteRole(id);
            await showMessage("Role deleted successfully!");
            fetchRoles();
        } catch (error) {
            console.error(error);
            await showMessage("Failed to delete role.");
        }
    };

    const handleEditRole = async (id: string, description: string) => {
        try {
            await updateRole(id, description);
            await showMessage("Role updated successfully!");
            fetchRoles();
        } catch (error) {
            console.error(error);
            await showMessage("Failed to update role.");
        }
    };

    if (isPending || !session) {
        return <div className="p-6">Loading...</div>; 
    }

    const filteredRoles = roles.filter(role => 
        role.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <PageGuardWrapper requiredRoles={["ADMINISTRATOR", "ROLES_CANACCESSROLES"]}>
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-x-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">
          Role Management
        </h1>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search roles..."
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
            onClick={() => setSearchQuery("")}
          >
            Clear
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          + Add Role
        </button>
      </div>

      <ModalGuardWrapper requiredRoles={["ADMINISTRATOR", "ROLES_CANADDROLES"]}>
        <AddRoleModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={handleAddRole} 
        />
      </ModalGuardWrapper>

      <ModalGuardWrapper requiredRoles={["ADMINISTRATOR", "ROLES_CANDELETEROLES"]}>
        <DeleteRoleModal
          isOpen={!!roleToDelete}
          onClose={() => setRoleToDelete(null)}
          onDelete={handleDeleteRole}
          role={roleToDelete}
        />
      </ModalGuardWrapper>

      <ModalGuardWrapper requiredRoles={["ADMINISTRATOR", "ROLES_CANEDITROLES"]}>
        <EditRoleModal
          isOpen={!!roleToEdit}
          onClose={() => setRoleToEdit(null)}
          onEdit={handleEditRole}
          role={roleToEdit}
        />
      </ModalGuardWrapper>

      {/* Table */}
      <>
        <div className="max-h-[calc(100vh-260px)] overflow-auto rounded border bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Row #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.map((role, index) => (
                <tr key={role.id} className="even:bg-gray-50/80 hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-2 text-sm">{index + 1}</td>
                  <td className="px-4 py-2 text-sm">{role.id}</td>
                  <td className="px-4 py-2 text-sm">{role.description}</td>
                  <td className="px-6 py-2 text-sm space-x-4">
                    <button
                      onClick={() => setRoleToEdit(role)}
                      className="rounded bg-amber-500 px-3 py-1 text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setRoleToDelete(role)}
                      className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loadingRoles && filteredRoles.length === 0 && (
                  <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No roles found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-sm text-gray-700">
          Showing {filteredRoles.length} of {roles.length} roles
        </div>
      </>
    </div>
    </PageGuardWrapper>
  );
}
