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

export async function toggleUserActive(id: string, active: boolean): Promise<void> {
  await query(
    'UPDATE public.users SET active = $2, "updatedAt" = NOW() WHERE id = $1',
    [id, active]
  );
  revalidatePath("/dashboard/admin/users");
}
