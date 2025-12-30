"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { showMessage } from '@/components/MessageModal';
import { getUsers, addUser, updateUser, toggleUserActive, changeUserPassword, User } from "./actions";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import ChangeUserPasswordModal from "./ChangeUserPasswordModal";
import ActDeactUserModal from "./ActDeactUserModal";
import PageGuardWrapper from "@/components/PageGuardWrapper";
import ModalGuardWrapper from "@/components/ModalGuardWrapper";

export default function Page() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToToggle, setUserToToggle] = useState<User | null>(null);
    const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);

    const fetchUsers = useCallback(() => {
        getUsers()
            .then(setUsers)
            .catch(console.error)
            .finally(() => setLoadingUsers(false));
    }, []);

    useEffect(() => {
        if (!isPending && !session) {
             router.push("/");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (session) {
            fetchUsers();
        }
    }, [session, fetchUsers]);

    const handleAddUser = async (data: {
        email: string;
        name: string;
        fullname: string;
        birthdate: string;
        gender: string;
    }) => {
        try {
            await addUser(data);
            await showMessage("User added successfully!");
            fetchUsers();
        } catch (error) {
            console.error(error);
            await showMessage("Failed to add user.");
        }
    };

    const handleEditUser = async (data: {
        id: string;
        email: string;
        name: string;
        fullname: string;
        birthdate: string;
        gender: string;
    }) => {
        try {
            await updateUser(data);
            await showMessage("User updated successfully!");
            fetchUsers();
        } catch (error) {
            console.error(error);
            await showMessage("Failed to update user.");
        }
    };

    const handleToggleUser = async (id: string, active: boolean) => {
        try {
            await toggleUserActive(id, active);
          //  await showMessage(`User ${active ? "activated" : "deactivated"} successfully!`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            await showMessage("Failed to update user status.");
        }
    };

    const handleChangePassword = async (id: string, password: string) => {
        try {
            await changeUserPassword(id, password);
            await showMessage("Password changed successfully!");
        } catch (error) {
            console.error(error);
            await showMessage("Failed to change password.");
        }
    };

    if (isPending || !session) {
        return <div className="p-6">Loading...</div>; 
    }

    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.fullname && user.fullname.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <PageGuardWrapper requiredRoles={["ADMINISTRATOR", "USERS_CANACCESSUSERS"]}>
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-x-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">
          User Management
        </h1>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users..."
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

        <ModalGuardWrapper requiredRoles={["ADMINISTRATOR", "USERS_CANADDUSERS"]}>
            <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
            >
            + Add User
            </button>
        </ModalGuardWrapper>
      </div>

      <ModalGuardWrapper requiredRoles={["ADMINISTRATOR", "USERS_CANADDUSERS"]}>
        <AddUserModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={handleAddUser} 
        />
      </ModalGuardWrapper>

      <ModalGuardWrapper requiredRoles={["ADMINISTRATOR", "USERS_CANEDITUSERS"]}>
        <EditUserModal
          isOpen={!!userToEdit}
          onClose={() => setUserToEdit(null)}
          onEdit={handleEditUser}
          user={userToEdit}
        />
      </ModalGuardWrapper>

      <ModalGuardWrapper requiredRoles={["ADMINISTRATOR", "USERS_ACTIVATEUSERS"]}>
        <ActDeactUserModal
          isOpen={!!userToToggle}
          onClose={() => setUserToToggle(null)}
          onToggle={handleToggleUser}
          user={userToToggle}
        />
      </ModalGuardWrapper>

      <ChangeUserPasswordModal
        isOpen={!!userToChangePassword}
        onClose={() => setUserToChangePassword(null)}
        onChangePassword={handleChangePassword}
        user={userToChangePassword}
      />

      {/* Table */}
      <>
        <div className="max-h-[calc(100vh-260px)] overflow-auto rounded border bg-white shadow relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200 sticky top-0 z-20">
              <tr>
                {/* Frozen Columns */}
                <th className="sticky left-0 z-20 bg-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-16">
                  Row #
                </th>
                <th className="sticky left-16 z-20 bg-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[220px]">
                  Email
                </th>
                {/* Scrollable Columns */}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Active
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Full Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Birthdate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Gender
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Status Action
                </th>
                <th className="sticky right-0 z-20 bg-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="group even:bg-gray-50/80 hover:bg-blue-50/50 transition-colors">
                  {/* Frozen Columns */}
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-blue-50/50 w-16">
                    {index + 1}
                  </td>
                  <td className="sticky left-16 z-10 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-blue-50/50 min-w-[220px]">
                    {user.email}
                  </td>
                  {/* Scrollable Columns */}
                  <td className="px-4 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={user.active}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">{user.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{user.fullname || "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {user.birthdate ? new Date(user.birthdate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">{user.gender || "-"}</td>
                  <td className="px-4 py-2 text-sm">
                    <ModalGuardWrapper requiredRoles={['ADMINISTRATOR', 'USERS_ACTIVATEUSERS']}>
                        <button 
                            onClick={() => setUserToToggle(user)}
                            className={`px-3 py-1 rounded-md border font-semibold transition-colors ${
                                user.active 
                                    ? 'border-red-600 text-red-600 hover:bg-red-50' 
                                    : 'border-green-600 text-green-600 hover:bg-green-50'
                            }`}
                        >
                            {user.active ? "Deactivate" : "Activate"}
                        </button>
                    </ModalGuardWrapper>
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-6 py-2 text-sm space-x-2 whitespace-nowrap shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                     <ModalGuardWrapper requiredRoles={['ADMINISTRATOR', 'USERS_CANEDITUSERS']}>
                        <button 
                            onClick={() => setUserToEdit(user)}
                            className="px-3 py-1 rounded-md border border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold transition-colors"
                        >
                            Edit
                        </button>
                    </ModalGuardWrapper>

                    <ModalGuardWrapper requiredRoles={['ADMINISTRATOR', 'USERS_CANEDITUSERS']}>
                        <button 
                            onClick={() => setUserToChangePassword(user)}
                            className="px-3 py-1 rounded-md border border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold transition-colors"
                            title="Change Password"
                        >
                            Password
                        </button>
                    </ModalGuardWrapper>
                  </td>
                </tr>
              ))}
              {!loadingUsers && filteredUsers.length === 0 && (
                  <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-gray-500">No users found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-sm text-gray-700">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </>
    </div>
    </PageGuardWrapper>
  );
}
