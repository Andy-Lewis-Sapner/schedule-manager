"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export function ScheduleTable({ schedule, locations }) {
  const [viewMode, setViewMode] = useState("cards"); // Default to cards for mobile

  // The schedule is already an array of entries, sorted by the generateSchedule function
  const sortedSlots = schedule;

  // Function to parse the slot key and extract date and time for display
  const parseSlotKey = (slotKey) => {
    const [start, end] = slotKey.split(" - ");
    const [startDate, startTime] = start.split(", ");
    const [, endTime] = end.split(", ");

    // Remove comma from the date for display
    const date = startDate.replace(",", "");

    // Always show only the time range, regardless of whether the dates differ
    const timeRange = `${startTime} - ${endTime}`;

    return { date, time: timeRange };
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* View Mode Toggle for Mobile */}
      <div className="flex justify-center mb-4 md:hidden">
        <button
          onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
        >
          {viewMode === "table" ? "הצג ככרטיסיות" : "הצג כטבלה"}
        </button>
      </div>

      {/* Table View (default for desktop, optional for mobile) */}
      <div
        className={`${
          viewMode === "table" ? "block" : "hidden"
        } md:block overflow-x-auto`}
      >
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100 sticky top-0 z-10">
              <th className="p-2 border-b border-gray-300 text-gray-700 font-semibold text-sm md:text-base">
                תאריך
              </th>
              <th className="p-2 border-b border-gray-300 text-gray-700 font-semibold text-sm md:text-base">
                שעה
              </th>
              {locations.map((loc, i) => (
                <th
                  key={i}
                  className="p-2 border-b border-gray-300 text-center text-gray-700 font-semibold text-sm md:text-base"
                >
                  {loc.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSlots.map(([slot, peopleByLocation], index) => {
              const { date, time } = parseSlotKey(slot);
              return (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-2 border-b border-gray-300 text-center text-gray-800 text-sm md:text-base">
                    {date}
                  </td>
                  <td className="p-2 border-b border-gray-300 text-center text-gray-800 text-sm md:text-base">
                    {time}
                  </td>
                  {locations.map((_, i) => (
                    <td
                      key={i}
                      className="p-2 border-b border-gray-300 text-center"
                    >
                      {peopleByLocation[i] && peopleByLocation[i].length > 0 ? (
                        <div className="space-y-1">
                          {peopleByLocation[i].map((p) => (
                            <div
                              key={p.id}
                              className={`inline-flex items-center px-2 m-[2px] py-1 rounded-md text-xs md:text-sm ${
                                p.role === "מפקד"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <span>{p.name}</span>
                              {p.role === "מפקד" && (
                                <span className="mr-1">(מפקד)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Card View (default for mobile, hidden on desktop) */}
      <div
        className={`${
          viewMode === "cards" ? "block" : "hidden"
        } md:hidden space-y-4`}
      >
        {sortedSlots.map(([slot, peopleByLocation], index) => {
          const { date, time } = parseSlotKey(slot);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-4 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{date}</h3>
                <span className="text-sm text-gray-600">{time}</span>
              </div>
              <div className="space-y-2">
                {locations.map((loc, i) => (
                  <div key={i} className="border-t pt-2">
                    <h4 className="text-md font-medium text-gray-700">
                      {loc.name}
                    </h4>
                    {peopleByLocation[i] && peopleByLocation[i].length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {peopleByLocation[i].map((p) => (
                          <div
                            key={p.id}
                            className={`inline-flex items-center px-2 py-1 mx-1 rounded-md text-sm ${
                              p.role === "מפקד"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <span>{p.name}</span>
                            {p.role === "מפקד" && (
                              <span className="mr-1">(מפקד)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">-</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
