"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

export default function ViewSchedulePage() {
  const [idNumber, setIdNumber] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [filteredTimeSlots, setFilteredTimeSlots] = useState([]);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setTimeSlots([]);
    setFilteredTimeSlots([]);
    setUserName("");
    setLocationFilter("");
    setDateFilter("");

    // Fetch the person's name from the people table using the id_number
    const { data: personData, error: personError } = await supabase
      .from("people")
      .select("name")
      .eq("id_number", idNumber)
      .single();

    if (personError || !personData) {
      setError("לא נמצאו לוחות זמנים עבור מספר זיהוי זה");
      return;
    }

    setUserName(personData.name);

    // Fetch all schedules where the person with the given id_number is assigned
    const { data, error } = await supabase.rpc("get_schedules_by_id_number", {
      p_id_number: idNumber,
    });

    if (error) {
      setError("שגיאה בחיפוש לוחות זמנים: " + error.message);
      return;
    }

    // Process the schedules to extract time slots where the user is assigned
    let userTimeSlots = [];
    data.forEach((schedule) => {
      const assignments = schedule.assignments || [];
      assignments.forEach(([timeSlotString, groups]) => {
        // Parse the time slot string (e.g., "1.4.2025, 14:00 - 1.4.2025, 18:00")
        const [startStr, endStr] = timeSlotString.split(" - ");
        const startDate = new Date(
          startStr
            .split(", ")
            .reverse()
            .join(" ")
            .replace(/(\d+)\.(\d+)\.(\d+)/, "$3-$2-$1")
        );
        const endDate = new Date(
          endStr
            .split(", ")
            .reverse()
            .join(" ")
            .replace(/(\d+)\.(\d+)\.(\d+)/, "$3-$2-$1")
        );

        // Check if the user is assigned to this time slot
        const isUserAssigned = groups.some((group) =>
          group.some((person) => person.id_number === idNumber)
        );

        if (isUserAssigned) {
          userTimeSlots.push({
            startDate,
            endDate,
            location: schedule.locations[0]?.name || "לא צוין מיקום",
          });
        }
      });
    });

    if (userTimeSlots.length === 0) {
      setError("לא נמצאו לוחות זמנים עבור מספר זיהוי זה");
      return;
    }

    // Sort time slots by startDate
    userTimeSlots.sort((a, b) => a.startDate - b.startDate);

    // Combine consecutive time slots
    const combinedTimeSlots = [];
    let currentSlot = { ...userTimeSlots[0] };

    for (let i = 1; i < userTimeSlots.length; i++) {
      const nextSlot = userTimeSlots[i];

      // Check if the slots are consecutive (endDate of current matches startDate of next)
      if (
        currentSlot.location === nextSlot.location &&
        currentSlot.endDate.getTime() === nextSlot.startDate.getTime()
      ) {
        // Combine the slots by extending the endDate
        currentSlot.endDate = nextSlot.endDate;
      } else {
        // If not consecutive, push the current slot and start a new one
        combinedTimeSlots.push(currentSlot);
        currentSlot = { ...nextSlot };
      }
    }
    // Push the last slot
    combinedTimeSlots.push(currentSlot);

    setTimeSlots(combinedTimeSlots);
    setFilteredTimeSlots(combinedTimeSlots);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("he-IL", { dateStyle: "short" });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("he-IL", { timeStyle: "short" });
  };

  // Get unique locations for the filter
  const uniqueLocations = [...new Set(timeSlots.map((slot) => slot.location))];

  // Handle filter application
  const applyFilters = () => {
    let filtered = [...timeSlots];

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter((slot) => slot.location === locationFilter);
    }

    // Filter by date
    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      filtered = filtered.filter((slot) => {
        const slotDate = new Date(slot.startDate);
        return (
          slotDate.getFullYear() === selectedDate.getFullYear() &&
          slotDate.getMonth() === selectedDate.getMonth() &&
          slotDate.getDate() === selectedDate.getDate()
        );
      });
    }

    setFilteredTimeSlots(filtered);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 p-4 flex flex-col items-center"
    >
      <h1 className="text-2xl font-bold mb-6">צפה בלוחות הזמנים שלך</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <form onSubmit={handleSearch} className="mb-6">
          <label className="block text-gray-700 mb-2">הזן מספר זיהוי:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value);
                setTimeSlots([]);
                setFilteredTimeSlots([]);
                setLocationFilter("");
                setDateFilter("");
              }}
              className="w-3/4 h-10 px-4 py-2 border border-gray-300 rounded-full text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800 placeholder-gray-400"
              placeholder="הכנס מספר זיהוי"
              required
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-1/4 bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition"
            >
              חפש
            </motion.button>
          </div>
        </form>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {timeSlots.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center">
              לוחות זמנים עבור {userName}
            </h2>

            {/* Filters */}
            <div className="mb-6">
              {/* Filters in One Row */}
              <div className="flex gap-2 mb-3">
                {/* Location Filter */}
                <div className="flex-1">
                  <label className="block text-gray-700 mb-2">
                    סנן לפי מיקום:
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full h-10 px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800"
                  >
                    <option value="">כל המיקומים</option>
                    {uniqueLocations.map((location, index) => (
                      <option key={index} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div className="flex-1">
                  <label className="block text-gray-700 mb-2">
                    סנן לפי תאריך:
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full h-10 px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-gray-800"
                  />
                </div>
              </div>

              {/* Apply Filters Button in the Next Row */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={applyFilters}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition"
              >
                החל סינונים
              </motion.button>
            </div>

            {/* Cards */}
            {filteredTimeSlots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTimeSlots.map((slot, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl shadow-lg border border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Decorative Top Accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-xl"></div>

                    <div className="space-y-2">
                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-800">
                          {slot.location}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-800">
                          {formatDate(slot.startDate)}
                        </p>
                      </div>

                      {/* Start and End Time in One Row */}
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-800">
                          {formatTime(slot.startDate)} -{" "}
                          {formatTime(slot.endDate)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-red-500 mb-4 text-center">
                לא נמצאו לוחות זמנים עבור מספר זיהוי זה
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
