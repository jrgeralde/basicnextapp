"use server";

import { query } from "@/lib/db";

export async function getUserRoles(userId: string): Promise<string[]> {
  const { rows } = await query<{ roleId: string }>(
    'SELECT "roleId" FROM public.usersroles WHERE "userId" = $1',
    [userId]
  );
  return rows.map((row) => row.roleId);
}
