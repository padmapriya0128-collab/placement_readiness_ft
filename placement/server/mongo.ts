import { MongoClient, Db } from 'mongodb';

let dbInstance: Db | null = null;
let clientInstance: MongoClient | null = null;

// In-memory fallback stores if MongoDB Atlas connection is not configured or offline
export const inMemoryDB: {
  students: any[];
  companies: any[];
  placementDrives: any[];
  datasets?: any[];
  assessments?: any[];
  assessmentScores?: Record<string, any>;
} = {
  students: [
    {
      id: 'std_7376222AD001',
      name: 'Adithya Kumar',
      registerNumber: '7376222AD001',
      email: 'adithyakumar@adithyatech.edu.in',
      department: 'Artificial Intelligence & Data Science',
      year: 4,
      cgpa: 8.75,
      readinessScore: 88,
      activeArrears: 0,
      skills: ['Java', 'Python', 'React', 'Data Science', 'Machine Learning', 'SQL'],
      certifications: ['AWS Certified Cloud Practitioner', 'TensorFlow Developer'],
      internships: ['Data Engineering Intern at TCS'],
      projects: ['Placement Readiness AI System'],
      role: 'Student'
    },
    {
      id: 'std_7376222AD002',
      name: 'Priya Dharshini',
      registerNumber: '7376222AD002',
      email: 'priyadharshini@adithyatech.edu.in',
      department: 'Artificial Intelligence & Data Science',
      year: 4,
      cgpa: 9.12,
      readinessScore: 92,
      activeArrears: 0,
      skills: ['Python', 'Deep Learning', 'PyTorch', 'React', 'SQL', 'FastAPI'],
      certifications: ['Deep Learning Specialization'],
      internships: ['AI Research Intern at Zoho'],
      projects: ['Medical Image Classification'],
      role: 'Student'
    },
    {
      id: 'std_7376222CS015',
      name: 'Karthik Raja',
      registerNumber: '7376222CS015',
      email: 'karthikraja@adithyatech.edu.in',
      department: 'Computer Science & Engineering',
      year: 4,
      cgpa: 8.20,
      readinessScore: 84,
      activeArrears: 0,
      skills: ['Java', 'Spring Boot', 'MySQL', 'React', 'Data Structures'],
      certifications: ['Oracle Java Certified Developer'],
      internships: ['Full Stack Intern at Cognizant'],
      projects: ['E-Commerce Microservices'],
      role: 'Student'
    },
    {
      id: 'std_7376222CS028',
      name: 'Sneha Ramachandran',
      registerNumber: '7376222CS028',
      email: 'sneharam@adithyatech.edu.in',
      department: 'Computer Science & Engineering',
      year: 4,
      cgpa: 7.85,
      readinessScore: 79,
      activeArrears: 0,
      skills: ['Python', 'Django', 'PostgreSQL', 'JavaScript', 'HTML/CSS'],
      certifications: ['Python Institute Certified Associate'],
      internships: ['Software Intern at Wipro'],
      projects: ['Student Attendance Tracker'],
      role: 'Student'
    },
    {
      id: 'std_7376222IT009',
      name: 'Vikas Viswanathan',
      registerNumber: '7376222IT009',
      email: 'vikasv@adithyatech.edu.in',
      department: 'Information Technology',
      year: 4,
      cgpa: 8.45,
      readinessScore: 85,
      activeArrears: 0,
      skills: ['Node.js', 'Express', 'MongoDB', 'React', 'TypeScript', 'AWS'],
      certifications: ['AWS Solutions Architect'],
      internships: ['Backend Intern at Freshworks'],
      projects: ['Real-time Chat Engine'],
      role: 'Student'
    },
    {
      id: 'std_7376222EC011',
      name: 'Ananya Sree',
      registerNumber: '7376222EC011',
      email: 'ananyasree@adithyatech.edu.in',
      department: 'Electronics & Communication Engineering',
      year: 4,
      cgpa: 7.60,
      readinessScore: 76,
      activeArrears: 0,
      skills: ['Embedded C', 'Python', 'IoT', 'MATLAB', 'VLSI', 'Arduino'],
      certifications: ['Embedded Systems Specialist'],
      internships: ['IoT Intern at Bosch'],
      projects: ['Smart Agriculture Sensor Node'],
      role: 'Student'
    },
    {
      id: 'std_7376222ME004',
      name: 'Rahul Saravanan',
      registerNumber: '7376222ME004',
      email: 'rahuls@adithyatech.edu.in',
      department: 'Mechanical Engineering',
      year: 4,
      cgpa: 6.80,
      readinessScore: 70,
      activeArrears: 0,
      skills: ['AutoCAD', 'SolidWorks', 'Python', 'ANSYS'],
      certifications: ['SolidWorks Associate'],
      internships: ['Design Intern at L&T'],
      projects: ['Automated Conveyor Mechanism'],
      role: 'Student'
    }
  ],
  companies: [],
  placementDrives: [],
  datasets: [],
  assessments: [],
  assessmentScores: {}
};

