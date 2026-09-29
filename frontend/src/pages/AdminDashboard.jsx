import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { StageBadge, ContactBadge, EscalationBadge } from '../components/StatusBadge';
import ExcelUploadModal from '../components/ExcelUploadModal';
import AlumniInspectModal from '../components/AlumniInspectModal';
import PendingStudentsApproval from '../components/PendingStudentsApproval';
import AddStudentModal from '../components/AddStudentModal';
import KpiCard from '../components/KpiCard';
import api from '../services/api';
import { ShieldCheck, Upload, Award, Users, Database, BarChart2, CheckCircle2, UserPlus, RefreshCw, AlertCircle, Eye, UserCheck, Calendar, Search, Wallet, IndianRupee, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [alumniList, setAlumniList] = useState([]);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approval'); // 'approval' | 'student-approvals' | 'users' | 'escalations' | 'payouts'
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedInspectId, setSelectedInspectId] = useState(null);
  const [search, setSearch] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: 'STAFF_COORDINATOR',
    department: 'CSE'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alumniRes, statsRes, usersRes, payoutRes] = await Promise.all([
        api.get('/alumni'),
        api.get('/alumni/stats'),
        api.get('/admin/users'),
        api.get('/admin/payout-requests').catch(() => ({ data: { data: [] } }))
      ]);

      setAlumniList(alumniRes.data.data || []);
      setStats(statsRes.data.stats || null);
      setUsersList(usersRes.data.data || []);
      setPayoutRequests(payoutRes.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessPayout = async (payoutId, action) => {
    setActionMessage(null);
    try {
      const response = await api.put(`/admin/payout-requests/${payoutId}/process`, { action });
      setActionMessage({ type: 'success', text: response.data.message });
      fetchData();
    } catch (error) {
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Failed to process payout request' });
    }
  };

  const handleAdminApprove = async (alumniId) => {
    setActionMessage(null);
    try {
      const response = await api.post(`/admin/approve/${alumniId}`);
      setActionMessage({ type: 'success', text: response.data.message });
      fetchData();
    } catch (error) {
      try {
        const res2 = await api.put(`/alumni/${alumniId}/admin-approve`);
        setActionMessage({ type: 'success', text: res2.data.message });
        fetchData();
      } catch (err2) {
        setActionMessage({ type: 'error', text: error.response?.data?.message || 'Approval failed' });
      }
    }
  };

  const handleBulkApprove = async () => {
    setActionMessage(null);
    try {
      const response = await api.put('/admin/bulk-approve');
      setActionMessage({ type: 'success', text: response.data.message });
      fetchData();
    } catch (error) {
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Bulk approval failed' });
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setActionMessage(null);
    try {
      const response = await api.post('/admin/users', newUser);
      setActionMessage({ type: 'success', text: response.data.message });
      setNewUser({ name: '', email: '', password: 'Password123!', role: 'STAFF_COORDINATOR', department: 'CSE' });
      setCreatingUser(false);
      fetchData();
    } catch (error) {
      setCreatingUser(false);
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create user account' });
    }
  };

  const backOfficerVerifiedBatch = alumniList.filter(a => {
    const isVerified = a.verificationStage === 'VERIFIED_BY_BACK_OFFICER' || a.verificationStage === 'VERIFIED_BY_HEAD';
    if (!isVerified) return false;
    if (!search || search.trim() === '') return true;
    const s = search.toLowerCase().trim();
    return (
      (a.name && a.name.toLowerCase().includes(s)) ||
      (a.mobile && a.mobile.includes(s)) ||
      (a.email && a.email.toLowerCase().includes(s)) ||
      (a.batch && a.batch.toString().includes(s))
    );
  });

  const level4Escalations = alumniList.filter(a => a.escalationLevel === 'LEVEL_4_CHAMBER_HEAD');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>System Administrator Command Center</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Master sheet ingestion, user provisioning & RBAC governance, and final approval of Back Officer-verified records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 px-4 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student Coordinator</span>
            </button>

            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Master Excel Ingestion</span>
            </button>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Alumni Ingested"
              value={stats.total}
              subtitle="Master database total"
              icon={Database}
              color="indigo"
            />
            <KpiCard
              title="Reached %"
              value={`${stats.reachedPercentage}%`}
              subtitle={`${stats.reachedCount || stats.reachedComplete || 0} outreach complete`}
              icon={BarChart2}
              color="emerald"
            />
            <KpiCard
              title="Back Officer Verified %"
              value={`${stats.backOfficerVerifiedPercentage || stats.headVerifiedPercentage || 0}%`}
              subtitle={`${stats.verifiedByBackOfficer || stats.verifiedByHead || 0} verified records`}
              icon={ShieldCheck}
              color="purple"
            />
            <KpiCard
              title="Fully Approved %"
              value={`${stats.fullyApprovedPercentage}%`}
              subtitle={`${stats.adminApproved} final approved`}
              icon={Award}
              color="amber"
            />
          </div>
        )}

        {/* Notification Banner */}
        {actionMessage && (
          <div className={`p-4 rounded-xl border text-xs font-semibold ${
            actionMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('approval')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'approval' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Final Approval Queue ({backOfficerVerifiedBatch.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('student-approvals')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'student-approvals' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Pending Student Approvals</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'users' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>System Users & RBAC ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('escalations')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'escalations' ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Level-4 Chamber Escalations ({level4Escalations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'payouts' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Cheque Validation Requests ({payoutRequests.filter(p => p.status === 'PENDING').length})</span>
          </button>
        </div>

        {/* Tab: Pending Student Approvals */}
        {activeTab === 'student-approvals' && (
          <PendingStudentsApproval onRefreshParent={fetchData} />
        )}

        {/* Tab 1: Final Approval Batch Table (Back Officer Verified Records) */}
        {activeTab === 'approval' && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search verified queue..."
                    className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium hidden md:block">
                  Records verified by <strong className="text-purple-700 dark:text-purple-400">Back Officer</strong> awaiting final acceptance (<strong className="text-indigo-700 dark:text-indigo-400 font-bold">ADMIN_APPROVED</strong>)
                </div>
              </div>

              {backOfficerVerifiedBatch.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bulk Approve All Verified ({backOfficerVerifiedBatch.length})</span>
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Alumni Name</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4">Verified By (Back Officer)</th>
                      <th className="py-3.5 px-4">Verification Date</th>
                      <th className="py-3.5 px-4">Current Stage</th>
                      <th className="py-3.5 px-4 text-right">Admin Final Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {backOfficerVerifiedBatch.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">
                          No records currently waiting for final admin approval.
                        </td>
                      </tr>
                    ) : (
                      backOfficerVerifiedBatch.map((record) => (
                        <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {record.name}
                            <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-normal">{record.mobile}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">{record.batch}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>{record.verifiedByBackOfficer?.name || 'Back Officer Verified'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{record.verifiedByBackOfficer?.email || ''}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {record.backOfficerVerificationDate 
                              ? new Date(record.backOfficerVerificationDate).toLocaleDateString() 
                              : new Date(record.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4"><StageBadge stage={record.verificationStage} /></td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedInspectId(record._id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 transition-all"
                                title="Inspect Full Profile & Verification Drawer"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Inspect</span>
                              </button>

                              <button
                                onClick={() => handleAdminApprove(record._id)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
                              >
                                <Award className="w-4 h-4" />
                                <span>Accept & Final Approve</span>
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

        {/* Tab 2: User Access & Role Provisioning */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Action Box */}
            <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Provision System Account</span>
              </h3>
              
              <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g. ramesh@college.edu"
                    className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Assign User Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                  >
                    <option value="STAFF_COORDINATOR">Staff Coordinator</option>
                    <option value="HEAD_OFFICER">Head Officer</option>
                    <option value="CHAMBER_BACK_OFFICER">Chamber Back Officer</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Department</label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="AIDS">AIDS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creatingUser}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 mt-2"
                >
                  {creatingUser ? 'Provisioning Account...' : 'Create Account & Issue Credentials'}
                </button>
              </form>
            </div>

            {/* Users List Table */}
            <div className="lg:col-span-2 bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Active System User Registry ({usersList.length})
                </h4>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">User Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">System Role</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {usersList.map((usr) => (
                      <tr key={usr._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{usr.name}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{usr.email}</td>
                        <td className="p-3 font-bold text-indigo-700 dark:text-indigo-400">{usr.role}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{usr.department || 'All'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Level-4 Chamber Escalations */}
        {activeTab === 'escalations' && (
          <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>Level-4 Escalation Drawer (Highest Priority)</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Alumni records requiring direct intervention by Chamber Leadership / System Admin.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151D2F]">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Alumni Name</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Escalation Stage</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {level4Escalations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500 dark:text-slate-400 italic">
                        No active Level-4 Chamber Head escalations.
                      </td>
                    </tr>
                  ) : (
                    level4Escalations.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{item.name}</td>
                        <td className="p-3 text-indigo-700 dark:text-indigo-400 font-mono font-semibold">{item.batch}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.mobile}</td>
                        <td className="p-3"><EscalationBadge level={item.escalationLevel} /></td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedInspectId(item._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-300 dark:border-sky-700 flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Inspect & Intervene</span>
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

        {/* Tab 5: Cheque Validation & Incentive Payout Requests */}
        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#151D2F] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Student Coordinator Incentive & Cheque Payout Requests</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Validate student balance redemptions based on verified admin-approved alumni records (Rate: ₹10 / record, 90-day cooldown).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Pending Requests: {payoutRequests.filter(p => p.status === 'PENDING').length}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Student Coordinator</th>
                      <th className="py-3.5 px-4">Department / Year</th>
                      <th className="py-3.5 px-4">Verified Records</th>
                      <th className="py-3.5 px-4">Requested Amount</th>
                      <th className="py-3.5 px-4">Request Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">
                          No cheque payout requests found.
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {req.student?.name || 'Unknown Student'}
                            <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-normal">{req.student?.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {req.student?.department || 'N/A'} {req.student?.year ? `(${req.student.year} Year)` : ''}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-700 dark:text-indigo-400">
                            {req.verifiedRecordsCount} records
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                            ₹{req.requestedAmount}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {req.requestDate ? new Date(req.requestDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4">
                            {req.status === 'PENDING' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                Pending Approval
                              </span>
                            )}
                            {req.status === 'APPROVED_CHEQUE_ISSUED' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                Cheque Issued
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleProcessPayout(req._id, 'REJECT')}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-700 transition-all"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span>Reject</span>
                                </button>
                                <button
                                  onClick={() => handleProcessPayout(req._id, 'APPROVE')}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Issue Cheque</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                Processed {req.processedAt ? new Date(req.processedAt).toLocaleDateString() : ''}
                              </div>
                            )}
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

        {/* Master Excel Ingestion Modal */}
        <ExcelUploadModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          onRefresh={fetchData}
        />

        {/* Add Student Coordinator Modal */}
        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
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

      </main>
    </div>
  );
};

export default AdminDashboard;
