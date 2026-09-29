const XLSX = require('xlsx');

// Standard Single Sheet Alumni Parser
const parseExcelBuffer = (buffer) => {
  const result = parseMasterSheetAlumni(buffer);
  return result.parsedAlumni;
};

// Excel Serial Date Converter
const parseExcelDate = (excelDate) => {
  if (!excelDate) return null;
  if (excelDate instanceof Date) return excelDate;
  if (typeof excelDate === 'number' || !isNaN(Number(excelDate))) {
    const num = Number(excelDate);
    if (num > 10000 && num < 60000) {
      // Excel epoch begins 1899-12-30
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? null : date;
    }
  }
  const parsed = new Date(excelDate);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Clean Mobile Number String
const sanitizeMobile = (rawMobile) => {
  if (!rawMobile) return '0000000000';
  let cleaned = String(rawMobile)
    .replace(/^#\s*/, '')          // Remove leading hashtag #
    .replace(/^\+91[\s\-]?/, '')   // Remove leading +91
    .replace(/[\s\-\(\)]/g, '');   // Remove whitespace, dashes, parens

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned || '0000000000';
};

// Convert string truthy values ("Yes", "Y", "True", "1") to Boolean
const parseBoolean = (val) => {
  if (!val) return false;
  const str = String(val).trim().toLowerCase();
  return str === 'yes' || str === 'y' || str === 'true' || str === '1';
};

// Advanced Multi-Sheet Master Sheet Parser for Updated Schema
const parseMasterSheetAlumni = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetNames = workbook.SheetNames;
  
  const alumniSheetRegex = /(alumni|graduated|alumni_data|alumni_master|alumni_records|cse|it|ece|eee|mech|civil|aids)/i;
  const targetSheetName = sheetNames.find(s => alumniSheetRegex.test(s)) || sheetNames[0];

  let rawRows = [];

  for (const sName of sheetNames) {
    const sheet = workbook.Sheets[sName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rows.forEach(r => { r.__sheetName = sName; });
    rawRows.push(...rows);
  }

  const parsedAlumni = [];
  const errors = [];

  rawRows.forEach((row, index) => {
    const sheetName = row.__sheetName || '';

    // Robust case-insensitive and symbol-agnostic key lookup
    const getVal = (...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
        const cleanK = k.toLowerCase().replace(/[\s_\-\.\/\?\(\)]/g, '');
        for (const rowKey of Object.keys(row)) {
          const cleanRowKey = rowKey.toLowerCase().replace(/[\s_\-\.\/\?\(\)]/g, '');
          if (cleanRowKey === cleanK || cleanRowKey.includes(cleanK)) {
            if (row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== '') {
              return String(row[rowKey]).trim();
            }
          }
        }
      }
      return '';
    };

    // 1. Personal Information
    const name = getVal('name', 'Name', 'full_name', 'alumni_name', 'student_name');
    const rawGender = getVal('gender', 'Gender', 'sex');
    const gender = ['Male', 'Female'].includes(rawGender) ? rawGender : (rawGender ? 'Other' : '');
    const rawMobile = getVal('mobile_phone_no', 'Mobile Phone No.', 'mobile', 'phone', 'contact_number');
    const mobile = sanitizeMobile(rawMobile);
    const dobRaw = getVal('date_of_birth', 'Date of Birth', 'dob', 'birth_date');
    const email = getVal('email_id', 'email', 'email_address', 'mail');
    const label = getVal('label', 'Label', 'tag', 'category');
    const profileUpdatedOnRaw = getVal('profile_updated_on', 'Profile Updated On');

    // 2. Location & Address Details
    const currentLocation = getVal('current_location', 'Current Location', 'city', 'location');
    const homeTown = getVal('home_town', 'Home Town', 'hometown');
    const correspondenceAddress = getVal('correspondence_address', 'Correspondence Address');
    const correspondenceCity = getVal('correspondence_city', 'Correspondence City');
    const correspondenceState = getVal('correspondence_state', 'Correspondence State');
    const correspondenceCountry = getVal('correspondence_country', 'Correspondence Country');
    const correspondencePincode = getVal('correspondence_pincode', 'Correspondence Pincode');
    const areaInCityTownLocation = getVal('area_in_city_town_location', 'Area in City/Town/Location', 'area');
    const chapter = getVal('chapter', 'Chapter', 'alumni_chapter');

    // 3. Academic Background
    const educationalCourse = getVal('educational_course', 'Educational Course', 'degree', 'course');
    const educationalInstitute = getVal('educational_institute', 'Educational Institute', 'college', 'institute');
    const startYear = getVal('start_year', 'Start Year');
    let endYear = getVal('end_year', 'End Year', 'batch', 'graduation_year', 'passing_year');

    // Auto-extract Batch / End Year from label or sheetName if missing
    if (!endYear) {
      const yearMatch = (label + ' ' + sheetName).match(/(19\d\d|20\d\d)/);
      if (yearMatch) endYear = yearMatch[1];
    }
    const batch = endYear || '2024';

    let department = getVal('department', 'dept', 'branch', 'stream');
    if (!department) {
      const deptMatch = (label + ' ' + sheetName).match(/(CSE|IT|ECE|EEE|MECH|CIVIL|AIDS)/i);
      if (deptMatch) department = deptMatch[1].toUpperCase();
    }
    department = department || 'CSE';

    // 4. Professional Details & Experience
    const company = getVal('company', 'Company', 'current_company', 'organization');
    const position = getVal('position', 'Position', 'designation', 'job_title');
    const workExperienceYears = Number(getVal('work_experience_years', 'Work Experience (in years)', 'experience')) || 0;
    const professionalSkillsRaw = getVal('professional_skills', 'Professional Skills', 'skills');
    const industriesWorkedIn = getVal('industries_worked_in', 'Industries Worked In', 'industry');
    const rolesPlayed = getVal('roles_played', 'Roles Played');
    const linkedinLink = getVal('linkedin_link', 'LinkedIn Link', 'linkedin_url', 'linkedin');
    const facebookLink = getVal('facebook_link', 'Facebook Link', 'facebook');

    // 5. Engagement & Contribution Preferences
    const mentorRaw = getVal('would_you_like_to_mentor', 'Would you like to Mentor students?');
    const volunteerRaw = getVal('would_you_like_to_be_a_volunteer', 'Would you like to be a volunteer / speaker?');
    const scholarshipRaw = getVal('contribute_to_scholarships', 'Do you want to contribute to scholarships for students?');

    // Skip blank rows
    if (!name && !email && !rawMobile) return;

    if (!name) {
      errors.push({ row: index + 2, reason: 'Missing required field: Name' });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: index + 2, email, reason: `Invalid email format: "${email}"` });
      return;
    }

    parsedAlumni.push({
      rowIndex: index + 2,
      name,
      gender,
      mobile,
      dob: parseExcelDate(dobRaw),
      email: email ? email.toLowerCase() : '',
      label,
      profileUpdatedOn: parseExcelDate(profileUpdatedOnRaw) || new Date(),
      
      currentLocation,
      homeTown,
      areaInCityTownLocation,
      chapter,
      address: {
        correspondenceAddress,
        city: correspondenceCity,
        state: correspondenceState,
        country: correspondenceCountry,
        pincode: correspondencePincode
      },

      batch: String(batch),
      graduationYear: String(batch),
      department,
      degree: educationalCourse || 'B.Tech',
      educationalCourse,
      educationalInstitute,
      startYear,
      endYear: String(batch),

      professional: {
        company: company || '',
        position: position || '',
        experienceYears: workExperienceYears,
        skills: professionalSkillsRaw ? professionalSkillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
        rolesPlayed: rolesPlayed || position || '',
        industriesWorkedIn: industriesWorkedIn || ''
      },

      socials: {
        linkedin: linkedinLink || '',
        facebook: facebookLink || ''
      },

      contributions: {
        mentorStudents: parseBoolean(mentorRaw),
        webinarSpeaker: parseBoolean(volunteerRaw),
        scholarships: parseBoolean(scholarshipRaw)
      }
    });
  });

  return {
    targetSheetName: targetSheetName || 'All Sheets Combined',
    isDedicatedSheet: !!targetSheetName,
    sheetNamesScanned: sheetNames,
    totalRowsScanned: rawRows.length,
    parsedAlumni,
    validationErrors: errors
  };
};

module.exports = { parseExcelBuffer, parseMasterSheetAlumni };
