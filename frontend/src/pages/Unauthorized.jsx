import React from 'react';
import { useAuth, getRoleDashboard } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const { user } = useAuth();
  const targetHome = user ? getRoleDashboard(user.role) : '/login';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">RBAC Access Boundary Restricted</h2>
        <p className="text-xs text-slate-400">
          Your current account role (<strong className="text-rose-300">{user?.role || 'Guest'}</strong>) is not authorized to access this functional module.
        </p>
        <div className="pt-2">
          <Link
            to={targetHome}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Assigned Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
