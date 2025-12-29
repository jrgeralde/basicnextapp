// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"; // <--- This sub-path is built into 'better-auth'

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
});

export const { useSession, signIn, signUp, signOut } = authClient;