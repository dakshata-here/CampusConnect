import React, { useState } from 'react';
import { Club, Venue } from '../../types';
import { EventFilterCriteria } from '../../utils/filterUtils';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Calendar,
  Building2,
  MapPin,
  Tag,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export interface DashboardFilterBarProps {
  filters: EventFilterCriteria;
  onFilterChange: (newFilters: EventFilterCriteria) => void;
  onReset: () => void;
  clubs?: Club[];
  venues?: Venue[];
  totalCount: number;
  filteredCount: number;
  userRole?: 'student' | 'president' | 'subhead' | 'college_admin';
  showClubFilter?: boolean;
  showVenueFilter?: boolean;
  showStatusFilter?: boolean;
  showCategoryFilter?: boolean;
  showDateFilter?: boolean;
  customStatusOptions?: { label: string; value: string }[];
  customCategoryOptions?: { label: string; value: string }[];
  placeholderSearch?: string;
  className?: string;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  clubs = [],
  venues = [],
  totalCount,
  filteredCount,
  userRole = 'student',
  showClubFilter = true,
  showVenueFilter = true,
  showStatusFilter = true,
  showCategoryFilter = true,
  showDateFilter = true,
  customStatusOptions,
  customCategoryOptions,
  placeholderSearch = 'Search events by title, keyword, venue, or club...',
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Default Category Options
  const categoryOptions = customCategoryOptions || [
    { label: 'All Categories', value: 'all' },
    { label: 'Workshops & SIGs', value: 'workshops' },
    { label: 'Hackathons & Contests', value: 'hackathons' },
    { label: 'Academic & Exams', value: 'academic' },
    { label: 'Clubs Only', value: 'club' }
  ];

  // Default Status Options based on Role
  const statusOptions =
    customStatusOptions ||
    (userRole === 'student'
      ? [
          { label: 'All Statuses', value: 'all' },
          { label: 'Registration Open / Approved', value: 'approved' },
          { label: 'Completed', value: 'completed' }
        ]
      : userRole === 'college_admin'
      ? [
          { label: 'All Statuses', value: 'all' },
          { label: 'Pending Approval', value: 'pending_approval' },
          { label: 'Approved / Published', value: 'approved' },
          { label: 'Changes Requested', value: 'changes_requested' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Completed', value: 'completed' }
        ]
      : [
          { label: 'All Statuses', value: 'all' },
          { label: 'Approved & Published', value: 'approved' },
          { label: 'Pending Admin Approval', value: 'pending_approval' },
          { label: 'Changes Requested by Admin', value: 'changes_requested' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' }
        ]);

  // Date Range Options
  const dateOptions = [
    { label: 'All Dates', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Custom Date', value: 'custom' }
  ];

  const hasActiveFilters =
    Boolean(filters.searchQuery?.trim()) ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.clubId !== 'all' ||
    filters.venueId !== 'all' ||
    filters.dateRange !== 'all' ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  const updateField = (field: keyof EventFilterCriteria, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <div className={`space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs ${className}`}>
      {/* Top Row: Search Input, Quick Category Pills, and Clear Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="dashboard-search-input"
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => updateField('searchQuery', e.target.value)}
            placeholder={placeholderSearch}
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateField('searchQuery', '')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action: Category Quick Pills (Desktop) / Toggle advanced filters */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showAdvanced || hasActiveFilters
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center gap-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Category Pills Bar (Always accessible for quick browsing) */}
      {showCategoryFilter && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs font-semibold scrollbar-none">
          {categoryOptions.map((cat) => (
            <button
              key={cat.value}
              onClick={() => updateField('category', cat.value)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filters.category === cat.value
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Advanced Filter Controls Drawer (Club, Status, Venue, Date) */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
          {/* Club Filter */}
          {showClubFilter && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-500" />
                <span>Club</span>
              </label>
              <select
                id="dashboard-filter-club"
                value={filters.clubId || 'all'}
                onChange={(e) => updateField('clubId', e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Clubs ({clubs.length})</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName ? `${c.shortName} – ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Status</span>
              </label>
              <select
                id="dashboard-filter-status"
                value={filters.status || 'all'}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Venue Filter */}
          {showVenueFilter && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Venue</span>
              </label>
              <select
                id="dashboard-filter-venue"
                value={filters.venueId || 'all'}
                onChange={(e) => updateField('venueId', e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Venues ({venues.length})</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.building})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          {showDateFilter && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                <span>Date Range</span>
              </label>
              <select
                id="dashboard-filter-date"
                value={filters.dateRange || 'all'}
                onChange={(e) => updateField('dateRange', e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {dateOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Date Input (shown if dateRange === 'custom') */}
          {showDateFilter && filters.dateRange === 'custom' && (
            <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3 pt-1">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full py-1 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full py-1 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filter Badges & Count Row */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Showing <strong className="text-blue-600 dark:text-blue-400">{filteredCount}</strong> of {totalCount} events
          </span>

          {/* Active Badges */}
          {filters.searchQuery?.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-900">
              Keyword: "{filters.searchQuery.trim()}"
              <button
                onClick={() => updateField('searchQuery', '')}
                className="hover:text-blue-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.category !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-900">
              Category: {categoryOptions.find((c) => c.value === filters.category)?.label || filters.category}
              <button
                onClick={() => updateField('category', 'all')}
                className="hover:text-indigo-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-900">
              Status: {statusOptions.find((s) => s.value === filters.status)?.label || filters.status}
              <button
                onClick={() => updateField('status', 'all')}
                className="hover:text-emerald-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.clubId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-200 dark:border-purple-900">
              Club: {clubs.find((c) => c.id === filters.clubId)?.shortName || clubs.find((c) => c.id === filters.clubId)?.name || filters.clubId}
              <button
                onClick={() => updateField('clubId', 'all')}
                className="hover:text-purple-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.venueId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-medium border border-rose-200 dark:border-rose-900">
              Venue: {venues.find((v) => v.id === filters.venueId)?.name || filters.venueId}
              <button
                onClick={() => updateField('venueId', 'all')}
                className="hover:text-rose-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.dateRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-900">
              Date: {dateOptions.find((d) => d.value === filters.dateRange)?.label || filters.dateRange}
              <button
                onClick={() => {
                  updateField('dateRange', 'all');
                  updateField('startDate', '');
                  updateField('endDate', '');
                }}
                className="hover:text-amber-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};
