"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PeopleList } from "../components/PeopleList";
import { LocationList } from "../components/LocationList";
import { motion } from "framer-motion";

export default function ManagementPage() {
  const [people, setPeople] = useState([]);
  const [locations, setLocations] = useState([]);
  const [waitTime, setWaitTime] = useState(8);
  const [originalWaitTime, setOriginalWaitTime] = useState(8);
  const [waitTimeChanged, setWaitTimeChanged] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: peopleData } = await supabase.from("people").select("*");
    const { data: locationsData } = await supabase
      .from("locations")
      .select("*");
    const { data: settingsData } = await supabase
      .from("settings")
      .select("wait_time")
      .single();
    setPeople(peopleData || []);
    setLocations(locationsData || []);
    const fetchedWaitTime = settingsData?.wait_time || 8;
    setWaitTime(fetchedWaitTime);
    setOriginalWaitTime(fetchedWaitTime);
  };

  const handleSaveWaitTime = async () => {
    const { error } = await supabase
      .from("settings")
      .upsert([{ id: 1, wait_time: waitTime }]);
    if (error) {
      alert("שגיאה בשמירת זמן המתנה: " + error.message);
      return;
    }
    setOriginalWaitTime(waitTime);
    setWaitTimeChanged(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 p-4 flex flex-col items-center"
    >
      <h1 className="text-2xl font-bold mb-6">ניהול</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-2">אנשים</h2>
        <PeopleList people={people} setPeople={setPeople} />

        <h2 className="text-lg font-semibold mb-2 mt-6">מיקומים</h2>
        <LocationList locations={locations} setLocations={setLocations} />

        <div className="mt-6">
          <label className="block text-gray-700 mb-2">זמן המתנה (שעות):</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={waitTime}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                setWaitTime(newValue);
                setWaitTimeChanged(newValue !== originalWaitTime);
              }}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="4"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveWaitTime}
              disabled={!waitTimeChanged}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
            >
              שמור
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
