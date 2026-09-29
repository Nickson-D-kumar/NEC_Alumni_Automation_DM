import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  X, CheckCircle, Phone, Mail, MapPin, 
  Briefcase, MessageSquare, Clock, UserCheck, ShieldCheck 
} from 'lucide-react';

export default function AlumniInspectModal({ alumniId, userRole, isOpen, onClose, onActionComplete }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarkText, setRemarkText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && alumniId) {
      fetchDetails();
    }
  }, [isOpen, alumniId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/alumni/${alumniId}/inspect`);
      setData(res.data.data);
    } catch (err) {
      console.error('Error fetching inspection details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrApprove = async (actionType) => {
    try {
      setSubmitting(true);
      const endpoint = actionType === 'BACK_OFFICER_VERIFY' ? 'verify-back-officer' : 'admin-approve';
      await api.put(`/alumni/${alumniId}/${endpoint}`);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostRemark = async () => {
    if (!remarkText.trim()) return;
    try {
      setSubmitting(true);
      await api.post(`/alumni/${alumniId}/add-remark`, { message: remarkText });
      setRemarkText('');
      fetchDetails();
    } catch (err) {
      alert('Failed to submit remark');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{data?.name || 'Loading...'}</h2>
              {data?.batch && (
                <span className="text-xs px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-semibold">{data.batch}</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Assigned Coordinator: {data?.assignedTo?.name || 'None'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading || !data ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Fetching detailed record...</div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-100">
            
            {/* Core Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Contact Info</span>
                <div className="mt-2 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" /> {data.mobile}</p>
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" /> {data.email || 'N/A'}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" /> {data.currentLocation || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Professional Info</span>
                <div className="mt-2 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                  <p className="font-semibold text-slate-900 dark:text-white">{data.professional?.position || 'Not Listed'}</p>
                  <p className="text-slate-600 dark:text-slate-400">{data.professional?.company || 'Not Listed'}</p>
                  <p className="text-slate-600 dark:text-slate-400">{data.professional?.experienceYears ? `${data.professional.experienceYears} Yrs Experience` : ''}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Engagement Opt-ins</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${data.contributions?.mentorStudents ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>Mentor</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${data.contributions?.webinarSpeaker ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>Speaker</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${data.contributions?.scholarships ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>Scholarships</span>
                </div>
              </div>
            </div>

            {/* Back Officer Verification Badge Box */}
            {(data.verifiedByBackOfficer || data.backOfficerVerificationDate) && (
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      Verified by Back Officer: {data.verifiedByBackOfficer?.name || 'Chamber Back Officer'}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      {data.verifiedByBackOfficer?.email || ''}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-purple-800 dark:text-purple-300 font-semibold">
                  {data.backOfficerVerificationDate ? new Date(data.backOfficerVerificationDate).toLocaleString() : ''}
                </div>
              </div>
            )}

            {/* Outreach Logs */}
            <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Outreach Call Trail
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {!data.callLogs || data.callLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No call logs recorded yet.</p>
                ) : (
                  data.callLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-[#1E293B] p-2 rounded border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-sky-700 dark:text-sky-400 mr-2">[{log.channel}]</span>
                        <span className="text-slate-800 dark:text-slate-200 mr-2 font-medium">{log.outcome}</span>
                        <span className="text-slate-500 dark:text-slate-400">{log.remarks}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Remarks / Feedback Loop */}
            <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-2.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Remarks / Feedback Thread
              </span>
              <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto">
                {!data.adminRemarks || data.adminRemarks.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No feedback added.</p>
                ) : (
                  data.adminRemarks.map((rem, i) => (
                    <div key={i} className="text-xs bg-white dark:bg-[#1E293B] p-2 rounded border border-slate-200 dark:border-slate-800 flex justify-between">
                      <div>
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">{rem.role || rem.sender?.role || 'Officer'}: </span>
                        <span className="text-slate-700 dark:text-slate-300">{rem.message}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">{new Date(rem.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type feedback or correction note for the student..."
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handlePostRemark}
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition"
                >
                  Send Note
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          <div className="text-xs">
            <span className="text-slate-600 dark:text-slate-400">Current Stage: </span>
            <span className="font-semibold text-sky-700 dark:text-sky-400">{data?.verificationStage || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2">
            {(userRole === 'CHAMBER_BACK_OFFICER' || userRole === 'BACK_OFFICER' || userRole === 'ADMIN') && data?.verificationStage === 'SUBMITTED_BY_STUDENT' && (
              <button
                onClick={() => handleVerifyOrApprove('BACK_OFFICER_VERIFY')}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Verify Record (Back Officer)</span>
              </button>
            )}

            {userRole === 'ADMIN' && (data?.verificationStage === 'VERIFIED_BY_BACK_OFFICER' || data?.verificationStage === 'VERIFIED_BY_HEAD') && (
              <button
                onClick={() => handleVerifyOrApprove('ADMIN_APPROVE')}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accept & Approve</span>
              </button>
            )}

            <button onClick={onClose} className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition">
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
