import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { workspacesApi } from "../api/tasks";
import { BarChart, Bar, XAxis, YAxis, Tooltip,
         LineChart, Line, ResponsiveContainer, CartesianGrid } from "recharts";

const STATUS_COLORS = {
  backlog:"#94a3b8", todo:"#60a5fa", in_progress:"#f59e0b",
  in_review:"#a78bfa", done:"#34d399", cancelled:"#f87171",
};

export default function AnalyticsPage() {
  const { wsId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    workspacesApi.analytics(wsId).then(r => setData(r.data)).catch(() => {});
  }, [wsId]);

  if (!data) return <div className="p-8 text-gray-400">Loading analytics…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-xl font-semibold">Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total tasks",  value: data.total_tasks },
          { label: "Done",         value: data.by_status.find(s => s.status === "done")?.count ?? 0 },
          { label: "In progress",  value: data.by_status.find(s => s.status === "in_progress")?.count ?? 0 },
          { label: "Overdue",      value: data.overdue_count, danger: true },
        ].map(card => (
          <div key={card.label} className={`card ${card.danger && card.value > 0 ? "border-red-200" : ""}`}>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.danger && card.value > 0 ? "text-red-500" : ""}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tasks by status bar chart */}
      <div className="card">
        <h2 className="text-sm font-medium mb-4">Tasks by status</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.by_status} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="status" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count"
              fill="#534AB7"
              radius={[4, 4, 0, 0]}
              label={{ position: "top", fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 30-day activity line chart */}
      <div className="card">
        <h2 className="text-sm font-medium mb-4">Activity — last 30 days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.activity_last_30_days}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={d => d.slice(5)}   /* show MM-DD only */
              interval={4} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="created"   stroke="#60a5fa" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="completed" stroke="#34d399" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block"/>Created</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 inline-block"/>Completed</span>
        </div>
      </div>

      {/* Member stats table */}
      <div className="card">
        <h2 className="text-sm font-medium mb-4">Team productivity</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2 font-medium">Member</th>
              <th className="pb-2 font-medium text-right">Assigned</th>
              <th className="pb-2 font-medium text-right">Done</th>
              <th className="pb-2 font-medium text-right">Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.member_stats.map(m => (
              <tr key={m.user_id} className="border-b last:border-0">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600
                                    text-xs flex items-center justify-center font-medium">
                      {m.username[0].toUpperCase()}
                    </div>
                    <span>{m.full_name}</span>
                  </div>
                </td>
                <td className="py-2 text-right">{m.assigned_count}</td>
                <td className="py-2 text-right">{m.completed_count}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full"
                        style={{ width: `${Math.round(m.completion_rate * 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(m.completion_rate * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}