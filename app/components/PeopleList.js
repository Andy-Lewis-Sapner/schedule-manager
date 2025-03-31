import { useState } from "react";
import { motion } from "framer-motion";

export function PeopleList({ people, setPeople, setHasChanges }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("חייל");

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("שם האדם לא יכול להיות ריק");
      return;
    }
    if (people.some((p) => p.name === name.trim())) {
      alert("שם זה כבר קיים ברשימה");
      return;
    }
    const newPerson = { id: Date.now(), name: name.trim(), role };
    setPeople([...people, newPerson]);
    setName("");
    setRole("חייל");
    setHasChanges(true);
  };

  const handleDeletePerson = (id) => {
    setPeople(people.filter((p) => p.id !== id));
    setHasChanges(true);
  };

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
      {people.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          {people.map((person) => (
            <motion.li
              key={person.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-white p-2 rounded shadow"
            >
              <span>
                {person.name} {person.role === "מפקד" ? "(מפקד)" : ""}
              </span>
              <button
                onClick={() => handleDeletePerson(person.id)}
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
