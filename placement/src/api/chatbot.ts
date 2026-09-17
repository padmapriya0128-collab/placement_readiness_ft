import { ChatMessage } from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

// Realistic responses to simulate high-fidelity AI interactions depending on keywords
const SIMULATED_RESPONSES = {
  score: [
    "To improve your placement readiness score, prioritize: \n1. **Core DSA Practice**: Solve 2 LeetCode problems daily.\n2. **Industry Certifications**: E.g. AWS Certified or Google Data Analytics.\n3. **Add Projects**: Make sure you have at least 2 complete, full-stack projects on your resume with GitHub links.",
    "Your readiness score is a weighted index. To push it past 90, ensure your academic CGPA remains above 8.5, and you have completed at least one 3+ month internship. If you lack internships, build an open-source contribution portfolio!"
  ],
  skills: [
    "Currently, high-demand skills in placement tracks are: \n\n* **Backend**: Node.js/Express, Spring Boot, Java.\n* **Cloud & DevOps**: AWS, Docker containers, CI/CD pipelines.\n* **Database**: SQL Query optimization, PostgreSQL, MongoDB transactions.\n* **Algorithms**: Time & space complexity, HashMaps, Trees, Graphs.",
    "I suggest focusing on the T-shaped skill model. Be a master of one stack (e.g. Full-Stack JavaScript or Python Data Analytics) while retaining basic literacy in systems design and databases."
  ],
  resume: [
    "For resume suggestions:\n- Keep it strictly to **1 Page**.\n- Use the **XYZ formula** for projects: 'Accomplished [X], as measured by [Y], by doing [Z]'.\n- Put your technical skills section at the top below your header.\n- Highlight metrics: 'Optimized database load times by **35%**'.\n- Check your resume quality rating in the dashboard!",
    "Avoid generic summaries like 'Hardworking student looking for opportunities'. Instead, write a focused subtitle: 'Specialized Full-Stack Developer with hands-on React/Node.js experience'."
  ],
  interview: [
    "For interview prep, practice the **STAR Method** (Situation, Task, Action, Result) for behavioral questions.\n\nFor technical screening: \n- Explain your thought process *out loud* before writing any code.\n- Start with a brute force solution, and then optimize it to O(N) or O(log N).\n- Review fundamental networking, OS, and DBMS concepts.",
    "Mock interviews are crucial. Have a classmate or faculty review your pitch. Focus on communication clarity, active listening, and explaining your projects' technical trade-offs."
  ],
  summary: [
    "Students in the CSE and IT departments currently have the highest placement readiness average of 86%. The main gaps identified are in Advanced DevOps (Docker, CI/CD) and System Design. Recommended to conduct a special 3-day boot camp on Cloud Deployment.",
    "Our current dataset analysis reveals that students with CGPA >= 8.5 and at least 2 projects have a 94% selection rate. Focusing on project building will significantly increase our placement ratios."
  ],
  default: [
    "Hello! I am your AI Placement Readiness Advisor. I can assist with:\n- Strategies to improve your Placement Readiness Score.\n- Recommendations for technical skills, certifications, and courses.\n- Core resume suggestions and structural checklists.\n- Guidance on filtering eligible students (for faculty).\n- Standard interview prep workflows. How can I help you today?",
    "That is an excellent question! In placements, consistency is key. Ensure your LinkedIn profile is updated with your latest projects, write clean readmes, and continue sharpening your problem-solving foundations."
  ]
};

export async function sendMessageToChatbot(
  message: string,
  history: ChatMessage[],
  role: 'Faculty' | 'Placement Faculty' | 'Student'
): Promise<string> {
  try {
    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, role })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.reply) {
        return data.reply;
      }
    }
  } catch (error) {
    console.warn('Backend endpoint unavailable, falling back to local simulated response.');
  }

  // Simulated Career Advisor logic fallback
  await new Promise((resolve) => setTimeout(resolve, 600));
  
  const query = message.toLowerCase();
  let reply = '';

  if (query.includes('score') || query.includes('readiness') || query.includes('improve')) {
    reply = SIMULATED_RESPONSES.score[Math.floor(Math.random() * SIMULATED_RESPONSES.score.length)];
  } else if (query.includes('skill') || query.includes('course') || query.includes('learn') || query.includes('dsa')) {
    reply = SIMULATED_RESPONSES.skills[Math.floor(Math.random() * SIMULATED_RESPONSES.skills.length)];
  } else if (query.includes('resume') || query.includes('linkedin') || query.includes('cv')) {
    reply = SIMULATED_RESPONSES.resume[Math.floor(Math.random() * SIMULATED_RESPONSES.resume.length)];
  } else if (query.includes('interview') || query.includes('prepare') || query.includes('google') || query.includes('amazon')) {
    reply = SIMULATED_RESPONSES.interview[Math.floor(Math.random() * SIMULATED_RESPONSES.interview.length)];
  } else if ((role === 'Faculty' || role === 'Placement Faculty') && (query.includes('dataset') || query.includes('summary') || query.includes('performance'))) {
    reply = SIMULATED_RESPONSES.summary[Math.floor(Math.random() * SIMULATED_RESPONSES.summary.length)];
  } else {
    reply = SIMULATED_RESPONSES.default[Math.floor(Math.random() * SIMULATED_RESPONSES.default.length)];
  }

  return reply;
}
