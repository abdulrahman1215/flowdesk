import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-52 shrink-0 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <span className="font-semibold text-brand-500 text-lg">FlowDesk</span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        <NavLink to="/"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-lg text-sm transition-colors
             ${isActive ? "bg-brand-50 text-brand-600 font-medium" : "text-gray-600 hover:bg-gray-100"}`
          }>
          Workspaces
        </NavLink>
      </nav>
      <div className="p-3 border-t">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600
                          text-xs flex items-center justify-center font-medium">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 truncate">{user?.full_name}</span>
        </div>
        <button onClick={handleLogout}
          className="w-full text-left text-xs text-gray-400 hover:text-red-500 px-1 py-1 transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}