import React, { useState } from 'react';
import { X, Phone, MessageSquare, Mail, AlertTriangle, Send, Calendar, User } from 'lucide-react';
import api from '../services/api';

const CallLogModal = ({ alumni, isOpen, onClose, onRefresh }) => {
  const [channel, setChannel] = useState('CALL');
  const [outcome, setOutcome] = useState('ATTENDED');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen || !alumni) return null;

  const handleLogCall = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post(`/alumni/${alumni._id}/log-call`, {
        channel,
        outcome,
        remarks
      });

      setMessage({ type: 'success', text: response.data.message });
      setRemarks('');
      setLoading(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      setLoading(false);
      const errText = error.response?.data?.message || 'Failed to log call attempt';
      setMessage({ type: 'error', text: errText });
    }
  };

  const isUnreachable = ['INVALID_NUMBER', 'NOT_CONNECTED', 'SWITCHED_OFF'].includes(outcome);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#151D2F] w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Outreach Log Audit & History
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Alumni: <span className="text-indigo-700 dark:text-indigo-300 font-semibold">{alumni.name}</span> ({alumni.mobile}) - Batch {alumni.batch}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-white">
          
          {/* Notification Message */}
          {message && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
            }`}>
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="underline text-slate-500 dark:text-slate-400 ml-2">Dismiss</button>
            </div>
          )}

          {/* New Outreach Form */}
          <form onSubmit={handleLogCall} className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">Log New Contact Attempt</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Communication Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CALL', label: 'Call', icon: Phone },
                    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
                    { id: 'EMAIL', label: 'Email', icon: Mail }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setChannel(item.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          channel === item.id 
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20' 
                            : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Call / Contact Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ATTENDED" className="dark:bg-[#1E293B]">ATTENDED (Connected & Verified)</option>
                  <option value="NOT_CONNECTED" className="dark:bg-[#1E293B]">NOT CONNECTED (Ringing / No Answer)</option>
                  <option value="SWITCHED_OFF" className="dark:bg-[#1E293B]">SWITCHED OFF / Unreachable</option>
                  <option value="INVALID_NUMBER" className="dark:bg-[#1E293B]">INVALID NUMBER / Wrong Contact</option>
                </select>
              </div>
            </div>

            {/* Auto-escalation Warning */}
            {isUnreachable && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-2.5 rounded-lg text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Outcome indicates unreachable contact. Logging this will <strong>auto-escalate</strong> record to <strong>LEVEL_2_STAFF</strong> coordinator queue.
                </span>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Call Notes & Observations</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter details of conversation or attempt notes..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Logging Entry...' : 'Submit Log Entry'}</span>
              </button>
            </div>
          </form>

          {/* Historical Logs List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Audit Log Trail ({alumni.callLogs?.length || 0})</h4>

            {!alumni.callLogs || alumni.callLogs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800/60">
                No prior outreach logs recorded for this alumni.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {alumni.callLogs.slice().reverse().map((log, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                          {log.channel}
                        </span>
                        <span className={`font-semibold ${
                          log.outcome === 'ATTENDED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                        }`}>
                          {log.outcome}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {log.remarks && (
                      <p className="text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-950/60 p-2 rounded border border-slate-200 dark:border-slate-800/50">
                        "{log.remarks}"
                      </p>
                    )}
                    {log.recordedBy && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <User className="w-3 h-3" />
                        <span>Logged by: {log.recordedBy.name || 'Coordinator'} ({log.recordedBy.role || ''})</span>
                      </div>
                    )}
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

export default CallLogModal;
