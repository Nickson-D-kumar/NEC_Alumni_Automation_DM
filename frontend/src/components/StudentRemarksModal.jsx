import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, MessageSquare, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function StudentRemarksModal({ alumniId, alumni, isOpen, onClose }) {
  const [remarks, setRemarks] = useState([]);
  const [alumniName, setAlumniName] = useState('');
  const [stage, setStage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);

  const targetId = alumniId || alumni?._id || alumni?.id;

  useEffect(() => {
    if (isOpen && targetId) {
      fetchStudentRemarks();
    } else {
      setRemarks([]);
      setAlumniName('');
      setStage('');
      setRejectionReason('');
    }
  }, [isOpen, targetId]);

  const fetchStudentRemarks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/alumni/${targetId}/student-remarks`);
      const remarksList = res.data.data?.adminRemarks || res.data.remarks || [];
      setRemarks(remarksList);
      setAlumniName(res.data.data?.name || alumni?.name || 'Alumni');
      setStage(res.data.data?.verificationStage || alumni?.verificationStage || '');
      setRejectionReason(res.data.data?.rejectionReason || res.data.data?.backOfficerRemarks || alumni?.rejectionReason || '');
    } catch (err) {
      console.error('Error fetching student remarks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${stage === 'VERIFICATION_REJECTED' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
              {stage === 'VERIFICATION_REJECTED' ? <XCircle size={16}/> : <MessageSquare size={16}/>}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Officer Remarks & Audit Log</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Profile: <span className="text-sky-600 dark:text-sky-400 font-medium">{alumniName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16}/></button>
        </div>

        {/* Thread */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-2.5">
          {stage === 'VERIFICATION_REJECTED' && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex flex-col gap-1 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Verification Rejected by Back Officer</span>
              </div>
              <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                {rejectionReason || 'Record was rejected during back officer verification review.'}
              </p>
            </div>
          )}
          {loading ? (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-6">Loading notes...</p>
          ) : remarks.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="mx-auto text-emerald-500 dark:text-emerald-400 mb-1.5" size={20}/>
              <p className="text-xs text-slate-600 dark:text-slate-400">No pending remarks or revision requests.</p>
            </div>
          ) : (
            remarks.map((r, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {r.role || r.sender?.role || 'Officer'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock size={10}/> {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{r.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex justify-end">
          <button onClick={onClose} className="px-3.5 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
