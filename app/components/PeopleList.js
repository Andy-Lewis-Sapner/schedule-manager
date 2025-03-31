import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

export function PeopleList({ people, setPeople }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("חייל");

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("שם האדם לא יכול להיות ריק");
      return;
    }
    if (people.some((p) => p.name === name.trim())) {
      alert("שם זה כבר קיים ברשימה");
      return;
    }
    const newPerson = { name: name.trim(), role };
    const { data, error } = await supabase
      .from("people")
      .insert([newPerson])
      .select()
      .single();

    if (error) {
      alert("שגיאה בהוספת אדם: " + error.message);
      return;
    }

    setPeople([...people, data]);
    setName("");
    setRole("חייל");
  };

  const handleDeletePerson = async (id) => {
    const { error } = await supabase.from("people").delete().eq("id", id);
    if (error) {
      alert("שגיאה במחיקת אדם: " + error.message);
      return;
    }
    setPeople(people.filter((p) => p.id !== id));
  };

  // Split people into managers and regulars
  const managers = people.filter((person) => person.role === "מפקד");
  const regulars = people.filter((person) => person.role === "חייל");

  return (
    <div>
      <form onSubmit={handleAddPerson} className="mb-4">
        <div className="flex gap-2">
          <div className="w-1/2">
            <label className="block text-gray-700 mb-1">שם האדם:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="הכנס שם"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-gray-700 mb-1">תפקיד:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="חייל">חייל</option>
              <option value="מפקד">מפקד</option>
            </select>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition w-full"
        >
          הוסף
        </motion.button>
      </form>

      {/* Counter for total number of people */}
      <p className="text-center text-gray-700 mb-4">
        סה"כ אנשים: {people.length}
      </p>

      {/* Managers Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">מפקדים</h2>
        {managers.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2">
            {managers.map((person) => (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-cyan-50 p-2 rounded shadow"
              >
                <span>{person.name}</span>
                <button
                  onClick={() => handleDeletePerson(person.id)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  X
                </button>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">אין מפקדים</p>
        )}
      </div>

      {/* Regulars Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2">חיילים</h2>
        {regulars.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2">
            {regulars.map((person) => (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-cyan-100 p-2 rounded shadow"
              >
                <span>{person.name}</span>
                <button
                  onClick={() => handleDeletePerson(person.id)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  X
                </button>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">אין חיילים</p>
        )}
      </div>
    </div>
  );
}
