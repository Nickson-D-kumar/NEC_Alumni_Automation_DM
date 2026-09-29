import React from 'react';
import { Clock, CheckCircle2, ShieldCheck, Award, AlertTriangle, AlertCircle, PhoneOff, PhoneCall } from 'lucide-react';

export const StageBadge = ({ stage }) => {
  switch (stage) {
    case 'PENDING_SUBMISSION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Pending Submission</span>
        </span>
      );
    case 'SUBMITTED_BY_STUDENT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Submitted by Student</span>
        </span>
      );
    case 'VERIFIED_BY_BACK_OFFICER':
    case 'VERIFIED_BY_HEAD':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-[#003366] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0077B5] dark:text-indigo-400" />
          <span>Verified by Back Officer</span>
        </span>
      );
    case 'ADMIN_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm">
          <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Admin Approved</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          {stage}
        </span>
      );
  }
};

export const ContactBadge = ({ status }) => {
  switch (status) {
    case 'NOT_ATTEMPTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          <span>Not Attempted</span>
        </span>
      );
    case 'REACHED_COMPLETE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          <PhoneCall className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Reached Complete</span>
        </span>
      );
    case 'REACHED_INCOMPLETE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
          <PhoneCall className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          <span>Reached Incomplete</span>
        </span>
      );
    case 'NOT_REACHED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
          <PhoneOff className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Not Reached</span>
        </span>
      );
    default:
      return <span className="text-xs text-slate-600 dark:text-slate-400">{status}</span>;
  }
};

export const EscalationBadge = ({ level }) => {
  switch (level) {
    case 'LEVEL_2_STAFF':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Level-2 Staff Escalation</span>
        </span>
      );
    case 'LEVEL_3_HOD':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
          <AlertCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <span>Level-3 Escalation</span>
        </span>
      );
    case 'LEVEL_4_CHAMBER_HEAD':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-400 dark:border-rose-700">
          <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Level-4 Chamber Escalation</span>
        </span>
      );
    case 'NONE':
    default:
      return null;
  }
};
