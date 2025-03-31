"use client";
import { useState, useEffect } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SchedulesPage() {
  const { supabase, session, loading } = useSupabase();
  const [schedules, setSchedules] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    } else if (session) {
      fetchSchedules();
    }
  }, [session, loading, router]);

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", session.user.id)
      .order("start_date", { ascending: true });
    setSchedules(data || []);
  };

  const handleDeleteSchedule = async (id) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את לוח הזמנים הזה?")) {
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (!error) {
        setSchedules(schedules.filter((schedule) => schedule.id !== id));
      } else {
        alert("שגיאה במחיקת לוח זמנים: " + error.message);
      }
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    })}`;
  };

  if (loading) {
    return <div className="text-center mt-10">טוען...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 p-4 flex flex-col items-center"
    >
      <h1 className="text-2xl font-bold mb-6">כל לוחות הזמנים</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        {schedules.length === 0 ? (
          <p className="text-center text-gray-700">
            אין לוחות זמנים שנוצרו עדיין
          </p>
        ) : (
          <ul className="space-y-4">
            {schedules.map((schedule) => (
              <motion.li
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm"
              >
                <Link
                  href={`/schedule?id=${schedule.id}&from=schedules`}
                  className="text-blue-500 hover:underline"
                >
                  {formatDateTime(schedule.start_date)} -{" "}
                  {formatDateTime(schedule.end_date)}
                </Link>
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  מחק
                </button>
              </motion.li>
            ))}
          </ul>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => (window.location.href = "/")}
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-md"
        >
          חזור לדף הבית
        </motion.button>
      </div>
    </motion.div>
  );
}
