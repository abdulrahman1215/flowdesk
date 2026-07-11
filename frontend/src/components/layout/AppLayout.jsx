import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationBell from "../common/NotificationBell";
import {
  Search,
  Command,
  Plus,
} from "lucide-react";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header
          className="
            sticky top-0 z-30
            flex items-center justify-between
            border-b border-slate-200
            bg-white/80
            backdrop-blur-xl
            px-6 py-4
            shadow-sm
          "
        >
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="
                absolute left-4 top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              placeholder="Search tasks, projects..."
              className="
                w-full
                rounded-2xl
                border border-slate-200
                bg-slate-50
                py-3 pl-11 pr-16
                text-sm
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-100
              "
            />

            <div
              className="
                absolute right-3 top-1/2
                -translate-y-1/2
                hidden md:flex
                items-center gap-1
                rounded-lg
                border border-slate-200
                bg-white
                px-2 py-1
                text-xs text-slate-400
              "
            >
              <Command size={12} />
              K
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4 ml-6">
            {/* Create Button */}
            <button
              className="
                hidden md:flex
                items-center gap-2
                rounded-2xl
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
                px-5 py-3
                text-sm font-semibold
                text-white
                shadow-lg
                transition
                hover:opacity-90
              "
            >
              <Plus size={16} />
              New Task
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile */}
            <div
              className="
                flex items-center gap-3
                rounded-2xl
                border border-slate-200
                bg-white
                px-3 py-2
                shadow-sm
                cursor-pointer
                hover:bg-slate-50
                transition
              "
            >
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-cyan-500
                  to-blue-600
                  text-sm font-bold
                  text-white
                "
              >
                AR
              </div>

              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-800">
                  Abdul Rahman
                </p>

                <p className="text-xs text-slate-400">
                  Software Engineer
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="
            flex-1
            overflow-y-auto
            p-6
            bg-gradient-to-br
            from-slate-100
            via-slate-50
            to-slate-100
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}