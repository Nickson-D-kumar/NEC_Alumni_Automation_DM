import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { 
  Calendar, AlertCircle, RefreshCw, BarChart2, Info, 
  CheckCircle2, Building2, Target, Award 
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getLastCouncilMeetingDateRange, formatDateToISO } from '../utils/dateUtils';

const WeeklyAnalysisReport = ({ department = 'ALL', onDepartmentChange = null }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Initial defaults: To Date = today, From Date = 8 weeks ago (56 days)
  const today = new Date();
  const eightWeeksAgo = new Date(today.getTime() - 56 * 24 * 60 * 60 * 1000);

  const [fromDate, setFromDate] = useState(formatDateToISO(eightWeeksAgo));
  const [toDate, setToDate] = useState(formatDateToISO(today));
  const [activePreset, setActivePreset] = useState('8w');
  
  // Department Selection State
  const [selectedDepartment, setSelectedDepartment] = useState(department || 'ALL');
  const [dynamicDepartments, setDynamicDepartments] = useState([]);

  const [chartData, setChartData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync with incoming department prop
  useEffect(() => {
    if (department && department !== selectedDepartment) {
      setSelectedDepartment(department);
    }
  }, [department]);

  // Validate Date Range
  const validateDates = (startStr, endStr) => {
    if (!startStr || !endStr) {
      return 'Please select both From Date and To Date.';
    }
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (end < start) {
      return 'To Date cannot be earlier than From Date.';
    }

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 180) {
      return 'Maximum date range is limited to 6 months.';
    }

    return null;
  };

  const fetchWeeklyData = async (overrideParams = {}) => {
    const sDate = overrideParams.startDate || fromDate;
    const eDate = overrideParams.endDate || toDate;
    const dept = overrideParams.department !== undefined ? overrideParams.department : selectedDepartment;

    const valError = validateDates(sDate, eDate);
    if (valError) {
      setErrorMsg(valError);
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await api.get('/analytics/weekly-breakdown', {
        params: {
          startDate: sDate,
          endDate: eDate,
          department: dept
        }
      });

      if (response.data.success) {
        const payloadData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setChartData(payloadData);
        if (response.data.summary) {
          setSummaryData(response.data.summary);
        }
        if (response.data.departments && response.data.departments.length > 0) {
          setDynamicDepartments(response.data.departments);
        } else if (response.data.departmentList && response.data.departmentList.length > 0) {
          setDynamicDepartments(response.data.departmentList);
        }
      } else if (Array.isArray(response.data)) {
        setChartData(response.data);
      }
    } catch (err) {
      console.error('Error fetching weekly breakdown:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch weekly analysis report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [selectedDepartment]);

  const handleDepartmentChange = (e) => {
    const val = e.target.value;
    setSelectedDepartment(val);
    if (onDepartmentChange) {
      onDepartmentChange(val);
    }
  };

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    setActivePreset(null);
    fetchWeeklyData();
  };

  const handleQuickPreset = (weeksCount, presetKey) => {
    const end = new Date();
    const start = new Date(end.getTime() - weeksCount * 7 * 24 * 60 * 60 * 1000);
    const startISO = formatDateToISO(start);
    const endISO = formatDateToISO(end);
    setFromDate(startISO);
    setToDate(endISO);
    setActivePreset(presetKey);
    
    fetchWeeklyData({ startDate: startISO, endDate: endISO });
  };

  const handleCouncilMeetingPreset = () => {
    const range = getLastCouncilMeetingDateRange();
    setFromDate(range.startDateISO);
    setToDate(range.endDateISO);
    setActivePreset('council');

    fetchWeeklyData({ startDate: range.startDateISO, endDate: range.endDateISO });
  };

  // Metrics Summary calculations (fallback to local sum if summaryData not populated)
  const totalTargetCount = summaryData?.totalTarget ?? chartData.reduce((acc, item) => acc + (item.target || 0), 0);
  const totalAchievedCount = summaryData?.totalAchieved ?? chartData.reduce((acc, item) => acc + (item.achieved || 0), 0);
  const conversionRateDisplay = summaryData?.conversionRate ?? (
    totalTargetCount > 0 ? `${((totalAchievedCount / totalTargetCount) * 100).toFixed(1)}%` : '0.0%'
  );

  const isDataEmpty = chartData.length === 0 || (totalTargetCount === 0 && totalAchievedCount === 0);

  // Colors:
  // Target: Slate Blue / Neutral Gray
  const targetBarColor = isDark ? '#94A3B8' : '#64748B';
  // Achieved: Brand Violet
  const achievedBarColor = isDark ? '#A78BFA' : '#7C3AED';

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const targetVal = data.target || 0;
      const achievedVal = data.achieved || 0;
      const weekRate = targetVal > 0 ? ((achievedVal / targetVal) * 100).toFixed(1) : 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2.5 min-w-[220px]">
          <div className="border-b border-slate-800 pb-1.5">
            <p className="font-bold text-white text-sm">{data.weekLabel}</p>
            <p className="text-[11px] font-mono text-slate-400">{data.dateRangeText}</p>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
                <span>Target (Allocated):</span>
              </span>
              <span className="font-mono font-bold text-slate-100">{targetVal} alumni</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED] dark:bg-[#A78BFA] inline-block" />
                <span>Achieved (Verified):</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{achievedVal} alumni</span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-800 text-slate-400 text-[11px]">
              <span>Week Conversion:</span>
              <span className="font-mono font-bold text-sky-400">{weekRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-6">
      
      {/* Section Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-[#7C3AED] dark:text-[#A78BFA]" />
            <span>Weekly Analysis Report</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Target quota allocation vs. final verified throughput performance aggregated across departments
          </p>
        </div>

        {/* Legend Swatches */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-slate-500 dark:bg-slate-400 inline-block shadow-sm" />
            <span>Target (Allocated)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#7C3AED] dark:text-[#A78BFA]">
            <span className="w-3 h-3 rounded-sm bg-[#7C3AED] dark:bg-[#A78BFA] inline-block shadow-sm" />
            <span>Achieved (Verified)</span>
          </div>
        </div>
      </div>

      {/* Top Summary Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Total Target */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Total Target (Allocated)</span>
            </div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {totalTargetCount}
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">alumni</span>
        </div>

        {/* Metric 2: Total Achieved */}
        <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Total Achieved (Verified)</span>
            </div>
            <div className="text-xl font-extrabold text-[#7C3AED] dark:text-[#A78BFA] font-mono">
              {totalAchievedCount}
            </div>
          </div>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">alumni</span>
        </div>

        {/* Metric 3: Overall Conversion Rate */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Overall Conversion Rate</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
              {conversionRateDisplay}
            </div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">ratio</span>
        </div>
      </div>

      {/* Date Range & Department Controls */}
      <div className="space-y-3">
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-[#1E293B]/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Department Dropdown */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department:</label>
              <select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#7C3AED] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="CSE">CSE - Computer Science & Engineering</option>
                <option value="ECE">ECE - Electronics & Communication</option>
                <option value="EEE">EEE - Electrical & Electronics</option>
                <option value="MECH">MECH - Mechanical Engineering</option>
                <option value="CIVIL">CIVIL - Civil Engineering</option>
                <option value="IT">IT - Information Technology</option>
                {dynamicDepartments
                  .filter((dept) => !['ALL', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'].includes(dept?.toUpperCase()))
                  .map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
              </select>
            </div>

            {/* From Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActivePreset(null);
                }}
                className="bg-white dark:bg-[#151D2F] border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] cursor-pointer"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActivePreset(null);
                }}
                className="bg-white dark:bg-[#151D2F] border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] cursor-pointer"
              />
            </div>

            {/* Apply Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Fetching...' : 'Apply Filter'}</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold hidden xl:inline">Presets:</span>
            <button
              type="button"
              onClick={() => handleQuickPreset(4, '4w')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                activePreset === '4w'
                  ? 'bg-[#7C3AED] text-white border border-[#7C3AED] shadow-sm'
                  : 'bg-white dark:bg-[#151D2F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              4 Weeks
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(8, '8w')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                activePreset === '8w'
                  ? 'bg-[#7C3AED] text-white border border-[#7C3AED] shadow-sm'
                  : 'bg-white dark:bg-[#151D2F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              8 Weeks
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(12, '12w')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                activePreset === '12w'
                  ? 'bg-[#7C3AED] text-white border border-[#7C3AED] shadow-sm'
                  : 'bg-white dark:bg-[#151D2F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              3 Months
            </button>
            <button
              type="button"
              onClick={handleCouncilMeetingPreset}
              title="Last Council Meeting to Present"
              className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${
                activePreset === 'council'
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#7C3AED] hover:text-white'
              }`}
            >
              Last Council Meeting
            </button>
          </div>

        </form>

        {/* Validation Toast / Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Grouped Dual Bar Chart Representation */}
      <div className="pt-2">
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 text-[#7C3AED] dark:text-[#A78BFA] animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Aggregating weekly target vs. achieved throughput...</span>
          </div>
        ) : isDataEmpty ? (
          /* Empty State Illustration */
          <div className="h-72 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
            <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No activity recorded during this period.</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
                There are no allocated quota or verified alumni records matching the selected timeframe ({fromDate} to {toDate}) and department ({selectedDepartment === 'ALL' ? 'All Departments' : selectedDepartment}). Try selecting a broader date range or "All Departments".
              </p>
            </div>
          </div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#334155' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="weekLabel"
                  stroke={isDark ? '#94A3B8' : '#64748B'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#334155' : '#CBD5E1' }}
                  dy={10}
                />
                <YAxis
                  stroke={isDark ? '#94A3B8' : '#64748B'}
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#334155' : '#CBD5E1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="target"
                  name="Target (Allocated)"
                  fill={targetBarColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="achieved"
                  name="Achieved (Verified)"
                  fill={achievedBarColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
};

export default WeeklyAnalysisReport;
