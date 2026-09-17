import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookOpen, 
  Target, 
  Layers, 
  Wrench, 
  ArrowRight, 
  Zap, 
  BarChart3, 
  GraduationCap, 
  Briefcase, 
  Compass, 
  ChevronRight, 
  Sliders, 
  RefreshCw, 
  Check, 
  Info,
  ShieldCheck,
  FileCode2,
  FolderKanban,
  FileSpreadsheet
} from 'lucide-react';
import { Student } from '../types';
import { getStudentAssessmentSummary, StudentAssessmentRecord } from '../api/faculty';
import CircularScoreMeter from './CircularScoreMeter';

interface CareerReadinessAnalyzerProps {
  student: Student;
  onUpdateReadinessScore?: (score: number) => void;
}

// Skill requirement structure for a career role
export interface SkillRequirement {
  name: string;
  category: 'Technical' | 'Analytics' | 'Domain' | 'Tools' | 'Soft Skills';
  requiredLevel: number; // 1 to 5 scale
  levelName: string; // e.g., "Level 4 - Advanced"
  description: string;
  importance: 'Critical' | 'Important' | 'Nice to Have';
}

// Career Role definition
export interface CareerRole {
  id: string;
  title: string;
  category: string;
  summary: string;
  averageSalary: string;
  industryDemand: 'Explosive' | 'Very High' | 'High' | 'Moderate';
  minCgpa: number;
  maxArrearsAllowed: number;
  requiredSkills: SkillRequirement[];
  projectRequirements: {
    minCount: number;
    description: string;
    suggestedProjects: string[];
  };
  recommendedCertifications: string[];
  keyResponsibilities: string[];
  similarRoles: string[];
}

