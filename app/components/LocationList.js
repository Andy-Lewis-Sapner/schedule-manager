"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export function LocationList({ locations, setLocations, setHasChanges }) {
  const [name, setName] = useState("");
  const [managersNeeded, setManagersNeeded] = useState(0);
  const [regularsNeeded, setRegularsNeeded] = useState(0);
  const [slotDuration, setSlotDuration] = useState(4);

  const handleAddLocation = (e) => {
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
      id: Date.now(),
      name: name.trim(),
      managers_needed: managersNeeded,
      regulars_needed: regularsNeeded,
      slot_duration: slotDuration,
    };
    setLocations([...locations, newLocation]);
    setName("");
    setManagersNeeded(0);
    setRegularsNeeded(0);
    setSlotDuration(4);
    setHasChanges(true);
  };

  const handleDeleteLocation = (id) => {
    setLocations(locations.filter((loc) => loc.id !== id));
    setHasChanges(true);
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
            <label className="block text-gray-700 mb-1">מפקד:</label>
            <input
              type="number"
              value={managersNeeded}
              onChange={(e) => setManagersNeeded(parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">חייל:</label>
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
      {locations.length > 0 && (
        <ul className="grid grid-cols-1 gap-2">
          {locations.map((loc) => (
            <motion.li
              key={loc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-white p-2 rounded shadow"
            >
              <span>
                {loc.name} ({loc.managers_needed} מפקדים, {loc.regulars_needed}{" "}
                חיילים, {loc.slot_duration} שעות)
              </span>
              <button
                onClick={() => handleDeleteLocation(loc.id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                X
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
