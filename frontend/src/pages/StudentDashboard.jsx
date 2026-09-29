import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { StageBadge, ContactBadge, EscalationBadge } from '../components/StatusBadge';
import CallLogModal from '../components/CallLogModal';
import AlumniVerificationModal from '../components/AlumniVerificationModal';
import StudentRemarksModal from '../components/StudentRemarksModal';
import MonthlyOutreachMatrix from '../components/MonthlyOutreachMatrix';
import StudentWalletCard from '../components/StudentWalletCard';
import api from '../services/api';
import { Phone, Edit3, Search, RefreshCw, CheckCircle2, Clock, ShieldCheck, AlertCircle, MessageSquare, UserCheck, Table, ListFilter, Wallet } from 'lucide-react';

const StudentDashboard = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'matrix' | 'wallet'
  const [selectedCallAlumni, setSelectedCallAlumni] = useState(null);
  const [selectedVerificationId, setSelectedVerificationId] = useState(null);
  const [selectedRemarksAlumni, setSelectedRemarksAlumni] = useState(null);

  const fetchAssignedAlumni = async () => {
    setLoading(true);
    try {
      const response = await api.get('/alumni', {
        params: { search }
      });
      setAlumniList(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assigned alumni:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedAlumni();
  }, [search]);

  // Compute metrics
  const totalAssigned = alumniList.length;
  const pendingCount = alumniList.filter(a => a.verificationStage === 'PENDING_SUBMISSION').length;
  const submittedCount = alumniList.filter(a => a.verificationStage === 'SUBMITTED_BY_STUDENT').length;
  const verifiedCount = alumniList.filter(a => ['VERIFIED_BY_BACK_OFFICER', 'VERIFIED_BY_HEAD', 'ADMIN_APPROVED'].includes(a.verificationStage)).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-[#003366] dark:text-sky-400 flex items-center gap-2">
              <span>Student Coordinator Workspace</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Call assigned alumni, verify pre-filled master sheet details, and log weekly outreach milestones in the Monthly Matrix
            </p>
          </div>
          <button
            onClick={fetchAssignedAlumni}
            className="flex items-center gap-2 text-xs font-semibold text-[#003366] dark:text-sky-400 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 transition-all self-start md:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0077B5] dark:text-sky-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Workspace</span>
          </button>
        </div>

        {/* Progress & Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assigned Quota</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalAssigned}</h3>
            </div>
            <Clock className="w-8 h-8 text-[#0077B5] dark:text-sky-400" />
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Pending Verification</p>
              <h3 className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-1">{pendingCount}</h3>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wider">Submitted for Officer Check</p>
              <h3 className="text-2xl font-extrabold text-sky-900 dark:text-sky-100 mt-1">{submittedCount}</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Verified & Approved</p>
              <h3 className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">{verifiedCount}</h3>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'list' ? 'border-[#003366] dark:border-sky-400 text-[#003366] dark:text-sky-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-4 h-4 text-[#003366] dark:text-sky-400" />
            <span>Assigned Alumni Queue ({alumniList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'matrix' ? 'border-[#0077B5] dark:border-sky-400 text-[#0077B5] dark:text-sky-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-4 h-4 text-[#0077B5] dark:text-sky-400" />
            <span>Monthly Outreach Analysis Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'wallet' ? 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Incentives & Wallet</span>
          </button>
        </div>

        {/* Tab 1: Assigned Alumni Queue */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#151D2F] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by alumni name, batch, company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5] transition-colors"
                />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
                Showing {alumniList.length} assigned records
              </div>
            </div>

            {/* Alumni Table */}
            <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Alumni Profile</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4">Outreach Status</th>
                      <th className="py-3.5 px-4">Verification Stage</th>
                      <th className="py-3.5 px-4">Company & Role</th>
                      <th className="py-3.5 px-4 text-center">Outreach Trail</th>
                      <th className="py-3.5 px-4 text-right">Student Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          Loading assigned alumni records...
                        </td>
                      </tr>
                    ) : alumniList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">
                          No alumni records assigned matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      alumniList.map((record) => (
                        <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{record.name}</div>
                            <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{record.mobile}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">{record.batch}</td>
                          <td className="py-3.5 px-4"><ContactBadge status={record.contactStatus} /></td>
                          <td className="py-3.5 px-4"><StageBadge stage={record.verificationStage} /></td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{record.professional?.company || <span className="text-slate-400 italic">Not set</span>}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-[11px]">{record.professional?.position || ''}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              <span>{record.callLogs?.length || 0} attempts</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              
                              {/* Log Call Button */}
                              <button
                                onClick={() => setSelectedCallAlumni(record)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 transition-all"
                                title="Log Call / Outreach Attempt"
                              >
                                <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Log Call</span>
                              </button>

                              {/* View Officer Remarks */}
                              <button
                                onClick={() => setSelectedRemarksAlumni(record)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-all"
                                title="View Officer Remarks"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Remarks ({record.adminRemarks?.length || 0})</span>
                              </button>

                              {/* Update & Submit Verification Button */}
                              <button
                                onClick={() => setSelectedVerificationId(record._id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#003366] hover:bg-[#002244] text-white shadow-md transition-all"
                                title="Verify Details & Submit for Officer Approval"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Verify & Edit</span>
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

          </div>
        )}

        {/* Tab 2: Monthly Outreach Analysis Matrix */}
        {activeTab === 'matrix' && (
          <MonthlyOutreachMatrix />
        )}

        {/* Tab 3: Student Incentive Wallet */}
        {activeTab === 'wallet' && (
          <StudentWalletCard />
        )}

      </main>

      {/* Call Log Modal */}
      <CallLogModal
        alumni={selectedCallAlumni}
        isOpen={!!selectedCallAlumni}
        onClose={() => setSelectedCallAlumni(null)}
        onRefresh={fetchAssignedAlumni}
      />

      {/* Alumni Verification Modal */}
      <AlumniVerificationModal
        alumniId={selectedVerificationId}
        isOpen={!!selectedVerificationId}
        onClose={() => setSelectedVerificationId(null)}
        onRefresh={fetchAssignedAlumni}
      />

      {/* Student Remarks Modal */}
      <StudentRemarksModal
        alumni={selectedRemarksAlumni}
        isOpen={!!selectedRemarksAlumni}
        onClose={() => setSelectedRemarksAlumni(null)}
      />
    </div>
  );
};

export default StudentDashboard;
