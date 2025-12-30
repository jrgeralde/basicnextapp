"use server";

import { query } from "@/lib/db";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  fullname: string | null;
  birthdate: Date | null;
  gender: string | null;
  active: boolean;
}

export async function getMyProfile(expectedUserId?: string): Promise<UserProfile | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  // Security Check: Ensure the session matches the client's expectation
  // This prevents the "Admin Tab A" from loading "User Tab B" data if the session cookie changed
  if (expectedUserId && session.user.id !== expectedUserId) {
    throw new Error("SessionMismatch");
  }

  const { rows } = await query<UserProfile>(
    'SELECT id, email, name, fullname, birthdate, gender, active FROM public.users WHERE id = $1',
    [session.user.id]
  );

  return rows[0] || null;
}

export async function updateMyProfile(data: {
  id: string;
  email: string;
  name: string;
  fullname: string;
  birthdate: string;
  gender: string;
}): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.id !== data.id) {
    throw new Error("SessionMismatch");
  }

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
  
  revalidatePath("/dashboard");
}

export async function changeMyPassword(userId: string, newPassword: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.id !== userId) {
    throw new Error("SessionMismatch");
  }

  const cookieStore = await cookies();
  const originalToken = cookieStore.get("better-auth.session_token")?.value;

  // Generate hash using dummy user trick
  const dummyEmail = `temp-${Date.now()}@temp.com`;
  const dummyUser = await auth.api.signUpEmail({
      body: {
          email: dummyEmail,
          password: newPassword,
          name: "Temp"
      }
  });

  // Restore the original session to prevent the dummy user from logging in
  if (originalToken) {
    cookieStore.set("better-auth.session_token", originalToken);
  } else {
    cookieStore.delete("better-auth.session_token");
  }

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

  // Update target user account
  const accountRes = await query<{id: string}>(
      `SELECT id FROM public.accounts WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId]
  );

  if (accountRes.rows.length > 0) {
      await query(
          `UPDATE public.accounts SET password = $2, "updatedAt" = NOW() WHERE id = $1`,
          [accountRes.rows[0].id, hashedPassword]
      );
  } else {
      // Create new account if missing (should not happen for credential user, but safe fallback)
      await query(
          `INSERT INTO public.accounts (
              id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
          ) VALUES (
              $1, $2, 'credential', $3, $4, NOW(), NOW()
          )`,
          [
              'acc-' + crypto.randomUUID(),
              userId, 
              userId,
              hashedPassword
          ]
      );
  }
  
  revalidatePath("/dashboard");
}
