// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"; // <--- This sub-path is built into 'better-auth'

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    fetchOptions: {
        auth: {
            type: "Bearer",
            token: () => {
                if (typeof window !== "undefined") {
                    return sessionStorage.getItem("better-auth-token") || undefined;
                }
                return undefined;
            }
        },
        plugins: [
            {
                id: "auth-token-storage",
                name: "auth-token-storage",
                hooks: {
                    onResponse: async (context) => {
                         const token = context.response.headers.get("set-auth-token");
                         if (token) {
                             sessionStorage.setItem("better-auth-token", token);
                         }
                    }
                }
            }
        ]
    }
});

export const { useSession, signIn, signUp, signOut } = authClient;