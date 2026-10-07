import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { StageBadge, ContactBadge, EscalationBadge } from '../components/StatusBadge';
import api from '../services/api';
import { Users, UserPlus, AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert, ChevronRight, Mail, Clock } from 'lucide-react';

const StaffDashboard = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [students, setStudents] = useState([]);
  const [coordinatorActivity, setCoordinatorActivity] = useState([]);
  const [selectedAlumniIds, setSelectedAlumniIds] = useState([]);
  const [targetStudentId, setTargetStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [remindedStudentIds, setRemindedStudentIds] = useState([]);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('allocation'); // 'allocation' | 'escalations' | 'activity'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alumniRes, studentsRes, activityRes] = await Promise.allSettled([
        api.get('/alumni'),
        api.get('/staff/students'),
        api.get('/staff/coordinators/activity')
      ]);

      if (alumniRes.status === 'fulfilled') {
        setAlumniList(alumniRes.value?.data?.data || []);
      }
      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value?.data?.data || []);
      }
      if (activityRes.status === 'fulfilled') {
        setCoordinatorActivity(activityRes.value?.data?.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSelectAll = () => {
    if (selectedAlumniIds.length === unassignedOrAllAlumni.length) {
      setSelectedAlumniIds([]);
    } else {
      setSelectedAlumniIds(unassignedOrAllAlumni.map(a => a._id));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedAlumniIds.includes(id)) {
      setSelectedAlumniIds(selectedAlumniIds.filter(i => i !== id));
    } else {
      setSelectedAlumniIds([...selectedAlumniIds, id]);
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (selectedAlumniIds.length === 0 || !targetStudentId) return;

    setAllocating(true);
    setMessage(null);

    try {
      const response = await api.post('/staff/allocate', {
        alumniIds: selectedAlumniIds,
        studentId: targetStudentId
      });

      const allocatedStudent = students.find(s => s._id === targetStudentId);
      setMessage({ 
        type: 'success', 
        text: `${response.data.message}. You can now dispatch the initiative email to ${allocatedStudent ? allocatedStudent.name : 'the coordinator'}.` 
      });
      setSelectedAlumniIds([]);
      setTargetStudentId('');
      setAllocating(false);
      fetchData();
    } catch (error) {
      setAllocating(false);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Allocation failed' });
    }
  };

  const handleSendInitiativeEmail = async (studentId) => {
    setSendingEmailId(studentId);
    setMessage(null);
    try {
      const response = await api.post(`/staff/student-coordinators/${studentId}/send-initiative-mail`);
      setMessage({ type: 'success', text: response.data.message });
      setSendingEmailId(null);
      fetchData();
    } catch (error) {
      setSendingEmailId(null);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to dispatch initiative email'
      });
    }
  };

  const handleSendInitiativeReminder = async (student) => {
    setSendingReminderId(student._id);
    setMessage(null);
    try {
      const response = await api.post(`/staff/coordinators/${student._id}/remind-initiative`);
      setMessage({ 
        type: 'success', 
        text: response.data.message || `Initiative reminder dispatched to ${student.name} (${student.email}) successfully.`
      });
      setRemindedStudentIds(prev => [...prev, student._id]);
      setSendingReminderId(null);
      
      // Refresh activity metrics in background
      const updatedActivity = await api.get('/staff/coordinators/activity');
      setCoordinatorActivity(updatedActivity.data.data || []);
    } catch (error) {
      setSendingReminderId(null);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to dispatch initiative reminder email'
      });
    }
  };

  const handleEscalationUpdate = async (alumniId, newLevel) => {
    try {
      await api.put(`/alumni/${alumniId}/escalation`, {
        escalationLevel: newLevel,
        remark: `Updated by Staff Coordinator`
      });
      fetchData();
    } catch (error) {
      console.error('Error updating escalation:', error);
    }
  };

  const unassignedOrAllAlumni = alumniList;
  const level2EscalationQueue = alumniList.filter(a => a.escalationLevel === 'LEVEL_2_STAFF');
  const inactiveCount = coordinatorActivity.filter(s => s.isInactive).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Staff Coordinator Operations Hub</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Quota allocation manager and Department Level-2 escalation review
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 transition-all self-start md:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Dashboard</span>
          </button>
        </div>

        {/* Student Coordinators Quota Cards */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Active Student Coordinators Workload ({students.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((st) => (
              <div key={st._id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{st.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {st.department || 'General'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{st.email}</div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{st.totalAssigned}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Assigned</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-700 dark:text-amber-400">{st.pendingSubmission}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Pending</div>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">{st.submitted}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Verified</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSendInitiativeEmail(st._id)}
                    disabled={sendingEmailId === st._id}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition disabled:opacity-50 shadow-sm"
                    title="Dispatch assignment & outreach initiative email to this student coordinator"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{sendingEmailId === st._id ? 'Dispatching Mail...' : 'Dispatch Assignment & Initiative Mail'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('allocation')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'allocation' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Quota Allocation Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('escalations')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'escalations' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Level-2 Escalation Queue ({level2EscalationQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'activity' ? 'border-[#7C3AED] text-[#7C3AED] dark:text-[#A78BFA]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Coordinator Activity & Reminders</span>
            {inactiveCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                {inactiveCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification Message */}
        {message && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tab 1: Allocation Manager */}
        {activeTab === 'allocation' && (
          <div className="space-y-4">
            
            {/* Allocation Bar */}
            <form onSubmit={handleAllocateSubmit} className="bg-white dark:bg-[#151D2F] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Selected: <strong className="text-indigo-700 dark:text-indigo-400 text-sm">{selectedAlumniIds.length}</strong> records
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  required
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64 cursor-pointer"
                >
                  <option value="">-- Select Student Coordinator --</option>
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.totalAssigned} assigned)
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={selectedAlumniIds.length === 0 || !targetStudentId || allocating}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{allocating ? 'Allocating...' : 'Assign Selected'}</span>
                </button>
              </div>
            </form>

            {/* Master Allocation Table */}
            <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedAlumniIds.length > 0 && selectedAlumniIds.length === unassignedOrAllAlumni.length}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-600"
                        />
                      </th>
                      <th className="py-3.5 px-4">Alumni Name</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4">Currently Assigned To</th>
                      <th className="py-3.5 px-4">Contact Status</th>
                      <th className="py-3.5 px-4">Verification Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {unassignedOrAllAlumni.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={selectedAlumniIds.includes(record._id)}
                            onChange={() => handleToggleSelect(record._id)}
                            className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-600"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {record.name}
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] font-normal">{record.mobile}</div>
                        </td>
                        <td className="py-3.5 px-4 text-indigo-700 dark:text-indigo-400 font-mono font-semibold">{record.batch}</td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                          {record.assignedTo ? record.assignedTo.name : <span className="text-amber-700 dark:text-amber-400 italic font-semibold">Unassigned</span>}
                        </td>
                        <td className="py-3.5 px-4"><ContactBadge status={record.contactStatus} /></td>
                        <td className="py-3.5 px-4"><StageBadge stage={record.verificationStage} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Level-2 Escalation Queue */}
        {activeTab === 'escalations' && (
          <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Records auto-escalated due to unreachable call outcomes (Switched Off / Invalid Number / No Answer)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Alumni Name</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Assigned Student</th>
                    <th className="py-3.5 px-4">Recent Outreach Remarks</th>
                    <th className="py-3.5 px-4 text-right">Escalation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {level2EscalationQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        No Level-2 escalations currently active.
                      </td>
                    </tr>
                  ) : (
                    level2EscalationQueue.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {record.name}
                          <div className="text-indigo-700 dark:text-indigo-400 font-mono text-[11px] font-normal">Batch {record.batch}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{record.mobile}</div>
                          <div className="text-slate-500 dark:text-slate-400">{record.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                          {record.assignedTo?.name || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400 italic">
                          {record.callLogs?.[record.callLogs.length - 1]?.remarks || 'No remarks'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEscalationUpdate(record._id, 'NONE')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              Resolve Level-2
                            </button>
                            <button
                              onClick={() => handleEscalationUpdate(record._id, 'LEVEL_3_HOD')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-100 transition-colors"
                            >
                              Escalate to Head (L-3)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Student Coordinator Activity Monitor & Actionable Reminders */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA]" />
                  <span>Student Coordinator Activity Monitor</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Monitors Student Coordinators with pending outreach assignments and triggers official initiative & reminder emails to coordinators inactive for 3+ days.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Total: <strong className="text-slate-900 dark:text-white">{coordinatorActivity.length}</strong>
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Inactive (3+ Days): <strong className="text-rose-800 dark:text-rose-200">{inactiveCount}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151D2F]">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department & Year</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Pending Records</th>
                    <th className="py-3 px-4">Inactivity Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {coordinatorActivity.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400 italic">
                        No Student Coordinators currently registered.
                      </td>
                    </tr>
                  ) : (
                    coordinatorActivity.map((student) => {
                      const isSentToday = student.remindedToday || remindedStudentIds.includes(student._id);
                      return (
                        <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            <div>{student.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">Student Coordinator</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            {student.department || 'CSE'} ({student.year || '3rd Year'})
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {student.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              {student.pendingCount} pending
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {student.isInactive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                <span>⚠ Inactive (3+ Days)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>✓ Active</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {!student.isInactive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                <span>On Track</span>
                              </span>
                            ) : isSentToday ? (
                              <button
                                disabled
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 opacity-90 cursor-not-allowed"
                                title="Reminder email has already been dispatched today"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Mail Sent (Today)</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendInitiativeReminder(student)}
                                disabled={sendingReminderId === student._id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
                                title="Dispatch initiative reminder email to this inactive coordinator"
                              >
                                {sendingReminderId === student._id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <>
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Send Initiative / Reminder Mail</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default StaffDashboard;
