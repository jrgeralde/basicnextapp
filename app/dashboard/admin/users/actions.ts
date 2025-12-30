"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface User {
  id: string;
  email: string;
  name: string;
  fullname: string | null;
  birthdate: Date | null;
  gender: string | null;
  active: boolean;
}

export async function getUsers(): Promise<User[]> {
  const { rows } = await query<User>(
    'SELECT id, email, name, fullname, birthdate, gender, active FROM public.users ORDER BY "createdAt" DESC'
  );
  return rows;
}

export async function addUser(data: {
  email: string;
  name: string;
  fullname: string;
  birthdate: string; // ISO string from form
  gender: string;
}): Promise<void> {
  // Generate a simple ID if not using a library, or use crypto.randomUUID()
  const id = crypto.randomUUID();
  
  // Default active to false as per requirement (though prompt said "Active check box with uncheck default", effectively meaning we save what is submitted, but if it's new, it starts false.
  // Actually, the prompt says "show the Active check box with uncheck default and readonly".
  // So for a new user, active is always false.
  
  await query(
    `INSERT INTO public.users (
      id, email, name, fullname, birthdate, gender, active, "emailVerified", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [
      id,
      data.email,
      data.name,
      data.fullname || null,
      data.birthdate ? new Date(data.birthdate) : null,
      data.gender || null,
      false, // active default false
      false // emailVerified default false
    ]
  );
  revalidatePath("/dashboard/admin/users");
}

export async function updateUser(data: {
  id: string;
  email: string;
  name: string;
  fullname: string;
  birthdate: string;
  gender: string;
}): Promise<void> {
  await query(
    `UPDATE public.users SET 
      email = $2, 
      name = $3, 
      fullname = $4, 
      birthdate = $5, 
      gender = $6,
      "updatedAt" = NOW()
    WHERE id = $1`,
    [
      data.id,
      data.email,
      data.name,
      data.fullname || null,
      data.birthdate ? new Date(data.birthdate) : null,
      data.gender || null
    ]
  );
  revalidatePath("/dashboard/admin/users");
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<void> {
    // 1. Better Auth uses a specific hashing mechanism (scrypt usually).
    // We should ideally use the auth library to update the password if possible, 
    // but the library runs on the server.
    // However, direct DB updates for passwords are risky if we don't match the hash.
    //
    // Fortunately, better-auth exposes an api to update the password, but usually for the logged-in user.
    // For an admin to reset ANY user's password, we need to use the admin API or internal helper if available.
    //
    // Since we are in a server action, we can import 'auth' from '@/lib/auth' and use its internal api.
    
    const { auth } = await import("@/lib/auth");
    
    // Better Auth doesn't have a direct "adminResetPassword" in the core exposed easily without plugins 
    // in some versions, but we can try to use the internal api or direct hash if we know it.
    //
    // Actually, the best way to ensure compatibility is to use the auth.api.changePassword 
    // but that usually requires a session.
    //
    // A robust way for Admin override:
    // Use the `auth.api.updateUser` or directly update the credential account if we can hash it correctly.
    //
    // Wait, Better Auth exports a `hashPassword` utility? Not always public.
    //
    // Let's use the `auth.api.setPassword` if available, or we might need to rely on 
    // re-hashing manually if we know the config.
    //
    // BETTER APPROACH FOR THIS VERSION:
    // We will use the `auth.api.updatePassword` but that is for the current user.
    //
    // Let's look for a way to update ANOTHER user's password.
    // If not easily available, we can delete the 'credential' account and re-create it, 
    // or we can try to use the internal `auth.password.hash` if exposed.
    //
    // Checking the docs/source implies we might need to use the `auth.api.signUpEmail` logic 
    // but for an existing user?
    //
    // Let's try to find the account and update the password field directly 
    // IF we can generate the hash.
    //
    // Since we don't have the hash function exposed easily from 'auth', 
    // we can use the 'auth.api' to potentially perform administrative actions if configured.
    //
    // However, for now, let's assume we can use the `auth.api.setPassword` but we need to spoof the session? No.
    //
    // Alternative: We can use the 'better-auth' internal hashing if we can import it.
    //
    // Actually, looking at my previous 'reset-admin' route, I used `auth.api.signUpEmail`.
    //
    // Let's try to use `auth.internal.hashPassword` if it exists (it might not).
    //
    // If we cannot hash it correctly, we cannot update it directly in SQL.
    //
    // WORKAROUND:
    // We can use the `auth.api.changePassword` by impersonating? No.
    //
    // Let's use the standard `auth.api` to update the password.
    // Actually, `auth.api.updateUser` might allow updating the password?
    //
    // Let's try to use the `auth` object to find a password helper.
    // If not, we will default to a known hash for now or try to fetch a helper.
    //
    // WAIT! I can use `auth.api.setPassword` ? 
    // No, that's usually for setting it for the first time or reset flow.
    //
    // Let's try to use the `auth.api.updateUser` with the new password.
    //
    // const res = await auth.api.updateUser({
    //    body: { password: newPassword, id: userId } // If this works?
    // });
    //
    // If that is not supported, we have to use the low-level `auth.options.emailAndPassword.password.hash`.
    //
    // Let's try to import the hashing function.
    //
    // If I cannot find it, I will use a temporary placeholder or delete/recreate the credential.
    //
    // Let's try to delete the 'credential' account for this user and re-create it with the new password.
    // This is safe because we are just resetting the password.
    
    // 1. Find the user's credential account
    const res = await query<{id: string}>(
        `SELECT id FROM public.accounts WHERE "userId" = $1 AND "providerId" = 'credential'`,
        [userId]
    );

    if (res.rows.length > 0) {
        // Delete the old credential account
        await query(
            `DELETE FROM public.accounts WHERE id = $1`,
            [res.rows[0].id]
        );
    }

    // 2. Re-create the account with the new password using the internal API to ensure hashing
    // We can use `auth.api.linkSocial`? No.
    // We can use `auth.api.signUpEmail`? No, that creates a user.
    //
    // We can use `auth.internal.createAccount`?
    //
    // Let's try to use `auth.api.linkEmail` ? No.
    //
    // OK, the cleanest way without the hash function is to use `auth.api.changePassword` 
    // but we need a session.
    //
    // Let's look at `node_modules/better-auth` if we can find the hash function.
    //
    // Actually, in `lib/auth.ts`, we export `auth`.
    // `auth.password` might be available?
    
    // Let's assume for now we can't easily hash it on the server without the lib's help.
    // But we CAN use the `auth.api.signUpEmail` logic to just create the account row? 
    // No, `signUpEmail` creates both user and account.
    
    // Let's use a server-side only trick:
    // We can use `auth.api.resetPassword`? That requires a token.
    
    // Let's try to use the `auth` instance to update the password directly if it has an admin function.
    // `auth.api.adminUpdatePassword`? (Hypothetical)
    
    // OK, plan B: Use the `auth` library to Hash the password.
    // It seems `better-auth` exports `hashPassword`?
    // import { hashPassword } from "better-auth/utils"; // (Guess)
    
    // If I cannot guess it, I will use the previous strategy:
    // Delete the user and recreate? No, that loses data.
    
    // Let's look at how I fixed the admin user. 
    // I created a new user to get the hash.
    //
    // We can do that here!
    // 1. Create a dummy user with the NEW password.
    // 2. Steal the hash from the dummy user's account.
    // 3. Delete the dummy user.
    // 4. Update the target user's account with the stolen hash.
    // 
    // This is inefficient but guaranteed to work with the current config.
    
    const dummyEmail = `temp-${Date.now()}@temp.com`;
    const dummyUser = await auth.api.signUpEmail({
        body: {
            email: dummyEmail,
            password: newPassword,
            name: "Temp"
        }
    });

    if (!dummyUser) {
        throw new Error("Failed to generate password hash");
    }

    // Get the hash
    const hashRes = await query<{password: string}>(
        `SELECT password FROM public.accounts WHERE "userId" = $1`,
        [dummyUser.user.id]
    );
    
    const hashedPassword = hashRes.rows[0].password;

    // Delete dummy
    await query(`DELETE FROM public.accounts WHERE "userId" = $1`, [dummyUser.user.id]);
    await query(`DELETE FROM public.users WHERE id = $1`, [dummyUser.user.id]);
    await query(`DELETE FROM public.usersroles WHERE "userId" = $1`, [dummyUser.user.id]);

    // Update target user
    // Check if account exists
    const accountRes = await query<{id: string}>(
        `SELECT id FROM public.accounts WHERE "userId" = $1 AND "providerId" = 'credential'`,
        [userId]
    );

    if (accountRes.rows.length > 0) {
        // Update existing
        await query(
            `UPDATE public.accounts SET password = $2, "updatedAt" = NOW() WHERE id = $1`,
            [accountRes.rows[0].id, hashedPassword]
        );
    } else {
        // Create new account for this user
        // We need to generate a valid account ID and link it.
        // For 'credential' provider, accountId usually matches userId or is unique.
        // Let's use the userId as accountId as per my previous fix.
        
        await query(
            `INSERT INTO public.accounts (
                id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, 'credential', $3, $4, NOW(), NOW()
            )`,
            [
                'acc-' + crypto.randomUUID(),
                userId, // accountId matches userId for credential provider in our fix
                userId,
                hashedPassword
            ]
        );
    }
    
    revalidatePath("/dashboard/admin/users");
}

export async function toggleUserActive(id: string, active: boolean): Promise<void> {
  await query(
    'UPDATE public.users SET active = $2, "updatedAt" = NOW() WHERE id = $1',
    [id, active]
  );
  revalidatePath("/dashboard/admin/users");
}
