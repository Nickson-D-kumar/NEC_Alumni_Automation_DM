import React, { useState } from 'react';
import api from '../services/api';
import { X, UserPlus, Mail, Lock, Building2, Calendar, Phone, User } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'OTHER'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function AddStudentModal({ isOpen, onClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    department: 'CSE',
    year: '3rd Year'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.mobile.match(/^[0-9]{10}$/)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/admin/create-student', formData);
      if (onUserAdded) {
        onUserAdded(res.data.data);
      }
      onClose();
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        mobile: '', 
        department: 'CSE', 
        year: '3rd Year' 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student coordinator');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Student Coordinator</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Enter student details with department & year</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-semibold rounded-lg">
              {error}
            </div>
          )}

          {/* Student Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={15} />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Student Name"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          {/* Department & Year Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={15} />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-sky-500 cursor-pointer font-medium appearance-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Year of Study</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={15} />
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-sky-500 cursor-pointer font-medium appearance-none"
                >
                  {YEARS.map((yr) => (
                    <option key={yr} value={yr} className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={15} />
              <input
                type="tel"
                name="mobile"
                required
                maxLength="10"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-sky-500 font-mono font-medium"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">College Email ID</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={15} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="student@college.edu"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          {/* Temporary Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Temporary Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={15} />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Coordinator'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
