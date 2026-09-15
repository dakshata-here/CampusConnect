import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Building2,
  Calendar,
  ExternalLink,
  Mail,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { EventCard } from '../events/EventCard';

export const ClubsDirectory: React.FC = () => {
  const { clubs, events, setSelectedEventForModal } = useApp();
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClubs = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeClub = clubs.find((c) => c.id === selectedClubId);
  const clubEvents = events.filter((e) => e.clubId === selectedClubId && e.status !== 'draft');

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Student Clubs & Chapters
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Explore technical student branches, SIGs, robotics societies, and cultural organizations
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clubs by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClubs.map((club) => {
          const clubEvtCount = events.filter((e) => e.clubId === club.id && e.status !== 'draft').length;
          return (
            <div
              key={club.id}
              className="dashboard-card rounded-xl border p-5 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <img
                    src={club.logo}
                    alt={club.name}
                    className="w-12 h-12 rounded-lg object-cover p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {club.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {club.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {club.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Lead: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{club.presidentName}</strong></span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{clubEvtCount} Events</span>
                </div>

                <button
                  onClick={() => setSelectedClubId(club.id)}
                  className="w-full py-2 rounded-lg bg-slate-50 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Club Hub</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Club Details Modal */}
      {activeClub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={activeClub.logo} alt={activeClub.name} className="w-12 h-12 rounded-lg bg-white p-1 border border-slate-200 dark:border-slate-700" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{activeClub.name}</h2>
                  <p className="text-xs text-slate-500">{activeClub.presidentName} (President)</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClubId(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[calc(80vh-8rem)] overflow-y-auto">
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase text-slate-400">About Chapter</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeClub.description}
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase text-slate-400">
                  Scheduled Events ({clubEvents.length})
                </h3>
                {clubEvents.length === 0 ? (
                  <p className="text-xs text-slate-400">No scheduled events at this time.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clubEvents.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          setSelectedEventForModal(e);
                          setSelectedClubId(null);
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors space-y-1"
                      >
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">{e.eventType}</span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{e.title}</h4>
                        <div className="text-[11px] text-slate-500">📅 {e.date} • 📍 {e.venueName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
