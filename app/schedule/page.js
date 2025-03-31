"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { ScheduleTable } from "../components/ScheduleTable";
import { motion } from "framer-motion";
import * as ExcelJS from "exceljs";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState(null);
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("id");
  const tableRef = useRef(null);

  useEffect(() => {
    if (scheduleId) fetchSchedule(scheduleId);
  }, [scheduleId]);

  const fetchSchedule = async (id) => {
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", id)
      .single();
    setSchedule(data);
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("לוח זמנים", {
      properties: { defaultColWidth: 15, tabColor: { argb: "FF00FF00" } },
      views: [{ rightToLeft: true }],
    });

    // Add headers
    const headers = [
      "תאריך",
      "שעה",
      ...schedule.locations.map((loc) => loc.name),
    ];
    worksheet.addRow(headers);

    // Parse slot key to extract date and time
    const parseSlotKey = (slotKey) => {
      const [start, end] = slotKey.split(" - ");
      const [startDate, startTime] = start.split(", ");
      const [, endTime] = end.split(", ");

      // Remove comma from the date
      const date = startDate.replace(",", "");
      const time = `${startTime} - ${endTime}`;

      return { date, time };
    };

    // Iterate over the assignments array (new structure: array of [slot, peopleByLocation] entries)
    schedule.assignments.forEach(([slot, peopleByLocation]) => {
      const { date, time } = parseSlotKey(slot);
      const row = [date, time];
      schedule.locations.forEach((_, i) => {
        const cellContent =
          peopleByLocation[i] && peopleByLocation[i].length > 0
            ? peopleByLocation[i]
                .map((p) => `${p.name}${p.role === "מפקד" ? " (מפקד)" : ""}`)
                .join(", ")
            : "-";
        row.push(cellContent);
      });
      worksheet.addRow(row);
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true, size: 12, name: "Arial" };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFADD8E6" },
    };

    // Style all rows
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Export the workbook
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "לוח_זמנים.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!schedule)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        טוען...
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 p-4 flex flex-col items-center"
    >
      <h1 className="text-2xl font-bold mb-6">
        לוח זמנים - {schedule.start_date.slice(0, 10)}
      </h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <div ref={tableRef}>
          <ScheduleTable
            schedule={schedule.assignments}
            locations={schedule.locations}
          />
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportExcel}
            className="bg-emerald-500 text-white py-2 px-4 rounded-full hover:bg-emerald-600 transition shadow-sm"
          >
            ייצא לאקסל
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => (window.location.href = "/")}
          className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition shadow-md"
        >
          חזור לדף הבית
        </motion.button>
      </div>
    </motion.div>
  );
}
