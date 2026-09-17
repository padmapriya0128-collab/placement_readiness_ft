const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const XLSX = require("xlsx");


// ==========================================
// GET FACULTY PROFILE
// ==========================================

exports.getProfile = async (req, res) => {

    try {

        const faculty = await Faculty.findById(req.user.id)
            .select("-password");


        if (!faculty) {

            return res.status(404).json({
                success:false,
                message:"Faculty not found."
            });

        }


        return res.status(200).json({

            success:true,

            faculty

        });


    } catch(error) {


        return res.status(500).json({

            success:false,

            message:error.message

        });

    }

};



// ==========================================
// GET ALL STUDENTS
// ==========================================

exports.getStudents = async(req,res)=>{


    try{


        const students = await Student.find({

            faculty:req.user.id

        }).select("-password");



        return res.status(200).json({

            success:true,

            totalStudents:students.length,

            students

        });



    }catch(error){


        return res.status(500).json({

            success:false,

            message:error.message

        });


    }


};




// ==========================================
// UPLOAD DATASET
// ==========================================

exports.uploadDataset = async(req,res)=>{


    try{


        if(!req.file){


            return res.status(400).json({

                success:false,

                message:"Please upload an Excel file."

            });


        }



        const workbook = XLSX.read(req.file.buffer,{

            type:"buffer"

        });



        const sheet = workbook.Sheets[workbook.SheetNames[0]];



        const data = XLSX.utils.sheet_to_json(sheet);



        if(data.length === 0){

            return res.status(400).json({

                success:false,

                message:"Excel file is empty."

            });

        }



        let insertedStudents=[];



        for(const row of data){



            // Debug uploaded column names
            console.log(row);



            const student = await Student.create({


                // Supports multiple column names
                fullName:
                    row["Full Name"] ||
                    row["fullName"] ||
                    row["Name"] ||
                    row["name"],



                registerNumber:
                    row["Register Number"] ||
                    row["registerNumber"] ||
                    row["Student ID"],



                username:
                    row["Register Number"] ||
                    row["registerNumber"],



                password:
                    row["Register Number"] ||
                    row["registerNumber"] ||
                    "123456",



                email:
                    row["Email"] ||
                    row["email"] ||
                    "",



                phone:
                    row["Phone"] ||
                    row["phone"] ||
                    "",



                department:
                    row["Department"] ||
                    row["department"] ||
                    "",



                year:
                    row["Year"] ||
                    row["year"] ||
                    "",



                section:
                    row["Section"] ||
                    row["section"] ||
                    "",



                cgpa:
                    row["CGPA"] ||
                    row["cgpa"] ||
                    0,



                skills:

                    row["Skills"] || row["skills"]

                    ?

                    String(row["Skills"] || row["skills"])
                    .split(",")
                    .map(skill=>skill.trim())

                    :

                    [],



                projects:
                    row["Projects"] || 0,



                certifications:
                    row["Certifications"] || 0,



                internships:
                    row["Internships"] || 0,



                faculty:req.user.id


            });



            insertedStudents.push(student);


        }




        return res.status(201).json({


            success:true,


            message:"Dataset Uploaded Successfully",


            totalStudents:insertedStudents.length


        });



    }catch(error){


        console.log(error);



        return res.status(500).json({


            success:false,


            message:error.message


        });


    }


};