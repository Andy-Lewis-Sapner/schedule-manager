"use client";
import Link from "next/link";
import { useSupabase } from "../context/SupabaseContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleLogin = async () => {
    router.push("/login");
  };

  return (
    <nav className="bg-blue-500 text-white p-4 flex justify-center gap-8 shadow-md">
      {session && (
        <div className="flex gap-4">
          <Link href="/" className="hover:underline text-lg">
            מתזמן
          </Link>
          <Link href="/schedules" className="hover:underline text-lg">
            לוחות זמנים
          </Link>

          <Link href="/management" className="hover:underline text-lg">
            ניהול
          </Link>
          <button
            onClick={handleSignOut}
            className="hover:underline cursor-pointer text-lg"
          >
            התנתק
          </button>
        </div>
      )}

      {!session && (
        <div className="flex gap-4">
          <Link href="/view-schedule" className="hover:underline text-lg">
            צפה בלוחות זמנים
          </Link>
          <button
            onClick={handleLogin}
            className="hover:underline cursor-pointer text-lg"
          >
            התחבר
          </button>
        </div>
      )}
    </nav>
  );
}
