"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../context/SupabaseContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  const { supabase } = useSupabase();
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      const userId = data.user.id; // Get the newly created user's ID
      const { error: settingsError } = await supabase.from("settings").insert({
        user_id: userId,
        wait_time: 8,
      });

      setNote("בבקשה אשר את כתובת המייל שלך");
      if (settingsError) {
        setError("שגיאה בהגדרת זמן המתנה ברירת מחדל: " + settingsError.message);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">הרשמה</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">מייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        {note && (
          <p className="justify-center text-center text-green-500 my-4">
            {note}
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          הירשם
        </button>
      </form>
      <p className="mt-4 text-center">
        כבר יש לך חשבון?{" "}
        <a href="/login" className="text-blue-500 hover:underline">
          התחבר
        </a>
      </p>
    </div>
  );
}
