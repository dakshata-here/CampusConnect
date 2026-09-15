import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AcademicNotice,
  AcademicEventType,
  AcademicPriority,
  AcademicStatus
} from '../../types';
import {
  GraduationCap,
  PlusCircle,
  Search,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  BookmarkCheck,
  Edit2,
  Trash2,
  Eye,
  Bell,
  CalendarPlus,
  Share2,
  X,
  Building,
  Users,
  Info,
  ChevronDown
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/calendarUtils';

export const AcademicCalendarView: React.FC = () => {
  const {
    currentUser,
    academicNotices,
    addAcademicNotice,
    updateAcademicNotice,
    deleteAcademicNotice,
    toggleAcademicNoticeCalendar,
    setActiveTab
  } = useApp();

  const isAdmin = currentUser.role === 'college_admin';

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<AcademicNotice | null>(null);
  const [detailsNotice, setDetailsNotice] = useState<AcademicNotice | null>(null);
  const [deleteTargetNotice, setDeleteTargetNotice] = useState<AcademicNotice | null>(null);
  const [reminderNotice, setReminderNotice] = useState<AcademicNotice | null>(null);
  const [reminderSuccessMessage, setReminderSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEventType, setFormEventType] = useState<AcademicEventType>('Examination');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formEndTime, setFormEndTime] = useState('13:00');
  const [formDepartment, setFormDepartment] = useState('All Departments');
  const [formYear, setFormYear] = useState('All Years');
  const [formSemester, setFormSemester] = useState('All Semesters');
  const [formVenue, setFormVenue] = useState('College Examination Center');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<AcademicPriority>('Normal');
  const [formStatus, setFormStatus] = useState<AcademicStatus>('Published');
  const [formError, setFormError] = useState<string | null>(null);

  // Open Form for Adding
  const handleOpenAddForm = () => {
    setEditingNotice(null);
    setFormName('');
    setFormEventType('Examination');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStartTime('10:00');
    setFormEndTime('13:00');
    setFormDepartment('All Departments');
    setFormYear('All Years');
    setFormSemester('All Semesters');
    setFormVenue('College Central Examination Block');
    setFormDescription('');
    setFormPriority('Normal');
    setFormStatus('Published');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (notice: AcademicNotice) => {
    setEditingNotice(notice);
    setFormName(notice.title);
    setFormEventType(notice.eventType);
    setFormDate(notice.date);
    setFormStartTime(notice.startTime);
    setFormEndTime(notice.endTime);
    setFormDepartment(notice.department);
    setFormYear(notice.year);
    setFormSemester(notice.semester);
    setFormVenue(notice.venue);
    setFormDescription(notice.description);
    setFormPriority(notice.priority);
    setFormStatus(notice.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Handle Form Submit (Save Draft or Publish)
  const handleSaveNotice = (statusToSave: AcademicStatus) => {
    if (!formName.trim()) {
      setFormError('Please enter the notice or event name.');
      return;
    }
    if (!formDate) {
      setFormError('Please select a scheduled date.');
      return;
    }
    if (!formVenue.trim()) {
      setFormError('Please specify the campus venue or room.');
      return;
    }

    if (editingNotice) {
      updateAcademicNotice(editingNotice.id, {
        title: formName.trim(),
        eventType: formEventType,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        department: formDepartment,
        year: formYear,
        semester: formSemester,
        venue: formVenue.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: statusToSave
      });
    } else {
      addAcademicNotice({
        title: formName.trim(),
        eventType: formEventType,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        department: formDepartment,
        year: formYear,
        semester: formSemester,
        venue: formVenue.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: statusToSave,
        addedToCalendar: statusToSave === 'Published'
      });
    }

    setIsFormOpen(false);
    setEditingNotice(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (deleteTargetNotice) {
      deleteAcademicNotice(deleteTargetNotice.id);
      setDeleteTargetNotice(null);
    }
  };

  // Set Reminder for Student
  const handleSetReminder = (notice: AcademicNotice, timing: string) => {
    setReminderNotice(null);
    setReminderSuccessMessage(
      `Reminder set successfully! You will receive an alert ${timing} before "${notice.title}".`
    );
    setTimeout(() => {
      setReminderSuccessMessage(null);
    }, 4000);
  };

  // Download .ics for personal calendar integration
  const handleExportICS = (notice: AcademicNotice) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CampusConnect//AcademicCalendar//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${notice.title}`,
      `DESCRIPTION:${notice.description} | Target: ${notice.department} (${notice.year})`,
      `LOCATION:${notice.venue}`,
      `DTSTART:${notice.date.replace(/-/g, '')}T${notice.startTime.replace(/:/g, '')}00`,
      `DTEND:${notice.date.replace(/-/g, '')}T${notice.endTime.replace(/:/g, '')}00`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${notice.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Notices
  const filteredNotices = (academicNotices || []).filter((notice) => {
    // Non-admin can only see Published notices
    if (!isAdmin && notice.status !== 'Published') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        notice.title.toLowerCase().includes(q) ||
        notice.description.toLowerCase().includes(q) ||
        notice.venue.toLowerCase().includes(q) ||
        notice.department.toLowerCase().includes(q) ||
        notice.eventType.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Type filter
    if (selectedType !== 'all' && notice.eventType !== selectedType) return false;

    // Department filter
    if (
      selectedDept !== 'all' &&
      notice.department !== 'All Departments' &&
      !notice.department.toLowerCase().includes(selectedDept.toLowerCase())
    ) {
      return false;
    }

    // Priority filter
    if (selectedPriority !== 'all' && notice.priority !== selectedPriority) return false;

    // Status filter (Admin only)
    if (isAdmin && selectedStatus !== 'all' && notice.status !== selectedStatus) return false;

    return true;
  });

  // Priority styling helper
  const getPriorityBadge = (priority: AcademicPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-3 h-3" />
            Urgent Priority
          </span>
        );
      case 'Important':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            Important
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            Normal
          </span>
        );
    }
  };

  const getTypeBadge = (type: AcademicEventType) => {
    let colorClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (type === 'Examination' || type === 'Practical Examination') {
      colorClass = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900';
    } else if (type === 'Project Submission' || type === 'Assignment Deadline') {
      colorClass = 'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-900';
    } else if (type === 'Holiday') {
      colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900';
    } else if (type === 'Semester Start' || type === 'Semester End') {
      colorClass = 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900';
    }
    return (
      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${colorClass}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {reminderSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">{reminderSuccessMessage}</span>
        </div>
      )}

      {/* TOP SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Official Academic Calendar & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            University examinations, project milestones, practical tests, and official college academic schedules
          </p>
        </div>

        {/* Add Academic Notice button (Admin Only) */}
        {isAdmin && (
          <button
            id="add-academic-notice-btn"
            onClick={handleOpenAddForm}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-purple-500/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Academic Notice</span>
          </button>
        )}
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search academic events, exams, assignments, or venues…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Event Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Event Types</option>
              <option value="Examination">Examination</option>
              <option value="Practical Examination">Practical Examination</option>
              <option value="Project Submission">Project Submission</option>
              <option value="Assignment Deadline">Assignment Deadline</option>
              <option value="Semester Start">Semester Start</option>
              <option value="Semester End">Semester End</option>
              <option value="Holiday">Holiday</option>
              <option value="Academic Notice">Academic Notice</option>
              <option value="Other">Other</option>
            </select>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Departments</option>
              <option value="Computer">Computer Engg</option>
              <option value="IT">Information Tech</option>
              <option value="Electronics">E&TC</option>
              <option value="AI">AI & Data Science</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="Important">Important</option>
              <option value="Normal">Normal</option>
            </select>

            {/* Status Filter (Admin only) */}
            {isAdmin && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            )}
          </div>
        </div>

        {/* Active count & Master Calendar link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-slate-100">{filteredNotices.length}</strong> official academic notices
          </span>
          <button
            onClick={() => setActiveTab('calendar')}
            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Open Campus Master Calendar</span>
          </button>
        </div>
      </div>

      {/* ACADEMIC EVENT CARDS GRID */}
      {filteredNotices.length === 0 ? (
        <div className="dashboard-card p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
          <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Academic Events Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedType !== 'all' || selectedPriority !== 'all'
              ? 'No notices match your active filters. Try resetting search criteria.'
              : 'Official university examination schedules and notices will appear here once published.'}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAddForm}
              className="mt-4 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
            >
              + Create First Academic Notice
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="dashboard-card rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md relative overflow-hidden"
            >
              {/* Top Row: Type, Status, Priority */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getTypeBadge(notice.eventType)}
                    {isAdmin && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          notice.status === 'Published'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                        }`}
                      >
                        {notice.status}
                      </span>
                    )}
                  </div>
                  {getPriorityBadge(notice.priority)}
                </div>

                {/* Event Name */}
                <div>
                  <h3
                    onClick={() => setDetailsNotice(notice)}
                    className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors"
                  >
                    {notice.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5">
                    {notice.description}
                  </p>
                </div>

                {/* Key Meta Details */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatDisplayDate(notice.date)}
                    </span>
                    <span className="text-slate-400">•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {formatDisplayTime(notice.startTime)} – {formatDisplayTime(notice.endTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{notice.venue}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {notice.department} • {notice.year} ({notice.semester})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {/* View Details (Available for all) */}
                <button
                  id={`view-details-${notice.id}`}
                  onClick={() => setDetailsNotice(notice)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {/* Admin Actions: Edit & Delete */}
                {isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`edit-notice-${notice.id}`}
                      onClick={() => handleOpenEditForm(notice)}
                      title="Edit Notice"
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      id={`delete-notice-${notice.id}`}
                      onClick={() => setDeleteTargetNotice(notice)}
                      title="Delete Notice"
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>

                    <button
                      id={`calendar-toggle-${notice.id}`}
                      onClick={() => toggleAcademicNoticeCalendar(notice.id)}
                      title={notice.addedToCalendar ? 'Included in Master Calendar' : 'Add to Master Calendar'}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        notice.addedToCalendar
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-purple-50'
                      }`}
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Student / Club Lead Actions: Set Reminder & Add to Calendar */
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`set-reminder-${notice.id}`}
                      onClick={() => setReminderNotice(notice)}
                      title="Set Alert Reminder"
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Reminder</span>
                    </button>

                    <button
                      id={`add-calendar-${notice.id}`}
                      onClick={() => handleExportICS(notice)}
                      title="Add to Personal Calendar (.ics)"
                      className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Calendar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT ACADEMIC NOTICE MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {editingNotice ? 'Edit Academic Notice' : 'Add Academic Notice'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official schedule for exams, project submissions, and university milestones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Notice Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notice / Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. In-Sem Theory Examination, Capstone Project Milestone-1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Grid: Event Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value as AcademicEventType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Examination">Examination</option>
                    <option value="Practical Examination">Practical Examination</option>
                    <option value="Project Submission">Project Submission</option>
                    <option value="Assignment Deadline">Assignment Deadline</option>
                    <option value="Semester Start">Semester Start</option>
                    <option value="Semester End">Semester End</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Academic Notice">Academic Notice</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as AcademicPriority)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Grid: Date, Start Time, End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid: Department, Year, Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Branch
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="All Departments">All Departments</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                    <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                    <option value="First Year Applied Sciences">First Year Applied Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Year
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="All Years">All Years</option>
                    <option value="FE (1st Year)">FE (1st Year)</option>
                    <option value="SE (2nd Year)">SE (2nd Year)</option>
                    <option value="TE (3rd Year)">TE (3rd Year)</option>
                    <option value="BE (4th Year)">BE (4th Year)</option>
                    <option value="TE & BE">TE & BE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="All Semesters">All Semesters</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                    <option value="Semester 5 & 7">Semester 5 & 7</option>
                  </select>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Venue / Room <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Examination Blocks A1-A4, Central Computing Lab, Main Auditorium"
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notice Details & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify guidelines, required documents, seating arrangement, or submission links..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Status Select */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Publishing Status
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status_radio"
                      checked={formStatus === 'Published'}
                      onChange={() => setFormStatus('Published')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Published (Live to students & on Master Calendar)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status_radio"
                      checked={formStatus === 'Draft'}
                      onChange={() => setFormStatus('Draft')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Save as Draft (Admin only)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Buttons: Cancel, Save Draft, Publish */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSaveNotice('Draft')}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-900 rounded-xl transition-colors cursor-pointer"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleSaveNotice('Published')}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md hover:shadow-purple-500/25 transition-all cursor-pointer"
              >
                Publish Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {detailsNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getTypeBadge(detailsNotice.eventType)}
                  {getPriorityBadge(detailsNotice.priority)}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {detailsNotice.title}
                </h2>
              </div>
              <button
                onClick={() => setDetailsNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="font-semibold">{formatDisplayDate(detailsNotice.date)}</span>
                <span>•</span>
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {formatDisplayTime(detailsNotice.startTime)} to {formatDisplayTime(detailsNotice.endTime)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Venue: <strong>{detailsNotice.venue}</strong></span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>
                  Audience: <strong>{detailsNotice.department}</strong> ({detailsNotice.year}, {detailsNotice.semester})
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Notice Information & Instructions
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {detailsNotice.description || 'No additional instructions provided for this milestone.'}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Issued by: {detailsNotice.createdByName}</span>
              <span>Status: {detailsNotice.status}</span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              {!isAdmin && (
                <button
                  onClick={() => {
                    handleExportICS(detailsNotice);
                    setDetailsNotice(null);
                  }}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Add to Calendar</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    const t = detailsNotice;
                    setDetailsNotice(null);
                    handleOpenEditForm(t);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Notice</span>
                </button>
              )}

              <button
                onClick={() => setDetailsNotice(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteTargetNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Are you sure you want to delete this academic event?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                "{deleteTargetNotice.title}" will be permanently removed from the official academic calendar and milestones.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="cancel-delete-notice-btn"
                onClick={() => setDeleteTargetNotice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-notice-btn"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-colors"
              >
                Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SET REMINDER MODAL (Students & Club Leads) */}
      {/* ========================================================================= */}
      {reminderNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Set Event Reminder</h3>
              </div>
              <button onClick={() => setReminderNotice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Choose when you would like to be alerted for <strong>"{reminderNotice.title}"</strong>:
            </p>

            <div className="space-y-2 text-xs">
              {[
                { label: '1 Day Before (Recommended)', val: '1 day' },
                { label: '6 Hours Before', val: '6 hours' },
                { label: '2 Hours Before', val: '2 hours' },
                { label: '30 Minutes Before', val: '30 minutes' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleSetReminder(reminderNotice, opt.val)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-amber-50 dark:bg-slate-800/60 dark:hover:bg-amber-950/40 hover:border-amber-400 dark:hover:border-amber-700 transition-colors font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>{opt.label}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setReminderNotice(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
