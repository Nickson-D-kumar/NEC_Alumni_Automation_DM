import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { StageBadge, ContactBadge, EscalationBadge } from '../components/StatusBadge';
import RemarksDrawer from '../components/RemarksDrawer';
import AlumniInspectModal from '../components/AlumniInspectModal';
import KpiCard from '../components/KpiCard';
import api from '../services/api';
import { Database, Search, MessageSquare, RefreshCw, ShieldCheck, AlertTriangle, Eye, CheckCircle2, Clock, Send, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BackOfficeDashboard = () => {
  const { user } = useAuth();
  const [alumniList, setAlumniList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificationStageFilter, setVerificationStageFilter] = useState('');
  const [selectedRemarkAlumni, setSelectedRemarkAlumni] = useState(null);
  const [selectedInspectId, setSelectedInspectId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alumniRes, statsRes] = await Promise.all([
        api.get('/alumni', {
          params: {
            search,
            verificationStage: verificationStageFilter,
            page,
            limit
          }
        }),
        api.get('/alumni/stats')
      ]);

      setAlumniList(alumniRes.data.data || []);
      setTotalPages(alumniRes.data.pages || 1);
      setTotalRecords(alumniRes.data.total || 0);
      setStats(statsRes.data.stats || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching back office data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, verificationStageFilter, page, limit]);

  const handleVerifyBackOfficer = async (alumniId) => {
    setActionMessage(null);
    try {
      let response;
      try {
        response = await api.put(`/alumni/${alumniId}/verify-back-officer`);
      } catch (err1) {
        if (err1.response && err1.response.status === 404) {
          response = await api.put(`/alumni/${alumniId}/verify-head`);
        } else {
          throw err1;
        }
      }
      setActionMessage({ type: 'success', text: response.data.message || 'Record successfully verified and forwarded to Admin!' });
      fetchData();
    } catch (error) {
      console.error('Verification error:', error);
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Failed to verify record' });
    }
  };

  const handleEscalateToHead = async (alumniId) => {
    setActionMessage(null);
    try {
      await api.put(`/alumni/${alumniId}/escalation`, {
        escalationLevel: 'LEVEL_3_HOD',
        remark: 'Escalated by Back Officer during record verification audit'
      });
      setActionMessage({ type: 'success', text: 'Issue escalated to Level-3 Head Officer Queue successfully!' });
      fetchData();
    } catch (error) {
      console.error('Escalation error:', error);
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Failed to escalate issue' });
    }
  };

  const handleRequestCorrection = (record) => {
    setSelectedRemarkAlumni(record);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span>Chamber Back Officer Record Auditing & Verification Hub</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Audit student-submitted outreach records, perform field verification, forward verified records to Admin, or issue correction requests.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 transition-all self-start md:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Queue</span>
          </button>
        </div>

        {/* Global KPIs */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Pending Back Officer Review"
              value={stats.submittedByStudent || 0}
              subtitle="Submitted by Student Coordinators"
              icon={Clock}
              color="amber"
            />
            <KpiCard
              title="Verified by Back Officer"
              value={stats.verifiedByBackOfficer || stats.verifiedByHead || 0}
              subtitle={`${stats.backOfficerVerifiedPercentage || 0}% of total master database`}
              icon={CheckCircle2}
              color="emerald"
            />
            <KpiCard
              title="Fully Approved by Admin"
              value={stats.adminApproved || 0}
              subtitle={`${stats.fullyApprovedPercentage || 0}% of total master database`}
              icon={ShieldCheck}
              color="indigo"
            />
            <KpiCard
              title="Flagged Escalations"
              value={stats.escalations?.total || 0}
              subtitle="Invalid details & unreachable numbers"
              icon={AlertTriangle}
              color="rose"
            />
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

        {/* Search & Stage Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search master list by name, phone, email..."
                className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={verificationStageFilter}
              onChange={(e) => setVerificationStageFilter(e.target.value)}
              className="bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value="">All Verification Stages</option>
              <option value="SUBMITTED_BY_STUDENT">SUBMITTED_BY_STUDENT (Pending Verification)</option>
              <option value="VERIFIED_BY_BACK_OFFICER">VERIFIED_BY_BACK_OFFICER</option>
              <option value="PENDING_SUBMISSION">PENDING_SUBMISSION</option>
              <option value="ADMIN_APPROVED">ADMIN_APPROVED</option>
            </select>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{alumniList.length}</strong> master records
          </div>
        </div>

        {/* Master Audit List Table */}
        <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Alumni Profile</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4">Assigned Coordinator</th>
                  <th className="py-3.5 px-4">Contact Status</th>
                  <th className="py-3.5 px-4">Verification Stage</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4 text-right">Back Officer Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {alumniList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 dark:text-slate-400 italic">
                      No alumni records found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  alumniList.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{record.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-normal">{record.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4 text-indigo-700 dark:text-indigo-400 font-mono font-semibold">{record.batch}</td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                        {record.assignedTo ? record.assignedTo.name : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3.5 px-4"><ContactBadge status={record.contactStatus} /></td>
                      <td className="py-3.5 px-4"><StageBadge stage={record.verificationStage} /></td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono text-xs font-semibold">
                          {record.adminRemarks?.length || 0} remarks
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* 1. Verify & Forward to Admin */}
                          {record.verificationStage === 'SUBMITTED_BY_STUDENT' && (
                            <button
                              onClick={() => handleVerifyBackOfficer(record._id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                              title="Verify record details & forward to Admin for final acceptance"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify & Forward to Admin</span>
                            </button>
                          )}

                          {/* 2. Request Student Correction */}
                          <button
                            onClick={() => handleRequestCorrection(record)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all"
                            title="Request correction from assigned Student Coordinator"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Request Correction</span>
                          </button>

                          {/* 3. Escalate to Head Officer */}
                          {record.escalationLevel !== 'LEVEL_3_HOD' && record.escalationLevel !== 'LEVEL_4_CHAMBER_HEAD' && (
                            <button
                              onClick={() => handleEscalateToHead(record._id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all"
                              title="Escalate issue (invalid contact / unreachable) to Head Officer Queue"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Escalate</span>
                            </button>
                          )}

                          {/* 4. Inspect Details */}
                          <button
                            onClick={() => setSelectedInspectId(record._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 transition-all"
                            title="Inspect Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Inspect</span>
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

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Showing Page <strong className="text-slate-900 dark:text-white">{page}</strong> of <strong className="text-slate-900 dark:text-white">{totalPages}</strong> (Total <strong className="text-indigo-700 dark:text-indigo-400">{totalRecords}</strong> Records)
          </div>
          <div className="flex items-center gap-3">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={250}>250 per page</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 dark:border-slate-600 shadow-sm"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
              >
                Next Page
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Remarks Drawer */}
      <RemarksDrawer
        alumni={selectedRemarkAlumni}
        isOpen={!!selectedRemarkAlumni}
        onClose={() => setSelectedRemarkAlumni(null)}
        onRefresh={fetchData}
      />

      {/* Alumni Inspect Modal */}
      <AlumniInspectModal
        alumniId={selectedInspectId}
        userRole={user?.role}
        isOpen={!!selectedInspectId}
        onClose={() => setSelectedInspectId(null)}
        onActionComplete={fetchData}
      />
    </div>
  );
};

export default BackOfficeDashboard;
