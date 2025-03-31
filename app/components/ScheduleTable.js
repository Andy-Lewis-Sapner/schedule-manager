"use client";
import { motion } from "framer-motion";

export function ScheduleTable({ schedule, locations }) {
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
    <div className="w-full max-w-md overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border-b border-gray-300 text-gray-700 font-semibold">
              תאריך
            </th>
            <th className="p-2 border-b border-gray-300 text-gray-700 font-semibold">
              שעה
            </th>
            {locations.map((loc, i) => (
              <th
                key={i}
                className="p-2 border-b border-gray-300 text-center text-gray-700 font-semibold"
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
                <td className="p-2 border-b border-gray-300 text-center text-gray-800">
                  {date}
                </td>
                <td className="p-2 border-b border-gray-300 text-center text-gray-800">
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
                            className={`inline-flex items-center px-2 m-[2px] py-1 rounded-md text-sm ${
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
  );
}
