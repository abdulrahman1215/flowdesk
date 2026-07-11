import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

import {
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Layers3,
  TrendingUp,
  Users,
} from "lucide-react";

import { workspacesApi } from "../api/tasks";

const STATUS_COLORS = {
  backlog: "#94a3b8",
  todo: "#60a5fa",
  in_progress: "#f59e0b",
  in_review: "#a78bfa",
  done: "#34d399",
  cancelled: "#f87171",
};

export default function AnalyticsPage() {
  const { wsId } = useParams();

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res =
          await workspacesApi.analytics(
            wsId
          );

        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [wsId]);

  // ==============================
  // Loading State
  // ==============================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
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
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-red-500">
        Failed to load analytics
      </div>
    );
  }

  // ==============================
  // Summary Cards
  // ==============================

  const summaryCards = [
    {
      label: "Total Tasks",
      value: data.total_tasks,
      icon: Layers3,
      color:
        "from-slate-500 to-slate-700",
    },
    {
      label: "Completed",
      value:
        data.by_status.find(
          (s) => s.status === "done"
        )?.count ?? 0,
      icon: CheckCircle2,
      color:
        "from-emerald-500 to-green-600",
    },
    {
      label: "In Progress",
      value:
        data.by_status.find(
          (s) =>
            s.status === "in_progress"
        )?.count ?? 0,
      icon: Clock3,
      color:
        "from-amber-500 to-orange-600",
    },
    {
      label: "Overdue",
      value: data.overdue_count,
      icon: AlertTriangle,
      color:
        "from-red-500 to-rose-600",
      danger: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="
              text-3xl
              font-bold
              text-slate-800
            "
          >
            Workspace Analytics
          </h1>

          <p className="text-slate-500 mt-1">
            Team productivity and task
            insights
          </p>
        </div>

        <div
          className="
            hidden md:flex
            items-center gap-2
            rounded-2xl
            border border-slate-200
            bg-white
            px-4 py-3
            shadow-sm
          "
        >
          <TrendingUp
            size={18}
            className="text-cyan-500"
          />

          <span className="text-sm font-medium text-slate-700">
            Performance Overview
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="
                relative overflow-hidden
                rounded-3xl
                bg-white
                border border-slate-200
                p-5
                shadow-sm
                hover:shadow-lg
                transition
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {card.label}
                  </p>

                  <h2
                    className={`
                      mt-2
                      text-3xl
                      font-bold

                      ${
                        card.danger &&
                        card.value > 0
                          ? "text-red-500"
                          : "text-slate-800"
                      }
                    `}
                  >
                    {card.value}
                  </h2>
                </div>

                <div
                  className={`
                    flex h-14 w-14
                    items-center justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    ${card.color}
                    text-white
                    shadow-lg
                  `}
                >
                  <Icon size={24} />
                </div>
              </div>

              <div
                className="
                  absolute -right-6 -bottom-6
                  w-24 h-24
                  rounded-full
                  bg-slate-100
                  opacity-50
                "
              />
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div
          className="
            rounded-3xl
            border border-slate-200
            bg-white
            p-6
            shadow-sm
          "
        >
          <h2
            className="
              text-lg font-semibold
              text-slate-800
              mb-6
            "
          >
            Tasks by Status
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={data.by_status}
              barSize={42}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />

              <XAxis
                dataKey="status"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                radius={[10, 10, 0, 0]}
                fill="#06b6d4"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Chart */}
        <div
          className="
            rounded-3xl
            border border-slate-200
            bg-white
            p-6
            shadow-sm
          "
        >
          <h2
            className="
              text-lg font-semibold
              text-slate-800
              mb-6
            "
          >
            30-Day Activity
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <AreaChart
              data={
                data.activity_last_30_days
              }
            >
              <defs>
                <linearGradient
                  id="created"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#60a5fa"
                    stopOpacity={0.4}
                  />

                  <stop
                    offset="95%"
                    stopColor="#60a5fa"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="completed"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#34d399"
                    stopOpacity={0.4}
                  />

                  <stop
                    offset="95%"
                    stopColor="#34d399"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d) =>
                  d.slice(5)
                }
                interval={4}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="created"
                stroke="#60a5fa"
                fill="url(#created)"
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="completed"
                stroke="#34d399"
                fill="url(#completed)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Productivity */}
      <div
        className="
          rounded-3xl
          border border-slate-200
          bg-white
          p-6
          shadow-sm
        "
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="
              flex h-12 w-12
              items-center justify-center
              rounded-2xl
              bg-cyan-100
              text-cyan-600
            "
          >
            <Users size={22} />
          </div>

          <div>
            <h2
              className="
                text-xl
                font-semibold
                text-slate-800
              "
            >
              Team Productivity
            </h2>

            <p className="text-sm text-slate-500">
              Individual contribution and
              completion rates
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="
                  border-b border-slate-200
                  text-left
                "
              >
                <th className="pb-4 text-xs uppercase text-slate-400">
                  Member
                </th>

                <th className="pb-4 text-xs uppercase text-slate-400 text-right">
                  Assigned
                </th>

                <th className="pb-4 text-xs uppercase text-slate-400 text-right">
                  Completed
                </th>

                <th className="pb-4 text-xs uppercase text-slate-400 text-right">
                  Completion Rate
                </th>
              </tr>
            </thead>

            <tbody>
              {data.member_stats.map(
                (member) => (
                  <tr
                    key={member.user_id}
                    className="
                      border-b border-slate-100
                      hover:bg-slate-50
                      transition
                    "
                  >
                    {/* Member */}
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            flex h-11 w-11
                            items-center justify-center
                            rounded-2xl
                            bg-gradient-to-br
                            from-cyan-500
                            to-blue-600
                            text-sm font-bold
                            text-white
                            shadow-sm
                          "
                        >
                          {member.username?.[0]?.toUpperCase()}
                        </div>

                        <div>
                          <p
                            className="
                              text-sm font-semibold
                              text-slate-800
                            "
                          >
                            {member.full_name}
                          </p>

                          <p className="text-xs text-slate-400">
                            @
                            {
                              member.username
                            }
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Assigned */}
                    <td
                      className="
                        py-5
                        text-right
                        text-sm font-medium
                        text-slate-700
                      "
                    >
                      {
                        member.assigned_count
                      }
                    </td>

                    {/* Completed */}
                    <td
                      className="
                        py-5
                        text-right
                        text-sm font-medium
                        text-emerald-600
                      "
                    >
                      {
                        member.completed_count
                      }
                    </td>

                    {/* Rate */}
                    <td className="py-5">
                      <div className="flex items-center justify-end gap-3">
                        <div
                          className="
                            w-28 h-2.5
                            rounded-full
                            bg-slate-100
                            overflow-hidden
                          "
                        >
                          <div
                            className="
                              h-full
                              rounded-full
                              bg-gradient-to-r
                              from-emerald-400
                              to-green-500
                            "
                            style={{
                              width: `${Math.round(
                                member.completion_rate *
                                  100
                              )}%`,
                            }}
                          />
                        </div>

                        <span
                          className="
                            text-xs font-semibold
                            text-slate-600
                            min-w-[40px]
                          "
                        >
                          {Math.round(
                            member.completion_rate *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}