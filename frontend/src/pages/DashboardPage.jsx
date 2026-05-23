import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { workspacesApi } from "../api/tasks";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    workspacesApi.list().then(r => setWorkspaces(r.data)).catch(() => {});
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await workspacesApi.create({ name });
      setWorkspaces(ws => [...ws, data]);
      setName("");
      setCreating(false);
      toast.success("Workspace created");
    } catch {
      toast.error("Failed to create workspace");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Your workspaces</h1>
        <button onClick={() => setCreating(true)} className="btn-primary text-sm">
          + New workspace
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="card flex gap-3 mb-4">
          <input className="input flex-1" placeholder="Workspace name"
            value={name} onChange={e => setName(e.target.value)} autoFocus />
          <button type="submit" className="btn-primary">Create</button>
          <button type="button" onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {workspaces.map(ws => (
          <Link key={ws.id} to={`/board/${ws.id}`}
            className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{ws.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">/{ws.slug}</p>
              </div>
              <span className="text-xs text-brand-500 font-medium px-2 py-1 bg-brand-50 rounded-full">
                {ws.my_role}
              </span>
            </div>
          </Link>
        ))}
        {workspaces.length === 0 && (
          <p className="text-gray-400 text-sm col-span-2 py-8 text-center">
            No workspaces yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}