import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  MessageSquare,
  CheckSquare,
  Send,
  Plus,
  Tag,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  Mail,
  Shield,
  Award
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/calendarUtils';

export const ClubMembersView: React.FC = () => {
  const {
    currentUser,
    clubs,
    events,
    clubMessages,
    sendClubMessage,
    clubTasks,
    addClubTask,
    toggleClubTaskStatus,
    deleteClubTask
  } = useApp();

  const myClub = clubs.find((c) => c.id === currentUser.clubId) || clubs[0];
  const clubEvents = events.filter((e) => e.clubId === myClub.id);

  // Filter messages & tasks for this club
  const activeClubMessages = clubMessages.filter((m) => m.clubId === myClub.id);
  const activeClubTasks = clubTasks.filter((t) => t.clubId === myClub.id);

  // Chat form state
  const [chatText, setChatText] = useState<string>('');
  const [selectedEventTag, setSelectedEventTag] = useState<string>('');

  // Task creation state
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskAssignee, setTaskAssignee] = useState<string>('Omkar Patil');
  const [taskDueDate, setTaskDueDate] = useState<string>('2026-09-20');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskEventTitle, setTaskEventTitle] = useState<string>('');

  // Tab between chat & tasks
  const [leadSectionTab, setLeadSectionTab] = useState<'chat' | 'tasks'>('chat');

  // Club Members roster
  const clubMembers = [
    {
      id: 'm1',
      name: 'Aditya Rao',
      role: 'Club President & Lead',
      department: 'Computer Engineering',
      year: 'Final Year (BE)',
      email: 'aditya.rao@pict.edu',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'm2',
      name: 'Pooja Kulkarni',
      role: 'Technical Subhead',
      department: 'Computer Engineering',
      year: 'Third Year (TE)',
      email: 'pooja.kulkarni@pict.edu',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'm3',
      name: 'Omkar Patil',
      role: 'Event Operations Lead',
      department: 'Information Technology',
      year: 'Third Year (TE)',
      email: 'omkar.patil@pict.edu',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'm4',
      name: 'Sneha Shinde',
      role: 'Design & PR Head',
      department: 'Electronics & Telecommunication',
      year: 'Second Year (SE)',
      email: 'sneha.shinde@pict.edu',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'm5',
      name: 'Dr. S. K. Mahajan',
      role: 'Faculty Advisor',
      department: 'Computer Engineering',
      year: 'Staff',
      email: 'skmahajan@pict.edu',
      status: 'Advisor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    sendClubMessage(
      myClub.id,
      chatText.trim(),
      selectedEventTag ? selectedEventTag : undefined
    );
    setChatText('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addClubTask({
      clubId: myClub.id,
      title: taskTitle.trim(),
      assignedToName: taskAssignee,
      assignedToRole: 'Executive Lead',
      assignedToAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      assignedByName: currentUser.name,
      dueDate: taskDueDate,
      priority: taskPriority,
      status: 'pending',
      relatedEventTitle: taskEventTitle ? taskEventTitle : undefined
    });

    setTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              {myClub.shortName} Executive Council
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Team Workspace</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Club Members & Lead Discussion
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Coordinate with fellow club leads, manage action items, and discuss upcoming campus event logistics.
          </p>
        </div>

        {/* Action Toggle between Chat and Tasks */}
        <div className="flex items-center gap-1.5 p-1 bg-blue-50/70 dark:bg-slate-900 rounded-xl border border-blue-200/80 dark:border-slate-800 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setLeadSectionTab('chat')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              leadSectionTab === 'chat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Lead Chat ({activeClubMessages.length})</span>
          </button>

          <button
            onClick={() => setLeadSectionTab('tasks')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              leadSectionTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task Manager ({activeClubTasks.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Discussion Box or Task Manager */}
        <div className="lg:col-span-8 space-y-4">
          {leadSectionTab === 'chat' ? (
            /* =================== CLUB LEAD CHAT BOX =================== */
            <div className="dashboard-card rounded-2xl border flex flex-col h-[580px] overflow-hidden shadow-xs">
              {/* Chat Header */}
              <div className="p-3.5 border-b border-blue-100/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    💬
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      Club Lead Discussion Room
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Real-time coordination for {myClub.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-blue-100 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Leads Online</span>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 divide-y divide-transparent">
                {activeClubMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <MessageSquare className="w-8 h-8 text-blue-300" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No messages yet in this club room.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Start the discussion below to coordinate event logistics with your team!
                    </p>
                  </div>
                ) : (
                  activeClubMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 items-start ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-blue-200 dark:border-slate-700"
                        />
                        <div
                          className={`max-w-[78%] space-y-1 ${
                            isMe ? 'items-end text-right' : 'items-start text-left'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-100/70 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold">
                              {msg.senderRole}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Tagged Event pill if exists */}
                          {msg.taggedEventTitle && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Tag className="w-3 h-3 text-indigo-500" />
                              <span className="truncate max-w-[200px]">{msg.taggedEventTitle}</span>
                            </div>
                          )}

                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-tr-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-blue-100 dark:border-slate-700 rounded-tl-xs'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 pt-2 pb-1 bg-white/70 dark:bg-slate-900/70 border-t border-blue-100/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-400 shrink-0">Quick tag:</span>
                {['Auditorium Booked', 'Poster Finalized', 'Sponsor Deck Ready', 'Refreshments Ordered'].map(
                  (chip) => (
                    <button
                      key={chip}
                      onClick={() => setChatText((prev) => (prev ? `${prev} - ${chip}` : chip))}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-slate-700 whitespace-nowrap transition-colors"
                    >
                      {chip}
                    </button>
                  )
                )}
              </div>

              {/* Input & Send Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-blue-100/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={selectedEventTag}
                    onChange={(e) => setSelectedEventTag(e.target.value)}
                    className="text-[11px] p-1.5 bg-slate-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 max-w-[170px] truncate"
                  >
                    <option value="">Tag an Event (Optional)</option>
                    {clubEvents.map((evt) => (
                      <option key={evt.id} value={evt.title}>
                        {evt.title}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder={`Message ${myClub.shortName} leads...`}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* =================== CLUB TASKS MANAGER =================== */
            <div className="dashboard-card rounded-2xl border p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Lead Task & Responsibility Tracker
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign and track critical milestones for club events
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingTask ? 'Close Form' : 'Add Task'}</span>
                </button>
              </div>

              {/* Add Task Sub-form */}
              {isAddingTask && (
                <form
                  onSubmit={handleCreateTask}
                  className="p-4 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 space-y-3 animate-in fade-in"
                >
                  <div className="font-bold text-xs text-blue-900 dark:text-blue-200">
                    Assign New Action Item
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Task Description
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Test microphone and audio output in Seminar Hall 1 with AV staff"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Assignee
                      </label>
                      <select
                        value={taskAssignee}
                        onChange={(e) => setTaskAssignee(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        {clubMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role.split(' ')[0]})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                      </input>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Priority
                      </label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as any)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Link with Event (Optional)
                    </label>
                    <select
                      value={taskEventTitle}
                      onChange={(e) => setTaskEventTitle(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="">General Club Task</option>
                      {clubEvents.map((evt) => (
                        <option key={evt.id} value={evt.title}>
                          {evt.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-1.5 text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              )}

              {/* Task Items List */}
              <div className="space-y-2.5">
                {activeClubTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No active tasks assigned yet. Click "Add Task" above.
                  </p>
                ) : (
                  activeClubTasks.map((t) => {
                    const isCompleted = t.status === 'completed';
                    const isInProgress = t.status === 'in_progress';

                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isCompleted
                            ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                            : 'bg-white dark:bg-slate-800 border-blue-100 dark:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleClubTaskStatus(t.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isInProgress
                                ? 'bg-blue-500 text-white'
                                : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500'
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isInProgress && <Clock className="w-3.5 h-3.5" />}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <h4
                              className={`text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug ${
                                isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''
                              }`}
                            >
                              {t.title}
                            </h4>

                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                              <span>👤 Assigned to: <strong className="text-slate-700 dark:text-slate-300">{t.assignedToName}</strong></span>
                              <span>•</span>
                              <span>📅 Due: {t.dueDate}</span>
                              {t.relatedEventTitle && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[150px]">
                                    {t.relatedEventTitle}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              t.priority === 'high'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : t.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {t.priority}
                          </span>

                          <button
                            onClick={() => deleteClubTask(t.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Club Leads & Committee Roster */}
        <div className="lg:col-span-4 space-y-4">
          <div className="dashboard-card rounded-2xl border p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100/70 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  Core Committee ({clubMembers.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                2026-27
              </span>
            </div>

            <div className="space-y-2.5">
              {clubMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-blue-100/60 dark:border-slate-700/60 flex items-center justify-between gap-3 shadow-2xs hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-blue-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {member.name}
                      </h4>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                        {member.role}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {member.department}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`mailto:${member.email}`}
                    title={`Email ${member.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Official roster managed via College Admin SAC cell.
              </p>
            </div>
          </div>

          {/* Quick Lead Guidelines Card */}
          <div className="dashboard-card rounded-2xl border p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Lead Coordination Guidelines</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <li>Proposal reviews must be discussed in chat before resubmission.</li>
              <li>Tag events directly when discussing venue or timing changes.</li>
              <li>High-priority tasks send automated alerts to assignees.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
