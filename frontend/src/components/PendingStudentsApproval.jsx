import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserCheck, Check, X, RefreshCw, Clock, AlertCircle } from 'lucide-react';

export default function PendingStudentsApproval({ onRefreshParent }) {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/pending-students');
      setPendingStudents(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending student registrations:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const handleVerify = async (studentId, action) => {
    setProcessingId(studentId);
    setActionMessage(null);
    try {
      const response = await api.put(`/users/verify-student/${studentId}`, { action });
      setActionMessage({
        type: 'success',
        text: response.data.message || `Student registration ${action.toLowerCase()}d`
      });
      setProcessingId(null);
      fetchPendingStudents();
      if (onRefreshParent) onRefreshParent();
    } catch (error) {
      setProcessingId(null);
      setActionMessage({
        type: 'error',
        text: error.response?.data?.message || 'Verification update failed'
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
      
      {/* Panel Header */}
      <div className="p-4 bg-white dark:bg-[#151D2F] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Student Coordinator Approvals</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Self-registered student access requests requiring verification</p>
          </div>
        </div>

        <button
          onClick={fetchPendingStudents}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className={`px-4 py-2.5 text-xs font-semibold border-b ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Review Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
          <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3.5 px-4">Student Name</th>
              <th className="py-3.5 px-4">Mobile Number</th>
              <th className="py-3.5 px-4">College Email</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Registration Date</th>
              <th className="py-3.5 px-4 text-right">Approval Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400 italic">
                  Loading pending registrations...
                </td>
              </tr>
            ) : pendingStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-1" />
                    <span className="font-medium text-slate-600 dark:text-slate-400">No pending student registration requests awaiting approval.</span>
                  </div>
                </td>
              </tr>
            ) : (
              pendingStudents.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {student.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {student.mobile}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {student.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-[11px]">
                      {student.department}
                    </span>
                    {student.year && (
                      <span className="ml-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        ({student.year})
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {new Date(student.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      
                      {/* Approve Green Button */}
                      <button
                        onClick={() => handleVerify(student._id, 'APPROVE')}
                        disabled={processingId === student._id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50"
                        title="Approve Student Account Access"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      {/* Reject Button */}
                      <button
                        onClick={() => handleVerify(student._id, 'REJECT')}
                        disabled={processingId === student._id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-all disabled:opacity-50"
                        title="Reject Student Registration Request"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
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
  );
}
