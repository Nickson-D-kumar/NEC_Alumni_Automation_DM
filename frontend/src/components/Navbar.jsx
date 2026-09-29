import React from 'react';
import { useAuth, getRoleDashboard } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Shield, User, Building2, ChevronRight, Award, BarChart3, GraduationCap } from 'lucide-react';

const roleColorMap = {
  STUDENT_COORDINATOR: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
  STAFF_COORDINATOR: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700',
  CHAMBER_BACK_OFFICER: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
  HEAD_OFFICER: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700',
  ADMIN: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
};

const roleLabelMap = {
  STUDENT_COORDINATOR: 'Student Coordinator',
  STAFF_COORDINATOR: 'Staff Coordinator',
  CHAMBER_BACK_OFFICER: 'Chamber Back Officer',
  HEAD_OFFICER: 'Head Officer',
  ADMIN: 'System Admin'
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const dashboardPath = getRoleDashboard(user.role);

  return (
    <header className="sticky top-0 z-40 shadow-md flex flex-col">

      {/* Top Header Bar (Light: White / Dark: Deep Card Slate) */}
      <div className="bg-white dark:bg-[#151D2F] text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-2.5 transition-colors">
        <div className="flex items-center justify-between max-w-7xl mx-auto">

          <Link to={dashboardPath} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white shadow-md group-hover:bg-[#5B21B6] transition-colors">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#7C3AED] dark:text-purple-400 group-hover:text-[#5B21B6] dark:group-hover:text-purple-300 transition-colors">
                  National Engineering College
                </h1>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold tracking-wide">
                Alumni Association, Kovilpatti
              </p>
            </div>
          </Link>

          {/* User Quick Identity Pill & Theme Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-7 h-7 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-300">{user.name}</span>
            </div>

            {/* Global Theme Toggle Button */}
            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
              title="Sign out of system"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Violet/Purple Navigation Bar */}
      <div className="bg-[#7C3AED] text-white border-b border-[#5B21B6] px-4 lg:px-8 py-2.5 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">

          <div className="flex items-center gap-4 text-xs font-bold tracking-wider uppercase">
            <Link
              to={dashboardPath}
              className="hover:text-purple-200 transition-colors py-1 flex items-center gap-1.5"
            >
              <span>Dashboard</span>
            </Link>

            {/* Navigation Link for Analytics (Admin / Head / Back Officer) */}
            {(user.role === 'ADMIN' || user.role === 'HEAD_OFFICER' || user.role === 'CHAMBER_BACK_OFFICER' || user.role === 'BACK_OFFICER') && (
              <Link
                to="/analytics"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#5B21B6] hover:bg-[#4C1D95] px-3 py-1.5 rounded-md transition-all shadow-sm"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
                <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded tracking-tighter ml-0.5">
                  NEW
                </span>
              </Link>
            )}
          </div>

          {/* Right Role Badges */}
          <div className="flex items-center gap-3">
            {user.department && (
              <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-100 bg-[#5B21B6] px-3 py-1 rounded-md border border-purple-400/30">
                <Building2 className="w-3.5 h-3.5 text-purple-200" />
                <span>{user.department}</span>
              </div>
            )}

            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md border ${roleColorMap[user.role] || 'bg-slate-200 text-slate-800'}`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{roleLabelMap[user.role] || user.role}</span>
            </div>
          </div>

        </div>
      </div>

    </header>
  );
};

export default Navbar;
