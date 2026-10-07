import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Clock, 
  User, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  Filter, 
  Send, 
  AlertTriangle,
  Building,
  MapPin,
  Calendar,
  GraduationCap,
  XCircle
} from 'lucide-react';
import api from '../services/api';

const AlumniDiffReviewModal = ({ alumniId, isOpen, onClose, onActionComplete }) => {
  const [loading, setLoading] = useState(true);
  const [diffData, setDiffData] = useState(null);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('CHANGED_ONLY'); // 'ALL' | 'CHANGED_ONLY'
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    if (isOpen && alumniId) {
      fetchDiff();
    } else {
      setDiffData(null);
      setError(null);
      setShowRevisionForm(false);
      setRevisionRemarks('');
      setShowRejectionForm(false);
      setRejectionReason('');
      setActionSuccess(null);
      setFilterMode('CHANGED_ONLY');
    }
  }, [isOpen, alumniId]);

  const fetchDiff = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      try {
        response = await api.get(`/back-officer/alumni/${alumniId}/diff`);
      } catch (err1) {
        response = await api.get(`/alumni/${alumniId}/diff`);
      }
      setDiffData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch alumni diff:', err);
      setError(err.response?.data?.message || 'Failed to load comparison data');
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setActionLoading(true);
    setError(null);
    try {
      let response;
      try {
        response = await api.post(`/back-officer/alumni/${alumniId}/verify`);
      } catch (err1) {
        response = await api.put(`/alumni/${alumniId}/verify-back-officer`);
      }
      setActionSuccess(response.data.message || 'Record successfully verified and forwarded to Admin queue!');
      setTimeout(() => {
        if (onActionComplete) onActionComplete();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setActionLoading(false);
    }
  };

  const handleRequestRevisionSubmit = async (e) => {
    e.preventDefault();
    if (!revisionRemarks.trim()) {
      setError('Please provide specific correction instructions for the Student Coordinator');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      let response;
      try {
        response = await api.post(`/back-officer/alumni/${alumniId}/request-revision`, {
          remarks: revisionRemarks.trim()
        });
      } catch (err1) {
        response = await api.post(`/officer/alumni/${alumniId}/request-revision`, {
          remarks: revisionRemarks.trim()
        });
      }
      setActionSuccess(response.data.message || 'Revision request successfully dispatched!');
      setTimeout(() => {
        if (onActionComplete) onActionComplete();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send revision request');
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a mandatory rejection reason (e.g. Invalid phone number / fake details / unverified workplace)');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      let response;
      try {
        response = await api.post(`/back-officer/alumni/${alumniId}/reject`, {
          reason: rejectionReason.trim()
        });
      } catch (err1) {
        response = await api.post(`/alumni/${alumniId}/reject`, {
          reason: rejectionReason.trim()
        });
      }
      setActionSuccess(response.data.message || 'Verification rejected. Record marked as VERIFICATION_REJECTED.');
      setTimeout(() => {
        if (onActionComplete) onActionComplete();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject verification');
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const changes = diffData?.changes || [];
  const filteredChanges = changes.filter(c => {
    if (filterMode === 'CHANGED_ONLY') {
      return c.status === 'MODIFIED' || c.status === 'NEWLY_ADDED' || c.status === 'REMOVED';
    }
    return true;
  });

  const modifiedCount = diffData?.summary?.modifiedCount || 0;
  const addedCount = diffData?.summary?.addedCount || 0;
  const unchangedCount = diffData?.summary?.unchangedCount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#151D2F] w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-[#7C3AED] dark:text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Alumni Data Comparison & Diff Review
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 dark:bg-purple-950/70 text-[#7C3AED] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Back Officer Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Side-by-side comparison of original Master Sheet data versus Student Coordinator updates
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Action Success Alert */}
          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Computing field-by-field differences...</p>
            </div>
          ) : diffData ? (
            <>
              {/* Audit Meta Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Left: Alumni Profile Identity */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Alumni Under Review
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {diffData.alumniName}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-semibold">
                      Batch {diffData.batch}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      {diffData.department}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    Phone: {diffData.mobile || 'N/A'} {diffData.email ? `• ${diffData.email}` : ''}
                  </div>
                </div>

                {/* Right: Submission Audit Info */}
                <div className="space-y-1.5 md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Submission Audit Stamp
                  </span>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="font-semibold">
                      {diffData.studentCoordinator?.name || 'Assigned Student Coordinator'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({diffData.studentCoordinator?.email || 'N/A'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Submitted on: {diffData.submittedAt ? new Date(diffData.submittedAt).toLocaleString() : 'Recent submission'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Summary Metrics & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{modifiedCount} Modified</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{addedCount} Newly Added</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {unchangedCount} Unchanged
                  </span>
                </div>

                {/* Filter Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setFilterMode('CHANGED_ONLY')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      filterMode === 'CHANGED_ONLY'
                        ? 'bg-white dark:bg-[#151D2F] text-[#7C3AED] dark:text-purple-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Changed Only ({modifiedCount + addedCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      filterMode === 'ALL'
                        ? 'bg-white dark:bg-[#151D2F] text-[#7C3AED] dark:text-purple-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All Fields ({changes.length})
                  </button>
                </div>
              </div>

              {/* Side-by-Side Diff Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 w-1/4">Field Attribute</th>
                      <th className="py-3 px-4 w-[37.5%] border-l border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Original Master Sheet Value</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 w-[37.5%] border-l border-slate-200 dark:border-slate-700 bg-purple-50/50 dark:bg-purple-950/20 text-[#7C3AED] dark:text-purple-300">
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Student Updated Submission</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {filteredChanges.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                          No modified or newly added fields detected. Record matches the baseline data.
                        </td>
                      </tr>
                    ) : (
                      filteredChanges.map((change, idx) => {
                        const isModified = change.status === 'MODIFIED';
                        const isAdded = change.status === 'NEWLY_ADDED';
                        const isRemoved = change.status === 'REMOVED';

                        let rowBg = 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
                        if (isModified) rowBg = 'bg-amber-50/60 dark:bg-amber-950/25 hover:bg-amber-50 dark:hover:bg-amber-950/35';
                        if (isAdded) rowBg = 'bg-emerald-50/60 dark:bg-emerald-950/25 hover:bg-emerald-50 dark:hover:bg-emerald-950/35';
                        if (isRemoved) rowBg = 'bg-rose-50/60 dark:bg-rose-950/25 hover:bg-rose-50 dark:hover:bg-rose-950/35';

                        return (
                          <tr key={idx} className={`transition-colors ${rowBg}`}>
                            
                            {/* Field Name & Status Tag */}
                            <td className="py-3 px-4 align-top">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 font-sans text-xs">
                                {change.label}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                {change.field}
                              </div>
                              <div className="mt-1">
                                {isModified && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    Edited
                                  </span>
                                )}
                                {isAdded && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                    Added
                                  </span>
                                )}
                                {isRemoved && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                    Removed
                                  </span>
                                )}
                                {change.status === 'UNCHANGED' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-medium">
                                    Unchanged
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Original Value */}
                            <td className="py-3 px-4 align-top border-l border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 break-words">
                              {change.oldValue ? (
                                <span className={isModified ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                                  {change.oldValue}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 italic font-sans text-[11px]">
                                  (Empty / Not Provided)
                                </span>
                              )}
                            </td>

                            {/* Student Updated Value */}
                            <td className="py-3 px-4 align-top border-l border-slate-200 dark:border-slate-800 break-words">
                              {change.newValue ? (
                                <span className={`font-semibold ${
                                  isModified 
                                    ? 'text-amber-900 dark:text-amber-300' 
                                    : isAdded 
                                    ? 'text-emerald-900 dark:text-emerald-300 font-bold' 
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {change.newValue}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 italic font-sans text-[11px]">
                                  (Blank)
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

              {/* Optional Inline Revision Remarks Drawer */}
              {showRevisionForm && (
                <form onSubmit={handleRequestRevisionSubmit} className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span>Request Student Revision & Explain Required Changes</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={revisionRemarks}
                    onChange={(e) => setRevisionRemarks(e.target.value)}
                    placeholder="Specify which fields need correction (e.g. 'Company name is verified but mobile number was flagged unreachable, please re-confirm phone with alumni')..."
                    className="w-full p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#151D2F] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !revisionRemarks.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{actionLoading ? 'Dispatching...' : 'Send Revision Request'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Rejection Form */}
              {showRejectionForm && (
                <form onSubmit={handleRejectSubmit} className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Reject Verification (Mandatory Rejection Reason)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRejectionForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter mandatory rejection reason (e.g. 'Invalid phone number / fake details / unverified workplace / unreachable contact')..."
                    className="w-full p-3 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-[#151D2F] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectionForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{actionLoading ? 'Rejecting...' : 'Confirm Rejection'}</span>
                    </button>
                  </div>
                </form>
              )}

            </>
          ) : null}

        </div>

        {/* Action Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Close Diff Review
          </button>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            
            {/* Reject Verification Button */}
            {!showRejectionForm && (
              <button
                type="button"
                onClick={() => {
                  setShowRejectionForm(true);
                  setShowRevisionForm(false);
                }}
                disabled={actionLoading || !diffData}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                title="Reject verification for this record"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Verification</span>
              </button>
            )}

            {/* Request Revision Button */}
            {!showRevisionForm && (
              <button
                type="button"
                onClick={() => {
                  setShowRevisionForm(true);
                  setShowRejectionForm(false);
                }}
                disabled={actionLoading || !diffData}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Request Student Revision</span>
              </button>
            )}

            {/* Verify & Forward to Admin Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={actionLoading || !diffData}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-purple-600/20 transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{actionLoading ? 'Verifying Record...' : 'Verify & Forward to Admin'}</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AlumniDiffReviewModal;
