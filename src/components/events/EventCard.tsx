import React from 'react';
import { CampusEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Share2,
  QrCode
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime, calculateTimeRemaining } from '../../utils/calendarUtils';

interface EventCardProps {
  event: CampusEvent;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, compact = false }) => {
  const {
    currentUser,
    registrations,
    setSelectedEventForModal,
    registerForEvent,
    clubs
  } = useApp();

  const isRegistered = registrations.some(
    (r) => r.eventId === event.id && r.studentId === currentUser.id
  );

  const club = clubs.find((c) => c.id === event.clubId);
  const timeRemaining = calculateTimeRemaining(event.date, event.startTime);
  const isHappeningSoon = !timeRemaining.isPast && timeRemaining.totalHours <= 48;
  const isFull = event.currentRegistrations >= event.maxParticipants;
  const fillPercentage = Math.min(100, Math.round((event.currentRegistrations / (event.maxParticipants || 1)) * 100));

  const isAcademic = event.category === 'academic';

  return (
    <div
      onClick={() => setSelectedEventForModal(event)}
      className={`group dashboard-card rounded-2xl border transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden flex flex-col justify-between ${
        isAcademic
          ? 'border-purple-200 dark:border-purple-900/50 hover:border-purple-400'
          : 'hover:border-blue-400'
      }`}
    >
      {/* Top Media / Header */}
      <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={event.posterUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase ${
                isAcademic
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/95 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {event.eventType}
            </span>

            {event.isDontMiss && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-blue-600 text-white shadow-sm uppercase">
                <Flame className="w-3 h-3 fill-current" />
                Featured
              </span>
            )}
          </div>

          <div className="shrink-0">
            <StatusBadge status={event.status} size="sm" />
          </div>
        </div>

        {/* Rescheduled warning pill */}
        {event.rescheduledHistory && (
          <div className="absolute bottom-3 left-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate">Rescheduled: {formatDisplayDate(event.date)}</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1 min-w-0">
              {/* Title */}
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                {event.title}
              </h3>
              
              {/* Organizer / Venue */}
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{event.venueName}</span>
                <span>•</span>
                <span className="truncate">{event.clubName || event.organizerName}</span>
              </p>
            </div>

            {/* Date Badge */}
            <div className="text-center bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                {new Date(event.date).toLocaleString('default', { month: 'short' })}
              </p>
              <p className="text-xl font-bold leading-none text-slate-900 dark:text-slate-100">
                {new Date(event.date).getDate()}
              </p>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {event.shortDescription}
          </p>
        </div>

        {/* Capacity / Registration fill meter */}
        {event.registrationRequired && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-900 dark:text-slate-200">{event.currentRegistrations}/{event.maxParticipants}</strong> Registered
              </span>
              <span className="font-medium text-[11px]">
                {fillPercentage}% full
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  fillPercentage >= 90
                    ? 'bg-rose-500'
                    : fillPercentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDisplayTime(event.startTime)}</span>
          </div>

          {isRegistered ? (
            <div className="py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pass Ready</span>
            </div>
          ) : event.registrationRequired ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if ((event.registrationType === 'external' || event.registrationType === 'link') && event.registrationLink) {
                  window.open(event.registrationLink, '_blank');
                } else {
                  setSelectedEventForModal(event);
                }
              }}
              disabled={isFull}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                isFull
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              {event.registrationType === 'external' || event.registrationType === 'link' ? (
                <>
                  <span>Register</span>
                  <ExternalLink className="w-3 h-3" />
                </>
              ) : event.registrationType === 'qr' ? (
                <>
                  <span>Scan QR</span>
                  <QrCode className="w-3 h-3" />
                </>
              ) : isFull ? (
                <span>Housefull</span>
              ) : (
                <span>Register Now</span>
              )}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEventForModal(event);
              }}
              className="py-2 px-4 rounded-lg bg-white border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
