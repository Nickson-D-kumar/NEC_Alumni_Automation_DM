import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, Briefcase, MapPin, Share2, Award, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const EditAlumniDrawer = ({ alumni, isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: '',
    salutation: 'Mr.',
    gender: 'Male',
    dob: '',
    mobile: '',
    email: '',
    currentLocation: '',
    homeTown: '',
    address: { correspondenceAddress: '', city: '', state: '', country: 'India', pincode: '' },
    professional: { company: '', position: '', experienceYears: 0, skills: '', rolesPlayed: '', industriesWorkedIn: '' },
    socials: { linkedin: '', facebook: '' },
    contributions: { mentorStudents: false, webinarSpeaker: false, scholarships: false }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (alumni) {
      setFormData({
        name: alumni.name || '',
        salutation: alumni.salutation || 'Mr.',
        gender: alumni.gender || 'Male',
        dob: alumni.dob ? new Date(alumni.dob).toISOString().split('T')[0] : '',
        mobile: alumni.mobile || '',
        email: alumni.email || '',
        currentLocation: alumni.currentLocation || '',
        homeTown: alumni.homeTown || '',
        address: {
          correspondenceAddress: alumni.address?.correspondenceAddress || '',
          city: alumni.address?.city || '',
          state: alumni.address?.state || '',
          country: alumni.address?.country || 'India',
          pincode: alumni.address?.pincode || ''
        },
        professional: {
          company: alumni.professional?.company || '',
          position: alumni.professional?.position || '',
          experienceYears: alumni.professional?.experienceYears || 0,
          skills: Array.isArray(alumni.professional?.skills) ? alumni.professional.skills.join(', ') : '',
          rolesPlayed: alumni.professional?.rolesPlayed || '',
          industriesWorkedIn: alumni.professional?.industriesWorkedIn || ''
        },
        socials: {
          linkedin: alumni.socials?.linkedin || '',
          facebook: alumni.socials?.facebook || ''
        },
        contributions: {
          mentorStudents: alumni.contributions?.mentorStudents || false,
          webinarSpeaker: alumni.contributions?.webinarSpeaker || false,
          scholarships: alumni.contributions?.scholarships || false
        }
      });
    }
  }, [alumni]);

  if (!isOpen || !alumni) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        professional: {
          ...formData.professional,
          skills: formData.professional.skills.split(',').map(s => s.trim()).filter(Boolean)
        }
      };

      const response = await api.put(`/alumni/${alumni._id}/update-data`, payload);

      setMessage({ type: 'success', text: response.data.message });
      setLoading(false);
      if (onRefresh) onRefresh();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setLoading(false);
      const errText = error.response?.data?.message || 'Error saving alumni record';
      setMessage({ type: 'error', text: errText });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 dark:bg-slate-950/75 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-[#151D2F] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alumni Verification & Data Form</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Submitting updates verification stage to <span className="text-indigo-600 dark:text-indigo-400 font-semibold">SUBMITTED_BY_STUDENT</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {message && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
            }`}>
              {message.text}
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <UserCheck className="w-4 h-4" /> 1. Personal & Contact Details
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Salutation</label>
                <select
                  value={formData.salutation}
                  onChange={e => setFormData({ ...formData, salutation: e.target.value })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Current Location (City, Country)</label>
                <input
                  type="text"
                  value={formData.currentLocation}
                  onChange={e => setFormData({ ...formData, currentLocation: e.target.value })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Home Town</label>
                <input
                  type="text"
                  value={formData.homeTown}
                  onChange={e => setFormData({ ...formData, homeTown: e.target.value })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <MapPin className="w-4 h-4" /> 2. Correspondence Address
            </h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Street Address</label>
              <textarea
                rows={2}
                value={formData.address.correspondenceAddress}
                onChange={e => setFormData({ ...formData, address: { ...formData.address, correspondenceAddress: e.target.value } })}
                className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">State</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Professional Info */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Briefcase className="w-4 h-4" /> 3. Professional Profile
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={formData.professional.company}
                  onChange={e => setFormData({ ...formData, professional: { ...formData.professional, company: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Designation / Position</label>
                <input
                  type="text"
                  value={formData.professional.position}
                  onChange={e => setFormData({ ...formData, professional: { ...formData.professional, position: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Total Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.professional.experienceYears}
                  onChange={e => setFormData({ ...formData, professional: { ...formData.professional, experienceYears: Number(e.target.value) } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, Cloud, ML"
                  value={formData.professional.skills}
                  onChange={e => setFormData({ ...formData, professional: { ...formData.professional, skills: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Socials & Institutional Contributions */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Share2 className="w-4 h-4" /> 4. Social Links & Contributions
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={formData.socials.linkedin}
                  onChange={e => setFormData({ ...formData, socials: { ...formData.socials, linkedin: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Facebook Profile URL</label>
                <input
                  type="text"
                  value={formData.socials.facebook}
                  onChange={e => setFormData({ ...formData, socials: { ...formData.socials, facebook: e.target.value } })}
                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-2">Institutional Contribution Commitments</label>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.contributions.mentorStudents}
                    onChange={e => setFormData({ ...formData, contributions: { ...formData.contributions, mentorStudents: e.target.checked } })}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Willing to Mentor Current Students</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.contributions.webinarSpeaker}
                    onChange={e => setFormData({ ...formData, contributions: { ...formData.contributions, webinarSpeaker: e.target.checked } })}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Guest Speaker / Webinar Panellist</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.contributions.scholarships}
                    onChange={e => setFormData({ ...formData, contributions: { ...formData.contributions, scholarships: e.target.checked } })}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Interested in Alumni Scholarships & Endowments</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#5B21B6] dark:bg-purple-600 dark:hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit Verification Data'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditAlumniDrawer;