// Comprehensive predefined Database of Career Roles
export const CAREER_ROLES_DATABASE: CareerRole[] = [
  {
    id: 'data-analytics',
    title: 'Data Analytics / Data Analyst',
    category: 'Data & AI',
    summary: 'Transforms raw data into actionable business intelligence using SQL, statistical modeling, data visualization tools (Power BI, Tableau), and Python/R.',
    averageSalary: '6.5 - 12 LPA',
    industryDemand: 'Explosive',
    minCgpa: 7.0,
    maxArrearsAllowed: 0,
    requiredSkills: [
      {
        name: 'SQL & Relational Databases',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Complex SQL queries, CTEs, Window Functions, aggregations, joins, and database indexing.',
        importance: 'Critical'
      },
      {
        name: 'Data Visualization (Power BI / Tableau)',
        category: 'Analytics',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Interactive dashboard creation, DAX measures, storytelling with visuals, and report distribution.',
        importance: 'Critical'
      },
      {
        name: 'Python / R for Data Analysis',
        category: 'Technical',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Pandas, NumPy, data cleaning, EDA (Exploratory Data Analysis), and Matplotlib/Seaborn.',
        importance: 'Important'
      },
      {
        name: 'Excel & Advanced Spreadsheets',
        category: 'Tools',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Pivot tables, Power Query, XLOOKUP, nested formulas, and data validation.',
        importance: 'Important'
      },
      {
        name: 'Applied Statistics & Probability',
        category: 'Analytics',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Hypothesis testing, descriptive statistics, A/B testing, and correlation analysis.',
        importance: 'Important'
      },
      {
        name: 'Business Intelligence & Communication',
        category: 'Soft Skills',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Translating analytical findings into plain language business recommendations for stakeholders.',
        importance: 'Nice to Have'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'Minimum 2 end-to-end data analytics projects with interactive dashboards and published GitHub/PowerBI reports.',
      suggestedProjects: [
        'E-Commerce Customer Churn Analytics Dashboard (Power BI / SQL)',
        'Sales Performance & Profit Margin Exploratory Data Analysis (Python / Pandas)',
        'Healthcare Patient Admission & Wait-Time Optimization Insights'
      ]
    },
    recommendedCertifications: [
      'Microsoft Certified: Power BI Data Analyst Associate (PL-300)',
      'Google Data Analytics Professional Certificate',
      'AWS Certified Data Analytics - Specialty'
    ],
    keyResponsibilities: [
      'Extracting and cleaning large volumes of data from relational databases.',
      'Building automated executive reports and interactive Power BI dashboards.',
      'Partnering with business teams to identify growth opportunities and cost efficiencies.'
    ],
    similarRoles: ['Business Intelligence Analyst', 'Business Analyst', 'Data Engineer Trainee', 'Product Analyst']
  },
  {
    id: 'fullstack-developer',
    title: 'Full Stack Software Engineer',
    category: 'Software Engineering',
    summary: 'Designs, builds, and maintains both client-side user interfaces (React/Next.js) and server-side REST APIs/Databases (Node.js/Express/PostgreSQL).',
    averageSalary: '7.5 - 16 LPA',
    industryDemand: 'Explosive',
    minCgpa: 7.5,
    maxArrearsAllowed: 0,
    requiredSkills: [
      {
        name: 'Frontend Development (React / TypeScript)',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'React state management, custom hooks, Tailwind CSS, component modularity, and web performance.',
        importance: 'Critical'
      },
      {
        name: 'Backend APIs (Node.js / Express / REST)',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'RESTful API routing, authentication (JWT/OAuth), middleware, and async error handling.',
        importance: 'Critical'
      },
      {
        name: 'Databases (SQL & NoSQL)',
        category: 'Technical',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'PostgreSQL/MySQL queries, ORM usage (Prisma/Drizzle), and MongoDB document modeling.',
        importance: 'Critical'
      },
      {
        name: 'Data Structures & Algorithms',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Arrays, Strings, Trees, Graphs, Sorting, Searching, and Time/Space complexity optimization.',
        importance: 'Critical'
      },
      {
        name: 'Git Version Control & CI/CD',
        category: 'Tools',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Branching strategies, pull requests, merge conflict resolution, and deployment pipelines.',
        importance: 'Important'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'At least 2 full-stack web applications deployed live on Cloud Run / Vercel / AWS with source code on GitHub.',
      suggestedProjects: [
        'Real-time Collaborative Task & Project Management App (React + Node + WebSockets)',
        'SaaS E-Commerce Platform with Stripe Payment Proxy & Auth',
        'AI-Powered Code Reviewer & Assistant Tool'
      ]
    },
    recommendedCertifications: [
      'AWS Certified Developer - Associate',
      'Meta Full-Stack Developer Professional Certificate',
      'MongoDB Certified Developer'
    ],
    keyResponsibilities: [
      'Architecting responsive, fast frontend interfaces and scalable backend microservices.',
      'Writing clean, testable TypeScript code and maintaining API contracts.',
      'Collaborating with product managers and QA engineers on release cycles.'
    ],
    similarRoles: ['Frontend Engineer', 'Backend Developer', 'Software Development Engineer (SDE-1)', 'Web Developer']
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI & Machine Learning Engineer',
    category: 'Data & AI',
    summary: 'Develops predictive algorithms, machine learning models, neural networks, and Generative AI applications using Python, PyTorch, and Gemini/LLM APIs.',
    averageSalary: '9.0 - 20 LPA',
    industryDemand: 'Explosive',
    minCgpa: 8.0,
    maxArrearsAllowed: 0,
    requiredSkills: [
      {
        name: 'Python & Scientific Computing',
        category: 'Technical',
        requiredLevel: 5,
        levelName: 'Level 5 - Expert',
        description: 'Advanced Python OOP, NumPy vectorization, Pandas data pipelines, and async processing.',
        importance: 'Critical'
      },
      {
        name: 'Machine Learning Algorithms & Scikit-Learn',
        category: 'Analytics',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Supervised/Unsupervised learning, Regression, Classification, Decision Trees, Random Forests, and SVM.',
        importance: 'Critical'
      },
      {
        name: 'Deep Learning & PyTorch / TensorFlow',
        category: 'Technical',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Neural Networks, CNNs, RNNs, Transformers, Model training, and hyperparameter tuning.',
        importance: 'Critical'
      },
      {
        name: 'Generative AI & LLMs (Gemini / OpenAI APIs)',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Prompt engineering, RAG (Retrieval-Augmented Generation), Vector Databases (Chroma/Pinecone), and Function Calling.',
        importance: 'Important'
      },
      {
        name: 'Linear Algebra, Calculus & Probability',
        category: 'Analytics',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Matrix multiplication, Eigenvalues, Gradient Descent optimization, and Bayes Theorem.',
        importance: 'Important'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'Minimum 2 AI/ML projects featuring custom model training, RAG pipeline integration, or published Hugging Face space.',
      suggestedProjects: [
        'RAG Knowledge Base Chatbot using Gemini API & Vector DB',
        'Computer Vision Automated Defect Detection Pipeline',
        'Predictive Maintenance ML Model with Streamlit UI'
      ]
    },
    recommendedCertifications: [
      'TensorFlow Developer Certificate',
      'AWS Certified Machine Learning - Specialty',
      'DeepLearning.AI AI Engineering Specialization'
    ],
    keyResponsibilities: [
      'Preprocessing complex multi-modal datasets for training and evaluation.',
      'Fine-tuning transformer models and deploying production ML endpoints.',
      'Monitoring model performance, drift, and inference latency.'
    ],
    similarRoles: ['Data Scientist', 'NLP Engineer', 'Computer Vision Specialist', 'MLOps Engineer']
  },
  {
    id: 'cloud-devops-engineer',
    title: 'Cloud & DevOps Engineer',
    category: 'Infrastructure',
    summary: 'Manages cloud infrastructure (AWS/GCP), CI/CD automated deployment pipelines, Docker containers, Kubernetes orchestration, and system reliability.',
    averageSalary: '8.0 - 18 LPA',
    industryDemand: 'Very High',
    minCgpa: 7.2,
    maxArrearsAllowed: 0,
    requiredSkills: [
      {
        name: 'Cloud Platforms (AWS / GCP / Azure)',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'EC2, S3, IAM, Cloud Run, VPC networking, Serverless functions, and load balancing.',
        importance: 'Critical'
      },
      {
        name: 'Docker & Containerization',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Dockerfile writing, multi-stage builds, container optimization, and docker-compose.',
        importance: 'Critical'
      },
      {
        name: 'Linux Administration & Shell Scripting',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Bash scripting, permissions, process management, networking tools (netstat, curl, SSH), and systemd.',
        importance: 'Critical'
      },
      {
        name: 'CI/CD Pipelines (GitHub Actions / Jenkins)',
        category: 'Tools',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Automated testing workflows, build artifacts, multi-environment deployments, and secrets management.',
        importance: 'Important'
      },
      {
        name: 'Infrastructure as Code (Terraform)',
        category: 'Tools',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Writing HCL scripts for automated provisioning and state management.',
        importance: 'Nice to Have'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'At least 2 infrastructure projects demonstrating automated container deployment to cloud with GitHub Actions CI/CD.',
      suggestedProjects: [
        'Automated CI/CD Pipeline deploying Dockerized Node app to Cloud Run on Git Push',
        'Multi-node Kubernetes Cluster Monitoring Setup with Prometheus & Grafana',
        'Terraform Infrastructure Script for Secure AWS VPC + EC2 + RDS'
      ]
    },
    recommendedCertifications: [
      'AWS Certified Solutions Architect - Associate',
      'Google Cloud Associate Cloud Engineer',
      'Certified Kubernetes Administrator (CKA)'
    ],
    keyResponsibilities: [
      'Automating infrastructure provisioning and software deployment workflows.',
      'Ensuring high availability, auto-scaling, and uptime of cloud services.',
      'Managing security policies, IAM access, and environment isolation.'
    ],
    similarRoles: ['Site Reliability Engineer (SRE)', 'Cloud Solutions Architect', 'Infrastructure Engineer', 'System Administrator']
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst & Security Engineer',
    category: 'Security',
    summary: 'Monitors, detects, and prevents security threats across network infrastructure, web applications, cloud environments, and enterprise endpoints.',
    averageSalary: '7.0 - 15 LPA',
    industryDemand: 'Very High',
    minCgpa: 7.0,
    maxArrearsAllowed: 0,
    requiredSkills: [
      {
        name: 'Network Security & Protocols',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'TCP/IP, DNS, HTTP/S, VPNs, Firewalls, Wireshark packet analysis, and IDS/IPS.',
        importance: 'Critical'
      },
      {
        name: 'Web Application Security (OWASP Top 10)',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'SQL Injection, XSS, CSRF, Auth flaws, and vulnerability scanning with Burp Suite / OWASP ZAP.',
        importance: 'Critical'
      },
      {
        name: 'Ethical Hacking & Penetration Testing',
        category: 'Technical',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Reconnaissance, exploitation techniques, Kali Linux tools, and vulnerability assessment.',
        importance: 'Important'
      },
      {
        name: 'Security Information & Event Management (SIEM)',
        category: 'Tools',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Splunk / Elastic Security log analysis, incident response, and threat detection rules.',
        importance: 'Important'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'At least 2 hands-on security audit or penetration testing labs documented with vulnerability report writeups.',
      suggestedProjects: [
        'Web Application Vulnerability Audit & Patching Report (OWASP Top 10)',
        'Network Intrusion Detection System with Wireshark & Snort Rules',
        'Capture-The-Flag (CTF) Security Analysis Writeup'
      ]
    },
    recommendedCertifications: [
      'CompTIA Security+',
      'Certified Ethical Hacker (CEH)',
      'Offensive Security Certified Professional (OSCP)'
    ],
    keyResponsibilities: [
      'Monitoring SIEM alerts and conducting threat response investigations.',
      'Performing web app security reviews and penetration testing.',
      'Ensuring compliance with ISO 27001 and GDPR data protection regulations.'
    ],
    similarRoles: ['SOC Analyst', 'Penetration Tester', 'Information Security Officer', 'Cloud Security Specialist']
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX & Product Designer',
    category: 'Design & Product',
    summary: 'Crafts intuitive, user-centered digital interfaces, wireframes, high-fidelity prototypes, and design systems using Figma and usability research.',
    averageSalary: '6.0 - 14 LPA',
    industryDemand: 'High',
    minCgpa: 6.5,
    maxArrearsAllowed: 1,
    requiredSkills: [
      {
        name: 'Figma & High-Fidelity Prototyping',
        category: 'Tools',
        requiredLevel: 5,
        levelName: 'Level 5 - Expert',
        description: 'Auto-layout, interactive components, design system tokens, and micro-animations.',
        importance: 'Critical'
      },
      {
        name: 'User Research & Information Architecture',
        category: 'Analytics',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'User interviews, personas, journey mapping, wireframing, and usability testing.',
        importance: 'Critical'
      },
      {
        name: 'Design Systems & Typography',
        category: 'Domain',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Visual hierarchy, color theory, accessibility (WCAG AA), mathematical spacing, and modular design.',
        importance: 'Critical'
      },
      {
        name: 'HTML/CSS & Developer Handoff',
        category: 'Technical',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Understanding CSS Flexbox/Grid limitations to design feasible UI components for engineers.',
        importance: 'Important'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'Minimum 2 comprehensive Figma case studies published on Behance / Dribbble or personal portfolio website.',
      suggestedProjects: [
        'End-to-End Redesign Case Study for Campus Placement Portal',
        'Mobile FinTech Banking App UI/UX Design with Interactive Prototype',
        'Design System UI Kit with 50+ Accessible Components'
      ]
    },
    recommendedCertifications: [
      'Google UX Design Professional Certificate',
      'Figma Community Certified Designer',
      'Nielsen Norman Group UX Certification'
    ],
    keyResponsibilities: [
      'Conducting user research and converting user pain points into wireframes.',
      'Building polished design systems and responsive UI layouts in Figma.',
      'Collaborating closely with frontend developers for pixel-perfect implementation.'
    ],
    similarRoles: ['Product Designer', 'Interaction Designer', 'Visual Designer', 'UX Researcher']
  },
  {
    id: 'mobile-app-developer',
    title: 'Mobile App Developer (Flutter / React Native)',
    category: 'Software Engineering',
    summary: 'Develops cross-platform iOS and Android mobile applications using Flutter (Dart) or React Native, connecting to REST/Firebase backends.',
    averageSalary: '7.0 - 15 LPA',
    industryDemand: 'Very High',
    minCgpa: 7.0,
    maxArrearsAllowed: 0,
    requiredSkills: [
      {
        name: 'Flutter / Dart OR React Native',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'State management (Bloc/Provider/Redux), navigation, custom UI widgets, and native plugins.',
        importance: 'Critical'
      },
      {
        name: 'Mobile API Integration & Local Storage',
        category: 'Technical',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Connecting REST APIs, offline SQLite/Hive caching, push notifications, and OAuth.',
        importance: 'Critical'
      },
      {
        name: 'Mobile UX & Responsive Layouts',
        category: 'Domain',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'Material Design, iOS Human Interface Guidelines, touch targets, and smooth 60fps animations.',
        importance: 'Important'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'At least 2 functional mobile apps published on GitHub or Google Play Store.',
      suggestedProjects: [
        'College Student Companion Mobile App with Offline Schedules & Grade Tracker',
        'Cross-Platform Fitness Tracker with Google Fit / HealthKit Integration',
        'E-Commerce Mobile Shopping App with Payment Gateway'
      ]
    },
    recommendedCertifications: [
      'Google Associate Android Developer',
      'Meta Android / iOS Developer Certificate',
      'Flutter Certified Application Developer'
    ],
    keyResponsibilities: [
      'Building cross-platform mobile apps for iOS and Android.',
      'Optimizing app startup times, memory usage, and battery consumption.',
      'Managing Play Store / App Store release processes.'
    ],
    similarRoles: ['Android Developer', 'iOS Developer', 'Flutter Engineer', 'Frontend Mobile Engineer']
  },
  {
    id: 'product-manager',
    title: 'Associate Product Manager (APM)',
    category: 'Design & Product',
    summary: 'Bridging technical engineering, business strategy, and user experience to define product roadmaps, user stories, and metrics for tech products.',
    averageSalary: '8.5 - 18 LPA',
    industryDemand: 'High',
    minCgpa: 7.5,
    maxArrearsAllowed: 0,
    requiredSkills: [
      {
        name: 'Product Strategy & Roadmapping',
        category: 'Domain',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Feature prioritization (RICE framework), user requirements, PRD writing, and roadmap execution.',
        importance: 'Critical'
      },
      {
        name: 'Product Analytics & Metrics',
        category: 'Analytics',
        requiredLevel: 3,
        levelName: 'Level 3 - Intermediate',
        description: 'DAU/MAU, Retention, Conversion Funnels, A/B Testing, and Mixpanel / Google Analytics.',
        importance: 'Critical'
      },
      {
        name: 'Agile & Scrum Methodologies',
        category: 'Soft Skills',
        requiredLevel: 4,
        levelName: 'Level 4 - Advanced',
        description: 'Jira, sprint planning, backlog grooming, user story creation, and cross-functional leadership.',
        importance: 'Important'
      }
    ],
    projectRequirements: {
      minCount: 2,
      description: 'Minimum 2 comprehensive Product Requirement Documents (PRDs) or Product Teardowns.',
      suggestedProjects: [
        'PRD & Feature Strategy for Improving Campus Placement Application Completion',
        'Product Teardown & Growth Strategy for Spotify / LinkedIn',
        'A/B Test Design & Conversion Analysis Case Study'
      ]
    },
    recommendedCertifications: [
      'Professional Scrum Product Owner (PSPO I)',
      'Product School Product Manager Certificate',
      'Pragmatic Institute Certified Product Manager'
    ],
    keyResponsibilities: [
      'Defining product vision, writing user stories, and prioritizing engineering backlogs.',
      'Working closely with software developers, designers, and business leaders.',
      'Tracking product KPIs, user feedback, and iterative release quality.'
    ],
    similarRoles: ['Technical Program Manager', 'Business Analyst', 'Product Operations Manager']
  }
];

export default function CareerReadinessAnalyzer({ student, onUpdateReadinessScore }: CareerReadinessAnalyzerProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('Data Analytics');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('data-analytics');

  // Faculty-uploaded Weekly Assessment summary state
  const [assessmentSummary, setAssessmentSummary] = useState<{
    records: StudentAssessmentRecord[];
    totalAssessments: number;
    presentCount: number;
    avgPercentage: number;
  } | null>(null);

  useEffect(() => {
    async function loadAssessmentData() {
      if (student.registerNumber || student.id) {
        const summary = await getStudentAssessmentSummary(student.registerNumber, student.id);
        setAssessmentSummary(summary);
      }
    }
    loadAssessmentData();
  }, [student]);

  // Interactive Self-Assessment tweaks
  const [customSkillProficiency, setCustomSkillProficiency] = useState<Record<string, number>>({});
  const [isSelfAssessmentActive, setIsSelfAssessmentActive] = useState<boolean>(false);

  // Filter or search roles
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return CAREER_ROLES_DATABASE;
    const q = searchQuery.toLowerCase().trim();
    return CAREER_ROLES_DATABASE.filter(
      r => r.title.toLowerCase().includes(q) || 
           r.category.toLowerCase().includes(q) || 
           r.summary.toLowerCase().includes(q) ||
           r.requiredSkills.some(s => s.name.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Selected Career Role object
  const activeRole = useMemo(() => {
    return CAREER_ROLES_DATABASE.find(r => r.id === selectedRoleId) || CAREER_ROLES_DATABASE[0];
  }, [selectedRoleId]);

  // Helper to estimate student's proficiency level (1-5) for a given skill based on student profile
  const getStudentSkillLevel = (skillName: string): number => {
    if (customSkillProficiency[skillName] !== undefined) {
      return customSkillProficiency[skillName];
    }

    const sNameLower = skillName.toLowerCase();
    const studentSkillsLower = (student.skills || []).map(s => s.toLowerCase());
    const studentCertsLower = (student.certifications || []).map(c => c.toLowerCase());
    const studentProjectsLower = (student.projects || []).map(p => p.toLowerCase());

    let level = 1; // Default basic level if unverified

    // Check if skill is listed in student's skills
    const hasSkill = studentSkillsLower.some(s => sNameLower.includes(s) || s.includes(sNameLower) || 
      (sNameLower.includes('sql') && s.includes('sql')) ||
      (sNameLower.includes('python') && s.includes('python')) ||
      (sNameLower.includes('power bi') && (s.includes('power bi') || s.includes('bi'))) ||
      (sNameLower.includes('react') && s.includes('react')) ||
      (sNameLower.includes('data') && s.includes('data'))
    );

    if (hasSkill) level = 3; // Intermediate standard

    // Boost if student has related certification
    const hasCert = studentCertsLower.some(c => sNameLower.split(' ')[0] && c.includes(sNameLower.split(' ')[0]));
    if (hasCert) level = Math.min(5, level + 1);

    // Boost if student has project mentioning skill
    const hasProj = studentProjectsLower.some(p => sNameLower.split(' ')[0] && p.includes(sNameLower.split(' ')[0]));
    if (hasProj) level = Math.min(5, level + 1);

    return level;
  };

  // Comprehensive Match & Readiness Calculation Engine
  const evaluationResult = useMemo(() => {
    let skillScoreSum = 0;
    let maxSkillScorePossible = 0;

    const skillAnalysis = activeRole.requiredSkills.map(req => {
      const studentLevel = getStudentSkillLevel(req.name);
      const targetLevel = req.requiredLevel;

      // Weight multiplier based on importance
      const weight = req.importance === 'Critical' ? 1.5 : req.importance === 'Important' ? 1.0 : 0.7;

      // Ratio capped at 100%
      const matchRatio = Math.min(1, studentLevel / targetLevel);
      skillScoreSum += matchRatio * weight;
      maxSkillScorePossible += weight;

      const gap = targetLevel - studentLevel;
      let matchStatus: 'Matched' | 'Needs Level Boost' | 'Missing';
      if (gap <= 0) matchStatus = 'Matched';
      else if (studentLevel >= 2) matchStatus = 'Needs Level Boost';
      else matchStatus = 'Missing';

      return {
        req,
        studentLevel,
        targetLevel,
        gap,
        matchRatio,
        matchStatus
      };
    });

    const skillScorePercent = maxSkillScorePossible > 0 ? (skillScoreSum / maxSkillScorePossible) * 100 : 70;

    // Academic CGPA Score
    const cgpaRatio = Math.min(1, student.cgpa / activeRole.minCgpa);
    const cgpaScorePercent = cgpaRatio * 100;

    // Arrears Penalty
    const arrearsPenalty = (student.activeArrears || 0) > activeRole.maxArrearsAllowed ? 20 : 0;

    // Projects Score
    const projCount = (student.projects || []).length;
    const projectScorePercent = Math.min(100, (projCount / activeRole.projectRequirements.minCount) * 100);

    // Certifications Score
    const certCount = (student.certifications || []).length;
    const certScorePercent = Math.min(100, certCount > 0 ? 85 : 50);

    // Weekly Assessment Score (uploaded by Professor)
    const assessmentScorePercent = (assessmentSummary && assessmentSummary.presentCount > 0)
      ? assessmentSummary.avgPercentage
      : 75;

    // Final Weighted Readiness Score
    const weightedScore = (
      skillScorePercent * 0.40 +
      assessmentScorePercent * 0.20 +
      cgpaScorePercent * 0.20 +
      projectScorePercent * 0.10 +
      certScorePercent * 0.10
    ) - arrearsPenalty;

    const finalReadinessScore = Math.max(10, Math.min(99, Math.round(weightedScore)));

    // Tier Classification
    let tierTitle = '';
    let tierColor = '';
    let tierBg = '';
    if (finalReadinessScore >= 88) {
      tierTitle = 'Placement Ready (Top Candidate)';
      tierColor = 'text-emerald-700 border-emerald-300';
      tierBg = 'bg-emerald-50';
    } else if (finalReadinessScore >= 72) {
      tierTitle = 'Strong Candidate (Minor Skill Boost Needed)';
      tierColor = 'text-blue-700 border-blue-300';
      tierBg = 'bg-blue-50';
    } else if (finalReadinessScore >= 55) {
      tierTitle = 'Developing Candidate (Action Plan Recommended)';
      tierColor = 'text-amber-700 border-amber-300';
      tierBg = 'bg-amber-50';
    } else {
      tierTitle = 'Foundational Stage (Skill Building Required)';
      tierColor = 'text-rose-700 border-rose-300';
      tierBg = 'bg-rose-50';
    }

    // Critical Gaps
    const criticalGaps = skillAnalysis.filter(s => s.matchStatus !== 'Matched');

    return {
      finalReadinessScore,
      skillScorePercent: Math.round(skillScorePercent),
      cgpaScorePercent: Math.round(cgpaScorePercent),
      projectScorePercent: Math.round(projectScorePercent),
      tierTitle,
      tierColor,
      tierBg,
      skillAnalysis,
      criticalGaps
    };
  }, [activeRole, student, customSkillProficiency]);

  // Handle setting active target role
  const handleSelectRole = (role: CareerRole) => {
    setSelectedRoleId(role.id);
    setSearchQuery(role.title);
  };

  const handleLevelChange = (skillName: string, newLevel: number) => {
    setCustomSkillProficiency(prev => ({
      ...prev,
      [skillName]: newLevel
    }));
  };

  const handleResetSelfAssessment = () => {
    setCustomSkillProficiency({});
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-8">

      {/* HERO SECTION: "A STUDENT CAN BECOME ANYTHING" */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-sky-50 text-slate-900 p-6 sm:p-8 shadow-xs border border-blue-200/80">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-black uppercase tracking-wider">
            <Compass size={14} className="animate-spin-slow text-blue-600" />
            <span>Career Exploration & Placement Matcher</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
            A Student Can Become Anything.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Search for what you aspire to become — whether it's <strong className="text-amber-800 font-black">Data Analytics</strong>, <strong className="text-emerald-800 font-black">Full Stack Engineering</strong>, or <strong className="text-indigo-800 font-black">AI Specialist</strong>. Explore exact industry requirements, skill levels needed, profile match score, and targeted recommendations to reach top-tier readiness.
          </p>

          {/* SEARCH BAR INPUT */}
          <div className="pt-2">
            <div className="relative max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search target career (e.g., Data Analytics, Cloud Engineer, UI/UX Designer)..."
                className="w-full pl-11 pr-10 py-3.5 bg-white border border-blue-200/80 rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all shadow-xs"
              />
              <Search className="absolute left-3.5 top-3.5 text-blue-500" size={18} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>
          </div>

          {/* POPULAR TARGET ROLE BADGES (CLICKABLE QUICK PILLS) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
              Popular Career Destinations:
            </span>
            <div className="flex flex-wrap gap-2">
              {CAREER_ROLES_DATABASE.map((role) => {
                const isSelected = activeRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105'
                        : 'bg-white hover:bg-blue-100/60 text-slate-700 border-slate-200/90 hover:border-blue-300'
                    }`}
                  >
                    <span>{role.title}</span>
                    {isSelected && <Check size={12} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Decorative ambient background blur elements */}
        <div className="absolute right-0 bottom-0 transform translate-x-1/3 translate-y-1/3 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 top-0 transform -translate-y-1/2 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* TARGET ROLE SUMMARY & PLACEMENT READINESS SCORE OVERVIEW */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-100">
          
          {/* Active Target Role Info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                Target Role: {activeRole.category}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase">
                Demand: {activeRole.industryDemand}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-[10px] font-black">
                Avg. Salary: {activeRole.averageSalary}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeRole.title}
            </h2>

            <p className="text-xs text-slate-600 max-w-2xl font-medium leading-relaxed">
              {activeRole.summary}
            </p>
          </div>

          {/* DYNAMIC READINESS SCORE METER FOR SEARCHED ROLE */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-sky-50 text-slate-900 p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center space-x-5 shrink-0 min-w-[300px]">
            <CircularScoreMeter score={evaluationResult.finalReadinessScore} size={88} strokeWidth={9} />
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                Target Match Score
              </span>
              <div className="text-3xl font-black text-blue-700">
                {evaluationResult.finalReadinessScore}%
              </div>
              <div className={`px-2.5 py-0.5 border rounded-md text-[10px] font-black inline-block ${evaluationResult.tierBg} ${evaluationResult.tierColor}`}>
                {evaluationResult.tierTitle}
              </div>
            </div>
          </div>

        </div>

        {/* METRICS & BREAKDOWN CARDS FOR SELECTED ROLE */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-500">Skill Alignment Score</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-blue-900">{evaluationResult.skillScorePercent}%</span>
              <span className="text-[10px] font-bold text-slate-600">Weight: 40%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${evaluationResult.skillScorePercent}%` }} />
            </div>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-blue-700 flex items-center justify-between">
              <span>Weekly Assessments</span>
              <FileSpreadsheet size={11} className="text-blue-600" />
            </span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-blue-950">
                {assessmentSummary && assessmentSummary.presentCount > 0
                  ? `${assessmentSummary.avgPercentage}%`
                  : 'N/A'}
              </span>
              <span className="text-[10px] font-bold text-blue-700">
                {assessmentSummary?.presentCount || 0} Graded
              </span>
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${assessmentSummary?.avgPercentage || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-500">Academic CGPA Cutoff</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-slate-900">{student.cgpa} / 10</span>
              <span className="text-[10px] font-bold text-emerald-700">Min {activeRole.minCgpa} Req</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${evaluationResult.cgpaScorePercent}%` }} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-500">Project Portfolio</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-indigo-900">{(student.projects || []).length} Projects</span>
              <span className="text-[10px] font-bold text-indigo-700">Req: {activeRole.projectRequirements.minCount}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${evaluationResult.projectScorePercent}%` }} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-500">Active Arrears</span>
            <div className="flex justify-between items-baseline">
              <span className={`text-xl font-black ${(student.activeArrears || 0) > activeRole.maxArrearsAllowed ? 'text-rose-600' : 'text-emerald-700'}`}>
                {student.activeArrears || 0} Arrears
              </span>
              <span className="text-[10px] font-bold text-slate-600">Allowed: {activeRole.maxArrearsAllowed}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div className={`h-full rounded-full ${(student.activeArrears || 0) > activeRole.maxArrearsAllowed ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: REQUIREMENTS BREAKDOWN - WHAT NEEDS TO BE KNOWN AND AT WHAT LEVEL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="text-blue-600" size={18} />
              <h3 className="text-base font-black text-slate-900">
                Requirements Breakdown & Skill Proficiency Level Matching
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact skills required for <strong className="text-slate-900">{activeRole.title}</strong>, expected industry mastery level (Level 1-5), and your matched status.
            </p>
          </div>

          {/* TOGGLE SELF ASSESSMENT INTERACTIVE TOOL */}
          <button
            onClick={() => setIsSelfAssessmentActive(!isSelfAssessmentActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
              isSelfAssessmentActive
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <Sliders size={14} />
            <span>{isSelfAssessmentActive ? 'Hide Interactive Level Adjuster' : 'Try Interactive Skill Booster'}</span>
          </button>
        </div>

        {/* INTERACTIVE SELF ASSESSMENT BANNER */}
        {isSelfAssessmentActive && (
          <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900 animate-fade-in">
            <div className="flex justify-between items-center font-bold">
              <span className="flex items-center space-x-1.5 text-amber-950 font-black">
                <Zap size={16} className="text-amber-600" />
                <span>Interactive Readiness Simulator Mode Active</span>
              </span>
              <button
                onClick={handleResetSelfAssessment}
                className="text-[11px] text-amber-800 hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Reset to Saved Profile</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-800">
              Drag or adjust your skill proficiency levels below to see how boosting your skills (e.g. learning SQL window functions or Power BI DAX) directly elevates your Placement Readiness Score in real-time!
            </p>
          </div>
        )}

        {/* SKILLS REQUIREMENT MATCHING TABLE / LIST */}
        <div className="space-y-4">
          {evaluationResult.skillAnalysis.map((item, idx) => {
            const req = item.req;
            const currentLevel = item.studentLevel;
            const targetLevel = item.targetLevel;

            return (
              <div 
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 text-sm">{req.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                        req.importance === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        req.importance === 'Important' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {req.importance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{req.description}</p>
                  </div>

                  {/* MATCH STATUS BADGE */}
                  <div className="shrink-0">
                    {item.matchStatus === 'Matched' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black rounded-xl inline-flex items-center space-x-1">
                        <CheckCircle2 size={14} />
                        <span>Matched (Target Level Met)</span>
                      </span>
                    ) : item.matchStatus === 'Needs Level Boost' ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-xl inline-flex items-center space-x-1">
                        <AlertTriangle size={14} />
                        <span>Needs Level Boost ({currentLevel}/5 vs {targetLevel}/5)</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black rounded-xl inline-flex items-center space-x-1">
                        <XCircle size={14} />
                        <span>Skill Missing (0/5)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* LEVEL COMPARISON BARS & READOUT */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 text-xs">
                  
                  <div className="md:col-span-3 flex justify-between font-bold text-slate-700">
                    <span>Required Mastery:</span>
                    <strong className="text-blue-900 font-extrabold">{req.levelName}</strong>
                  </div>

                  {/* VISUAL DUAL LEVEL PROGRESS BAR */}
                  <div className="md:col-span-6 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Your Level: <strong className="text-slate-900">{currentLevel} / 5</strong></span>
                      <span>Target Level: <strong className="text-blue-900">{targetLevel} / 5</strong></span>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
                      {/* Target background marker */}
                      <div 
                        className="bg-blue-200 h-full rounded-full absolute top-0 left-0" 
                        style={{ width: `${(targetLevel / 5) * 100}%` }} 
                      />
                      {/* Current level fill */}
                      <div 
                        className={`h-full rounded-full relative z-10 transition-all duration-300 ${
                          currentLevel >= targetLevel ? 'bg-emerald-600' : currentLevel >= 2 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${(currentLevel / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* INTERACTIVE LEVEL SLIDER (WHEN SIMULATOR MODE IS ON) */}
                  <div className="md:col-span-3">
                    {isSelfAssessmentActive ? (
                      <div className="flex items-center space-x-2 bg-white p-1.5 border border-amber-300 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-600">Simulate:</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={currentLevel}
                          onChange={(e) => handleLevelChange(req.name, parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                        <span className="font-extrabold text-amber-900 min-w-[20px] text-center">L{currentLevel}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-medium text-right italic">
                        {currentLevel >= targetLevel ? 'Fully ready for role expectations' : `Gap of ${targetLevel - currentLevel} level(s)`}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: WHERE TO IMPROVE & RECOMMENDED ACTION PLAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* WHERE TO IMPROVE GAP ANALYSIS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Where to Improve for {activeRole.title}</h3>
              <p className="text-xs text-slate-500">Targeted skill gaps identified between your current profile and industry expectations.</p>
            </div>
          </div>

          <div className="space-y-3">
            {evaluationResult.criticalGaps.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-medium space-y-1">
                <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                  <CheckCircle2 size={16} />
                  <span>No Critical Skill Gaps Detected!</span>
                </div>
                <p className="text-emerald-800">
                  Your profile meets or exceeds all technical skill requirements for this role. Focus on practicing interview questions and publishing your portfolio projects.
                </p>
              </div>
            ) : (
              evaluationResult.criticalGaps.map((gapItem, i) => (
                <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900">{gapItem.req.name}</span>
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                      Current: Level {gapItem.studentLevel} &rarr; Target: Level {gapItem.targetLevel}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] font-medium">
                    {gapItem.req.description}
                  </p>
                  <div className="text-[11px] font-bold text-blue-700 flex items-center space-x-1 pt-0.5">
                    <ArrowRight size={12} />
                    <span>Recommended: Focus on hands-on practice & exercises to level up.</span>
                  </div>
                </div>
              ))
            )}

            {/* PROJECT PORTFOLIO IMPROVEMENT */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2 text-xs">
              <div className="font-black text-indigo-950 flex items-center space-x-2">
                <FolderKanban size={16} className="text-indigo-600" />
                <span>Recommended Portfolio Projects ({activeRole.projectRequirements.minCount} Required)</span>
              </div>
              <p className="text-indigo-900 text-[11px] font-medium">
                {activeRole.projectRequirements.description}
              </p>
              <ul className="space-y-1.5 pt-1 pl-1 text-[11px] text-indigo-900 font-semibold">
                {activeRole.projectRequirements.suggestedProjects.map((proj, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                    <span>{proj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* RECOMMENDED CERTIFICATIONS & SIMILAR CAREER PATHS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Industry Certifications & Adjacent Paths</h3>
              <p className="text-xs text-slate-500">Industry-recognized credentials to boost candidate ranking and alternative roles.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* RECOMMENDED CERTIFICATIONS */}
            <div className="space-y-2">
              <span className="font-extrabold uppercase text-[10px] text-slate-500 tracking-wider block">
                Top Certifications for {activeRole.title}:
              </span>
              <div className="space-y-2">
                {activeRole.recommendedCertifications.map((cert, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3">
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
                      <ShieldCheck size={14} />
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SIMILAR ROLES YOU CAN EXPLORE */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-extrabold uppercase text-[10px] text-slate-500 tracking-wider block">
                Similar Career Paths You Might Match:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeRole.similarRoles.map((simRole, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl font-bold text-xs">
                    {simRole}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
