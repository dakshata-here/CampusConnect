import {
  CampusEvent,
  EventStatus,
  Registration,
  Club,
  Venue,
  User,
  PopulatedClub,
  PopulatedVenue
} from '../types';

const TOKEN_KEY = 'campusconnect_token';
const FALLBACK_TOKEN_KEY = 'token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(FALLBACK_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(FALLBACK_TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(FALLBACK_TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Generic API request wrapper with centralized error handling
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {})
  };

  if (options.body && !(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && data.message) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Mappers between backend MongoDB responses and frontend state types
 */
export function mapBackendEventToCampusEvent(raw: any): CampusEvent {
  const clubObj = typeof raw.clubId === 'object' && raw.clubId !== null ? raw.clubId : null;
  const clubIdStr = clubObj?._id?.toString() || clubObj?.id || (typeof raw.clubId === 'string' ? raw.clubId : null);
  const clubNameStr =
    clubObj?.name ||
    raw.clubName ||
    (String(raw.category).toUpperCase() === 'ACADEMIC' ? 'Academic Council' : 'College Club');

  const venueObj = typeof raw.venueId === 'object' && raw.venueId !== null ? raw.venueId : null;
  const venueIdStr = venueObj?._id?.toString() || venueObj?.id || (typeof raw.venueId === 'string' ? raw.venueId : null);
  const venueNameStr = venueObj?.name || raw.venueName || 'On Campus / TBD';

  // Format date string to YYYY-MM-DD safely preserving local calendar date
  let dateStr = '';
  if (raw.date) {
    if (typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw.date)) {
      dateStr = raw.date.slice(0, 10);
    } else {
      const d = new Date(raw.date);
      if (!isNaN(d.getTime())) {
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        dateStr = String(raw.date).slice(0, 10);
      }
    }
  }

  // Normalize status to lowercase for frontend components
  const statusStr = (raw.status || 'draft').toLowerCase() as EventStatus;
  const isAcademicCategory = String(raw.category || '').toLowerCase() === 'academic';

  return {
    id: raw.id || raw._id?.toString() || '',
    clubId: clubIdStr,
    clubName: clubNameStr,
    clubLogo: raw.clubLogo || clubObj?.logoUrl,
    club: clubObj
      ? ({
          id: clubIdStr,
          _id: clubIdStr,
          name: clubObj.name,
          shortName: clubObj.shortName || clubObj.name,
          category: clubObj.category,
          status: clubObj.status,
          logoUrl: clubObj.logoUrl
        } as PopulatedClub)
      : undefined,
    title: raw.title || '',
    eventType: raw.eventType || 'Workshop',
    category: isAcademicCategory ? 'academic' : 'club',
    academicType: raw.academicType,
    shortDescription: raw.shortDescription || '',
    description: raw.description || raw.fullDescription || '',
    fullDescription: raw.fullDescription || raw.description || '',
    agenda: raw.agenda || '',
    posterTheme: raw.posterTheme || '',
    posterUrl:
      raw.posterUrl ||
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    organizerName:
      raw.contactPerson ||
      raw.organizerName ||
      (typeof raw.proposedBy === 'object' ? raw.proposedBy?.name : 'Organizer'),
    date: dateStr,
    endDate: raw.endDate
      ? (typeof raw.endDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw.endDate)
          ? raw.endDate.slice(0, 10)
          : (() => {
              const d = new Date(raw.endDate);
              return !isNaN(d.getTime())
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                : String(raw.endDate).slice(0, 10);
            })())
      : null,
    startTime: raw.startTime || '',
    endTime: raw.endTime || '',
    venueId: venueIdStr,
    venueName: venueNameStr,
    venue: venueObj
      ? ({
          id: venueIdStr,
          _id: venueIdStr,
          name: venueObj.name,
          building: venueObj.building || '',
          floor: venueObj.floor || '',
          capacity: venueObj.capacity || 0,
          operationalStatus: venueObj.operationalStatus,
          facilities: venueObj.facilities || []
        } as PopulatedVenue)
      : undefined,
    proposedBy: raw.proposedBy,
    registrationRequired: Boolean(raw.registrationRequired),
    registrationMethod: raw.registrationMethod || 'CAMPUSCONNECT',
    registrationType: raw.registrationType || (raw.registrationMethod === 'EXTERNAL' ? 'external' : 'internal'),
    registrationLink: raw.externalRegistrationUrl || raw.registrationLink,
    externalRegistrationUrl: raw.externalRegistrationUrl,
    registrationQrUrl: raw.externalRegistrationQrUrl || raw.registrationQrUrl,
    externalRegistrationQrUrl: raw.externalRegistrationQrUrl,
    registrationDeadline: raw.registrationDeadline
      ? new Date(raw.registrationDeadline).toISOString().split('T')[0]
      : null,
    maxParticipants: raw.maxParticipants,
    currentRegistrations: raw.currentRegistrations,
    meetingLink: raw.meetingLink,
    eligibility: raw.eligibility || 'Open to all students',
    requiredMaterials: raw.requiredMaterials || '',
    instructions: raw.instructions || '',
    contactPerson: raw.contactPerson || '',
    contactEmail: raw.contactEmail || '',
    contactPhone: raw.contactPhone,
    contactNumber: raw.contactPhone || raw.contactNumber,
    status: statusStr,
    createdBy: typeof raw.proposedBy === 'object' ? raw.proposedBy?._id?.toString() : raw.proposedBy,
    createdByName: typeof raw.proposedBy === 'object' ? raw.proposedBy?.name : raw.createdByName,
    createdByRole: typeof raw.proposedBy === 'object' ? raw.proposedBy?.role : raw.createdByRole,
    rejectionReason: raw.rejectionReason,
    changeComments: raw.changeComments,
    rescheduledHistory: raw.rescheduledHistory,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : undefined
  };
}

