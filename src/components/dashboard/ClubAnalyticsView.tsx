import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Award,
  Users,
  Calendar,
  Sparkles,
  BarChart3,
  Flame,
  CheckCircle2,
  Clock,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/calendarUtils';

export const ClubAnalyticsView: React.FC = () => {
  const { currentUser, clubs, events, registrations } = useApp();

  const myClub = clubs.find((c) => c.id === currentUser.clubId) || clubs[0];
  const clubEvents = events.filter((e) => e.clubId === myClub.id);

  const [timePeriod, setTimePeriod] = useState<'year' | 'semester' | 'month'>('year');

  // Compute stats per event
  const eventStats = clubEvents.map((evt) => {
    const regCount = registrations.filter((r) => r.eventId === evt.id).length;
    const capacity = evt.maxParticipants || 100;
    const fillRate = Math.min(Math.round((regCount / capacity) * 100), 100);

    return {
      id: evt.id,
      name: evt.title.length > 20 ? evt.title.substring(0, 18) + '...' : evt.title,
      fullName: evt.title,
      eventType: evt.eventType,
      date: evt.date,
      registrations: regCount,
      capacity,
      fillRate,
      status: evt.status
    };
  });

  // Sort by registrations to find the most enjoyed event
  const sortedByRegistrations = [...eventStats].sort(
    (a, b) => b.registrations - a.registrations
  );
  const mostEnjoyedEvent = sortedByRegistrations[0];

  // Aggregated totals
  const totalRegistrations = eventStats.reduce(
    (acc, curr) => acc + curr.registrations,
    0
  );
  const totalEventsYear = clubEvents.length;

  // Monthly performance distribution (Events held per month in 2026)
  const monthlyData = [
    { month: 'Jan', eventsHeld: 1, registrations: 45 },
    { month: 'Feb', eventsHeld: 2, registrations: 85 },
    { month: 'Mar', eventsHeld: 2, registrations: 110 },
    { month: 'Apr', eventsHeld: 1, registrations: 60 },
    { month: 'May', eventsHeld: 0, registrations: 0 },
    { month: 'Jun', eventsHeld: 1, registrations: 40 },
    { month: 'Jul', eventsHeld: 2, registrations: 95 },
    { month: 'Aug', eventsHeld: 3, registrations: 165 },
    { month: 'Sep', eventsHeld: clubEvents.length, registrations: totalRegistrations },
    { month: 'Oct', eventsHeld: 2, registrations: 80 },
    { month: 'Nov', eventsHeld: 1, registrations: 50 },
    { month: 'Dec', eventsHeld: 1, registrations: 40 }
  ];

  // Events held this month (September 2026)
  const eventsThisMonth = clubEvents.filter((e) => e.date.startsWith('2026-09')).length;

  const barColors = [
    '#2563eb', // blue
    '#3b82f6', // light blue
    '#0ea5e9', // sky
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#8b5cf6'  // violet
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              {myClub.shortName} Performance Intelligence
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Club Metrics & Trends</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Club Analytics & Event Performance
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Understand which events are most enjoyed based on student registrations, and review annual and monthly event performance.
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-blue-50/70 dark:bg-slate-900 rounded-xl border border-blue-200/80 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setTimePeriod('year')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timePeriod === 'year'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            Year 2026
          </button>
          <button
            onClick={() => setTimePeriod('semester')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timePeriod === 'semester'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            Current Term
          </button>
          <button
            onClick={() => setTimePeriod('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timePeriod === 'month'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            September (This Month)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Registrations */}
        <div className="p-4 rounded-2xl dashboard-card border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Registrations
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {totalRegistrations}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Across all {clubEvents.length} club events</span>
          </div>
        </div>

        {/* KPI 2: Events Held This Year */}
        <div className="p-4 rounded-2xl dashboard-card border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Events in 2026 (Year)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {totalEventsYear} Held
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Official technical & cultural sessions
          </div>
        </div>

        {/* KPI 3: Events Held This Month */}
        <div className="p-4 rounded-2xl dashboard-card border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Held This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {eventsThisMonth} Active
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
            September 2026 Schedule
          </div>
        </div>

        {/* KPI 4: Most Enjoyed Event */}
        <div className="p-4 rounded-2xl dashboard-card border space-y-1 ring-1 ring-amber-400/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Most Enjoyed Event
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
            {mostEnjoyedEvent ? mostEnjoyedEvent.fullName : 'None'}
          </div>
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
            {mostEnjoyedEvent ? `${mostEnjoyedEvent.registrations} Student Registrations` : 'N/A'}
          </div>
        </div>
      </div>

      {/* ================= PRIMARY GRAPH: EVENT REGISTRATIONS COMPARISON ================= */}
      <div className="dashboard-card rounded-2xl border p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Event Registration Popularity Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Visual graph comparing registrations across each club event. Shows which events received the highest student turnout and engagement.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 self-start sm:self-auto">
            Interactive Recharts Graph
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={eventStats}
              margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#93c5fd33" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {data.fullName}
                        </div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400">
                          Category: <strong>{data.eventType}</strong>
                        </div>
                        <div className="text-emerald-600 font-bold">
                          {data.registrations} Students Registered
                        </div>
                        <div className="text-slate-500">
                          Capacity: {data.capacity} ({data.fillRate}% Filled)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="registrations" name="Student Registrations" radius={[8, 8, 0, 0]}>
                {eventStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[index % barColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-blue-100/60 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span>Higher bar = More enjoyed / higher turnout</span>
            </div>
          </div>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            Top Performer: {mostEnjoyedEvent?.fullName} ({mostEnjoyedEvent?.registrations} attendees)
          </span>
        </div>
      </div>

      {/* ================= SECONDARY GRAPH: MONTHLY PERFORMANCE OVER THE YEAR ================= */}
      <div className="dashboard-card rounded-2xl border p-5 space-y-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Event Performance & Frequency Over the Year (2026)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            How many events are held in {myClub.name} across each month and cumulative student registrations.
          </p>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#93c5fd33" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {label} 2026
                        </div>
                        <div className="text-indigo-600 font-semibold">
                          Events Held: {payload[0]?.value}
                        </div>
                        <div className="text-blue-600 font-semibold">
                          Student Registrations: {payload[1]?.value}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="eventsHeld"
                name="Events Held in Month"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#eventGrad)"
              />
              <Area
                type="monotone"
                dataKey="registrations"
                name="Monthly Registrations"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#regGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Event Performance Table */}
      <div className="dashboard-card rounded-2xl border p-5 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
          Club Event Performance Breakdown Table
        </h3>

        <div className="overflow-x-auto rounded-xl border border-blue-100/80 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-50/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-blue-100 dark:border-slate-800 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Event Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Date</th>
                <th className="p-3">Registrations</th>
                <th className="p-3">Capacity Fill Rate</th>
                <th className="p-3">Popularity Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 dark:divide-slate-800 bg-white/60 dark:bg-slate-900/60">
              {sortedByRegistrations.map((evt, idx) => (
                <tr
                  key={evt.id}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                    {evt.fullName}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">
                      {evt.eventType}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {formatDisplayDate(evt.date)}
                  </td>
                  <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                    {evt.registrations} / {evt.capacity}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${evt.fillRate}%` }}
                        />
                      </div>
                      <span className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                        {evt.fillRate}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    {idx === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        <Award className="w-3 h-3" />
                        #1 Most Enjoyed
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500">
                        #{idx + 1}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
