"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { House, UserCog, ChevronDown, ShieldCheck, LucideIcon, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import ConfirmModal from "@/components/ConfirmModal";
import { showMessage } from "@/components/MessageModal";
import SessionTimeoutWrapper from "@/components/SessionTimeoutWrapper";
import EditUserModal from "./admin/users/EditUserModal";
import ChangeUserPasswordModal from "./admin/users/ChangeUserPasswordModal";
import { getMyProfile, updateMyProfile, changeMyPassword, UserProfile } from "./actions";

// --- Reusable Dropdown Component ---
interface NavItem {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  className?: string;
}

function NavDropdown({ label, Icon, items, isOpen, onToggle }: {
  label: string;
  Icon: LucideIcon;
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-lg font-bold px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition-colors"
      >
        <Icon size={20} /> {label}
        <ChevronDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <ul className="absolute right-0 mt-2 w-52 bg-white border rounded shadow-lg z-50 text-gray-800 py-1 overflow-hidden">
          {items.map((item, index) => (
            <li key={item.label} className={index === items.length - 1 && items.length > 2 ? "border-t border-gray-100" : ""}>
              <button
                onClick={item.onClick}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2 ${item.className || ""}`}
              >
                {item.icon && <item.icon size={16} />}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Main Layout ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const toggleMenu = (name: string) => setOpenMenu(openMenu === name ? null : name);
  
  const openEditProfile = async () => {
    setOpenMenu(null);
    try {
      const profile = await getMyProfile();
      if (profile) {
        setCurrentUserProfile(profile);
        setIsEditProfileOpen(true);
      } else {
        alert("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      alert("Error fetching profile");
    }
  };

  const openChangePassword = async () => {
    setOpenMenu(null);
    try {
      const profile = await getMyProfile();
      if (profile) {
        setCurrentUserProfile(profile);
        setIsChangePasswordOpen(true);
      } else {
        alert("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      alert("Error fetching profile");
    }
  };

  const handleEditProfileSubmit = async (data: {
    id: string;
    email: string;
    name: string;
    fullname: string;
    birthdate: string;
    gender: string;
  }) => {
    try {
      await updateMyProfile(data);
      setIsEditProfileOpen(false);
      router.refresh();
      await showMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      await showMessage("Failed to update profile");
    }
  };

  const handleChangePasswordSubmit = async (userId: string, newPassword: string) => {
    try {
        await changeMyPassword(userId, newPassword);
        setIsChangePasswordOpen(false);
        // Optional: Sign out the user or show success message?
        // For now, just close modal.
        await showMessage("Password changed successfully.");
    } catch (error) {
        console.error("Error changing password:", error);
        await showMessage("Failed to change password");
    }
  };

  const handleAction = (action: string) => {
    setOpenMenu(null);
    if (action === "Role Management") {
      router.push("/dashboard/admin/roles");
      return;
    }
    if (action === "User Management") {
      router.push("/dashboard/admin/users");
      return;
    }
    alert(`Clicked: ${action}`);
  };

  const handleLogout = async () => {
    setOpenMenu(null);
    const confirmed = await ConfirmModal("Are you sure you want to logout?", {
      okText: "Yes, Logout",
      cancelText: "Cancel",
      okColor: "bg-red-600 hover:bg-red-700",
    });

    if (confirmed) {
      await signOut();
      router.push("/");
    }
  };

  const profileItems: NavItem[] = [
    { label: "Edit My Profile", onClick: openEditProfile },
    { label: "Change Password", onClick: openChangePassword },
  ];

  const adminItems = [
    { label: "User Management", onClick: () => handleAction("User Management") },
    // CHANGED: Removed router.push and replaced with handleAction to show the alert
    { label: "Role Management", onClick: () => handleAction("Role Management") },
  ];

  const handleTimeoutLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <SessionTimeoutWrapper
      timeoutMinutes={20}
      countdownSeconds={60}
      onLogout={handleTimeoutLogout}
    >
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-blue-600 shadow px-6 py-2 flex items-center justify-between text-white">
          <button
            onClick={() => { router.push("/dashboard"); setOpenMenu(null); }}
            className="flex items-center gap-2 text-lg font-bold px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition-colors"
          >
            <House size={20} /> Home
          </button>

          <div className="flex items-center gap-6">
            <NavDropdown 
              label="My Profile" Icon={UserCog} items={profileItems} 
              isOpen={openMenu === "profile"} onToggle={() => toggleMenu("profile")} 
            />
            <NavDropdown 
              label="Admin" Icon={ShieldCheck} items={adminItems} 
              isOpen={openMenu === "admin"} onToggle={() => toggleMenu("admin")} 
            />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-lg font-bold px-4 py-2 rounded hover:bg-red-600 hover:text-white text-red-100 transition-colors ml-2 border border-transparent hover:border-red-400"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>

        <footer className="bg-blue-600 text-white p-3 flex justify-between text-sm border-t border-blue-500">
          <span className="font-semibold">
            {(() => {
              const rawName = session?.user?.name || session?.user?.email || "";
              // Remove " user" from the end (case insensitive)
              const cleanName = rawName.replace(/ user$/i, "");
              return `User: ${cleanName}`;
            })()}
          </span>
          <span>© {new Date().getFullYear()} My Dashboard App</span>
        </footer>

        {/* Edit Profile Modal */}
        <EditUserModal 
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onEdit={handleEditProfileSubmit}
          user={currentUserProfile}
          title="Edit My Profile"
        />

        {/* Change Password Modal */}
        <ChangeUserPasswordModal 
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          onChangePassword={handleChangePasswordSubmit}
          user={currentUserProfile}
          title="Change My Password"
        />
      </div>
    </SessionTimeoutWrapper>
  );
}
