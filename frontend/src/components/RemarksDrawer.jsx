import React, { useState } from 'react';
import { X, MessageSquare, Send, User, Clock } from 'lucide-react';
import api from '../services/api';

const RemarksDrawer = ({ alumni, isOpen, onClose, onRefresh }) => {
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen || !alumni) return null;

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      await api.post(`/alumni/${alumni._id}/remark`, {
        message: messageText
      });

      setMessageText('');
      setFeedback({ type: 'success', text: 'Remark successfully recorded' });
      setLoading(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      setLoading(false);
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Error posting remark' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2F] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Officer Remarks & Feedback</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Targeting record: <span className="text-amber-600 dark:text-amber-300 font-semibold">{alumni.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {feedback && (
            <div className={`p-2.5 rounded-lg text-xs font-medium ${
              feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
            }`}>
              {feedback.text}
            </div>
          )}

          {/* New Remark Input */}
          <form onSubmit={handleAddRemark} className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Dispatch Remarks / Instructions</label>
            <textarea
              rows={3}
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter feedback or instructions for student coordinator..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !messageText.trim()}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Posting...' : 'Post Remark'}</span>
              </button>
            </div>
          </form>

          {/* Past Remarks Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Remarks Log ({alumni.adminRemarks?.length || 0})</h4>

            {!alumni.adminRemarks || alumni.adminRemarks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800/60">
                No officer remarks recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {alumni.adminRemarks.slice().reverse().map((rem, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                        <User className="w-3 h-3" />
                        <span>{rem.sender?.name || 'Officer'}</span>
                        <span className="text-slate-500 font-normal">({rem.role})</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(rem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 pl-4 border-l-2 border-amber-500/40">
                      {rem.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RemarksDrawer;
