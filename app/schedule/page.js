import { Suspense } from "react";
import { ScheduleContent } from "../components/ScheduleContent";

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          טוען...
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
