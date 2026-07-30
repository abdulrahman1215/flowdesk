import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Plus,
  FolderKanban,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { workspacesApi } from "../api/tasks";

import toast from "react-hot-toast";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] =
    useState([]);

  const [creating, setCreating] =
    useState(false);

  const [name, setName] = useState("");

  const [loading, setLoading] =
    useState(true);

  // ==============================
  // Fetch Workspaces
  // ==============================

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const res =
          await workspacesApi.list();

        setWorkspaces(res.data);
      } catch (err) {
        console.error(err);

        toast.error(
          "Failed to load workspaces"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspaces();
  }, []);

  // ==============================
  // Create Workspace
  // ==============================

  const create = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      const { data } =
        await workspacesApi.create({
          name,
        });

      setWorkspaces((prev) => [
        ...prev,
        data,
      ]);

      setName("");

      setCreating(false);

      toast.success(
        "Workspace created successfully"
      );
    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to create workspace"
      );
    }
  };

  // ==============================
  // Loading State
  // ==============================

  if (loading) {
    return (
      <div
        className="
          flex h-[70vh]
          items-center justify-center
        "
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="
              w-14 h-14
              rounded-full
              border-4
              border-cyan-500
              border-t-transparent
              animate-spin
            "
          />

          <p className="text-slate-500 text-sm">
            Loading workspaces...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div
        className="
          flex flex-col gap-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles
              size={18}
              className="text-cyan-500"
            />

            <span
              className="
                text-sm font-medium
                text-cyan-600
              "
            >
              Team Collaboration
            </span>
          </div>

          <h1
            className="
              text-4xl
              font-bold
              tracking-tight
              text-slate-800
            "
          >
            Your Workspaces
          </h1>

          <p className="mt-2 text-slate-500">
            Organize projects, collaborate
            with teams, and manage tasks
            efficiently.
          </p>
        </div>

        {/* Create Button */}
        <button
          onClick={() =>
            setCreating(true)
          }
          className="
            flex items-center gap-2
            rounded-2xl
            bg-gradient-to-r
            from-cyan-500
            to-blue-600
            px-6 py-4
            text-sm font-semibold
            text-white
            shadow-lg
            transition
            hover:opacity-90
          "
        >
          <Plus size={18} />
          New Workspace
        </button>
      </div>

      {/* Create Workspace Modal */}
      {creating && (
        <div
          className="
            rounded-3xl
            border border-slate-200
            bg-white
            p-6
            shadow-xl
            max-w-2xl
          "
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-2xl
                bg-cyan-100
                text-cyan-600
              "
            >
              <FolderKanban size={22} />
            </div>

            <div>
              <h2
                className="
                  text-xl
                  font-semibold
                  text-slate-800
                "
              >
                Create Workspace
              </h2>

              <p className="text-sm text-slate-500">
                Start managing a new project
              </p>
            </div>
          </div>

          <form
            onSubmit={create}
            className="space-y-4"
          >
            <input
              autoFocus
              placeholder="Workspace name..."
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="
                w-full
                rounded-2xl
                border border-slate-200
                bg-slate-50
                px-5 py-4
                text-sm
                text-slate-900
                caret-cyan-600
                placeholder:text-slate-300
                selection:bg-cyan-100
                selection:text-slate-900
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-100
              "
            />

            <div className="flex gap-3">
              <button
                type="submit"
                className="
                  flex-1
                  rounded-2xl
                  bg-gradient-to-r
                  from-cyan-500
                  to-blue-600
                  px-5 py-3
                  text-sm font-semibold
                  text-white
                  shadow-md
                  transition
                  hover:opacity-90
                "
              >
                Create Workspace
              </button>

              <button
                type="button"
                onClick={() =>
                  setCreating(false)
                }
                className="
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  px-5 py-3
                  text-sm font-medium
                  text-slate-600
                  transition
                  hover:bg-slate-100
                "
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workspace Grid */}
      {workspaces.length > 0 ? (
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-6
          "
        >
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/board/${ws.id}`}
              className="
                group
                relative overflow-hidden
                rounded-3xl
                border border-slate-200
                bg-white
                p-6
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-xl
              "
            >
              {/* Background Decoration */}
              <div
                className="
                  absolute -right-10 -top-10
                  h-32 w-32
                  rounded-full
                  bg-cyan-100
                  opacity-40
                  transition
                  group-hover:scale-125
                "
              />

              {/* Header */}
              <div className="relative flex items-start justify-between">
                <div
                  className="
                    flex h-14 w-14
                    items-center justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-cyan-500
                    to-blue-600
                    text-white
                    shadow-lg
                  "
                >
                  <FolderKanban size={24} />
                </div>

                <span
                  className="
                    rounded-full
                    bg-cyan-50
                    px-3 py-1
                    text-xs font-semibold
                    text-cyan-600
                    border border-cyan-100
                  "
                >
                  {ws.my_role}
                </span>
              </div>

              {/* Workspace Info */}
              <div className="relative mt-6">
                <h2
                  className="
                    text-xl
                    font-bold
                    text-slate-800
                    group-hover:text-cyan-600
                    transition
                  "
                >
                  {ws.name}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  /{ws.slug}
                </p>

                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                  Collaborative workspace
                  for project planning,
                  realtime task tracking,
                  and team productivity.
                </p>
              </div>

              {/* Footer */}
              <div
                className="
                  relative mt-6
                  flex items-center justify-between
                "
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={16} />

                  <span className="text-xs">
                    Team Workspace
                  </span>
                </div>

                <div
                  className="
                    flex items-center gap-1
                    text-sm font-medium
                    text-cyan-600
                    opacity-0
                    transition
                    group-hover:opacity-100
                  "
                >
                  Open Board

                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="
            flex flex-col items-center justify-center
            rounded-3xl
            border border-dashed border-slate-300
            bg-white/60
            py-24
            text-center
          "
        >
          <div
            className="
              flex h-20 w-20
              items-center justify-center
              rounded-3xl
              bg-slate-100
              text-slate-400
              mb-6
            "
          >
            <FolderKanban size={36} />
          </div>

          <h2
            className="
              text-2xl
              font-semibold
              text-slate-700
            "
          >
            No Workspaces Yet
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            Create your first workspace to
            start collaborating with your
            team and managing tasks.
          </p>

          <button
            onClick={() =>
              setCreating(true)
            }
            className="
              mt-6
              flex items-center gap-2
              rounded-2xl
              bg-gradient-to-r
              from-cyan-500
              to-blue-600
              px-6 py-3
              text-sm font-semibold
              text-white
              shadow-lg
              transition
              hover:opacity-90
            "
          >
            <Plus size={18} />
            Create Workspace
          </button>
        </div>
      )}
    </div>
  );
}
