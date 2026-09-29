import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ThemeToggle } from '../context/ThemeContext';
import { User, Mail, Lock, Phone, Building2, Calendar, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    department: 'CSE',
    year: '3rd Year'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.mobile.match(/^[0-9]{10}$/)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      let response;
      try {
        response = await api.post('/auth/student-register', formData);
      } catch (err1) {
        if (err1.response && err1.response.status === 404) {
          try {
            response = await api.post('/student-register', formData);
          } catch (err2) {
            if (err2.response && err2.response.status === 404) {
              response = await api.post('/register', formData);
            } else {
              throw err2;
            }
          }
        } else {
          throw err1;
        }
      }

      if (response && response.data && response.data.success) {
        setSuccessMessage(response.data.message || 'Registration submitted successfully!');
      } else {
        setSuccessMessage('Registration submitted successfully! Pending approval.');
      }
      setLoading(false);
    } catch (err) {
      const errorMsg = 
        err.response?.data?.message || 
        (err.code === 'ERR_NETWORK' ? 'Cannot connect to backend server. Make sure your Express server is running on port 5000.' : (err.message || 'Registration failed. Please restart your Express backend server.'));
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col justify-center items-center px-4 py-12 text-slate-900 dark:text-slate-100 transition-colors relative">
      
      {/* Top Right Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Container Box */}
      <div className="w-full max-w-md bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 text-[#7C3AED] dark:text-purple-400 mb-1">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Coordinator Self-Registration</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Institutional Alumni Outreach Portal Access Request</p>
        </div>

        {/* Informational Alert Box */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span className="leading-relaxed font-medium">
            Your account requires verification by the Department Head Officer or Admin before accessing the dashboard.
          </span>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Registration Submitted!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              {successMessage}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all shadow-md shadow-purple-600/20"
            >
              Return to Login Page
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
            </div>

            {/* Department & Year Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-2 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="AIDS">AIDS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Year of Study *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-2 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile Number (10 digits) *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="tel"
                  name="mobile"
                  required
                  maxLength="10"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] font-mono"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">College Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@institution.edu"
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Submitting Registration...' : 'Submit Registration Request'}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-700">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors font-medium">
            <ArrowLeft size={14} />
            <span>Back to Unified Sign In</span>
          </Link>
        </div>

      </div>

    </div>
  );
};

export default StudentRegister;
