"use client";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-blue-500 text-white p-4 flex justify-center gap-8 shadow-md">
      <Link href="/" className="hover:underline text-lg">
        מתזמן
      </Link>
      <Link href="/schedules" className="hover:underline text-lg">
        לוחות זמנים
      </Link>
      <Link href="/management" className="hover:underline text-lg">
        ניהול
      </Link>
    </nav>
  );
}
