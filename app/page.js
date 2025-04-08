"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "./context/SupabaseContext";
import { motion } from "framer-motion";
import Popup from "./components/Popup";

export default function SchedulerPage() {
  const { supabase, session, loading } = useSupabase();
  const [people, setPeople] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endHour, setEndHour] = useState("");
  const [popupMessage, setPopupMessage] = useState(null);
  const [mode, setMode] = useState("automatic"); // "automatic" or "manual"
  const [timeSlots, setTimeSlots] = useState([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [manualAssignments, setManualAssignments] = useState({});
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    } else if (session) {
      fetchData();
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, "0");
      const start = new Date(now);
      setStartDate(start.toISOString().split("T")[0]);
      setStartHour(`${currentHour}:00`);
      const end = new Date(start);
      end.setHours(end.getHours() + 24);
      setEndDate(end.toISOString().split("T")[0]);
      setEndHour(`${end.getHours().toString().padStart(2, "0")}:00`);
    }
  }, [session, loading, router]);

  const fetchData = async () => {
    const { data: peopleData } = await supabase
      .from("people")
      .select("*")
      .eq("user_id", session.user.id);
    setPeople(peopleData || []);
    setSelectedPeople(peopleData || []);

    const { data: locationsData } = await supabase
      .from("locations")
      .select("*")
      .eq("user_id", session.user.id);
    setLocations(locationsData || []);
    setSelectedLocations(locationsData || []);
  };

  const handleAddAllPeople = () => setSelectedPeople([...people]);
  const handleRemoveAllPeople = () => setSelectedPeople([]);
  const handleAddAllLocations = () => setSelectedLocations([...locations]);
  const handleRemoveAllLocations = () => setSelectedLocations([]);

  const handleHourChange = (e, setter) => {
    const [hour] = e.target.value.split(":");
    setter(`${hour}:00`);
  };

  const togglePerson = (person) => {
    setSelectedPeople(
      selectedPeople.some((p) => p.id === person.id)
        ? selectedPeople.filter((p) => p.id !== person.id)
        : [...selectedPeople, person]
    );
  };

  const toggleLocation = (loc) => {
    setSelectedLocations(
      selectedLocations.some((l) => l.id === loc.id)
        ? selectedLocations.filter((l) => l.id !== loc.id)
        : [...selectedLocations, loc]
    );
  };

  const generateTimeSlots = () => {
    if (!startDate || !startHour || !endDate || !endHour) {
      setPopupMessage("אנא מלא את כל השדות של תאריך ושעה");
      return;
    }

    const start = new Date(`${startDate}T${startHour}:00`);
    const end = new Date(`${endDate}T${endHour}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setPopupMessage("תאריך או שעה לא תקינים");
      return;
    }

    if (end <= start) {
      setPopupMessage("תאריך ושעת הסיום חייבים להיות אחרי תאריך ושעת ההתחלה");
      return;
    }

    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours % 4 !== 0) {
      setPopupMessage("הפרש השעות בין ההתחלה לסיום חייב להתחלק ב-4");
      return;
    }

    const minSlotDuration =
      locations.length > 0
        ? Math.max(
            4,
            Math.min(...locations.map((loc) => loc.slot_duration || 4))
          )
        : 4;
    const slots = [];
    let current = new Date(start);
    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current);
      slotEnd.setHours(slotEnd.getHours() + minSlotDuration);
      if (slotEnd > end) slotEnd.setTime(end.getTime());
      const slotKey = slotStart.toISOString(); // Use ISO string as key
      slots.push({
        key: slotKey,
        start: slotStart,
        end: slotEnd,
        timestamp: slotStart.getTime(),
      });
      current.setHours(current.getHours() + minSlotDuration);
    }
    setTimeSlots(slots);

    const initialAssignments = {};
    slots.forEach((slot) => {
      initialAssignments[slot.key] = {};
    });
    setManualAssignments(initialAssignments);
    setCurrentSlotIndex(0);
  };

  const toggleManualAssignment = (slotKey, locationId, person) => {
    setManualAssignments((prev) => {
      const newAssignments = JSON.parse(JSON.stringify(prev)); // Deep clone
      const slotAssignments = newAssignments[slotKey] || {};

      const locId = String(locationId);
      if (!slotAssignments[locId]) {
        slotAssignments[locId] = [];
      }

      const assignedPeople = slotAssignments[locId];
      const isAssigned = assignedPeople.some((p) => p.id === person.id);

      if (isAssigned) {
        slotAssignments[locId] = assignedPeople.filter(
          (p) => p.id !== person.id
        );
      } else {
        const location = locations.find((loc) => loc.id === Number(locationId));
        const managersAssigned = assignedPeople.filter(
          (p) => p.role === "מפקד"
        ).length;
        const regularsAssigned = assignedPeople.filter(
          (p) => p.role === "חייל"
        ).length;

        if (
          (person.role === "מפקד" &&
            managersAssigned >= (location.managers_needed || 0)) ||
          (person.role === "חייל" &&
            regularsAssigned >= (location.regulars_needed || 0))
        ) {
          return prev; // Return original state if limit reached
        }

        const assignedInOtherLocation = Object.entries(slotAssignments)
          .filter(([id]) => id !== locId)
          .flatMap(([, people]) => people)
          .some((p) => p.id === person.id);

        if (!assignedInOtherLocation) {
          slotAssignments[locId].push(person);
        }
      }

      newAssignments[slotKey] = slotAssignments;
      return newAssignments;
    });
  };

  const handleAutomaticSchedule = async () => {
    if (!startDate || !startHour || !endDate || !endHour) {
      setPopupMessage("אנא מלא את כל השדות של תאריך ושעה");
      return;
    }

    const start = new Date(`${startDate}T${startHour}:00`);
    const end = new Date(`${endDate}T${endHour}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setPopupMessage("תאריך או שעה לא תקינים");
      return;
    }

    if (end <= start) {
      setPopupMessage("תאריך ושעת הסיום חייבים להיות אחרי תאריך ושעת ההתחלה");
      return;
    }

    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours % 4 !== 0) {
      setPopupMessage("הפרש השעות בין ההתחלה לסיום חייב להתחלק ב-4");
      return;
    }

    const { data: settingsData } = await supabase
      .from("settings")
      .select("wait_time")
      .eq("user_id", session.user.id)
      .single();
    const waitTime = settingsData?.wait_time || 8;

    const assignments = generateSchedule(
      start.toISOString(), // Pass as ISO string
      end.toISOString(), // Pass as ISO string
      selectedLocations, // Correct order: locations first
      selectedPeople, // Then people
      waitTime,
      {} // Empty manual assignments for automatic mode
    );

    const { data, error } = await supabase
      .from("schedules")
      .insert([
        {
          user_id: session.user.id,
          start_date: start,
          end_date: end,
          people: selectedPeople,
          locations: selectedLocations,
          assignments,
        },
      ])
      .select()
      .single();

    if (error) {
      setPopupMessage("שגיאה ביצירת לוח זמנים: " + error.message);
    } else {
      router.push(`/schedule?id=${data.id}&from=main`);
    }
  };

  const handleManualSchedule = async () => {
    if (!startDate || !startHour || !endDate || !endHour) {
      setPopupMessage("אנא מלא את כל השדות של תאריך ושעה");
      return;
    }

    const start = new Date(`${startDate}T${startHour}:00`);
    const end = new Date(`${endDate}T${endHour}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setPopupMessage("תאריך או שעה לא תקינים");
      return;
    }

    if (end <= start) {
      setPopupMessage("תאריך ושעת הסיום חייבים להיות אחרי תאריך ושעת ההתחלה");
      return;
    }

    const { data: settingsData } = await supabase
      .from("settings")
      .select("wait_time")
      .eq("user_id", session.user.id)
      .single();
    const waitTime = settingsData?.wait_time || 8;

    const formattedManualAssignments = {};
    for (const [slotKey, assignments] of Object.entries(manualAssignments)) {
      const slotAssignments = {};
      for (const [locationId, peopleArray] of Object.entries(assignments)) {
        slotAssignments[locationId] = peopleArray; // Already an array of person objects
      }
      formattedManualAssignments[slotKey] = slotAssignments;
    }

    const assignments = generateSchedule(
      start.toISOString(),
      end.toISOString(),
      locations,
      people,
      waitTime,
      formattedManualAssignments
    );

    const { data, error } = await supabase
      .from("schedules")
      .insert([
        {
          user_id: session.user.id,
          start_date: start,
          end_date: end,
          people,
          locations,
          assignments,
        },
      ])
      .select()
      .single();

    if (error) {
      setPopupMessage("שגיאה ביצירת לוח זמנים: " + error.message);
    } else {
      router.push(`/schedule?id=${data.id}&from=main`);
    }
  };

  const handleNextSlot = () => {
    if (currentSlotIndex < timeSlots.length - 1) {
      setCurrentSlotIndex(currentSlotIndex + 1);
    }
  };

  const handlePreviousSlot = () => {
    if (currentSlotIndex > 0) {
      setCurrentSlotIndex(currentSlotIndex - 1);
    }
  };

  const managers = people.filter((person) => person.role === "מפקד");
  const regularWorkers = people.filter((person) => person.role !== "מפקד");

  const locationsByDuration = locations.reduce((acc, loc) => {
    const duration = loc.slot_duration || 4;
    if (!acc[duration]) {
      acc[duration] = [];
    }
    acc[duration].push(loc);
    return acc;
  }, {});

  const sortedDurations = Object.keys(locationsByDuration).sort(
    (a, b) => a - b
  );

  const minSlotDuration =
    locations.length > 0
      ? Math.max(4, Math.min(...locations.map((loc) => loc.slot_duration || 4)))
      : 4;

  const isLocationAssignable = (location, slotIndex) => {
    const slotDuration = location.slot_duration || 4;
    const slotsPerDuration = Math.floor(slotDuration / minSlotDuration);
    const slotInCycle = slotIndex % slotsPerDuration;
    return slotInCycle === 0; // Only allow assignment in the first slot of the location's duration cycle
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
      {popupMessage && (
        <Popup message={popupMessage} onClose={() => setPopupMessage(null)} />
      )}

      <h1 className="text-2xl font-bold mb-6">מתזמן</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode("automatic")}
            className={`py-2 px-4 rounded-full transition shadow-md ${
              mode === "automatic"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            תזמון אוטומטי
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode("manual")}
            className={`py-2 px-4 rounded-full transition shadow-md ${
              mode === "manual"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            תזמון ידני
          </motion.button>
        </div>

        {mode === "automatic" ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">בחר אנשים</h2>
              <div className="flex justify-center gap-4 mb-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddAllPeople}
                  className="bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-sm"
                >
                  הוסף את כולם
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemoveAllPeople}
                  className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition shadow-sm"
                >
                  הסר את כולם
                </motion.button>
              </div>
              <p className="text-center text-gray-700 mb-2">
                מספר נבחרים: {selectedPeople.length}
              </p>
              <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg shadow-inner">
                {managers.length > 0 && (
                  <>
                    <h3 className="text-md font-medium text-gray-800 mb-2">
                      מפקדים
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {managers.map((person) => (
                        <motion.div
                          key={person.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePerson(person)}
                          className={`p-2 rounded-md shadow-sm cursor-pointer transition-colors ${
                            selectedPeople.some((p) => p.id === person.id)
                              ? "bg-green-300"
                              : "bg-red-300"
                          }`}
                        >
                          <span className="text-gray-800">{person.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
                {regularWorkers.length > 0 && (
                  <>
                    <h3 className="text-md font-medium text-gray-800 mb-2">
                      חיילים
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {regularWorkers.map((person) => (
                        <motion.div
                          key={person.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePerson(person)}
                          className={`p-2 rounded-md shadow-sm cursor-pointer transition-colors ${
                            selectedPeople.some((p) => p.id === person.id)
                              ? "bg-green-300"
                              : "bg-red-300"
                          }`}
                        >
                          <span className="text-gray-800">{person.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">בחר מיקומים</h2>
              <div className="flex justify-center gap-4 mb-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddAllLocations}
                  className="bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-sm"
                >
                  הוסף את כולם
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemoveAllLocations}
                  className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition shadow-sm"
                >
                  הסר את כולם
                </motion.button>
              </div>
              <p className="text-center text-gray-700 mb-2">
                מספר נבחרים: {selectedLocations.length}
              </p>
              <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg shadow-inner">
                {sortedDurations.map((duration) => (
                  <div key={duration} className="mb-4">
                    <h3 className="text-md font-medium text-gray-800 mb-2">
                      משך זמן: {duration} שעות
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {locationsByDuration[duration].map((loc) => (
                        <motion.div
                          key={loc.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleLocation(loc)}
                          className={`p-2 rounded-md shadow-sm cursor-pointer transition-colors ${
                            selectedLocations.some((l) => l.id === loc.id)
                              ? "bg-green-300"
                              : "bg-red-300"
                          }`}
                        >
                          <span className="text-gray-800">{loc.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">תאריך התחלה:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">שעת התחלה:</label>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => handleHourChange(e, setStartHour)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">תאריך סיום:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">שעת סיום:</label>
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => handleHourChange(e, setEndHour)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAutomaticSchedule}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-md"
            >
              צור לוח זמנים אוטומטי
            </motion.button>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">תאריך התחלה:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">שעת התחלה:</label>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => handleHourChange(e, setStartHour)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">תאריך סיום:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">שעת סיום:</label>
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => handleHourChange(e, setEndHour)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateTimeSlots}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-md mb-6"
            >
              צור חלונות זמן
            </motion.button>

            {timeSlots.length > 0 && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePreviousSlot}
                      disabled={currentSlotIndex === 0}
                      className={`py-2 px-4 rounded-full transition shadow-md ${
                        currentSlotIndex === 0
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      הקודם
                    </motion.button>
                    <h2 className="text-lg font-semibold">
                      {timeSlots[currentSlotIndex].start.toLocaleString(
                        "he-IL",
                        {
                          dateStyle: "short",
                          timeStyle: "short",
                        }
                      )}{" "}
                      -{" "}
                      {timeSlots[currentSlotIndex].end.toLocaleString("he-IL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNextSlot}
                      disabled={currentSlotIndex === timeSlots.length - 1}
                      className={`py-2 px-4 rounded-full transition shadow-md ${
                        currentSlotIndex === timeSlots.length - 1
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      הבא
                    </motion.button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg shadow-inner">
                    {locations.map((location) => {
                      const slotKey = timeSlots[currentSlotIndex].key;
                      // if (!isLocationAssignable(location, currentSlotIndex)) {
                      //   return (
                      //     <div key={location.id} className="mb-4">
                      //       <h3 className="text-md font-medium text-gray-800 mb-2">
                      //         {location.name} (משך זמן:{" "}
                      //         {location.slot_duration || 4} שעות)
                      //       </h3>
                      //       <p className="text-gray-600">
                      //         מיקום זה אינו זמין לשיבוץ בחלון זמן זה
                      //       </p>
                      //     </div>
                      //   );
                      // }

                      const slotAssignments = manualAssignments[slotKey] || {};
                      const assignedPeople =
                        slotAssignments[String(location.id)] || []; // Ensure string key
                      const managersAssigned = assignedPeople.filter(
                        (p) => p.role === "מפקד"
                      ).length;
                      const regularsAssigned = assignedPeople.filter(
                        (p) => p.role === "חייל"
                      ).length;
                      const allAssignedInSlot = Object.values(slotAssignments)
                        .flat()
                        .map((p) => p.id);

                      return (
                        <div key={location.id} className="mb-4">
                          <h3 className="text-md font-medium text-gray-800 mb-2">
                            {location.name} (מפקדים נדרשים:{" "}
                            {location.managers_needed || 0}, חיילים נדרשים:{" "}
                            {location.regulars_needed || 0})
                          </h3>
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">
                              מפקדים:
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {managers.map((person) => {
                                const isAssigned = assignedPeople.some(
                                  (p) => p.id === person.id
                                );
                                const isAssignedInOtherLocation =
                                  allAssignedInSlot.includes(person.id) &&
                                  !isAssigned;
                                const isDisabled =
                                  (managersAssigned >=
                                    (location.managers_needed || 0) &&
                                    !isAssigned) ||
                                  isAssignedInOtherLocation;
                                return (
                                  <motion.div
                                    key={person.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() =>
                                      !isDisabled &&
                                      toggleManualAssignment(
                                        slotKey,
                                        location.id,
                                        person
                                      )
                                    }
                                    className={`p-2 rounded-md shadow-sm cursor-pointer transition-colors ${
                                      isDisabled
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : isAssigned
                                        ? "bg-green-300"
                                        : "bg-red-300"
                                    }`}
                                  >
                                    <span className="text-gray-800">
                                      {person.name}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">
                              חיילים:
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {regularWorkers.map((person) => {
                                const isAssigned = assignedPeople.some(
                                  (p) => p.id === person.id
                                );
                                const isAssignedInOtherLocation =
                                  allAssignedInSlot.includes(person.id) &&
                                  !isAssigned;
                                const isDisabled =
                                  (regularsAssigned >=
                                    (location.regulars_needed || 0) &&
                                    !isAssigned) ||
                                  isAssignedInOtherLocation;
                                return (
                                  <motion.div
                                    key={person.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() =>
                                      !isDisabled &&
                                      toggleManualAssignment(
                                        slotKey,
                                        location.id,
                                        person
                                      )
                                    }
                                    className={`p-2 rounded-md shadow-sm cursor-pointer transition-colors ${
                                      isDisabled
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : isAssigned
                                        ? "bg-green-300"
                                        : "bg-red-300"
                                    }`}
                                  >
                                    <span className="text-gray-800">
                                      {person.name}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleManualSchedule}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-md"
                >
                  צור לוח זמנים ידני
                </motion.button>
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function generateSchedule(
  start,
  end,
  locations,
  people,
  waitTime,
  manualAssignment
) {
  // Find minimum slot duration (minimum 4 hours)
  const minSlotDuration = Math.max(
    4,
    Math.min(...locations.map((loc) => loc.slot_duration))
  );

  // Convert start and end to Date objects
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Generate time slots
  const slots = [];
  let currentTime = new Date(startDate);
  while (currentTime < endDate) {
    const slotEnd = new Date(currentTime);
    slotEnd.setHours(slotEnd.getHours() + minSlotDuration);
    slots.push({
      start: new Date(currentTime),
      end: slotEnd > endDate ? endDate : slotEnd,
    });
    currentTime = slotEnd;
  }

  // Process manual assignments and identify prioritized people
  const manualSlots = new Map();
  const manuallyAssignedPeople = new Set();
  if (manualAssignment && Object.keys(manualAssignment).length > 0) {
    for (const [time, assignments] of Object.entries(manualAssignment)) {
      const slotTime = new Date(time);
      manualSlots.set(slotTime.toISOString(), assignments);
      for (const assignedPeople of Object.values(assignments)) {
        assignedPeople.forEach((person) =>
          manuallyAssignedPeople.add(person.id)
        );
      }
    }
  }

  // Track availability of people
  const peopleAvailability = new Map();
  people.forEach((person) => {
    peopleAvailability.set(person.id, []);
  });

  // Resulting schedule
  const schedule = slots.map((slot) => ({
    start: slot.start,
    end: slot.end,
    assignments: {},
  }));

  // Helper function to check if person is available
  function isPersonAvailable(personId, slotStart, slotEnd) {
    const unavailableTimes = peopleAvailability.get(personId) || [];
    return !unavailableTimes.some((time) => {
      const unavailableStart = new Date(time.start);
      unavailableStart.setHours(unavailableStart.getHours() - waitTime);
      const unavailableEnd = new Date(time.end);
      unavailableEnd.setHours(unavailableEnd.getHours() + waitTime);
      return slotStart < unavailableEnd && slotEnd > unavailableStart;
    });
  }

  // Helper function to mark person as assigned
  function markPersonAssigned(personId, slotStart, slotEnd) {
    const unavailableTimes = peopleAvailability.get(personId) || [];
    unavailableTimes.push({ start: slotStart, end: slotEnd });
    peopleAvailability.set(personId, unavailableTimes);
  }

  // Process manual assignments first
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const slotStartStr = slot.start.toISOString();
    if (manualSlots.has(slotStartStr)) {
      schedule[i].assignments = manualSlots.get(slotStartStr);
      for (const [locId, assignedPeople] of Object.entries(
        schedule[i].assignments
      )) {
        const location = locations.find((loc) => loc.id === Number(locId));
        const slotsToFill = location.slot_duration / minSlotDuration;
        assignedPeople.forEach((person) => {
          const personObj = people.find((p) => p.id === person.id);
          if (personObj) {
            let currentSlotStart = new Date(slot.start);
            for (let j = 0; j < slotsToFill && i + j < slots.length; j++) {
              const slotEnd = new Date(currentSlotStart);
              slotEnd.setHours(slotEnd.getHours() + minSlotDuration);
              markPersonAssigned(personObj.id, currentSlotStart, slotEnd);
              if (j > 0 && i + j < slots.length) {
                if (!schedule[i + j].assignments[locId]) {
                  schedule[i + j].assignments[locId] = [];
                }
                schedule[i + j].assignments[locId] = [...assignedPeople];
              }
              currentSlotStart = slotEnd;
            }
          }
        });
      }
    }
  }

  // Process each slot for automatic assignments with priority
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    // Skip if slot is fully assigned
    if (Object.keys(schedule[i].assignments).length === locations.length) {
      continue;
    }

    for (const location of locations) {
      // Skip if location is already assigned for this slot
      if (schedule[i].assignments[location.id]) {
        continue;
      }

      const managersNeeded = location.managers_needed;
      const regularsNeeded = location.regulars_needed;
      const slotsToFill = location.slot_duration / minSlotDuration;

      let assignedManagers = [];
      let assignedRegulars = [];

      // Get available people with priority for manually assigned
      const availableManagers = people
        .filter(
          (p) =>
            p.role === "מפקד" && isPersonAvailable(p.id, slot.start, slot.end)
        )
        .sort((a, b) => {
          const aPriority = manuallyAssignedPeople.has(a.id);
          const bPriority = manuallyAssignedPeople.has(b.id);
          return bPriority - aPriority; // true (1) comes before false (0)
        });
      const availableRegulars = people
        .filter(
          (p) =>
            p.role === "חייל" && isPersonAvailable(p.id, slot.start, slot.end)
        )
        .sort((a, b) => {
          const aPriority = manuallyAssignedPeople.has(a.id);
          const bPriority = manuallyAssignedPeople.has(b.id);
          return bPriority - aPriority; // true (1) comes before false (0)
        });

      // Check if we have enough people for all required slots
      let canAssign = true;
      for (let j = 0; j < slotsToFill && i + j < slots.length; j++) {
        const futureSlotStart = slots[i + j].start;
        const futureSlotEnd = slots[i + j].end;
        if (
          !availableManagers.every((m) =>
            isPersonAvailable(m.id, futureSlotStart, futureSlotEnd)
          ) ||
          !availableRegulars.every((r) =>
            isPersonAvailable(r.id, futureSlotStart, futureSlotEnd)
          )
        ) {
          canAssign = false;
          break;
        }
      }

      if (
        canAssign &&
        availableManagers.length >= managersNeeded &&
        availableRegulars.length >= regularsNeeded
      ) {
        assignedManagers = availableManagers.slice(0, managersNeeded);
        assignedRegulars = availableRegulars.slice(0, regularsNeeded);
        const assignedPeople = [...assignedManagers, ...assignedRegulars];

        // Assign to current and consecutive slots
        for (let j = 0; j < slotsToFill && i + j < slots.length; j++) {
          const currentSlotIndex = i + j;
          if (!schedule[currentSlotIndex].start) {
            schedule[currentSlotIndex].start = slots[currentSlotIndex].start;
            schedule[currentSlotIndex].end = slots[currentSlotIndex].end;
          }
          schedule[currentSlotIndex].assignments[location.id] = assignedPeople;

          // Mark people as assigned
          assignedPeople.forEach((person) => {
            const slotStart = slots[currentSlotIndex].start;
            const slotEnd = slots[currentSlotIndex].end;
            markPersonAssigned(person.id, slotStart, slotEnd);
          });
        }
      } else {
        schedule[i].assignments[location.id] = [];
      }
    }
  }

  schedule.forEach((slot) => {
    for (const [locId, people] of Object.entries(slot.assignments)) {
      const loc = locations.find((l) => l.id === Number(locId));
    }
  });
  return schedule;
}
