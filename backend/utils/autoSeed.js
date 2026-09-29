const User = require('../models/User');
const Alumni = require('../models/Alumni');
const bcrypt = require('bcryptjs');

const autoSeed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`Database already populated (${userCount} users found). Skipping auto-seed.`);
      return;
    }

    console.log('Database empty. Running automatic seed of 5 role demo accounts & alumni dataset...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const users = await User.create([
      {
        name: 'Alex Rivera (Admin)',
        email: 'admin@crm.com',
        password: passwordHash,
        mobile: '+919876500001',
        role: 'ADMIN',
        department: 'CSE',
        registrationStatus: 'APPROVED',
        assignedBatch: ['2020', '2021', '2022', '2023', '2024'],
        isActive: true
      },
      {
        name: 'Dr. Marcus Vance (Head Officer)',
        email: 'head@crm.com',
        password: passwordHash,
        mobile: '+919876500002',
        role: 'HEAD_OFFICER',
        department: 'CSE',
        registrationStatus: 'APPROVED',
        assignedBatch: ['2022', '2023'],
        isActive: true
      },
      {
        name: 'Prof. Sarah Jenkins (Staff Coordinator)',
        email: 'staff@crm.com',
        password: passwordHash,
        mobile: '+919876500003',
        role: 'STAFF_COORDINATOR',
        department: 'CSE',
        registrationStatus: 'APPROVED',
        assignedBatch: ['2023', '2024'],
        isActive: true
      },
      {
        name: 'Elena Rostova (Chamber Back Officer)',
        email: 'backoffice@crm.com',
        password: passwordHash,
        mobile: '+919876500004',
        role: 'CHAMBER_BACK_OFFICER',
        department: 'OTHER',
        registrationStatus: 'APPROVED',
        assignedBatch: ['2021', '2022', '2023', '2024'],
        isActive: true
      },
      {
        name: 'David Chen (Student Coordinator)',
        email: 'student@crm.com',
        password: passwordHash,
        mobile: '+919876500005',
        role: 'STUDENT_COORDINATOR',
        department: 'CSE',
        registrationStatus: 'APPROVED',
        assignedBatch: ['2023'],
        isActive: true
      },
      {
        name: 'Priya Sharma (Student Coordinator 2)',
        email: 'student2@crm.com',
        password: passwordHash,
        mobile: '+919876500006',
        role: 'STUDENT_COORDINATOR',
        department: 'EEE',
        registrationStatus: 'APPROVED',
        assignedBatch: ['2024'],
        isActive: true
      }
    ]);

    const adminUser = users.find(u => u.role === 'ADMIN');
    const staffUser = users.find(u => u.role === 'STAFF_COORDINATOR');
    const studentUser = users.find(u => u.role === 'STUDENT_COORDINATOR');
    const student2User = users.find(u => u.email === 'student2@crm.com');

    const sampleAlumni = [
      {
        batch: '2023',
        name: 'Vikramaditya Sengupta',
        salutation: 'Mr.',
        gender: 'Male',
        dob: new Date('1998-05-14'),
        mobile: '+919876543210',
        email: 'vikram.sengupta@techcorp.com',
        currentLocation: 'Bengaluru, India',
        homeTown: 'Kolkata, West Bengal',
        address: {
          correspondenceAddress: 'Flat 402, Green View Apartments, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          pincode: '560038'
        },
        professional: {
          company: 'CloudScale Dynamics',
          position: 'Senior Backend Engineer',
          experienceYears: 3,
          skills: ['Node.js', 'MongoDB', 'AWS', 'Kubernetes'],
          rolesPlayed: 'Lead Developer on Cloud Ingestion Engine',
          industriesWorkedIn: 'FinTech / SaaS'
        },
        socials: {
          linkedin: 'https://linkedin.com/in/vikram-sengupta',
          facebook: 'https://facebook.com/vikram.sengupta'
        },
        contributions: { mentorStudents: true, webinarSpeaker: true, scholarships: false },
        assignedTo: studentUser._id,
        assignedBy: staffUser._id,
        contactStatus: 'REACHED_COMPLETE',
        escalationLevel: 'NONE',
        verificationStage: 'SUBMITTED_BY_STUDENT',
        adminRemarks: [
          { sender: studentUser._id, role: 'STUDENT_COORDINATOR', message: 'Verified details via WhatsApp call on Aug 24.', createdAt: new Date() }
        ],
        callLogs: [
          { channel: 'WHATSAPP', outcome: 'ATTENDED', remarks: 'Alumni confirmed current location and position.', recordedBy: studentUser._id, timestamp: new Date() }
        ]
      },
      {
        batch: '2023',
        name: 'Aanya Patel',
        salutation: 'Ms.',
        gender: 'Female',
        dob: new Date('1999-11-20'),
        mobile: '+919812345678',
        email: 'aanya.p@designhub.io',
        currentLocation: 'Mumbai, India',
        homeTown: 'Ahmedabad, Gujarat',
        address: {
          correspondenceAddress: '12B Heritage Towers, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400050'
        },
        professional: {
          company: 'Nexus Creative Labs',
          position: 'Lead UX Designer',
          experienceYears: 2,
          skills: ['Figma', 'User Research', 'Design Systems'],
          rolesPlayed: 'Product Designer',
          industriesWorkedIn: 'E-Commerce'
        },
        socials: { linkedin: 'https://linkedin.com/in/aanyapatel-ux' },
        contributions: { mentorStudents: true, webinarSpeaker: false, scholarships: true },
        assignedTo: studentUser._id,
        assignedBy: staffUser._id,
        contactStatus: 'REACHED_COMPLETE',
        escalationLevel: 'NONE',
        verificationStage: 'VERIFIED_BY_HEAD',
        adminRemarks: [
          { sender: studentUser._id, role: 'STUDENT_COORDINATOR', message: 'All credentials submitted.', createdAt: new Date() }
        ],
        callLogs: [
          { channel: 'CALL', outcome: 'ATTENDED', remarks: 'Call connected; verified employment status.', recordedBy: studentUser._id, timestamp: new Date() }
        ]
      },
      {
        batch: '2022',
        name: 'Rohan Deshmukh',
        salutation: 'Mr.',
        gender: 'Male',
        dob: new Date('1997-03-08'),
        mobile: '+919700112233',
        email: 'rohan.deshmukh@ai-labs.org',
        currentLocation: 'San Francisco, USA',
        homeTown: 'Pune, Maharashtra',
        address: {
          correspondenceAddress: '450 Mission St, Suite 800',
          city: 'San Francisco',
          state: 'California',
          country: 'USA',
          pincode: '94105'
        },
        professional: {
          company: 'Anthropic AI Partners',
          position: 'Research Scientist',
          experienceYears: 4,
          skills: ['PyTorch', 'LLMs', 'Transformer Models'],
          rolesPlayed: 'AI Researcher',
          industriesWorkedIn: 'Artificial Intelligence'
        },
        socials: { linkedin: 'https://linkedin.com/in/rohandeshmukh-ai' },
        contributions: { mentorStudents: true, webinarSpeaker: true, scholarships: true },
        assignedTo: studentUser._id,
        assignedBy: staffUser._id,
        contactStatus: 'REACHED_COMPLETE',
        escalationLevel: 'NONE',
        verificationStage: 'ADMIN_APPROVED',
        adminRemarks: [
          { sender: adminUser._id, role: 'ADMIN', message: 'Gold standard verified profile.', createdAt: new Date() }
        ],
        callLogs: [
          { channel: 'EMAIL', outcome: 'ATTENDED', remarks: 'Confirmed over institutional email.', recordedBy: studentUser._id, timestamp: new Date() }
        ]
      },
      {
        batch: '2023',
        name: 'Kavya Nair',
        salutation: 'Ms.',
        gender: 'Female',
        dob: new Date('1999-07-19'),
        mobile: '+919654321098',
        email: 'kavya.nair@oldnumber.com',
        currentLocation: 'Hyderabad, India',
        homeTown: 'Kochi, Kerala',
        address: {
          correspondenceAddress: 'Gachibowli Tech Park',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500032'
        },
        professional: { company: 'Global Systems Inc', position: 'Data Analyst', experienceYears: 1 },
        assignedTo: studentUser._id,
        assignedBy: staffUser._id,
        contactStatus: 'NOT_REACHED',
        escalationLevel: 'LEVEL_2_STAFF',
        verificationStage: 'PENDING_SUBMISSION',
        adminRemarks: [
          { sender: studentUser._id, role: 'STUDENT_COORDINATOR', message: 'Number switched off repeatedly.', createdAt: new Date() }
        ],
        callLogs: [
          { channel: 'CALL', outcome: 'SWITCHED_OFF', remarks: 'Number switched off on 3 consecutive calls.', recordedBy: studentUser._id, timestamp: new Date() },
          { channel: 'CALL', outcome: 'NOT_CONNECTED', remarks: 'Unreachable.', recordedBy: studentUser._id, timestamp: new Date() }
        ]
      },
      {
        batch: '2024',
        name: 'Siddharth Rao',
        salutation: 'Mr.',
        gender: 'Male',
        dob: new Date('2000-01-12'),
        mobile: '+919988776655',
        email: 'siddharth.rao@futuretech.com',
        currentLocation: 'Delhi NCR, India',
        homeTown: 'Jaipur, Rajasthan',
        assignedTo: student2User._id,
        assignedBy: staffUser._id,
        contactStatus: 'NOT_ATTEMPTED',
        escalationLevel: 'NONE',
        verificationStage: 'PENDING_SUBMISSION',
        callLogs: []
      },
      {
        batch: '2024',
        name: 'Ananya Roy',
        salutation: 'Ms.',
        gender: 'Female',
        dob: new Date('2000-09-25'),
        mobile: '+919112233445',
        email: 'ananya.roy@startup.co',
        currentLocation: 'Gurugram, India',
        homeTown: 'Kolkata, West Bengal',
        assignedTo: null,
        assignedBy: null,
        contactStatus: 'NOT_ATTEMPTED',
        escalationLevel: 'LEVEL_3_HOD',
        verificationStage: 'PENDING_SUBMISSION',
        adminRemarks: [
          { sender: staffUser._id, role: 'STAFF_COORDINATOR', message: 'Escalated to HOD due to conflicting company records.', createdAt: new Date() }
        ],
        callLogs: []
      }
    ];

    await Alumni.create(sampleAlumni);
    console.log(`Auto-seeded ${users.length} demo users and ${sampleAlumni.length} alumni records cleanly!`);
  } catch (err) {
    console.error('Error during auto-seed execution:', err.message);
  }
};

module.exports = autoSeed;
