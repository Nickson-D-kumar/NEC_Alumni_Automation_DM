import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await login(email, password);

    if (res.success) {
      navigate(res.targetPath);
    } else {
      setError(res.message);
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Right Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#151D2F] p-8 rounded-3xl border border-[#CBD5E1] dark:border-slate-700 shadow-xl relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#003366] flex items-center justify-center shadow-md mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#003366] dark:text-sky-400 tracking-tight">
            National Engineering College
          </h2>
          <p className="text-xs text-[#0077B5] dark:text-sky-300 font-bold mt-1 uppercase tracking-wider">
            Alumni Association, Kovilpatti
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Institutional Data Verification Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Institutional Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@crm.com"
                className="w-full bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0077B5] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#0077B5] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-slate-600 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0077B5] dark:focus:border-sky-400 focus:ring-1 focus:ring-[#0077B5] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm disabled:opacity-50 mt-2"
          >
            <span>{submitting ? 'Authenticating Role...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Self-Registration Link */}
        <div className="text-center mt-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs text-[#0077B5] dark:text-sky-400 hover:underline font-semibold transition-colors"
          >
            <UserPlus size={14} />
            <span>New Student Coordinator? Self-Register Here</span>
          </Link>
        </div>

        {/* Demo Quick Logins Box */}
        <div className="mt-6 pt-6 border-t border-[#CBD5E1] dark:border-slate-700">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-3">
            Quick 1-Click Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => fillDemoAccount('student@crm.com')}
              className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-left transition-colors font-medium flex items-center justify-between"
            >
              <span>Student Coord.</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>

            <button
              onClick={() => fillDemoAccount('staff@crm.com')}
              className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-300 text-left transition-colors font-medium flex items-center justify-between"
            >
              <span>Staff Coord.</span>
              <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            </button>

            <button
              onClick={() => fillDemoAccount('backoffice@crm.com')}
              className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-left transition-colors font-medium flex items-center justify-between"
            >
              <span>Back Officer</span>
              <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </button>

            <button
              onClick={() => fillDemoAccount('head@crm.com')}
              className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-300 text-left transition-colors font-medium flex items-center justify-between"
            >
              <span>Head Officer</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </button>
          </div>

          <button
            onClick={() => fillDemoAccount('admin@crm.com')}
            className="w-full mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Login as System Administrator (admin@crm.com)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
