import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CircularProgressRing from '../components/CircularProgressRing';
import api from '../services/api';
import { 
  BarChart3, Filter, Building2, Calendar, RefreshCw, 
  Database, CheckCircle2, Clock, ShieldCheck, Award, 
  Layers, PieChart, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AnalyticsDashboard = () => {
  const { user } = useAuth();

  const [department, setDepartment] = useState('ALL');
  const [range, setRange] = useState('all');

  const [analyticsData, setAnalyticsData] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState([
    'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'OTHER'
  ]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchAnalyticsSummary = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.get('/analytics/summary', {
        params: { department, range }
      });

      if (response.data.success) {
        setAnalyticsData(response.data.data);
        if (response.data.data.departmentList && response.data.data.departmentList.length > 0) {
          setDepartmentOptions(response.data.data.departmentList);
        }
      }
    } catch (err) {
      console.error('Analytics summary fetch error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch analytics summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsSummary();
  }, [department, range]);

  const {
    total = 0,
    completed = 0,
    pending = 0,
    completionRate = 0,
    pendingRate = 0,
    reachedRate = 0,
    breakdown = {}
  } = analyticsData || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">

        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Institutional Data Analytics & Insights
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Real-time verification progress, intake volume tracking, and completion ratios for Executive Leadership
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Role: <strong className="text-purple-700 dark:text-purple-400 font-bold">
                {user?.role === 'ADMIN' ? 'System Administrator' : (user?.role === 'CHAMBER_BACK_OFFICER' || user?.role === 'BACK_OFFICER') ? 'Chamber Back Officer' : 'Head Officer'}
              </strong>
            </span>
          </div>
        </div>

        {/* STICKY TOP FILTER BAR */}
        <div className="sticky top-16 z-30 bg-white dark:bg-[#151D2F] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Filter Metrics:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            
            {/* 1. Department Filter */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 flex-1 sm:flex-none">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-transparent text-xs text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL" className="dark:bg-[#1E293B]">All Departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept} className="dark:bg-[#1E293B]">
                    {dept} Department
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Timeframe Filter */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 flex-1 sm:flex-none">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="bg-transparent text-xs text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="dark:bg-[#1E293B]">All Time</option>
                <option value="1y" className="dark:bg-[#1E293B]">Last 1 Year</option>
                <option value="6m" className="dark:bg-[#1E293B]">Last 6 Months</option>
                <option value="1m" className="dark:bg-[#1E293B]">Last 1 Month</option>
              </select>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={fetchAnalyticsSummary}
              className="p-2 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center shadow-sm"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* 3 MAIN ANIMATED CIRCULAR PROGRESS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Total Records */}
          <CircularProgressRing
            title="Total Intake Records"
            percentage={100}
            count={total}
            subtitle="Filtered master database records"
            icon={Database}
            colorScheme="indigo"
          />

          {/* Card 2: Completed / Processed Data */}
          <CircularProgressRing
            title="Completed & Processed"
            percentage={completionRate}
            count={completed}
            subtitle="Verified by Back Officer or Approved"
            icon={CheckCircle2}
            colorScheme="emerald"
          />

          {/* Card 3: Not Completed / Pending Data */}
          <CircularProgressRing
            title="Pending Verification"
            percentage={pendingRate}
            count={pending}
            subtitle="Awaiting student action or verification"
            icon={Clock}
            colorScheme="amber"
          />

        </div>

        {/* EXTENDED VISUAL PIPELINE BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Detailed Verification Lifecycle Breakdown */}
          <div className="lg:col-span-2 bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Multi-Tier Verification Pipeline Stages</span>
              </h3>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-semibold">Total Scope: {total} Records</span>
            </div>

            {/* Stacked Visual Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  style={{ width: `${total > 0 ? ((breakdown.adminApproved || 0) / total) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-700"
                  title={`Admin Approved: ${breakdown.adminApproved || 0}`}
                />
                <div
                  style={{ width: `${total > 0 ? ((breakdown.verifiedByBackOfficer || 0) / total) * 100 : 0}%` }}
                  className="bg-purple-500 h-full transition-all duration-700"
                  title={`Verified by Back Officer: ${breakdown.verifiedByBackOfficer || 0}`}
                />
                <div
                  style={{ width: `${total > 0 ? ((breakdown.submittedByStudent || 0) / total) * 100 : 0}%` }}
                  className="bg-sky-500 h-full transition-all duration-700"
                  title={`Submitted by Student: ${breakdown.submittedByStudent || 0}`}
                />
                <div
                  style={{ width: `${total > 0 ? ((breakdown.pendingSubmission || 0) / total) * 100 : 0}%` }}
                  className="bg-amber-500 h-full rounded-r-full transition-all duration-700"
                  title={`Pending Submission: ${breakdown.pendingSubmission || 0}`}
                />
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Admin Approved</span>
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">{breakdown.adminApproved || 0}</div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">Finalized System Acceptance</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-purple-800 dark:text-purple-300 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                    <span>Back Officer Verified</span>
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">{breakdown.verifiedByBackOfficer || 0}</div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">Validated by Officer</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-sky-800 dark:text-sky-300 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    <span>Submitted Student</span>
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">{breakdown.submittedByStudent || 0}</div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">Awaiting Back Officer Check</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-bold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Pending Student</span>
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">{breakdown.pendingSubmission || 0}</div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">Initial Student Entry Needed</div>
                </div>

              </div>
            </div>
          </div>

          {/* Outreach Reachability Metric */}
          <div className="bg-white dark:bg-[#151D2F] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Outreach Reachability Index</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Percentage of alumni contacted with updated verified phone or workplace details
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block uppercase">Reached Ratio</span>
                <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">{reachedRate}%</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Complete Contacts:</span>
                <strong className="text-slate-900 dark:text-white">{breakdown.reachedComplete || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Partial / Incomplete:</span>
                <strong className="text-slate-700 dark:text-slate-300">{breakdown.reachedIncomplete || 0}</strong>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default AnalyticsDashboard;
