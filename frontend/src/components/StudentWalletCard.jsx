import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Wallet, IndianRupee, Clock, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, FileText, ArrowRight, X } from 'lucide-react';

const StudentWalletCard = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/student/wallet');
      } catch (err1) {
        if (err1.response && err1.response.status === 404) {
          res = await api.get('/alumni/wallet');
        } else {
          throw err1;
        }
      }
      setWalletData(res.data.data || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student wallet:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleRequestPayout = async () => {
    setRequesting(true);
    setActionMessage(null);
    try {
      let res;
      try {
        res = await api.post('/student/request-cheque-payout');
      } catch (err1) {
        if (err1.response && err1.response.status === 404) {
          res = await api.post('/alumni/request-cheque-payout');
        } else {
          throw err1;
        }
      }
      setActionMessage({ type: 'success', text: res.data.message || 'Cheque validation request submitted successfully!' });
      setIsModalOpen(false);
      setRequesting(false);
      fetchWallet();
    } catch (error) {
      setRequesting(false);
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Payout request failed' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED_CHEQUE_ISSUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Cheque Issued & Paid</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Request Rejected</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending Admin Cheque Initiation</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#151D2F] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center text-slate-500 dark:text-slate-400 italic">
        Loading Student Coordinator Wallet details...
      </div>
    );
  }

  const {
    verifiedCount = 0,
    ratePerRecord = 10,
    totalEarnedAmount = 0,
    withdrawnAmount = 0,
    currentBalance = 0,
    lastPayoutRequestAt,
    isEligibleForPayout,
    daysRemainingInCooldown = 0,
    pendingRequest = false,
    history = []
  } = walletData || {};

  return (
    <div className="space-y-6">
      
      {/* Action Notification Message */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Main Wallet Summary Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Balance & Claim Action */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Student Incentive Wallet</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Earn ₹10 INR per ADMIN_APPROVED alumni record</p>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Available Redeemable Balance</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">₹ {currentBalance.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">INR</span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchWallet}
              className="p-2 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition shadow-sm"
              title="Refresh Wallet Balance"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Breakdown Stats Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Verified Records</span>
              <span className="text-slate-900 dark:text-white font-bold">{verifiedCount} records</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Lifetime Earned</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">₹ {totalEarnedAmount}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Withdrawn</span>
              <span className="text-indigo-700 dark:text-indigo-400 font-bold">₹ {withdrawnAmount}</span>
            </div>
          </div>

          {/* Cheque Payout Claim Action Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            
            {pendingRequest ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Request Pending Admin Cheque Initiation</span>
                </div>
                <span className="text-[11px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono">Under Review</span>
              </div>
            ) : daysRemainingInCooldown > 0 ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Request Cheque Validation (Locked)</span>
                </button>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold text-center bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                  Next cheque validation request available in <strong>{daysRemainingInCooldown} day(s)</strong> (3-month cycle rule).
                </p>
              </div>
            ) : currentBalance > 0 ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-[#003366] hover:bg-[#002244] text-white shadow-md transition-all flex items-center justify-center gap-2"
              >
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                <span>Request Cheque Validation (Claim ₹{currentBalance})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs text-center font-medium">
                No redeemable balance available. Earn ₹10 per record when Admin grants final approval.
              </div>
            )}

          </div>

        </div>

        {/* Right Card: Incentive Rules & Info */}
        <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Coordinator Incentive Rules</span>
          </h4>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-3 font-medium">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>₹10 Credit Rate:</strong> Earn ₹10 INR for every alumni profile successfully updated and verified.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span><strong>Eligibility Condition:</strong> Balance is ONLY credited when the record achieves final <strong className="text-indigo-700 dark:text-indigo-400">ADMIN_APPROVED</strong> status.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span><strong>3-Month Cycle Rule:</strong> Payout requests can only be initiated once every 90 days (3 months).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
              <span><strong>Cheque Dispatches:</strong> Payout claims are processed as physical institutional cheques issued by Admin.</span>
            </li>
          </ul>

          {lastPayoutRequestAt && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
              Last Claim Date: <strong className="text-slate-800 dark:text-slate-200 font-mono">{new Date(lastPayoutRequestAt).toLocaleDateString()}</strong>
            </div>
          )}
        </div>

      </div>

      {/* Payout History Table */}
      <div className="bg-white dark:bg-[#151D2F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Payout Request & Cheque History ({history.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700 uppercase">
              <tr>
                <th className="py-3.5 px-4">Request Date</th>
                <th className="py-3.5 px-4">Verified Records</th>
                <th className="py-3.5 px-4">Claimed Amount</th>
                <th className="py-3.5 px-4">Cheque Status</th>
                <th className="py-3.5 px-4">Admin Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 italic">
                    No previous cheque payout requests found.
                  </td>
                </tr>
              ) : (
                history.map((reqItem) => (
                  <tr key={reqItem._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {new Date(reqItem.requestDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {reqItem.verifiedRecordsCount} records
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                      ₹ {reqItem.requestedAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(reqItem.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 italic">
                      {reqItem.adminNotes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151D2F] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Cheque Validation Request</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Verified Alumni Count:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{verifiedCount} records</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Rate per Record:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹10 INR</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Previously Withdrawn:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{withdrawnAmount}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 dark:border-slate-700 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Claimable Amount:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">₹{currentBalance} INR</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium">
                ⚠️ <strong>Note:</strong> Triggering this payout request will lock subsequent claims for a 3-month (90-day) cooldown period.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={requesting}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#003366] hover:bg-[#002244] text-white shadow-md disabled:opacity-50"
                >
                  {requesting ? 'Submitting Claim...' : 'Confirm & Send Request'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentWalletCard;
