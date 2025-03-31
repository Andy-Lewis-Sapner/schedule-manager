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
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPeople, setOriginalPeople] = useState([]);
  const [originalLocations, setOriginalLocations] = useState([]);
  const [originalWaitTime, setOriginalWaitTime] = useState(8);

  useEffect(() => {
    fetchData();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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
    setWaitTime(settingsData?.wait_time || 8);
    setOriginalPeople(peopleData || []);
    setOriginalLocations(locationsData || []);
    setOriginalWaitTime(settingsData?.wait_time || 8);
  };

  const handleBeforeUnload = (e) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = "יש שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?";
    }
  };

  const handleSaveChanges = async () => {
    // Sync people: Delete removed, insert new
    const peopleToDelete = originalPeople.filter(
      (op) => !people.some((p) => p.id === op.id)
    );
    const peopleToAdd = people.filter(
      (p) => !originalPeople.some((op) => op.id === p.id)
    );
    if (peopleToDelete.length > 0) {
      await supabase
        .from("people")
        .delete()
        .in(
          "id",
          peopleToDelete.map((p) => p.id)
        );
    }
    if (peopleToAdd.length > 0) {
      await supabase
        .from("people")
        .insert(peopleToAdd.map((p) => ({ name: p.name, role: p.role })));
    }

    // Sync locations: Delete removed, insert new
    const locationsToDelete = originalLocations.filter(
      (ol) => !locations.some((l) => l.id === ol.id)
    );
    const locationsToAdd = locations.filter(
      (l) => !originalLocations.some((ol) => ol.id === l.id)
    );
    if (locationsToDelete.length > 0) {
      await supabase
        .from("locations")
        .delete()
        .in(
          "id",
          locationsToDelete.map((l) => l.id)
        );
    }
    if (locationsToAdd.length > 0) {
      await supabase.from("locations").insert(
        locationsToAdd.map((l) => ({
          name: l.name,
          managers_needed: l.managers_needed,
          regulars_needed: l.regulars_needed,
          slot_duration: l.slot_duration,
        }))
      );
    }

    // Update wait time
    await supabase.from("settings").upsert([{ id: 1, wait_time: waitTime }]);

    // Refresh original state
    const { data: peopleData } = await supabase.from("people").select("*");
    const { data: locationsData } = await supabase
      .from("locations")
      .select("*");
    setOriginalPeople(peopleData || []);
    setOriginalLocations(locationsData || []);
    setOriginalWaitTime(waitTime);
    setHasChanges(false);
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
        <PeopleList
          people={people}
          setPeople={setPeople}
          setHasChanges={setHasChanges}
        />

        <h2 className="text-lg font-semibold mb-2 mt-6">מיקומים</h2>
        <LocationList
          locations={locations}
          setLocations={setLocations}
          setHasChanges={setHasChanges}
        />

        <div className="mt-6">
          <label className="block text-gray-700 mb-2">זמן המתנה (שעות):</label>
          <input
            type="number"
            value={waitTime}
            onChange={(e) => {
              setWaitTime(parseInt(e.target.value));
              setHasChanges(true);
            }}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="4"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveChanges}
          disabled={!hasChanges}
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
        >
          שמור שינויים
        </motion.button>
      </div>
    </motion.div>
  );
}
