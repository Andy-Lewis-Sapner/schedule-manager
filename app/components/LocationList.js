"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useSupabase } from "../context/SupabaseContext";

export function LocationList({ locations, setLocations }) {
  const { supabase, session, loading } = useSupabase();
  const [name, setName] = useState("");
  const [managersNeeded, setManagersNeeded] = useState(0);
  const [regularsNeeded, setRegularsNeeded] = useState(0);
  const [slotDuration, setSlotDuration] = useState(4);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("שם המיקום לא יכול להיות ריק");
      return;
    }
    if (locations.some((loc) => loc.name === name.trim())) {
      alert("שם זה כבר קיים ברשימה");
      return;
    }
    const newLocation = {
      name: name.trim(),
      managers_needed: managersNeeded,
      regulars_needed: regularsNeeded,
      slot_duration: slotDuration,
      user_id: session.user.id,
    };
    const { data, error } = await supabase
      .from("locations")
      .insert([newLocation])
      .select()
      .single();

    if (error) {
      alert("שגיאה בהוספת מיקום: " + error.message);
      return;
    }

    setLocations([...locations, data]);
    setName("");
    setManagersNeeded(0);
    setRegularsNeeded(0);
    setSlotDuration(4);
  };

  const handleDeleteLocation = async (id) => {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (error) {
      alert("שגיאה במחיקת מיקום: " + error.message);
      return;
    }
    setLocations(locations.filter((loc) => loc.id !== id));
  };

  return (
    <div>
      <form onSubmit={handleAddLocation} className="mb-4 flex flex-col gap-2">
        <div>
          <label className="block text-gray-700 mb-1">שם המיקום:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="הכנס שם מיקום"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">מפקדים:</label>
            <input
              type="number"
              value={managersNeeded}
              onChange={(e) => setManagersNeeded(parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">חיילים:</label>
            <input
              type="number"
              value={regularsNeeded}
              onChange={(e) => setRegularsNeeded(parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">זמן:</label>
            <input
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="4"
              step="4"
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
        >
          הוסף
        </motion.button>
      </form>

      {/* Counter for total number of locations */}
      <p className="text-center text-gray-700 mb-4">
        סה&quot;כ מיקומים: {locations.length}
      </p>

      {/* Locations List */}
      {locations.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3">
          {locations.map((loc) => (
            <motion.li
              key={loc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cyan-100 p-4 rounded-lg shadow-md flex justify-between items-start"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {loc.name}
                </h3>
                <div className="text-gray-600 text-sm">
                  <p>מפקדים נדרשים: {loc.managers_needed}</p>
                  <p>חיילים נדרשים: {loc.regulars_needed}</p>
                  <p>משך זמן: {loc.slot_duration} שעות</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteLocation(loc.id)}
                className="text-red-500 hover:text-red-700 font-bold text-lg"
              >
                X
              </button>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">אין מיקומים</p>
      )}
    </div>
  );
}
