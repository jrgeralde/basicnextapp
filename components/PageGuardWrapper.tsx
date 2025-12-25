"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getUserRoles } from "./actions";
import { showMessage } from "@/components/MessageModal";

interface PageGuardWrapperProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function PageGuardWrapper({ children, requiredRoles = [] }: PageGuardWrapperProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const requiredRolesKey = JSON.stringify(requiredRoles);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push("/");
      return;
    }

    const checkAuthorization = async () => {
      try {
        const roles = await getUserRoles(session.user.id);
        
        // If no roles are required, allow access
        if (requiredRoles.length === 0) {
          setIsAuthorized(true);
          return;
        }

        // Check if user has ANY required role
        const hasAnyRole = requiredRoles.some(role => roles.includes(role));

        if (hasAnyRole) {
          setIsAuthorized(true);
        } else {
          await showMessage("You do not have permission to access this page:"+session.user.id);
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to check authorization:", error);
        await showMessage("An error occurred while checking permissions.");
        router.push("/dashboard");
      } finally {
        setChecking(false);
      }
    };

    checkAuthorization();
  }, [session, isPending, router, requiredRolesKey, requiredRoles]);

  if (isPending || checking) {
    return <div className="p-6">Checking permissions...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
