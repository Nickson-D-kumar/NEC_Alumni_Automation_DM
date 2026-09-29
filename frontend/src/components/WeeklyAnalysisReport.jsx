import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell 
} from 'recharts';
import { Calendar, AlertCircle, RefreshCw, BarChart2, Info, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const WeeklyAnalysisReport = ({ department = 'ALL' }) => {
  const { isDark } = useTheme();

  // Helper to format date object to YYYY-MM-DD
  const formatDateToISO = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // Initial defaults: To Date = today, From Date = 8 weeks ago (56 days)
  const today = new Date();
  const eightWeeksAgo = new Date(today.getTime() - 56 * 24 * 60 * 60 * 1000);

  const [fromDate, setFromDate] = useState(formatDateToISO(eightWeeksAgo));
  const [toDate, setToDate] = useState(formatDateToISO(today));
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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

  const fetchWeeklyData = async () => {
    const valError = validateDates(fromDate, toDate);
    if (valError) {
      setErrorMsg(valError);
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await api.get('/analytics/weekly-breakdown', {
        params: {
          startDate: fromDate,
          endDate: toDate,
          department
        }
      });

      if (response.data.success) {
        setChartData(response.data.data || []);
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
  }, [department]);

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    fetchWeeklyData();
  };

  const handleQuickPreset = (weeksCount) => {
    const end = new Date();
    const start = new Date(end.getTime() - weeksCount * 7 * 24 * 60 * 60 * 1000);
    const startISO = formatDateToISO(start);
    const endISO = formatDateToISO(end);
    setFromDate(startISO);
    setToDate(endISO);
    
    // Auto-fetch after setting state
    setTimeout(() => {
      setErrorMsg(null);
      setLoading(true);
      api.get('/analytics/weekly-breakdown', {
        params: { startDate: startISO, endDate: endISO, department }
      }).then(res => {
        if (res.data.success) setChartData(res.data.data || []);
      }).catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to fetch weekly analysis report data.');
      }).finally(() => setLoading(false));
    }, 0);
  };

  // Total verified count in current view
  const totalVerifiedCount = chartData.reduce((acc, item) => acc + (item.verifiedCount || 0), 0);
  const isDataEmpty = chartData.length === 0 || totalVerifiedCount === 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <p className="font-bold text-sky-400">{data.weekLabel}</p>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Period:</span>
            <span className="font-mono font-medium text-slate-100">{data.dateRangeText}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
            <span>Verified Records:</span>
            <span className="font-extrabold text-emerald-400 text-sm">{data.verifiedCount}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Primary Bar Colors:
  // Light mode: Violet/Purple (#7C3AED)
  // Dark mode: Bright Violet Accent (#A78BFA)
  const barColor = isDark ? '#A78BFA' : '#7C3AED';
  const barHoverColor = isDark ? '#8B5CF6' : '#5B21B6';

  return (
    <div className="bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-6">
      
      {/* Section Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Weekly Analysis Report</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Weekly verified alumni volume trends & throughput aggregation over selected timeframe
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Verified in View:</span>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {totalVerifiedCount} Records
          </span>
        </div>
      </div>

      {/* Date Range Controls & Presets */}
      <div className="space-y-3">
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-[#1E293B]/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* From Date */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">From:</label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white dark:bg-[#151D2F] border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To:</label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white dark:bg-[#151D2F] border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7C3AED] hover:bg-[#5B21B6] dark:bg-purple-600 dark:hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Fetching...' : 'Apply Filter'}</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-semibold hidden lg:inline">Presets:</span>
            <button
              type="button"
              onClick={() => handleQuickPreset(4)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-[#151D2F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-medium transition"
            >
              4 Weeks
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(8)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-[#151D2F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-medium transition"
            >
              8 Weeks
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(12)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-[#151D2F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-medium transition"
            >
              3 Months
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

      {/* Bar Chart Representation */}
      <div className="pt-2">
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 text-sky-600 dark:text-sky-400 animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Aggregating weekly verified throughput...</span>
          </div>
        ) : isDataEmpty ? (
          /* Empty State Illustration */
          <div className="h-72 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
            <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No alumni verified during this period.</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
                There are no verified alumni records matching the selected date range ({fromDate} to {toDate}). Try selecting a broader timeframe.
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
                  dataKey="verifiedCount"
                  fill={barColor}
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.verifiedCount > 0 ? barColor : (isDark ? '#1E293B' : '#E2E8F0')}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
};

export default WeeklyAnalysisReport;
