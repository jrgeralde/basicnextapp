"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getUserRoles } from "./actions";

interface ModalGuardWrapperProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ModalGuardWrapper({ children, requiredRoles = [] }: ModalGuardWrapperProps) {
  const { data: session, isPending } = useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const requiredRolesKey = JSON.stringify(requiredRoles);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      setChecking(false);
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
        }
      } catch (error) {
        console.error("Failed to check authorization for modal:", error);
      } finally {
        setChecking(false);
      }
    };

    checkAuthorization();
  }, [session, isPending, requiredRolesKey, requiredRoles]);

  if (isPending || checking || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
