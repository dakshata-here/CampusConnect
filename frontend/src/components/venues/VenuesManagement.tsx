import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Layers,
  Search
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

export const VenuesManagement: React.FC = () => {
  const { venues, events, setSelectedEventForModal } = useApp();
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];
  const venueEvents = events.filter((e) => e.venueId === currentVenue?.id && e.status !== 'cancelled');

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Campus Venues & Hall Allocations
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time occupancy, seating limits, and equipment availability across college facilities
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search auditorium, labs, halls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Grid: Venues List + Venue Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Venues Selector */}
        <div className="space-y-3">
          {filteredVenues.map((v) => {
            const isSelected = v.id === currentVenue.id;
            const scheduledCount = events.filter((e) => e.venueId === v.id && e.status !== 'cancelled').length;

            return (
              <div
                key={v.id}
                onClick={() => setSelectedVenueId(v.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {v.name}
                  </h4>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {v.capacity} pax
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{v.building}, {v.floor}</span>
                  <span className="font-semibold">{scheduledCount} bookings</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Venue Booking Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {currentVenue.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentVenue.building} • {currentVenue.floor} • Maximum Seating Capacity: {currentVenue.capacity} students
              </p>
            </div>
          </div>

          {/* Amenities tags */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Installed Equipment & Facilities
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {currentVenue.facilities.map((fac, i) => (
                <span key={i} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {fac}
                </span>
              ))}
            </div>
          </div>

          {/* Scheduled Events on this Venue */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Current Scheduled Slot Allocations ({venueEvents.length})
              </h3>
            </div>

            {venueEvents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-slate-400">
                No events currently booked at this venue. Open for new proposals.
              </div>
            ) : (
              <div className="space-y-3">
                {venueEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventForModal(evt)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                        {evt.clubName || evt.organizerName}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                        {evt.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      <span>📅 {formatDisplayDate(evt.date)}</span>
                      <span>⏰ {formatDisplayTime(evt.startTime)} – {formatDisplayTime(evt.endTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
