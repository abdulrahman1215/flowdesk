import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <button
      className="
        relative
        flex h-11 w-11
        items-center justify-center
        rounded-2xl
        border border-slate-200
        bg-white
        text-slate-600
        shadow-sm
        transition
        hover:bg-slate-50
        hover:shadow-md
      "
    >
      <Bell size={18} />

      {/* Notification Dot */}
      <span
        className="
          absolute right-3 top-3
          h-2 w-2
          rounded-full
          bg-red-500
        "
      />
    </button>
  );
}