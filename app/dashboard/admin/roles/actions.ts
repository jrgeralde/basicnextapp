"use server";

import { query } from "@/lib/db";

export interface Role {
  id: string;
  description: string;
}

export async function getRoles(): Promise<Role[]> {
  const { rows } = await query<Role>('SELECT id, description FROM public.roles ORDER BY id ASC');
  return rows;
}

export async function addRole(id: string, description: string): Promise<void> {
  await query('INSERT INTO public.roles (id, description) VALUES ($1, $2)', [id, description]);
}

export async function deleteRole(id: string): Promise<void> {
  await query('DELETE FROM public.roles WHERE id = $1', [id]);
}

export async function updateRole(id: string, description: string): Promise<void> {
  await query('UPDATE public.roles SET description = $2 WHERE id = $1', [id, description]);
}
