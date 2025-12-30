"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  fullname: string | null;
  birthdate: Date | null;
  gender: string | null;
  active: boolean;
}

export interface Role {
  id: string; // Role Name
  description: string | null;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
}

// Helper to check permissions
async function checkPermission(requiredRoles: string[] = []) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  
  // If no specific roles required, just being authenticated is enough? 
  // For Admin actions, we usually want at least some role.
  if (requiredRoles.length === 0) return session.user;

  const { rows } = await query<{roleId: string}>(
    'SELECT "roleId" FROM public.usersroles WHERE "userId" = $1',
    [session.user.id]
  );
  const userRoles = rows.map(r => r.roleId);
  
  const hasPermission = requiredRoles.some(r => userRoles.includes(r));
  if (!hasPermission) throw new Error("Forbidden");
  
  return session.user;
}

export async function getAllRoles(): Promise<Role[]> {
  await checkPermission(['ADMINISTRATOR']);
  const { rows } = await query<Role>(
    'SELECT id, description FROM public.roles ORDER BY id ASC'
  );
  return rows;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  // Allow if self
  if (session.user.id !== userId) {
      // If not self, check for Admin privileges
      const { rows } = await query<{roleId: string}>(
        'SELECT "roleId" FROM public.usersroles WHERE "userId" = $1',
        [session.user.id]
      );
      const userRoles = rows.map(r => r.roleId);
      
      // We require ADMINISTRATOR to view others' roles for now
      if (!userRoles.includes('ADMINISTRATOR')) {
           throw new Error("Forbidden");
      }
  }

  const { rows } = await query<{roleId: string}>(
    'SELECT "roleId" FROM public.usersroles WHERE "userId" = $1',
    [userId]
  );
  return rows.map(r => r.roleId);
}

export async function assignRole(userId: string, roleId: string): Promise<void> {
  await checkPermission(['ADMINISTRATOR', 'USERS_CANASSIGNUSERSROLES']);
  
  // Check if already assigned
  const existing = await query(
    'SELECT id FROM public.usersroles WHERE "userId" = $1 AND "roleId" = $2',
    [userId, roleId]
  );
  
  if (existing.rows.length > 0) return;

  const id = crypto.randomUUID();
  await query(
    'INSERT INTO public.usersroles (id, "userId", "roleId") VALUES ($1, $2, $3)',
    [id, userId, roleId]
  );
  revalidatePath("/dashboard/admin/users");
}

export async function removeRole(userId: string, roleId: string): Promise<void> {
  await checkPermission(['ADMINISTRATOR', 'USERS_CANASSIGNUSERSROLES']);

  await query(
    'DELETE FROM public.usersroles WHERE "userId" = $1 AND "roleId" = $2',
    [userId, roleId]
  );
  revalidatePath("/dashboard/admin/users");
}

export async function getUsers(): Promise<User[]> {
  await checkPermission(['ADMINISTRATOR']);
  const { rows } = await query<User>(
    'SELECT id, email, name, fullname, birthdate, gender, active FROM public.users ORDER BY "createdAt" DESC'
  );
  return rows;
}

export async function addUser(data: {
  email: string;
  name: string;
  fullname: string;
  birthdate: string;
  gender: string;
}): Promise<void> {
  await checkPermission(['ADMINISTRATOR', 'USERS_CANEDITUSERS']);

  const id = crypto.randomUUID();
  
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
      false, 
      false 
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
  await checkPermission(['ADMINISTRATOR', 'USERS_CANEDITUSERS']);

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
    await checkPermission(['ADMINISTRATOR', 'USERS_CANEDITUSERS']);

    const cookieStore = await cookies();
    const originalToken = cookieStore.get("better-auth.session_token")?.value;

    const dummyEmail = `temp-${Date.now()}@temp.com`;
    const dummyUser = await auth.api.signUpEmail({
        body: {
            email: dummyEmail,
            password: newPassword,
            name: "Temp"
        }
    });

    if (originalToken) {
        cookieStore.set("better-auth.session_token", originalToken);
    } else {
        cookieStore.delete("better-auth.session_token");
    }

    if (!dummyUser) {
        throw new Error("Failed to generate password hash");
    }

    const hashRes = await query<{password: string}>(
        `SELECT password FROM public.accounts WHERE "userId" = $1`,
        [dummyUser.user.id]
    );
    
    const hashedPassword = hashRes.rows[0].password;

    await query(`DELETE FROM public.accounts WHERE "userId" = $1`, [dummyUser.user.id]);
    await query(`DELETE FROM public.users WHERE id = $1`, [dummyUser.user.id]);
    await query(`DELETE FROM public.usersroles WHERE "userId" = $1`, [dummyUser.user.id]);

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
    
    revalidatePath("/dashboard/admin/users");
}

export async function toggleUserActive(id: string, active: boolean): Promise<void> {
  await checkPermission(['ADMINISTRATOR', 'USERS_CANACTIVATEUSERS']);

  await query(
    'UPDATE public.users SET active = $2, "updatedAt" = NOW() WHERE id = $1',
    [id, active]
  );
  revalidatePath("/dashboard/admin/users");
}