export function mapBackendRegistrationToRegistration(raw: any): Registration {
  const studentUser = typeof raw.studentId === 'object' && raw.studentId !== null ? raw.studentId : null;
  const eventObj = typeof raw.eventId === 'object' && raw.eventId !== null ? raw.eventId : null;

  let eventDateStr = '';
  if (eventObj?.date) {
    const d = new Date(eventObj.date);
    eventDateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(eventObj.date);
  }

  const regDateStr = raw.registrationDate
    ? new Date(raw.registrationDate).toISOString()
    : new Date().toISOString();

  let attendanceStatus: 'registered' | 'attended' | 'cancelled' = 'registered';
  const rawStatus = String(raw.attendanceStatus || '').toUpperCase();
  if (rawStatus === 'ATTENDED') {
    attendanceStatus = 'attended';
  } else if (rawStatus === 'CANCELLED') {
    attendanceStatus = 'cancelled';
  }

  return {
    id: raw.id || raw._id?.toString() || '',
    eventId: eventObj?._id?.toString() || eventObj?.id || (typeof raw.eventId === 'string' ? raw.eventId : ''),
    eventTitle: eventObj?.title || raw.eventTitle || 'Campus Event',
    eventDate: eventDateStr || raw.eventDate || '',
    eventTime: eventObj?.startTime ? `${eventObj.startTime} - ${eventObj.endTime || ''}` : raw.eventTime || '',
    venueName: eventObj?.venueId?.name || raw.venueName || 'Campus Venue',
    studentId: studentUser?._id?.toString() || studentUser?.id || (typeof raw.studentId === 'string' ? raw.studentId : ''),
    studentName: raw.studentName || studentUser?.name || '',
    studentEmail: raw.studentEmail || studentUser?.email || '',
    studentEnrollment: raw.studentEnrollment || studentUser?.enrollmentNumber || '',
    department: raw.department || studentUser?.department || '',
    year: raw.year || studentUser?.year || '',
    phone: raw.phone || studentUser?.phone || '',
    teamName: raw.teamName || '',
    registrationDate: regDateStr,
    attendanceStatus,
    attendedAt: raw.attendedAt ? new Date(raw.attendedAt).toISOString() : undefined,
    qrCodeData: raw.qrCodeData || raw.id || raw._id?.toString() || '',
    qrCodeString: raw.qrCodeString || raw.qrCodeData
  };
}

// ==========================================
// API Operations
// ==========================================

export async function loginApi(credentials: {
  identifier: string;
  password?: string;
  role?: string;
  club?: string;
  clubId?: string;
  clubName?: string;
  securityAnswer?: string;
}): Promise<{ token: string; user: User; mustChangePassword?: boolean; message?: string }> {
  const data = await apiFetch<{
    success: boolean;
    token: string;
    user: any;
    mustChangePassword?: boolean;
    message?: string;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  if (data.token) {
    setToken(data.token);
  }
  return {
    token: data.token,
    user: data.user,
    mustChangePassword: data.mustChangePassword,
    message: data.message
  };
}

export async function changePasswordApi(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string; token: string; user: User }> {
  const data = await apiFetch<{
    success: boolean;
    message: string;
    token: string;
    user: any;
  }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(params)
  });

  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function forgotPasswordApi(identifier: string): Promise<{
  success: boolean;
  message: string;
  requiresAdminIssuance?: boolean;
}> {
  return await apiFetch<{
    success: boolean;
    message: string;
    requiresAdminIssuance?: boolean;
  }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier })
  });
}

