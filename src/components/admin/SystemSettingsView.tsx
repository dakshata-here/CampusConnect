import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SystemSettings, SystemDepartment } from '../../types';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  Calendar,
  Bell,
  Shield,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Mail,
  Clock,
  UserCheck,
  Check,
  X
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings, resetDatabase } = useApp();

  const [formData, setFormData] = useState<SystemSettings>({
    ...systemSettings
  });

  const [activeSubTab, setActiveSubTab] = useState<'academic' | 'departments' | 'governance' | 'notifications'>('academic');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // New Department Form State
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHod, setNewDeptHod] = useState('');
  const [newDeptIntake, setNewDeptIntake] = useState(120);

  const handleSave = () => {
    updateSystemSettings(formData);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3500);
  };

  const handleAddDepartment = () => {
    if (newDeptCode.trim() && newDeptName.trim()) {
      const newDept: SystemDepartment = {
        id: `dept_${newDeptCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
        code: newDeptCode.trim().toUpperCase(),
        name: newDeptName.trim(),
        hodName: newDeptHod.trim() || 'Head of Department',
        intake: Number(newDeptIntake) || 120,
        active: true
      };

      setFormData({
        ...formData,
        departments: [...formData.departments, newDept]
      });

      setNewDeptCode('');
      setNewDeptName('');
      setNewDeptHod('');
      setNewDeptIntake(120);
    }
  };

  const handleRemoveDepartment = (deptId: string) => {
    setFormData({
      ...formData,
      departments: formData.departments.filter((d) => d.id !== deptId)
    });
  };

  const handleToggleDepartmentActive = (deptId: string) => {
    setFormData({
      ...formData,
      departments: formData.departments.map((d) =>
        d.id === deptId ? { ...d, active: !d.active } : d
      )
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {saveSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>System Settings saved successfully and applied campus-wide!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-purple-600" />
            Platform & Governance Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure institutional academic years, eligible departments, proposal policies, and campus notification rules
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="save-system-settings-btn"
            onClick={handleSave}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'academic', label: 'Academic Terms & Year', icon: Calendar },
          { id: 'departments', label: 'Departments & Branches', icon: Building },
          { id: 'governance', label: 'Event Policies & Approvals', icon: Shield },
          { id: 'notifications', label: 'Notifications & Alerts', icon: Bell }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: ACADEMIC TERMS & CALENDAR WINDOWS */}
      {activeSubTab === 'academic' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Institutional Academic Term Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Defines the active semester schedule, student batch years, and university timetable windows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Active Academic Year
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="2026-2027">2026-2027 (Current Term)</option>
                <option value="2025-2026">2025-2026 (Archive)</option>
                <option value="2027-2028">2027-2028 (Upcoming)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Active Semester Description
              </label>
              <input
                type="text"
                value={formData.activeSemester}
                onChange={(e) => setFormData({ ...formData, activeSemester: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Term Commencement Date
              </label>
              <input
                type="date"
                value={formData.termStartDate}
                onChange={(e) => setFormData({ ...formData, termStartDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Term Conclusion Date
              </label>
              <input
                type="date"
                value={formData.termEndDate}
                onChange={(e) => setFormData({ ...formData, termEndDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                University Examination Window Start
              </label>
              <input
                type="date"
                value={formData.examPeriodStart}
                onChange={(e) => setFormData({ ...formData, examPeriodStart: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                University Examination Window End
              </label>
              <input
                type="date"
                value={formData.examPeriodEnd}
                onChange={(e) => setFormData({ ...formData, examPeriodEnd: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DEPARTMENTS & BRANCHES */}
      {activeSubTab === 'departments' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Institutional Academic Departments
              </h3>
              <p className="text-xs text-slate-500">
                Departments selectable for club event eligibility, student registrations, and academic milestone notices.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-md self-start sm:self-auto">
              {formData.departments.length} Active Departments
            </span>
          </div>

          {/* Add Department Form */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              Add New Department
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. MECH"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mechanical Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">HOD Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. P. R. Joshi"
                  value={newDeptHod}
                  onChange={(e) => setNewDeptHod(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Annual Intake</label>
                <input
                  type="number"
                  placeholder="120"
                  value={newDeptIntake}
                  onChange={(e) => setNewDeptIntake(parseInt(e.target.value) || 120)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <button
              onClick={handleAddDepartment}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Department</span>
            </button>
          </div>

          {/* Department Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {formData.departments.map((dept) => (
              <div
                key={dept.id}
                className={`p-4 rounded-xl border transition-all ${
                  dept.active
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60'
                    : 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {dept.code}
                      </span>
                      {dept.active ? (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Disabled</span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{dept.name}</h4>
                    <p className="text-[11px] text-slate-500">HOD: {dept.hodName}</p>
                    <p className="text-[10px] text-slate-400">Intake: {dept.intake} students</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleDepartmentActive(dept.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title={dept.active ? 'Deactivate' : 'Activate'}
                    >
                      {dept.active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleRemoveDepartment(dept.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: GOVERNANCE & PERMISSIONS */}
      {activeSubTab === 'governance' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Campus Event Governance & Permissions
            </h3>
            <p className="text-xs text-slate-500">
              Role permissions, proposal approval workflows, and classroom venue reservation rules.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  President Can Invite Subheads
                </strong>
                <span className="text-xs text-slate-500">
                  Allows club presidents to grant subhead workspace access to active club members.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.permissions.presidentCanInviteSubhead}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissions: { ...formData.permissions, presidentCanInviteSubhead: e.target.checked }
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  Subhead Proposals Require President Review
                </strong>
                <span className="text-xs text-slate-500">
                  Forces event proposals created by technical subheads to be reviewed by Club President before reaching Admin.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.permissions.subheadCanDraftOnly}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissions: { ...formData.permissions, subheadCanDraftOnly: e.target.checked }
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  Allow External College Registrations
                </strong>
                <span className="text-xs text-slate-500">
                  Enables clubs to open hackathons and flagship symposiums to students from other universities.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.permissions.allowExternalRegistrations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissions: { ...formData.permissions, allowExternalRegistrations: e.target.checked }
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  Auto-Approve Classroom Venues (Halls 301-303)
                </strong>
                <span className="text-xs text-slate-500">
                  Automatically approves classroom bookings for small club SIG sessions if no conflict exists.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.permissions.autoApproveClassroomVenues}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissions: { ...formData.permissions, autoApproveClassroomVenues: e.target.checked }
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  Default Event Maximum Attendees
                </strong>
                <span className="text-xs text-slate-500">
                  Initial attendee limit set when drafting a new campus proposal.
                </span>
              </div>
              <input
                type="number"
                min={20}
                max={2000}
                value={formData.defaultMaxParticipants}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxParticipants: parseInt(e.target.value) || 150 })
                }
                className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: NOTIFICATIONS & ALERTS */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Campus Notifications & Automated Dispatch
            </h3>
            <p className="text-xs text-slate-500">
              Configure student broadcast notices, reschedule alerts, and automated email digests.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  Broadcast Academic Notices to All Students
                </strong>
                <span className="text-xs text-slate-500">
                  Instantly sends notification bell push when an official Academic Notice or Exam schedule is published.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.broadcastAcademicNotices}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, broadcastAcademicNotices: e.target.checked }
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  High-Priority Alert on Reschedule
                </strong>
                <span className="text-xs text-slate-500">
                  e.g. "Academic Calendar Update: Your Practical Examination has been rescheduled from 20 Sept to 22 Sept."
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.notifyOnReschedule}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, notifyOnReschedule: e.target.checked }
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  College Admin Daily Digest Email
                </strong>
                <span className="text-xs text-slate-500">
                  Sends morning email summary of pending club proposals and today's campus venue bookings.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.adminDailyDigest}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, adminDailyDigest: e.target.checked }
                  })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  Pre-Event Student Reminder Window
                </strong>
                <span className="text-xs text-slate-500">
                  Dispatches event reminder notification this many hours before start time.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={formData.notifications.studentReminderHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        studentReminderHours: parseInt(e.target.value) || 24
                      }
                    })
                  }
                  className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <span className="text-xs text-slate-500">Hours</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM DANGER ZONE: RESET DEMO DATA */}
      <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Platform Demo Reset
          </h4>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
            Reset all college events, academic milestones, and user roles back to default factory seed data.
          </p>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Confirm Platform Reset?
              </h3>
              <p className="text-xs text-slate-500">
                All customized events, academic notices, and registered attendees will be restored to default.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDatabase();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
