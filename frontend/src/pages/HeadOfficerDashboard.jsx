import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { StageBadge, ContactBadge, EscalationBadge } from '../components/StatusBadge';
import AlumniInspectModal from '../components/AlumniInspectModal';
import KpiCard from '../components/KpiCard';
import api from '../services/api';
import { ShieldCheck, Mail, AlertTriangle, RefreshCw, CheckCircle2, Clock, Users, ArrowRight, Eye, Database, Download, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HeadOfficerDashboard = () => {
  const { user } = useAuth();
  const [alumniList, setAlumniList] = useState([]);
  const [inactiveStudents, setInactiveStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('escalations'); // 'escalations' | 'inactivity'
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedInspectId, setSelectedInspectId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alumniRes, inactiveRes, statsRes] = await Promise.all([
        api.get('/alumni'),
        api.get('/officer/inactive-students'),
        api.get('/alumni/stats')
      ]);

      setAlumniList(alumniRes.data.data || []);
      setInactiveStudents(inactiveRes.data.data || []);
      setStats(statsRes.data.stats || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching head officer data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEscalationUpdate = async (alumniId, newLevel) => {
    setActionMessage(null);
    try {
      await api.put(`/alumni/${alumniId}/escalation`, {
        escalationLevel: newLevel,
        remark: `Escalation status updated by Head Officer (${user?.name || 'HOD'})`
      });
      setActionMessage({ type: 'success', text: `Escalation updated to ${newLevel} successfully!` });
      fetchData();
    } catch (error) {
      console.error('Error updating escalation:', error);
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update escalation' });
    }
  };

  const handleDownloadDepartmentReport = () => {
    if (!alumniList || alumniList.length === 0) return;
    const headers = ['Name', 'Mobile', 'Batch', 'Department', 'Contact Status', 'Verification Stage', 'Escalation Level', 'Assigned Student'];
    const rows = alumniList.map(a => [
      `"${a.name || ''}"`,
      `"${a.mobile || ''}"`,
      `"${a.batch || ''}"`,
      `"${a.department || ''}"`,
      `"${a.contactStatus || ''}"`,
      `"${a.verificationStage || ''}"`,
      `"${a.escalationLevel || 'NONE'}"`,
      `"${a.assignedTo?.name || 'Unassigned'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Department_Alumni_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const level3Escalations = alumniList.filter(a => a.escalationLevel === 'LEVEL_3_HOD');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              <span>Head Officer Governance & Escalations Command</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              High-level department outreach progress monitoring, Level-3 issue escalations queue, and Student Coordinator activity governance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadDepartmentReport}
              className="flex items-center gap-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded-xl shadow-md shadow-sky-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Department Report</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Portal</span>
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Department Alumni"
              value={stats.total}
              subtitle="Master database total"
              icon={Database}
              color="indigo"
            />
            <KpiCard
              title="Outreach Progress"
              value={`${stats.reachedPercentage}%`}
              subtitle={`${stats.reachedCount || stats.reachedComplete || 0} outreach complete`}
              icon={CheckCircle2}
              color="emerald"
            />
            <KpiCard
              title="Remaining Outreach"
              value={stats.remainingCount ?? (stats.total - (stats.reachedCount || 0))}
              subtitle="Pending outreach completion"
              icon={Clock}
              color="amber"
            />
            <KpiCard
              title="Level-3 Escalations"
              value={level3Escalations.length}
              subtitle="Unreachable / Invalid contact issues"
              icon={AlertTriangle}
              color="rose"
            />
          </div>
        )}

        {/* Department Progress Summary Bar */}
        {stats && (
          <div className="bg-white dark:bg-[#151D2F] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Department Outreach Completion Rate
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">{stats.reachedPercentage}% Completed</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats.reachedPercentage || 0))}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Message Banner */}
        {actionMessage && (
          <div className={`p-4 rounded-xl border text-xs font-semibold ${
            actionMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('escalations')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'escalations' ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Escalated Alumni Issues Queue ({level3Escalations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inactivity')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'inactivity' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Coordinator Activity & Reminders ({inactiveStudents.filter(s => s.isInactive).length})</span>
          </button>
        </div>

        {/* Tab 1: Level-3 Escalated Alumni Issues Queue */}
        {activeTab === 'escalations' && (
          <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>Level-3 Escalated Alumni Issues Queue</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Alumni records where contact numbers were invalid, wrong, or unreachable, requiring Head Officer intervention.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151D2F]">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Alumni Name</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Mobile Phone</th>
                    <th className="p-3">Escalation Stage</th>
                    <th className="p-3 text-right">Head Officer Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {level3Escalations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500 dark:text-slate-400 italic">
                        No active Level-3 Head escalations requiring resolution.
                      </td>
                    </tr>
                  ) : (
                    level3Escalations.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{item.name}</td>
                        <td className="p-3 text-indigo-700 dark:text-indigo-400 font-mono font-semibold">{item.batch}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.mobile}</td>
                        <td className="p-3"><EscalationBadge level={item.escalationLevel} /></td>
                        <td className="p-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInspectId(item._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-300 dark:border-sky-700 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Inspect Issue</span>
                          </button>
                          
                          <button
                            onClick={() => handleEscalationUpdate(item._id, 'NONE')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-sm"
                            title="Resolve issue & return record to routine outreach"
                          >
                            <span>Resolve Escalation</span>
                          </button>

                          <button
                            onClick={() => handleEscalationUpdate(item._id, 'LEVEL_4_CHAMBER_HEAD')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 shadow-sm"
                            title="Escalate to Level-4 Chamber Head"
                          >
                            <span>Escalate to Chamber Head</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Student Self-Registration Verification */}
        {activeTab === 'registrations' && (
          <PendingStudentsApproval onRefresh={fetchData} />
        )}

        {/* Tab 3: Student Inactivity Tracking & Reminder Trigger */}
        {activeTab === 'inactivity' && (
          <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Student Coordinator Activity Monitor</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Monitors Student Coordinators with pending outreach assignments. Quota management and outreach initiative emails are administered exclusively by Department Staff Coordinators.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151D2F]">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Department & Year</th>
                    <th className="p-3">Contact Info</th>
                    <th className="p-3">Pending Records</th>
                    <th className="p-3">Inactivity Status</th>
                    <th className="p-3 text-right">Monitoring Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {inactiveStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500 dark:text-slate-400 italic">
                        All Student Coordinators are actively logging outreach activity.
                      </td>
                    </tr>
                  ) : (
                    inactiveStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{student.name}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{student.department || 'CSE'} ({student.year || '3rd Year'})</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{student.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            {student.pendingCount} pending
                          </span>
                        </td>
                        <td className="p-3">
                          {student.isInactive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>Inactive (3+ Days)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span>Monitored by Staff</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Inspection Drawer */}
        <AlumniInspectModal
          alumniId={selectedInspectId}
          isOpen={!!selectedInspectId}
          onClose={() => setSelectedInspectId(null)}
          onActionComplete={fetchData}
        />

      </main>
    </div>
  );
};

export default HeadOfficerDashboard;
