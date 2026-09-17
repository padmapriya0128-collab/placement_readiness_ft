const Student = require("./models/Student");
const Faculty = require("./models/Faculty");
const Company = require("./models/Company");

const DEFAULT_STUDENTS = [
  {
    id: 'std_7376222AD001',
    name: 'Adithya Kumar',
    fullName: 'Adithya Kumar',
    registerNumber: '7376222AD001',
    email: 'adithyakumar@adithyatech.edu.in',
    department: 'AI&DS',
    year: 4,
    cgpa: 8.75,
    readinessScore: 88,
    activeArrears: 0,
    skills: ['Java', 'Python', 'React', 'Data Science', 'Machine Learning', 'SQL'],
    certifications: ['AWS Certified Cloud Practitioner', 'TensorFlow Developer'],
    internships: ['TCS Digital - Data Engineering Intern (3 mos)'],
    projects: ['Placement Readiness AI System - ML-based readiness prediction'],
    section: 'A',
    username: '7376222AD001',
    password: '123',
    placementStatus: 'Eligible'
  },
  {
    id: 'std_7376222AD002',
    name: 'Priya Dharshini',
    fullName: 'Priya Dharshini',
    registerNumber: '7376222AD002',
    email: 'priyadharshini@adithyatech.edu.in',
    department: 'AI&DS',
    year: 4,
    cgpa: 9.12,
    readinessScore: 92,
    activeArrears: 0,
    skills: ['Python', 'Deep Learning', 'PyTorch', 'React', 'SQL', 'FastAPI'],
    certifications: ['Deep Learning Specialization', 'Azure AI Engineer'],
    internships: ['Zoho Corporation - AI Research Intern (6 mos)'],
    projects: ['Medical Image Classification - ResNet50 based diagnosis tool'],
    section: 'A',
    username: '7376222AD002',
    password: '123',
    placementStatus: 'Eligible'
  },
  {
    id: 'std_7376222CS015',
    name: 'Karthik Raja',
    fullName: 'Karthik Raja',
    registerNumber: '7376222CS015',
    email: 'karthikraja@adithyatech.edu.in',
    department: 'Computer Science & Engineering',
    year: 4,
    cgpa: 8.20,
    readinessScore: 84,
    activeArrears: 0,
    skills: ['Java', 'Spring Boot', 'MySQL', 'React', 'Data Structures', 'Docker'],
    certifications: ['Oracle Certified Java Developer'],
    internships: ['Cognizant - Full Stack Intern (4 mos)'],
    projects: ['E-Commerce Microservices - Spring Cloud architecture'],
    section: 'A',
    username: '7376222CS015',
    password: '123',
    placementStatus: 'Eligible'
  }
];

const DEFAULT_FACULTY = [
  {
    fullName: 'Dr. Sarah Jenkins',
    name: 'Dr. Sarah Jenkins',
    facultyId: 'FAC001',
    email: 'sarah.jenkins@adithyatech.edu.in',
    password: '123',
    department: 'AI&DS',
    role: 'Faculty'
  },
  {
    fullName: 'Placement Officer',
    name: 'Placement Officer',
    facultyId: 'PLAC001',
    email: 'placement@adithyatech.edu.in',
    password: '123',
    department: 'Training & Placement',
    role: 'Placement Faculty'
  }
];

const DEFAULT_COMPANIES = [
  {
    id: 'co_vis_ai_labs',
    name: 'VIS AI LABS',
    location: 'Chennai',
    jobRole: 'Software Development Engineer Trainee / Computer Vision Engineer Trainee',
    salaryPackage: '5.0 LPA',
    cgpaCutoff: 7.50,
    allowedDepartments: [
      'Electronics & Communication Engineering',
      'Computer Science & Engineering',
      'Information Technology',
      'Artificial Intelligence & Data Science',
      'AI&DS'
    ],
    year: '2026',
    requiredSkills: [
      'C', 'C++', 'JavaScript', 'Python', 'React JS', 'Full Stack Development', 'Computer Vision'
    ],
    requiredCertifications: ['Full Stack Development', 'Computer Vision'],
    internshipRequired: 'No',
    requiredProjects: 1,
    maxActiveArrears: 0,
    eligibleGender: 'All',
    applicationDeadline: '30.12.2025 @ 8 AM',
    selectionProcess: 'Day 1: Written Test (Logical & Technical) | Day 2: Technical & HR Interview',
    description: 'VisAI Labs is a leading OEM camera solutions provider with cutting-edge computer vision and AI solutions.',
    googleFormLink: 'https://docs.google.com/forms/d/e/1FAIpQLScGu4M0MCSb0O41EwUVXbABgjl0r3dvL_fznmGOkAerDhOHNA/viewform',
    status: 'Active'
  }
];

async function seedDatabase() {
  try {
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      await Student.insertMany(DEFAULT_STUDENTS);
      console.log('🌱 Seeded default students into MongoDB Atlas');
    }

    const facultyCount = await Faculty.countDocuments();
    if (facultyCount === 0) {
      for (const fac of DEFAULT_FACULTY) {
        await Faculty.create(fac);
      }
      console.log('🌱 Seeded default faculty into MongoDB Atlas');
    }

    const companyCount = await Company.countDocuments();
    if (companyCount === 0) {
      await Company.insertMany(DEFAULT_COMPANIES);
      console.log('🌱 Seeded default companies into MongoDB Atlas');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

module.exports = seedDatabase;
