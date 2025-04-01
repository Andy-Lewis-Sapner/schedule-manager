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

  return (
    <nav className="bg-blue-500 text-white p-4 flex justify-center gap-8 shadow-md">
      {session && (
        <Link href="/" className="hover:underline text-lg">
          מתזמן
        </Link>
      )}
      <Link href="/schedules" className="hover:underline text-lg">
        לוחות זמנים
      </Link>
      {session && (
        <Link href="/management" className="hover:underline text-lg">
          ניהול
        </Link>
      )}
      {session && (
        <button onClick={handleSignOut} className="hover:underline text-lg">
          התנתק
        </button>
      )}
    </nav>
  );
}
