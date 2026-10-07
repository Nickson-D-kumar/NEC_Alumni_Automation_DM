import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  X, User, Phone, Mail, MapPin, Briefcase, GraduationCap, 
  Linkedin, CheckCircle2, AlertCircle, Save, Send, Clock, 
  HeartHandshake, ChevronDown, ChevronUp, Layers, Tag
} from 'lucide-react';

const AlumniVerificationModal = ({ alumniId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'location' | 'academics' | 'professional' | 'engagement'

  // Form State initialized defensively with empty strings
  const [formData, setFormData] = useState({
    // 1. Personal Information
    name: '',
    gender: '',
    mobile: '',
    dob: '',
    email: '',
    label: '',
    profileUpdatedOn: '',

    // 2. Location & Address Details
    currentLocation: '',
    homeTown: '',
    correspondenceAddress: '',
    correspondenceCity: '',
    correspondenceState: '',
    correspondenceCountry: '',
    correspondencePincode: '',
    areaInCityTownLocation: '',
    chapter: '',

    // 3. Academic Background
    regNo: '',
    educationalCourse: '',
    educationalInstitute: '',
    department: 'CSE',
    startYear: '',
    endYear: '',
    batch: '',

    // 4. Professional Details & Experience
    company: '',
    position: '',
    workExperienceYears: '',
    skills: '',
    industriesWorkedIn: '',
    rolesPlayed: '',
    linkedin: '',
    facebook: '',

    // 5. Engagement & Outreach Status
    wouldYouLikeToMentor: false,
    wouldYouLikeToBeAVolunteer: false,
    contributeToScholarships: false,
    contactStatus: 'NOT_ATTEMPTED',
    callOutcome: 'ATTENDED',
    verificationRemarks: ''
  });

  const [originalRecord, setOriginalRecord] = useState(null);

  useEffect(() => {
    if (isOpen && alumniId) {
      fetchAlumniRecord();
    }
  }, [isOpen, alumniId]);

  const fetchAlumniRecord = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.get(`/alumni/${alumniId}`);
      const data = res.data.data;
      setOriginalRecord(data);

      setFormData({
        // 1. Personal Info
        name: data.name || '',
        gender: data.gender || '',
        mobile: data.mobile || '',
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        email: data.email || '',
        label: data.label || '',
        profileUpdatedOn: data.profileUpdatedOn ? new Date(data.profileUpdatedOn).toLocaleString() : '',

        // 2. Location & Address
        currentLocation: data.currentLocation || '',
        homeTown: data.homeTown || '',
        correspondenceAddress: data.address?.correspondenceAddress || '',
        correspondenceCity: data.address?.city || '',
        correspondenceState: data.address?.state || '',
        correspondenceCountry: data.address?.country || '',
        correspondencePincode: data.address?.pincode || '',
        areaInCityTownLocation: data.areaInCityTownLocation || '',
        chapter: data.chapter || '',

        // 3. Academics
        regNo: data.regNo || '',
        educationalCourse: data.educationalCourse || data.degree || 'B.Tech',
        educationalInstitute: data.educationalInstitute || '',
        department: data.department || 'CSE',
        startYear: data.startYear || '',
        endYear: data.endYear || data.batch || '',
        batch: data.batch || data.endYear || '',

        // 4. Professional
        company: data.professional?.company || '',
        position: data.professional?.position || '',
        workExperienceYears: data.professional?.experienceYears !== undefined && data.professional?.experienceYears !== null ? String(data.professional.experienceYears) : '',
        skills: Array.isArray(data.professional?.skills) ? data.professional.skills.join(', ') : (data.professional?.skills || ''),
        industriesWorkedIn: data.professional?.industriesWorkedIn || '',
        rolesPlayed: data.professional?.rolesPlayed || '',
        linkedin: data.socials?.linkedin || '',
        facebook: data.socials?.facebook || '',

        // 5. Engagement & Outreach
        wouldYouLikeToMentor: data.contributions?.mentorStudents || false,
        wouldYouLikeToBeAVolunteer: data.contributions?.webinarSpeaker || false,
        contributeToScholarships: data.contributions?.scholarships || false,
        contactStatus: data.contactStatus || 'NOT_ATTEMPTED',
        callOutcome: 'ATTENDED',
        verificationRemarks: ''
      });
    } catch (err) {
      console.error('Error fetching alumni record for verification:', err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load alumni details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (submitForVerification = false) => {
    // Form Validation
    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Name is required' });
      setActiveTab('personal');
      return;
    }
    if (!formData.mobile.trim()) {
      setStatusMessage({ type: 'error', text: 'Mobile Phone No. is required' });
      setActiveTab('personal');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setStatusMessage({ type: 'error', text: 'Invalid Email format' });
      setActiveTab('personal');
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      const payload = {
        name: formData.name,
        gender: formData.gender,
        mobile: formData.mobile,
        dob: formData.dob,
        email: formData.email,
        label: formData.label,
        currentLocation: formData.currentLocation,
        homeTown: formData.homeTown,
        areaInCityTownLocation: formData.areaInCityTownLocation,
        chapter: formData.chapter,
        address: {
          correspondenceAddress: formData.correspondenceAddress,
          city: formData.correspondenceCity,
          state: formData.correspondenceState,
          country: formData.correspondenceCountry,
          pincode: formData.correspondencePincode
        },
        regNo: formData.regNo,
        educationalCourse: formData.educationalCourse,
        educationalInstitute: formData.educationalInstitute,
        department: formData.department,
        startYear: formData.startYear,
        endYear: formData.endYear || formData.batch,
        batch: formData.batch || formData.endYear,
        company: formData.company,
        position: formData.position,
        workExperienceYears: Number(formData.workExperienceYears) || 0,
        skills: formData.skills,
        industriesWorkedIn: formData.industriesWorkedIn,
        rolesPlayed: formData.rolesPlayed,
        linkedin: formData.linkedin,
        facebook: formData.facebook,
        wouldYouLikeToMentor: formData.wouldYouLikeToMentor,
        wouldYouLikeToBeAVolunteer: formData.wouldYouLikeToBeAVolunteer,
        contributeToScholarships: formData.contributeToScholarships,
        contactStatus: formData.contactStatus,
        callOutcome: formData.callOutcome,
        verificationRemarks: formData.verificationRemarks,
        submitForVerification
      };

      const response = await api.patch(`/alumni/${alumniId}`, payload);

      setStatusMessage({ 
        type: 'success', 
        text: response.data.message || 'Alumni Master Sheet record updated & saved!' 
      });

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Error updating alumni record:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update record.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-900 dark:text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#003366] dark:text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#003366] dark:text-sky-400 flex items-center gap-2">
                <span>Alumni Master Sheet Verification & Update</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pre-filled from Master Sheet — Verify, complete missing details, and submit for Back Officer approval
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Header */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B] px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('personal')}
            className={`pb-3 pt-2 text-xs font-bold flex items-center gap-1.5 border-b-2 px-3 transition-all ${
              activeTab === 'personal' ? 'border-[#003366] dark:border-sky-400 text-[#003366] dark:text-sky-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Personal Info</span>
          </button>

          <button
            onClick={() => setActiveTab('location')}
            className={`pb-3 pt-2 text-xs font-bold flex items-center gap-1.5 border-b-2 px-3 transition-all ${
              activeTab === 'location' ? 'border-[#003366] dark:border-sky-400 text-[#003366] dark:text-sky-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Location & Address</span>
          </button>

          <button
            onClick={() => setActiveTab('academics')}
            className={`pb-3 pt-2 text-xs font-bold flex items-center gap-1.5 border-b-2 px-3 transition-all ${
              activeTab === 'academics' ? 'border-[#003366] dark:border-sky-400 text-[#003366] dark:text-sky-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>3. Academic Background</span>
          </button>

          <button
            onClick={() => setActiveTab('professional')}
            className={`pb-3 pt-2 text-xs font-bold flex items-center gap-1.5 border-b-2 px-3 transition-all ${
              activeTab === 'professional' ? 'border-[#003366] dark:border-sky-400 text-[#003366] dark:text-sky-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>4. Professional Details</span>
          </button>

          <button
            onClick={() => setActiveTab('engagement')}
            className={`pb-3 pt-2 text-xs font-bold flex items-center gap-1.5 border-b-2 px-3 transition-all ${
              activeTab === 'engagement' ? 'border-[#003366] dark:border-sky-400 text-[#003366] dark:text-sky-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>5. Engagement & Status</span>
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#003366] dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Pre-filling record from Master Sheet...</span>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-900 dark:text-slate-100 bg-[#F8FAFC] dark:bg-[#0B0F19]">
            
            {/* Status Toast */}
            {statusMessage && (
              <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Rejection Notice Banner */}
            {originalRecord?.verificationStage === 'VERIFICATION_REJECTED' && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs flex flex-col gap-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Verification Rejected by Back Officer</span>
                </div>
                <p className="text-rose-900 dark:text-rose-200 font-medium leading-relaxed">
                  Reason: {originalRecord.rejectionReason || originalRecord.backOfficerRemarks || 'Please verify details again and submit correct information.'}
                </p>
              </div>
            )}

            {/* TAB 1: PERSONAL INFORMATION */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#151D2F] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Master Sheet Attribute Status:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                    Profile Updated On: <strong className="text-[#0077B5] dark:text-sky-400">{formData.profileUpdatedOn || 'Initial Import'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Name (Full Name) *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5] cursor-pointer"
                    >
                      <option value="" className="dark:bg-[#1E293B]">Select Gender</option>
                      <option value="Male" className="dark:bg-[#1E293B]">Male</option>
                      <option value="Female" className="dark:bg-[#1E293B]">Female</option>
                      <option value="Other" className="dark:bg-[#1E293B]">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Mobile Phone No. *</label>
                    <input
                      type="text"
                      required
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">email_id (Email Address)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="alumni@example.com"
                      className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Label / Tag</label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) => handleInputChange('label', e.target.value)}
                      placeholder="e.g. BE 1996, CSE"
                      className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOCATION & ADDRESS DETAILS */}
            {activeTab === 'location' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Current Location</label>
                    <input
                      type="text"
                      value={formData.currentLocation}
                      onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                      placeholder="e.g. Bangalore, Karnataka"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Home Town</label>
                    <input
                      type="text"
                      value={formData.homeTown}
                      onChange={(e) => handleInputChange('homeTown', e.target.value)}
                      placeholder="e.g. Madurai"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Area in City/Town/Location</label>
                    <input
                      type="text"
                      value={formData.areaInCityTownLocation}
                      onChange={(e) => handleInputChange('areaInCityTownLocation', e.target.value)}
                      placeholder="e.g. HSR Layout Sector 1"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Alumni Chapter</label>
                    <input
                      type="text"
                      value={formData.chapter}
                      onChange={(e) => handleInputChange('chapter', e.target.value)}
                      placeholder="e.g. Bangalore Chapter"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">Correspondence Address</label>
                    <input
                      type="text"
                      value={formData.correspondenceAddress}
                      onChange={(e) => handleInputChange('correspondenceAddress', e.target.value)}
                      placeholder="Street, Flat No, Building..."
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Correspondence City</label>
                    <input
                      type="text"
                      value={formData.correspondenceCity}
                      onChange={(e) => handleInputChange('correspondenceCity', e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Correspondence State</label>
                    <input
                      type="text"
                      value={formData.correspondenceState}
                      onChange={(e) => handleInputChange('correspondenceState', e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Correspondence Pincode</label>
                    <input
                      type="text"
                      value={formData.correspondencePincode}
                      onChange={(e) => handleInputChange('correspondencePincode', e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACADEMIC BACKGROUND */}
            {activeTab === 'academics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Educational Course / Degree</label>
                    <input
                      type="text"
                      value={formData.educationalCourse}
                      onChange={(e) => handleInputChange('educationalCourse', e.target.value)}
                      placeholder="e.g. B.Tech Computer Science"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Educational Institute</label>
                    <input
                      type="text"
                      value={formData.educationalInstitute}
                      onChange={(e) => handleInputChange('educationalInstitute', e.target.value)}
                      placeholder="e.g. College of Engineering"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5] cursor-pointer"
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

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Start Year</label>
                    <input
                      type="text"
                      value={formData.startYear}
                      onChange={(e) => handleInputChange('startYear', e.target.value)}
                      placeholder="e.g. 1992"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">End Year / Batch *</label>
                    <input
                      type="text"
                      value={formData.endYear}
                      onChange={(e) => {
                        handleInputChange('endYear', e.target.value);
                        handleInputChange('batch', e.target.value);
                      }}
                      placeholder="e.g. 1996"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PROFESSIONAL DETAILS & EXPERIENCE */}
            {activeTab === 'professional' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Company / Employer</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="e.g. Microsoft, Infosys"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Position / Designation</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="e.g. VP Engineering"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Work Experience (in years)</label>
                    <input
                      type="number"
                      value={formData.workExperienceYears}
                      onChange={(e) => handleInputChange('workExperienceYears', e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Industries Worked In</label>
                    <input
                      type="text"
                      value={formData.industriesWorkedIn}
                      onChange={(e) => handleInputChange('industriesWorkedIn', e.target.value)}
                      placeholder="e.g. FinTech, Cloud Computing"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Roles Played</label>
                    <input
                      type="text"
                      value={formData.rolesPlayed}
                      onChange={(e) => handleInputChange('rolesPlayed', e.target.value)}
                      placeholder="e.g. Tech Lead, Product Owner"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Professional Skills</label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      placeholder="e.g. React, Node.js, Python"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">LinkedIn Link</label>
                    <input
                      type="text"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Facebook Link</label>
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/username"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ENGAGEMENT PREFERENCES & OUTREACH STATUS */}
            {activeTab === 'engagement' && (
              <div className="space-y-4">
                
                {/* Engagement Preferences Toggles */}
                <div className="bg-white dark:bg-[#151D2F] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-[#003366] dark:text-sky-400 uppercase tracking-wider">
                    Contribution & Engagement Preferences
                  </h4>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-[#0077B5] dark:hover:border-sky-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.wouldYouLikeToMentor}
                        onChange={(e) => handleInputChange('wouldYouLikeToMentor', e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-[#003366] dark:text-sky-400 focus:ring-[#0077B5] w-4 h-4"
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">Would you like to Mentor students?</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-[#0077B5] dark:hover:border-sky-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.wouldYouLikeToBeAVolunteer}
                        onChange={(e) => handleInputChange('wouldYouLikeToBeAVolunteer', e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-[#003366] dark:text-sky-400 focus:ring-[#0077B5] w-4 h-4"
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">Would you like to be a volunteer / webinar speaker?</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-[#0077B5] dark:hover:border-sky-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.contributeToScholarships}
                        onChange={(e) => handleInputChange('contributeToScholarships', e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-[#003366] dark:text-sky-400 focus:ring-[#0077B5] w-4 h-4"
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">Do you want to contribute to scholarships for students?</span>
                    </label>
                  </div>
                </div>

                {/* Outreach & Call Verification Controls */}
                <div className="bg-white dark:bg-[#151D2F] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-[#003366] dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0077B5] dark:text-sky-400" />
                    <span>Outreach Status & Verification Remarks</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Outreach Status *</label>
                      <select
                        value={formData.contactStatus}
                        onChange={(e) => handleInputChange('contactStatus', e.target.value)}
                        className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5] cursor-pointer"
                      >
                        <option value="REACHED_COMPLETE" className="dark:bg-[#1E293B]">Reached & Fully Verified (Complete)</option>
                        <option value="REACHED_INCOMPLETE" className="dark:bg-[#1E293B]">Reached (Partial Details Received)</option>
                        <option value="NOT_REACHED" className="dark:bg-[#1E293B]">Not Reached (Tried Calling)</option>
                        <option value="NOT_ATTEMPTED" className="dark:bg-[#1E293B]">Not Attempted Yet</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Call Outcome</label>
                      <select
                        value={formData.callOutcome}
                        onChange={(e) => handleInputChange('callOutcome', e.target.value)}
                        className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5] cursor-pointer"
                      >
                        <option value="ATTENDED" className="dark:bg-[#1E293B]">Attended & Verified</option>
                        <option value="NOT_CONNECTED" className="dark:bg-[#1E293B]">Ring No Answer / Not Connected</option>
                        <option value="SWITCHED_OFF" className="dark:bg-[#1E293B]">Switched Off / Out of Reach</option>
                        <option value="INVALID_NUMBER" className="dark:bg-[#1E293B]">Invalid / Wrong Number</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Verification Remarks / Audit Notes</label>
                    <textarea
                      rows={2}
                      value={formData.verificationRemarks}
                      onChange={(e) => handleInputChange('verificationRemarks', e.target.value)}
                      placeholder="Record call summary, new details verified, or callback notes..."
                      className="w-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#0077B5] focus:ring-1 focus:ring-[#0077B5]"
                    />
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B] gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {originalRecord?.lastUpdatedByStudent && (
              <span>Last updated by coordinator on {new Date(originalRecord.updatedAt).toLocaleDateString()}</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#003366] dark:text-sky-400 bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 transition-all disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4 text-[#0077B5] dark:text-sky-400" />
              <span>Save Progress</span>
            </button>

            <button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Verify & Submit to Back Officer</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AlumniVerificationModal;
