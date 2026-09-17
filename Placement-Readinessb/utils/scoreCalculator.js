exports.calculatePlacementScore = (student) => {

    let score = 0;

    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    // CGPA (25 Marks)
    if (student.cgpa >= 9) {
        score += 25;
        strengths.push("Excellent CGPA");
    } else if (student.cgpa >= 8) {
        score += 20;
        strengths.push("Good CGPA");
    } else if (student.cgpa >= 7) {
        score += 15;
    } else {
        weaknesses.push("Low CGPA");
        recommendations.push("Improve academic performance.");
    }

    // Skills (30 Marks)
    const skills = student.skills || [];

    if (skills.length >= 5) {
        score += 30;
        strengths.push("Strong technical skills");
    } else if (skills.length >= 3) {
        score += 20;
        strengths.push("Good technical skills");
    } else if (skills.length >= 1) {
        score += 10;
    } else {
        weaknesses.push("Insufficient technical skills");
        recommendations.push("Learn Python, SQL, Java, React or other in-demand skills.");
    }

    // Projects (20 Marks)
    if (student.projects >= 3) {
        score += 20;
        strengths.push("Excellent project experience");
    } else if (student.projects >= 1) {
        score += 10;
    } else {
        weaknesses.push("No projects");
        recommendations.push("Build at least 2-3 real-world projects.");
    }

    // Internships (15 Marks)
    if (student.internships >= 2) {
        score += 15;
        strengths.push("Industry experience");
    } else if (student.internships >= 1) {
        score += 10;
    } else {
        weaknesses.push("No internship experience");
        recommendations.push("Complete an internship.");
    }

    // Certifications (10 Marks)
    if (student.certifications >= 3) {
        score += 10;
    } else if (student.certifications >= 1) {
        score += 5;
    } else {
        weaknesses.push("No certifications");
        recommendations.push("Earn certifications from Coursera, Google, Microsoft, etc.");
    }

    let placementStatus = "Needs Improvement";

    if (score >= 80) {
        placementStatus = "Placement Ready";
    } else if (score >= 60) {
        placementStatus = "Almost Ready";
    }

    return {
        readinessScore: score,
        placementStatus,
        strengths,
        weaknesses,
        recommendations
    };
};