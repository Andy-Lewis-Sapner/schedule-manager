"use client";
import { motion } from "framer-motion";

export default function Popup({ message, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />

      {/* Popup Content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full mx-4 relative z-10"
      >
        <p className="text-gray-800 text-center mb-4">{message}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition"
        >
          סגור
        </motion.button>
      </motion.div>
    </div>
  );
}
