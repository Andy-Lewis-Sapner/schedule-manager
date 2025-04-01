import { useState } from "react";
import { motion } from "framer-motion";
import { useSupabase } from "../context/SupabaseContext";

export function PeopleList({ people, setPeople }) {
  const { supabase, session, loading } = useSupabase();
  const [name, setName] = useState("");
  const [role, setRole] = useState("חייל");
  const [idNumber, setIdNumber] = useState("");

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("שם האדם לא יכול להיות ריק");
      return;
    }
    if (!idNumber.trim()) {
      alert("מספר זיהוי לא יכול להיות ריק");
      return;
    }
    if (people.some((p) => p.name === name.trim())) {
      alert("שם זה כבר קיים ברשימה");
      return;
    }
    if (people.some((p) => p.id_number === idNumber.trim())) {
      alert("מספר זיהוי זה כבר קיים ברשימה");
      return;
    }
    const newPerson = {
      name: name.trim(),
      role,
      id_number: idNumber.trim(),
      user_id: session.user.id,
    };
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
    setIdNumber("");
  };

  const handleDeletePerson = async (id) => {
    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (error) {
      alert("שגיאה במחיקת אדם: " + error.message);
      return;
    }
    setPeople(people.filter((p) => p.id !== id));
  };

  const managers = people.filter((person) => person.role === "מפקד");
  const regulars = people.filter((person) => person.role === "חייל");

  return (
    <div>
      <form onSubmit={handleAddPerson} className="mb-4 space-y-3">
        <div className="space-y-1">
          <label className="block text-gray-700 text-sm font-medium">
            שם האדם:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
            placeholder="הכנס שם"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-gray-700 text-sm font-medium">
            מספר זיהוי:
          </label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
            placeholder="הכנס מספר זיהוי"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1/2">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              תפקיד:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800"
            >
              <option value="חייל">חייל</option>
              <option value="מפקד">מפקד</option>
            </select>
          </div>
          <div className="w-1/2 mt-6">
            {" "}
            {/* Adjusted margin to align with select input */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full h-10 bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition duration-200 font-medium"
            >
              הוסף
            </motion.button>
          </div>
        </div>
      </form>

      <p className="text-center text-gray-700 mb-4">
        סה&quot;כ אנשים: {people.length}
      </p>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">מפקדים</h2>
        {managers.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2">
            {managers.map((person) => (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-cyan-50 p-3 rounded-lg shadow"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">
                    {`${person.name} (${person.id_number})`}
                  </span>
                  <button
                    onClick={() => handleDeletePerson(person.id)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    X
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">אין מפקדים</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">חיילים</h2>
        {regulars.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2">
            {regulars.map((person) => (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-cyan-100 p-3 rounded-lg shadow"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">
                    {`${person.name} (${person.id_number})`}
                  </span>
                  <button
                    onClick={() => handleDeletePerson(person.id)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    X
                  </button>
                </div>
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
