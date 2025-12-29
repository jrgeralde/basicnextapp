import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/");
    }
  return (
    <div className="flex items-center justify-center max-h-screen bg-zinc-50 dark:bg-gray-900 max-w-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
        Welcome Home
      </h1>
    </div>
  );
}
