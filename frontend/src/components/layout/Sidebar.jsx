import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  KanbanSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Boards",
    path: "/board/1",
    icon: KanbanSquare,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  return (
    <aside
      className="
        hidden md:flex
        w-[280px]
        shrink-0
        flex-col
        border-r border-slate-200
        bg-white/90
        backdrop-blur-xl
        shadow-sm
      "
    >
      {/* Logo */}
      <div
        className="
          flex items-center gap-3
          border-b border-slate-200
          px-6 py-5
        "
      >
        <div
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-2xl
            bg-gradient-to-br
            from-cyan-500
            to-blue-600
            text-lg font-bold
            text-white
            shadow-lg
          "
        >
          F
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">
            FlowDesk
          </h1>

          <p className="text-xs text-slate-400">
            Team Collaboration Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p
          className="
            mb-3 px-3
            text-xs font-semibold
            uppercase tracking-wider
            text-slate-400
          "
        >
          Workspace
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `
                  group
                  flex items-center justify-between
                  rounded-2xl
                  px-4 py-3
                  transition-all duration-200

                  ${
                    isActive
                      ? `
                        bg-gradient-to-r
                        from-cyan-500
                        to-blue-600
                        text-white
                        shadow-lg
                      `
                      : `
                        text-slate-600
                        hover:bg-slate-100
                        hover:text-slate-900
                      `
                  }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        flex h-10 w-10
                        items-center justify-center
                        rounded-xl
                        transition

                        ${
                          isActive
                            ? "bg-white/20"
                            : "bg-slate-100 group-hover:bg-white"
                        }
                      `}
                    >
                      <Icon size={18} />
                    </div>

                    <span className="text-sm font-medium">
                      {item.name}
                    </span>
                  </div>

                  <ChevronRight
                    size={16}
                    className={`
                      transition-transform

                      ${
                        isActive
                          ? "translate-x-1"
                          : "opacity-0 group-hover:opacity-100"
                      }
                    `}
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Card */}
      <div className="border-t border-slate-200 p-4">
        <div
          className="
            rounded-3xl
            border border-slate-200
            bg-slate-50
            p-4
            shadow-sm
          "
        >
          {/* User */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-2xl
                bg-gradient-to-br
                from-cyan-500
                to-blue-600
                text-sm font-bold
                text-white
                shadow-md
              "
            >
              {user?.username?.[0]?.toUpperCase() ||
                "U"}
            </div>

            <div className="flex-1 overflow-hidden">
              <h3
                className="
                  truncate
                  text-sm font-semibold
                  text-slate-800
                "
              >
                {user?.full_name || "Guest User"}
              </h3>

              <p
                className="
                  truncate
                  text-xs text-slate-400
                "
              >
                @{user?.username || "username"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="
              mt-4
              flex w-full items-center justify-center gap-2
              rounded-2xl
              border border-red-100
              bg-red-50
              px-4 py-3
              text-sm font-medium
              text-red-500
              transition
              hover:bg-red-100
            "
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}