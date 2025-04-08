import { useState } from "react";
import { motion } from "framer-motion";
import { useSupabase } from "../context/SupabaseContext";
import Popup from "./Popup";

export function PeopleList({ people, setPeople }) {
  const { supabase, session, loading } = useSupabase();
  const [name, setName] = useState("");
  const [role, setRole] = useState("חייל");
  const [idNumber, setIdNumber] = useState("");
  const [popupMessage, setPopupMessage] = useState(null);

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setPopupMessage("שם האדם לא יכול להיות ריק");
      return;
    }
    if (!idNumber.trim()) {
      setPopupMessage("מספר זיהוי לא יכול להיות ריק");
      return;
    }
    if (people.some((p) => p.name === name.trim())) {
      setPopupMessage("שם זה כבר קיים ברשימה");
      return;
    }

    // Check if the id_number already exists in the people table (across all users)
    const { data: existingPerson, error: checkError } = await supabase
      .from("people")
      .select("id")
      .eq("id_number", idNumber.trim())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      setPopupMessage("שגיאה בבדיקת מספר זיהוי: " + checkError.message);
      return;
    }

    if (existingPerson) {
      setPopupMessage("מספר זיהוי זה כבר קיים במערכת");
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
      setPopupMessage("שגיאה בהוספת אדם: " + error.message);
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
      setPopupMessage("שגיאה במחיקת אדם: " + error.message);
      return;
    }
    setPeople(people.filter((p) => p.id !== id));
  };

  const managers = people.filter((person) => person.role === "מפקד");
  const regulars = people.filter((person) => person.role === "חייל");

  return (
    <div>
      {popupMessage && (
        <Popup message={popupMessage} onClose={() => setPopupMessage(null)} />
      )}

      <form onSubmit={handleAddPerson} className="mb-4">
        {/* Inputs in One Row */}
        <div className="flex flex-wrap gap-3 mb-3">
          {/* Name Input */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-gray-700 text-sm font-medium mb-1">
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

          {/* ID Number Input */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-gray-700 text-sm font-medium mb-1">
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

          {/* Role Select */}
          <div className="flex-1 min-w-[120px]">
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
        </div>

        {/* Add Button in the Next Row */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full h-10 bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition duration-200 font-medium"
        >
          הוסף
        </motion.button>
      </form>

      <p className="text-center text-gray-700 mb-4">
        סה"כ אנשים: {people.length}
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
