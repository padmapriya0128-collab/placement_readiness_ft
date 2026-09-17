const Student = require("../models/Student");

exports.getDashboard = async (req, res) => {

    try {

        const students = await Student.find({
            faculty: req.user.id
        });

        const totalStudents = students.length;

        if (totalStudents === 0) {

            return res.status(200).json({

                success: true,

                dashboard: {

                    totalStudents: 0,
                    averageCGPA: 0,
                    averageReadinessScore: 0,
                    placementReadyStudents: 0,
                    almostReadyStudents: 0,
                    needsImprovementStudents: 0

                }

            });

        }

        const totalCGPA = students.reduce((sum, student) => sum + (student.cgpa || 0), 0);

        const totalScore = students.reduce((sum, student) => sum + (student.readinessScore || 0), 0);

        const placementReadyStudents = students.filter(
            student => student.placementStatus === "Placement Ready"
        ).length;

        const almostReadyStudents = students.filter(
            student => student.placementStatus === "Almost Ready"
        ).length;

        const needsImprovementStudents = students.filter(
            student => student.placementStatus === "Needs Improvement"
        ).length;

        return res.status(200).json({

            success: true,

            dashboard: {

                totalStudents,

                averageCGPA: Number((totalCGPA / totalStudents).toFixed(2)),

                averageReadinessScore: Number((totalScore / totalStudents).toFixed(2)),

                placementReadyStudents,

                almostReadyStudents,

                needsImprovementStudents

            }

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};