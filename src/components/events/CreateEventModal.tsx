import React, { useState, useEffect, useRef } from 'react';
import { CampusEvent, EventType } from '../../types';
import { useApp } from '../../context/AppContext';
import { detectEventConflicts } from '../../utils/calendarUtils';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Building2,
  HelpCircle,
  Upload,
  Link as LinkIcon,
  QrCode,
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react';

interface CreateEventModalProps {
  onClose: () => void;
}

const PRESET_POSTERS = [
  { label: 'Hackathon / Code', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80' },
  { label: 'AI & Data Science', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Robotics & Hardware', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80' },
  { label: 'Photography & Arts', url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80' },
  { label: 'Startups & Business', url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=80' },
  { label: 'Exam / Academic', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
  { label: 'Campus Fest', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80' }
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose }) => {
  const { currentUser, clubs, venues, events, createEventProposal } = useApp();

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('Workshop');
  const [category, setCategory] = useState<'club' | 'academic'>(
    currentUser.role === 'college_admin' ? 'academic' : 'club'
  );
  const [clubId, setClubId] = useState<string>(currentUser.clubId || clubs[0]?.id || '');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState(PRESET_POSTERS[0].url);
  const [customPoster, setCustomPoster] = useState('');
  const [posterFileName, setPosterFileName] = useState('');
  const [posterInputMode, setPosterInputMode] = useState<'upload' | 'url'>('upload');
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  // Schedule & Venue
  const [date, setDate] = useState('2026-09-20');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [venueId, setVenueId] = useState(venues[0]?.id || 'venue_auditorium');

  // Registration
  const [registrationRequired, setRegistrationRequired] = useState(true);
  const [registrationMethod, setRegistrationMethod] = useState<'qr' | 'link'>('qr');
  const [registrationLink, setRegistrationLink] = useState('');
  const [registrationQrUrl, setRegistrationQrUrl] = useState('');
  const [qrFileName, setQrFileName] = useState('');
  const [qrInputMode, setQrInputMode] = useState<'upload' | 'url'>('upload');
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-09-19T23:59');
  const [maxParticipants, setMaxParticipants] = useState(150);

  // Handlers for Poster Upload & URL
  const handlePosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Please select a poster image smaller than 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomPoster(reader.result);
          setPosterFileName(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePastePosterUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setCustomPoster(text.trim());
        setPosterFileName('');
      } else {
        const manual = prompt('Paste your poster image URL:');
        if (manual) {
          setCustomPoster(manual.trim());
          setPosterFileName('');
        }
      }
    } catch {
      const manual = prompt('Paste your poster image URL:');
      if (manual) {
        setCustomPoster(manual.trim());
        setPosterFileName('');
      }
    }
  };

  // Handlers for QR Upload & URL
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Please select a QR code image smaller than 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setRegistrationQrUrl(reader.result);
          setQrFileName(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteQrUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setRegistrationQrUrl(text.trim());
        setQrFileName('');
      } else {
        const manual = prompt('Paste your QR Code Image URL:');
        if (manual) {
          setRegistrationQrUrl(manual.trim());
          setQrFileName('');
        }
      }
    } catch {
      const manual = prompt('Paste your QR Code Image URL:');
      if (manual) {
        setRegistrationQrUrl(manual.trim());
        setQrFileName('');
      }
    }
  };

  const handlePasteRegistrationLink = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        setRegistrationLink(clipText.trim());
      } else {
        const manual = prompt('Paste your registration link here:');
        if (manual) setRegistrationLink(manual.trim());
      }
    } catch {
      const manual = prompt('Paste your registration link here:');
      if (manual) setRegistrationLink(manual.trim());
    }
  };

  // Additional Details
  const [eligibility, setEligibility] = useState('Open to all engineering students across all branches and years.');
  const [requiredMaterials, setRequiredMaterials] = useState('College ID card and laptops with charging adapters.');
  const [instructions, setInstructions] = useState('Please arrive 15 minutes prior to start time for check-in.');
  const [contactPerson, setContactPerson] = useState(currentUser.name);
  const [contactEmail, setContactEmail] = useState(currentUser.email);
  const [contactNumber, setContactNumber] = useState('+91 98811 22334');

  // Real-time Conflict Detection
  const selectedVenue = venues.find((v) => v.id === venueId);
  const conflict = detectEventConflicts(
    {
      date,
      startTime,
      endTime,
<<<<<<< HEAD
      venueId
=======
      venueId,
      venueName: selectedVenue?.name
>>>>>>> eff49e3 (First commit)
    },
    events
  );

  const handleSubmit = (asDraft: boolean = false) => {
    if (!title.trim()) {
      alert('Please enter an Event Name.');
      return;
    }

<<<<<<< HEAD
=======
    if (conflict.hasConflict) {
      alert(conflict.message);
      return;
    }

>>>>>>> eff49e3 (First commit)
    if (registrationRequired && !asDraft) {
      if (registrationMethod === 'qr' && !registrationQrUrl.trim()) {
        alert('Please upload a QR code image or provide a QR image URL.');
        return;
      }
      if (registrationMethod === 'link' && !registrationLink.trim()) {
        alert('Please paste and upload the registration link.');
        return;
      }
    }

    const newEvt = createEventProposal({
      title,
      eventType,
      category,
      clubId: category === 'club' ? clubId : undefined,
      shortDescription,
      fullDescription,
      posterUrl: customPoster.trim() || posterUrl,
      date,
      startTime,
      endTime,
      venueId,
      venueName: selectedVenue?.name || 'College Hall',
      registrationRequired,
      registrationType: registrationMethod,
      registrationLink: registrationMethod === 'link' ? registrationLink.trim() : undefined,
      registrationQrUrl: registrationMethod === 'qr' ? registrationQrUrl.trim() : undefined,
      registrationDeadline,
      maxParticipants: Number(maxParticipants),
      eligibility,
      requiredMaterials,
      instructions,
      contactPerson,
      contactEmail,
      contactNumber,
      status: asDraft ? 'draft' : undefined
    });

    if (!asDraft && currentUser.role !== 'college_admin') {
      alert(`Approval request sent to Admin! Your event proposal "${title}" has been submitted to the College Admin for approval and will appear on the calendar once approved.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {currentUser.role === 'college_admin'
                    ? 'Publish Academic / College Event'
                    : 'Submit Club Event Proposal'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser.role === 'college_admin'
                    ? 'Fill event details and publish directly to calendar.'
                    : 'Proposals are submitted to College Admin for approval before appearing on the campus calendar.'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-8 space-y-8 max-h-[calc(85vh-9rem)] overflow-y-auto">
          
          {/* Real-time Conflict Alert Box */}
          {conflict.hasConflict && (
<<<<<<< HEAD
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-amber-900 dark:text-amber-200">
                  {conflict.type === 'venue' ? '⚠️ Venue Conflict Detected' : '⚠️ Schedule Warning'}
                </div>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  {conflict.message}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: Change the venue or adjust start/end times to avoid overlapping with "{conflict.conflictingEvent?.title}".
=======
            <div
              role="alert"
              className="p-4 rounded-2xl border flex items-start gap-3 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400 animate-bounce" />
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-rose-900 dark:text-rose-200">
                  ⚠️ Venue Conflict
                </div>
                <p className="font-bold leading-relaxed text-rose-800 dark:text-rose-300 text-sm">
                  {conflict.message}
                </p>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  Please select a different venue or adjust the event date/time.
>>>>>>> eff49e3 (First commit)
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              1. Basic Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. HackGenesis 2026 — National 24hr Hackathon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Ideathon">Ideathon</option>
                  <option value="SIG Session">SIG Session</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Competition">Competition</option>
                  <option value="Technical Event">Technical Event</option>
                  <option value="Cultural Event">Cultural Event</option>
                  <option value="Sports Event">Sports Event</option>
                  <option value="Guest Lecture">Guest Lecture</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Orientation">Orientation</option>
                  <option value="Academic">Academic</option>
                  <option value="Internal Exam">Internal Exam</option>
                  <option value="End Sem Exam">End Sem Exam</option>
                  <option value="Project Submission">Project Submission</option>
                  <option value="College Fest">College Fest</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Host Club / Organization *
                </label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  disabled={currentUser.role === 'president' || currentUser.role === 'subhead'}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description (Summary on Cards)
                </label>
                <input
                  type="text"
                  placeholder="One catchy sentence describing this event..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Description & Agenda
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed schedule, speaker highlights, prize pool, hands-on tracks..."
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Poster Picker & Attachment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Event Poster Theme
              </label>
              {customPoster && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomPoster('');
                    setPosterFileName('');
                  }}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset to Presets</span>
                </button>
              )}
            </div>

            {/* Preset Themes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_POSTERS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPosterUrl(preset.url);
                    setCustomPoster('');
                    setPosterFileName('');
                  }}
                  className={`relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    posterUrl === preset.url && !customPoster
                      ? 'border-indigo-600 scale-102 shadow-md ring-2 ring-indigo-500/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center p-1 text-center">
                    <span className="text-[11px] font-bold text-white leading-tight">
                      {preset.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Poster Attachment (Upload Image or URL Link) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Attach Poster Image (Upload or URL)</span>
                </span>

                <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPosterInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      posterInputMode === 'upload'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterInputMode('url')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      posterInputMode === 'url'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Image URL Link</span>
                  </button>
                </div>
              </div>

              {posterInputMode === 'upload' ? (
                <div>
                  <input
                    ref={posterFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePosterFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => posterFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setCustomPoster(reader.result);
                            setPosterFileName(file.name);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/60 dark:bg-slate-900/40 hover:bg-indigo-50/20"
                  >
                    <Upload className="w-6 h-6 mx-auto text-indigo-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Click to upload poster image or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      placeholder="Paste poster image URL (e.g. https://...)..."
                      value={customPoster.startsWith('data:') ? '' : customPoster}
                      onChange={(e) => {
                        setCustomPoster(e.target.value);
                        setPosterFileName('');
                      }}
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePastePosterUrl}
                    className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Paste URL
                  </button>
                </div>
              )}

              {/* Attached Poster Preview */}
              {customPoster && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={customPoster}
                      alt="Attached Poster Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-indigo-200 dark:border-indigo-800 shrink-0"
                    />
                    <div className="min-w-0 text-left">
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider">
                        {posterFileName ? 'Attached File' : 'Attached URL'}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 max-w-[200px] sm:max-w-md">
                        {posterFileName || customPoster}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPoster('');
                      setPosterFileName('');
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove Attached Poster"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Schedule & Venue */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              2. Schedule & Venue Selection
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  College Venue Dropdown *
                </label>
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
<<<<<<< HEAD
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
=======
                  className={`w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    conflict.hasConflict && conflict.type === 'venue'
                      ? 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-400/30'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
>>>>>>> eff49e3 (First commit)
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Capacity: {v.capacity} pax | {v.building}, {v.floor} | {v.facilities.slice(0, 2).join(', ')})
                    </option>
                  ))}
                </select>
<<<<<<< HEAD
=======

                {/* Venue Conflict Error Message right below the dropdown */}
                {conflict.hasConflict && conflict.type === 'venue' && (
                  <div
                    role="alert"
                    className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{conflict.message}</span>
                  </div>
                )}

>>>>>>> eff49e3 (First commit)
                {selectedVenue && (
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Facilities:</span>
                    {selectedVenue.facilities.map((fac, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Registration Rules */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              3. Registration Settings
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="regReq"
                  checked={registrationRequired}
                  onChange={(e) => setRegistrationRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="regReq" className="font-bold text-slate-700 dark:text-slate-300">
                  Registration Required?
                </label>
              </div>

              {registrationRequired && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Method
                  </label>
                  <select
                    value={registrationMethod}
                    onChange={(e) => setRegistrationMethod(e.target.value as 'qr' | 'link')}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500 text-xs"
                  >
                    <option value="qr">Upload QR</option>
                    <option value="link">Upload Link</option>
                  </select>
                </div>
              )}

              {/* Upload QR Mode */}
              {registrationRequired && registrationMethod === 'qr' && (
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Registration QR Code *</span>
                    </div>

                    {/* Mode Toggle: Upload Image vs QR URL */}
                    <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setQrInputMode('upload')}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          qrInputMode === 'upload'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload QR Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrInputMode('url')}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          qrInputMode === 'url'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>QR Image URL</span>
                      </button>
                    </div>
                  </div>

                  {qrInputMode === 'upload' ? (
                    <div>
                      <input
                        ref={qrFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleQrFileUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => qrFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setRegistrationQrUrl(reader.result);
                                setQrFileName(file.name);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/60 dark:bg-slate-900/40 hover:bg-indigo-50/20"
                      >
                        <QrCode className="w-7 h-7 mx-auto text-indigo-500 mb-1.5" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Click to upload QR code image or drag & drop here
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          PNG, JPG, SVG of event registration QR code (UPI, Google Form, WhatsApp group)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="Paste image URL of the QR code (e.g. https://.../qr.png)..."
                          value={registrationQrUrl.startsWith('data:') ? '' : registrationQrUrl}
                          onChange={(e) => {
                            setRegistrationQrUrl(e.target.value);
                            setQrFileName('');
                          }}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handlePasteQrUrl}
                        className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Paste QR URL
                      </button>
                    </div>
                  )}

                  {/* QR Image Live Preview */}
                  {registrationQrUrl && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                          <img
                            src={registrationQrUrl}
                            alt="QR Code Preview"
                            className="w-16 h-16 object-contain rounded"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>QR Code Attached Successfully</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-xs sm:max-w-sm mt-0.5">
                            {qrFileName || (registrationQrUrl.startsWith('data:') ? 'Uploaded Image File' : registrationQrUrl)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegistrationQrUrl('');
                          setQrFileName('');
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Remove QR Code"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Link Mode */}
              {registrationRequired && registrationMethod === 'link' && (
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Registration Link *</span>
                    </label>
                    {registrationLink && (
                      <a
                        href={registrationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        placeholder="Paste or enter registration link (e.g. Google Form, Devfolio, Unstop)..."
                        value={registrationLink}
                        onChange={(e) => setRegistrationLink(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handlePasteRegistrationLink}
                      className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Link</span>
                    </button>
                  </div>

                  {registrationLink && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px]">
                      <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 truncate">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-semibold">Uploaded Link:</span>
                        <span className="truncate font-mono">{registrationLink}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegistrationLink('')}
                        className="text-rose-500 hover:text-rose-700 ml-2 shrink-0 font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {registrationRequired && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Max Participants / Seats
                    </label>
                    <input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Registration Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Eligibility & Contact */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              4. Eligibility & Contact Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eligibility
                </label>
                <input
                  type="text"
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Required Materials
                </label>
                <input
                  type="text"
                  value={requiredMaterials}
                  onChange={(e) => setRequiredMaterials(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Email & Phone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-6 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {currentUser.role === 'college_admin'
                  ? 'Publish Event Directly'
                  : "Submit for Admin's Approval"}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
