const Student = require("../models/Student");
const { calculatePlacementScore } = require("../utils/scoreCalculator");

exports.analyzeStudent = async (req, res) => {

    try {

        const student = await Student.findById(req.user.id);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found."
            });

        }

        const result = calculatePlacementScore(student);

        student.readinessScore = result.readinessScore;
        student.placementStatus = result.placementStatus;
        student.strengths = result.strengths;
        student.weaknesses = result.weaknesses;
        student.recommendations = result.recommendations;

        await student.save();

        return res.status(200).json({

            success: true,

            message: "Placement analysis completed successfully.",

            analysis: result

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};