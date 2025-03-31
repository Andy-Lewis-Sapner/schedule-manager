"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "./context/SupabaseContext";
import { motion } from "framer-motion";

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

    const { data: locationsData } = await supabase
      .from("locations")
      .select("*")
      .eq("user_id", session.user.id);
    setLocations(locationsData || []);
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

  const handleCreateSchedule = async () => {
    if (!startDate || !startHour || !endDate || !endHour) {
      alert("אנא מלא את כל השדות של תאריך ושעה");
      return;
    }

    const start = new Date(`${startDate}T${startHour}:00`);
    const end = new Date(`${endDate}T${endHour}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("תאריך או שעה לא תקינים");
      return;
    }

    if (end <= start) {
      alert("תאריך ושעת הסיום חייבים להיות אחרי תאריך ושעת ההתחלה");
      return;
    }

    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours % 4 !== 0) {
      alert("הפרש השעות בין ההתחלה לסיום חייב להתחלק ב-4");
      return;
    }

    const { data: settingsData } = await supabase
      .from("settings")
      .select("wait_time")
      .eq("user_id", session.user.id)
      .single();
    const waitTime = settingsData?.wait_time || 8;

    const assignments = generateSchedule(
      start,
      end,
      selectedPeople,
      selectedLocations,
      waitTime
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
      alert("שגיאה ביצירת לוח זמנים: " + error.message);
    } else {
      router.push(`/schedule?id=${data.id}&from=main`);
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
      <h1 className="text-2xl font-bold mb-6">מתזמן</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
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
                          ? "bg-green-100"
                          : "bg-red-100"
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
                          ? "bg-green-100"
                          : "bg-red-100"
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
                          ? "bg-green-100"
                          : "bg-red-100"
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
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">שעת התחלה:</label>
            <input
              type="time"
              value={startHour}
              onChange={(e) => handleHourChange(e, setStartHour)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">שעת סיום:</label>
            <input
              type="time"
              value={endHour}
              onChange={(e) => handleHourChange(e, setEndHour)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateSchedule}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-md"
        >
          צור לוח זמנים
        </motion.button>
      </div>
    </motion.div>
  );
}

function generateSchedule(start, end, people, locations, waitTime) {
  const assignments = {};
  const availability = people.reduce((acc, person) => {
    acc[person.id] = new Date(start); // Tracks the next available time for each person
    return acc;
  }, {});
  const lastAssignmentEnd = people.reduce((acc, person) => {
    acc[person.id] = new Date(start); // Initially set to the start time
    return acc;
  }, {});

  const minSlotDuration =
    locations.length > 0
      ? Math.min(...locations.map((loc) => loc.slot_duration || 4))
      : 4;

  let current = new Date(start);
  const slots = [];

  while (current < end) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current);
    slotEnd.setHours(slotEnd.getHours() + minSlotDuration);
    if (slotEnd > end) slotEnd.setTime(end.getTime());
    const slotKey = `${slotStart.toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    })} - ${slotEnd.toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    })}`;
    slots.push({
      key: slotKey,
      start: slotStart,
      end: slotEnd,
      timestamp: slotStart.getTime(),
    });
    current.setHours(current.getHours() + minSlotDuration);
  }

  const locationNextAssignmentTime = locations.reduce((acc, loc) => {
    acc[loc.id] = new Date(start);
    return acc;
  }, {});

  const locationAssignments = locations.map(() => []);

  slots.forEach((slot, slotIndex) => {
    const slotAssignments = locations.map(() => []);

    // Get available managers and regulars for this slot
    const managers = people.filter((p) => p.role === "מפקד");
    let availableManagers = managers
      .filter((m) => availability[m.id] <= slot.start)
      .sort((a, b) => availability[a.id] - availability[b.id]);

    const regulars = people.filter((p) => p.role === "חייל");
    let availableRegulars = regulars
      .filter((r) => availability[r.id] <= slot.start)
      .sort((a, b) => availability[a.id] - availability[b.id]);

    // Process each location
    locations.forEach((loc, locIndex) => {
      // Skip if the location isn't due for an assignment yet
      if (locationNextAssignmentTime[loc.id] > slot.start) {
        // Don't push an empty assignment; let the previous assignment persist
        return;
      }

      const assigned = [];

      // Check if we have enough managers
      const managersNeeded = loc.managers_needed || 0;
      if (managersNeeded > 0 && availableManagers.length < managersNeeded) {
        // Not enough managers, skip this location
        locationAssignments[locIndex].push({
          slotIndex,
          assigned: [],
          duration: loc.slot_duration || 4,
        });
        locationNextAssignmentTime[loc.id] = new Date(slot.start);
        locationNextAssignmentTime[loc.id].setHours(
          locationNextAssignmentTime[loc.id].getHours() +
            (loc.slot_duration || 4)
        );
        return;
      }

      // Check if we have enough regulars
      const regularsNeeded = loc.regulars_needed || 0;
      if (regularsNeeded > 0 && availableRegulars.length < regularsNeeded) {
        // Not enough regulars, skip this location
        locationAssignments[locIndex].push({
          slotIndex,
          assigned: [],
          duration: loc.slot_duration || 4,
        });
        locationNextAssignmentTime[loc.id] = new Date(slot.start);
        locationNextAssignmentTime[loc.id].setHours(
          locationNextAssignmentTime[loc.id].getHours() +
            (loc.slot_duration || 4)
        );
        return;
      }

      // We have enough managers and regulars, proceed with assignment
      // Assign managers
      if (managersNeeded > 0) {
        for (let i = 0; i < managersNeeded; i++) {
          const manager = availableManagers[0];
          assigned.push(manager);
          const slotDuration = loc.slot_duration || 4;
          const slotEndForManager = new Date(slot.start);
          slotEndForManager.setHours(
            slotEndForManager.getHours() + slotDuration
          );
          lastAssignmentEnd[manager.id] = new Date(slotEndForManager);
          availability[manager.id] = new Date(lastAssignmentEnd[manager.id]);
          availability[manager.id].setHours(
            availability[manager.id].getHours() + waitTime
          );
          availableManagers = availableManagers.slice(1); // Remove the assigned manager
        }
      }

      // Assign regulars
      if (regularsNeeded > 0) {
        for (let i = 0; i < regularsNeeded; i++) {
          const regular = availableRegulars[0];
          assigned.push(regular);
          const slotDuration = loc.slot_duration || 4;
          const slotEndForRegular = new Date(slot.start);
          slotEndForRegular.setHours(
            slotEndForRegular.getHours() + slotDuration
          );
          lastAssignmentEnd[regular.id] = new Date(slotEndForRegular);
          availability[regular.id] = new Date(lastAssignmentEnd[regular.id]);
          availability[regular.id].setHours(
            availability[regular.id].getHours() + waitTime
          );
          availableRegulars = availableRegulars.slice(1); // Remove the assigned regular
        }
      }

      slotAssignments[locIndex] = assigned;

      // Update the next assignment time for this location
      locationNextAssignmentTime[loc.id] = new Date(slot.start);
      locationNextAssignmentTime[loc.id].setHours(
        locationNextAssignmentTime[loc.id].getHours() + (loc.slot_duration || 4)
      );

      // Store the assignment
      locationAssignments[locIndex].push({
        slotIndex,
        assigned,
        duration: loc.slot_duration || 4,
      });
    });
  });

  // Populate the assignments for each slot
  slots.forEach((slot, slotIndex) => {
    const slotAssignments = locations.map(() => []);

    locations.forEach((loc, locIndex) => {
      const relevantAssignment = locationAssignments[locIndex].find(
        (assignment) => {
          const assignmentStartSlot = assignment.slotIndex;
          const slotsCovered = Math.ceil(
            (assignment.duration || 4) / minSlotDuration
          );
          const assignmentEndSlot = assignmentStartSlot + slotsCovered - 1;
          return (
            slotIndex >= assignmentStartSlot && slotIndex <= assignmentEndSlot
          );
        }
      );

      if (relevantAssignment) {
        slotAssignments[locIndex] = relevantAssignment.assigned;
      }
    });

    assignments[slot.key] = slotAssignments;
  });

  // Sort the assignments by date
  const sortedAssignments = Object.entries(assignments).sort((a, b) => {
    const parseDate = (dateRange) => {
      const [startDateTime] = dateRange.split(" - ");
      const [datePart, timePart] = startDateTime.split(", ");
      const [day, month, year] = datePart.split(".");
      const [hours, minutes] = timePart.split(":");
      return new Date(year, month - 1, day, hours, minutes);
    };

    const dateA = parseDate(a[0]);
    const dateB = parseDate(b[0]);

    return dateA - dateB;
  });

  return sortedAssignments;
}