export async function connectToMongoDB(): Promise<Db | null> {
  if (dbInstance) return dbInstance;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ MONGODB_URI environment variable not provided. Utilizing in-memory storage mode.');
    return null;
  }

  try {
    clientInstance = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });
    await clientInstance.connect();
    dbInstance = clientInstance.db('placement_db');
    console.log('✅ Successfully connected to MongoDB Atlas (Database: placement_db)');

    // Ensure initial seeds if collection is empty
    await seedInitialData(dbInstance);

    return dbInstance;
  } catch (err) {
    console.warn('⚠️ Could not connect to MongoDB Atlas. Falling back to in-memory store:', (err as any)?.message);
    dbInstance = null;
    return null;
  }
}

async function seedInitialData(db: Db) {
  try {
    const studentCount = await db.collection('students').countDocuments();
    if (studentCount === 0) {
      console.log('🌱 Seeding initial student dataset into MongoDB Atlas...');
      const sampleStudents = [
        {
          id: 'std_101',
          name: 'Arun Kumar',
          registerNumber: '710122104001',
          department: 'Computer Science & Engineering',
          year: 4,
          section: 'A',
          email: 'arunkumar.7101@gmail.com',
          phone: '+91 9876543210',
          cgpa: 8.7,
          skills: ['Java', 'React', 'Data Structures', 'SQL', 'Python'],
          certifications: ['AWS Cloud Practitioner', 'Java Certified Associate'],
          internships: ['SDE Intern at TechCorp (3 Months)'],
          projects: ['AI Placement Readiness Analyzer', 'E-Commerce Microservice'],
          activeArrears: 0,
          readinessScore: 92,
          placementStatus: 'Eligible',
          username: 'arunkumar',
          role: 'Student'
        },
        {
          id: 'std_102',
          name: 'Priya Dharshini',
          registerNumber: '710122104002',
          department: 'Computer Science & Engineering',
          year: 4,
          section: 'A',
          email: 'priyadharshini.7101@gmail.com',
          phone: '+91 9876543211',
          cgpa: 9.1,
          skills: ['Python', 'Data Structures', 'Machine Learning', 'SQL', 'Docker'],
          certifications: ['Google Data Analytics Professional', 'Deep Learning Specialization'],
          internships: ['Data Science Intern at Analytics Hub'],
          projects: ['Student Placement Predictor', 'Smart Health Monitor'],
          activeArrears: 0,
          readinessScore: 95,
          placementStatus: 'Eligible',
          username: 'priyadharshini',
          role: 'Student'
        },
        {
          id: 'std_103',
          name: 'Karthik Raja',
          registerNumber: '710122105012',
          department: 'Information Technology',
          year: 4,
          section: 'B',
          email: 'karthikraja.7101@gmail.com',
          phone: '+91 9876543212',
          cgpa: 7.9,
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'SQL'],
          certifications: ['Full Stack Web Development'],
          internships: ['Frontend Developer Intern at WebStudio'],
          projects: ['College Management System'],
          activeArrears: 0,
          readinessScore: 84,
          placementStatus: 'Eligible',
          username: 'karthikraja',
          role: 'Student'
        },
        {
          id: 'std_104',
          name: 'Sneha R',
          registerNumber: '710122106025',
          department: 'Electronics & Communication Engineering',
          year: 4,
          section: 'A',
          email: 'sneha.ece.7101@gmail.com',
          phone: '+91 9876543213',
          cgpa: 8.2,
          skills: ['C++', 'Embedded C', 'Python', 'MATLAB', 'VLSI'],
          certifications: ['Embedded Systems Specialist'],
          internships: ['IoT Systems Intern'],
          projects: ['Smart Agriculture Automation'],
          activeArrears: 0,
          readinessScore: 86,
          placementStatus: 'Eligible',
          username: 'snehar',
          role: 'Student'
        },
        {
          id: 'std_105',
          name: 'Vignesh M',
          registerNumber: '710122104045',
          department: 'Computer Science & Engineering',
          year: 4,
          section: 'B',
          email: 'vignesh.7101@gmail.com',
          phone: '+91 9876543214',
          cgpa: 6.8,
          skills: ['Java', 'HTML', 'CSS'],
          certifications: [],
          internships: [],
          projects: ['Basic Portfolio Website'],
          activeArrears: 2,
          readinessScore: 58,
          placementStatus: 'Not Eligible',
          username: 'vigneshm',
          role: 'Student'
        }
      ];
      await db.collection('students').insertMany(sampleStudents);
      console.log(`✅ Seeded ${sampleStudents.length} students into MongoDB.`);
    }
  } catch (err) {
    console.error('Error seeding MongoDB Atlas:', err);
  }
}
