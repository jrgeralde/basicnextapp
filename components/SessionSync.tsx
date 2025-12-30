"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, RefreshCw, ShieldAlert } from "lucide-react";

export default function SessionSync() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const initialUserId = useRef<string | null | undefined>(undefined);
  const [isSessionMismatch, setIsSessionMismatch] = useState(false);
  const [newUserName, setNewUserName] = useState<string>("");

  useEffect(() => {
    // Once the initial session is loaded, store the ID
    if (!isPending) {
        if (initialUserId.current === undefined) {
            initialUserId.current = session?.user?.id || null;
        } else {
            // If we already had a user ID stored, and the new session is different
            const currentId = session?.user?.id || null;
            
            // Only trigger if we have a valid NEW user ID that is different from the old one.
            if (currentId && initialUserId.current && currentId !== initialUserId.current) {
                // Session changed!
                if (!isSessionMismatch) {
                    // Use setTimeout to avoid synchronous state update in effect
                    const userName = session?.user?.name || "another user";
                    setTimeout(() => {
                        setNewUserName(userName);
                        setIsSessionMismatch(true);
                    }, 0);
                }
            }
        }
    }
  }, [session, isPending, router, isSessionMismatch]);

  if (!isSessionMismatch) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 text-center border-2 border-red-100">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Changed</h2>
        
        <p className="text-gray-600 mb-6">
          You have logged in as <span className="font-semibold text-gray-900">{newUserName}</span> in another tab.
          <br/><br/>
          To prevent accidental changes to the wrong account, this tab has been paused.
        </p>

        <div className="flex flex-col gap-3">
            <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
                <RefreshCw size={18} />
                Switch to {newUserName}
            </button>
            
            <button 
                onClick={async () => {
                    await signOut();
                    router.push("/");
                }}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
                <LogOut size={18} />
                Logout
            </button>
        </div>
      </div>
    </div>
  );
}