export async function resetPasswordApi(params: {
  token: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  return await apiFetch<{
    success: boolean;
    message: string;
  }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function getMeApi(): Promise<User> {
  const data = await apiFetch<{ success: boolean; user: any }>('/api/auth/me', {
    method: 'GET'
  });
  return data.user;
}

export async function fetchEventsApi(includePast: boolean = false): Promise<CampusEvent[]> {
  const queryParam = includePast ? '?includePast=true' : '';
  const data = await apiFetch<{
    success: boolean;
    count: number;
    events: any[];
  }>(`/api/events${queryParam}`, {
    method: 'GET'
  });
  return (data.events || []).map(mapBackendEventToCampusEvent);
}

export async function fetchEventByIdApi(id: string): Promise<CampusEvent> {
  const data = await apiFetch<{
    success: boolean;
    event: any;
  }>(`/api/events/${id}`, {
    method: 'GET'
  });
  return mapBackendEventToCampusEvent(data.event);
}

export async function createEventApi(eventData: Partial<CampusEvent>): Promise<CampusEvent> {
  const payload: any = {
    title: eventData.title,
    eventType: eventData.eventType || 'Workshop',
    category: String(eventData.category).toUpperCase() === 'ACADEMIC' ? 'ACADEMIC' : 'CLUB',
    shortDescription: eventData.shortDescription || '',
    description: eventData.fullDescription || eventData.description || '',
    agenda: eventData.agenda || '',
    posterTheme: eventData.posterTheme || '',
    posterUrl: eventData.posterUrl || '',
    date: eventData.date,
    endDate: eventData.endDate || undefined,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    venueId: eventData.venueId || undefined,
    clubId: eventData.clubId || undefined,
    maxParticipants: eventData.maxParticipants ? Number(eventData.maxParticipants) : null,
    registrationRequired: Boolean(eventData.registrationRequired),
    registrationMethod: eventData.registrationMethod || 'CAMPUSCONNECT',
    externalRegistrationUrl: eventData.externalRegistrationUrl || eventData.registrationLink || '',
    externalRegistrationQrUrl: eventData.externalRegistrationQrUrl || eventData.registrationQrUrl || '',
    registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null,
    eligibility: eventData.eligibility || 'Open to all students',
    requiredMaterials: eventData.requiredMaterials || '',
    contactPerson: eventData.contactPerson || '',
    contactEmail: eventData.contactEmail || '',
    contactPhone: eventData.contactPhone || eventData.contactNumber || '',
    status: eventData.status ? String(eventData.status).toUpperCase() : undefined
  };

  const data = await apiFetch<{
    success: boolean;
    message: string;
    event: any;
  }>('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return mapBackendEventToCampusEvent(data.event);
}

export async function updateEventApi(id: string, updates: Partial<CampusEvent>): Promise<CampusEvent> {
  const payload: any = { ...updates };
  if (payload.category) {
    payload.category = String(payload.category).toUpperCase() === 'ACADEMIC' ? 'ACADEMIC' : 'CLUB';
  }
  if (payload.status) {
    payload.status = String(payload.status).toUpperCase();
  }

  const data = await apiFetch<{
    success: boolean;
    message: string;
    event: any;
  }>(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  return mapBackendEventToCampusEvent(data.event);
}

export async function approveEventApi(id: string, comments?: string): Promise<any> {
  return apiFetch(`/api/events/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ comments: comments || '' })
  });
}

export async function rejectEventApi(id: string, reason: string): Promise<any> {
  return apiFetch(`/api/events/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  });
}

export async function requestChangesApi(id: string, comments: string): Promise<any> {
  return apiFetch(`/api/events/${id}/request-changes`, {
    method: 'PATCH',
    body: JSON.stringify({ comments })
  });
}

export async function cancelEventApi(id: string, reason: string): Promise<any> {
  return apiFetch(`/api/events/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  });
}

export async function fetchMyRegistrationsApi(): Promise<Registration[]> {
  const data = await apiFetch<{
    success: boolean;
    count: number;
    registrations: any[];
  }>('/api/registrations/my', {
    method: 'GET'
  });
  return (data.registrations || []).map(mapBackendRegistrationToRegistration);
}

export async function fetchEventRegistrationsApi(eventId: string): Promise<Registration[]> {
  const data = await apiFetch<{
    success: boolean;
    count: number;
    eventId: string;
    eventTitle: string;
    registrations: any[];
  }>(`/api/events/${eventId}/registrations`, {
    method: 'GET'
  });
  return (data.registrations || []).map(mapBackendRegistrationToRegistration);
}

export async function registerForEventApi(
  eventId: string,
  teamName?: string
): Promise<{ success: boolean; message: string; registration?: Registration }> {
  const data = await apiFetch<{
    success: boolean;
    message: string;
    registration?: any;
  }>(`/api/registrations/events/${eventId}`, {
    method: 'POST',
    body: JSON.stringify({ teamName: teamName || '' })
  });
  return {
    success: data.success,
    message: data.message,
    registration: data.registration ? mapBackendRegistrationToRegistration(data.registration) : undefined
  };
}

export async function cancelRegistrationApi(registrationId: string): Promise<void> {
  await apiFetch(`/api/registrations/${registrationId}`, {
    method: 'DELETE'
  });
}

export async function fetchClubsApi(): Promise<Club[]> {
  const data = await apiFetch<{
    success: boolean;
    count: number;
    clubs: any[];
  }>('/api/clubs', {
    method: 'GET'
  });
  return (data.clubs || []).map((c: any) => ({
    id: c.id || c._id?.toString() || '',
    name: c.name,
    shortName: c.shortName || c.name,
    description: c.description || '',
    logo: c.logoUrl || c.logo,
    logoUrl: c.logoUrl || c.logo,
    banner: c.bannerUrl || c.banner,
    bannerUrl: c.bannerUrl || c.banner,
    departmentId: c.departmentId,
    department: c.department || '',
    facultyCoordinator: c.facultyCoordinator || '',
    presidentId: c.lead?.userId || c.presidentId,
    presidentName: c.lead?.user?.name || c.presidentName,
    presidentEmail: c.lead?.user?.email || c.presidentEmail,
    subheadIds: c.subheadIds || [],
    memberCount: c.memberCount || 0,
    contactEmail: c.contactEmail || '',
    socialLinks: c.socialLinks || {},
    status: (c.status || 'active').toLowerCase(),
    category: (c.category || 'technical').toLowerCase()
  }));
}

export async function fetchVenuesApi(): Promise<Venue[]> {
  const data = await apiFetch<{
    success: boolean;
    count: number;
    venues: any[];
  }>('/api/venues', {
    method: 'GET'
  });
  return (data.venues || []).map((v: any) => ({
    id: v.id || v._id?.toString() || '',
    name: v.name,
    building: v.building || '',
    floor: v.floor || '',
    capacity: v.capacity || 0,
    facilities: v.facilities || [],
    isAvailable: v.operationalStatus === 'OPERATIONAL' || v.isAvailable,
    operationalStatus: v.operationalStatus || 'OPERATIONAL'
  }));
}

export async function registerApi(userData: {
  name: string;
  email: string;
  password?: string;
  role: string;
  enrollmentNumber?: string;
  department?: string;
  year?: string;
  phone?: string;
  clubId?: string;
  clubName?: string;
  securityQuestions?: { question: string; answer: string }[];
}): Promise<{ token?: string; user: User }> {
  const data = await apiFetch<{
    success: boolean;
    token?: string;
    user: any;
    message?: string;
  }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  if (data.token) {
    setToken(data.token);
  }
  return { token: data.token, user: data.user };
}

export async function downloadEventRegistrationsCsv(eventId: string, eventTitle?: string): Promise<void> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`/api/events/${eventId}/registrations/download`, {
    method: 'GET',
    headers
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Failed to download CSV: HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = (eventTitle || 'event').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `Event_${safeTitle}_Registered_Students.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function downloadEventRegistrationsPdf(eventId: string, eventTitle?: string): Promise<void> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`/api/events/${eventId}/registrations/download/pdf`, {
    method: 'GET',
    headers
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Failed to download PDF: HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = (eventTitle || 'event').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `CampusConnect_${safeTitle}_Registered_Students.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

