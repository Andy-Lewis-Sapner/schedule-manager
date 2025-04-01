"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../context/SupabaseContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { supabase } = useSupabase();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Invalid login credentials")
        setError("מייל לא קיים או סיסמה שגויה");
      else setError(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">התחברות</h1>
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">מייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
            placeholder="example@example.com"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
            placeholder="⦁⦁⦁⦁⦁⦁⦁⦁"
            required
          />
        </div>
        {error && (
          <p className="text-red-500 justify-center text-center mb-4">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-full hover:bg-blue-600 transition"
        >
          התחבר
        </button>
      </form>
      <p className="mt-4 text-center">
        אין לך חשבון?{" "}
        <a href="/register" className="text-blue-500 hover:underline">
          הירשם
        </a>
      </p>
    </div>
  );
}
