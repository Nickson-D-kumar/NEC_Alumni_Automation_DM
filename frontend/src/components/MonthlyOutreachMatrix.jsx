import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Search, RefreshCw, CheckCircle2, Clock, ShieldCheck, AlertCircle, Filter, Check, Award } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

// Helper to calculate exact number of calendar weeks in selected month & year (4 or 5)
function getWeeksInMonth(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysCount = lastDay.getDate();
  const weeks = Math.ceil((daysCount + firstDay.getDay()) / 7);
  return Math.min(5, Math.max(4, weeks));
}

const MonthlyOutreachMatrix = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState('');
  const [alumniList, setAlumniList] = useState([]);
  const [trackingMap, setTrackingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const totalWeeks = getWeeksInMonth(selectedYear, selectedMonth);
  const weekNumbers = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/monthly-tracking', {
        params: {
          year: selectedYear,
          month: selectedMonth
        }
      });

      const alumniData = response.data.alumni || [];
      const trackingData = response.data.tracking || [];

      // Build key-value map: `${alumniId}_w${weekNumber}_${milestone}` -> boolean
      const newMap = {};
      trackingData.forEach(item => {
        const alumniId = item.alumni;
        const w = item.weekNumber;
        if (item.connected) newMap[`${alumniId}_w${w}_connected`] = true;
        if (item.formShared) newMap[`${alumniId}_w${w}_form_shared`] = true;
        if (item.detailsCollected) newMap[`${alumniId}_w${w}_details_collected`] = true;
        if (item.verified) newMap[`${alumniId}_w${w}_verified`] = true;
      });

      setAlumniList(alumniData);
      setTrackingMap(newMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching monthly tracking matrix:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrixData();
  }, [selectedMonth, selectedYear]);

  const handleCheckboxToggle = async (alumniId, weekNum, milestone) => {
    const key = `${alumniId}_w${weekNum}_${milestone}`;
    const newStatus = !trackingMap[key];

    // Optimistic UI Update
    setTrackingMap(prev => ({
      ...prev,
      [key]: newStatus
    }));

    setSavingKey(key);
    try {
      let res;
      try {
        res = await api.patch('/student/monthly-tracking', {
          alumni_id: alumniId,
          year: selectedYear,
          month: selectedMonth,
          week_number: weekNum,
          milestone,
          status: newStatus
        });
      } catch (err1) {
        if (err1.response && err1.response.status === 404) {
          res = await api.patch('/student/alumni-tracking', {
            alumni_id: alumniId,
            year: selectedYear,
            month: selectedMonth,
            week_number: weekNum,
            milestone,
            status: newStatus
          });
        } else {
          throw err1;
        }
      }

      setSavingKey(null);
    } catch (error) {
      console.error('Auto-save milestone failed:', error);
      // Rollback on failure
      setTrackingMap(prev => ({
        ...prev,
        [key]: !newStatus
      }));
      setSavingKey(null);
      setActionMessage({ type: 'error', text: 'Failed to auto-save update. Check connection.' });
    }
  };

  const filteredAlumni = alumniList.filter(a => {
    if (!search || search.trim() === '') return true;
    const q = search.toLowerCase().trim();
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.mobile && a.mobile.includes(q)) ||
      (a.batch && a.batch.toString().includes(q)) ||
      (a.department && a.department.toLowerCase().includes(q))
    );
  });

  // Calculate final verification status per alumni for current month
  const isRowVerified = (alumniId) => {
    for (let w = 1; w <= totalWeeks; w++) {
      if (trackingMap[`${alumniId}_w${w}_verified`]) return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-[#151D2F] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Month & Year Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Outreach Period:</span>
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {totalWeeks} Calendar Weeks Calculated
          </span>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned alumni..."
              className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={fetchMatrixData}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Matrix</span>
          </button>
        </div>

      </div>

      {/* Notification Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Monthly Outreach Spreadsheet Matrix */}
      <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* Header Row 1: Week Groupings */}
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 w-48 border-r border-slate-200 dark:border-slate-700">Alumni Name</th>
                <th className="p-3.5 w-32 border-r border-slate-200 dark:border-slate-700">Phone No</th>
                {weekNumbers.map(w => (
                  <th key={w} colSpan={4} className="p-3.5 text-center border-r border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300">
                    Week {w}
                  </th>
                ))}
                <th className="p-3.5 text-center w-32">Final Status</th>
              </tr>

              {/* Header Row 2: Sub-milestone Columns */}
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-semibold">
                <th className="p-2 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-20 border-r border-slate-200 dark:border-slate-700"></th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700"></th>
                {weekNumbers.map(w => (
                  <React.Fragment key={w}>
                    <th className="p-2 text-center w-20 border-r border-slate-200/60 dark:border-slate-700/60 font-mono">Connected</th>
                    <th className="p-2 text-center w-20 border-r border-slate-200/60 dark:border-slate-700/60 font-mono">Form Shared</th>
                    <th className="p-2 text-center w-20 border-r border-slate-200/60 dark:border-slate-700/60 font-mono">Details Rec.</th>
                    <th className="p-2 text-center w-20 border-r border-slate-200 dark:border-slate-700 font-mono bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">Verified</th>
                  </React.Fragment>
                ))}
                <th className="p-2 text-center font-mono">Monthly Status</th>
              </tr>
            </thead>

            {/* Matrix Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={2 + (totalWeeks * 4) + 1} className="p-12 text-center text-slate-500 dark:text-slate-400 italic">
                    Loading monthly outreach matrix tracking data...
                  </td>
                </tr>
              ) : filteredAlumni.length === 0 ? (
                <tr>
                  <td colSpan={2 + (totalWeeks * 4) + 1} className="p-12 text-center text-slate-500 dark:text-slate-400 italic">
                    No assigned alumni records found.
                  </td>
                </tr>
              ) : (
                filteredAlumni.map((alumni) => {
                  const verified = isRowVerified(alumni._id);

                  return (
                    <tr key={alumni._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      
                      {/* 1. Alumni Name (Sticky) */}
                      <td className="p-3 sticky left-0 bg-white dark:bg-[#151D2F] hover:bg-slate-50 dark:hover:bg-slate-800 z-10 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="truncate w-44">{alumni.name}</div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">{alumni.batch}</div>
                      </td>

                      {/* 2. Phone Number */}
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-slate-700">
                        {alumni.mobile}
                      </td>

                      {/* 3. Dynamic Week Milestone Checkboxes */}
                      {weekNumbers.map(w => {
                        const connectedKey = `${alumni._id}_w${w}_connected`;
                        const formKey = `${alumni._id}_w${w}_form_shared`;
                        const detailsKey = `${alumni._id}_w${w}_details_collected`;
                        const verifiedKey = `${alumni._id}_w${w}_verified`;

                        return (
                          <React.Fragment key={w}>
                            {/* Connected */}
                            <td className="p-2 text-center border-r border-slate-200/60 dark:border-slate-700/60">
                              <input
                                type="checkbox"
                                checked={Boolean(trackingMap[connectedKey])}
                                onChange={() => handleCheckboxToggle(alumni._id, w, 'connected')}
                                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 cursor-pointer accent-[#003366]"
                                title={`Week ${w}: Call Connected`}
                              />
                            </td>

                            {/* Form Shared */}
                            <td className="p-2 text-center border-r border-slate-200/60 dark:border-slate-700/60">
                              <input
                                type="checkbox"
                                checked={Boolean(trackingMap[formKey])}
                                onChange={() => handleCheckboxToggle(alumni._id, w, 'form_shared')}
                                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 cursor-pointer accent-[#003366]"
                                title={`Week ${w}: Google Form Shared`}
                              />
                            </td>

                            {/* Details Collected */}
                            <td className="p-2 text-center border-r border-slate-200/60 dark:border-slate-700/60">
                              <input
                                type="checkbox"
                                checked={Boolean(trackingMap[detailsKey])}
                                onChange={() => handleCheckboxToggle(alumni._id, w, 'details_collected')}
                                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 cursor-pointer accent-[#003366]"
                                title={`Week ${w}: Details Collected`}
                              />
                            </td>

                            {/* Verified */}
                            <td className="p-2 text-center border-r border-slate-200 dark:border-slate-700 bg-emerald-50/20 dark:bg-emerald-950/10">
                              <input
                                type="checkbox"
                                checked={Boolean(trackingMap[verifiedKey])}
                                onChange={() => handleCheckboxToggle(alumni._id, w, 'verified')}
                                className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                title={`Week ${w}: Final Verified`}
                              />
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* 4. Final Status Column */}
                      <td className="p-3 text-center">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Pending</span>
                          </span>
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

    </div>
  );
};

export default MonthlyOutreachMatrix;
