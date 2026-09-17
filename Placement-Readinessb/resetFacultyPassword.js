const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Faculty = require("./models/Faculty");

async function resetFacultyPassword() {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected");

        const newPassword = "faculty123";

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await Faculty.updateOne(

            { email: "padma@gmail.com" },

            {
                $set: {
                    password: hashedPassword
                }
            }

        );

        console.log(result);

        console.log("Password Reset Successfully");
        console.log("New Password : faculty123");

        process.exit();

    } catch (error) {

        console.log(error);

        process.exit(1);

    }


}
console.log(require.resolve("./models/Faculty"));

resetFacultyPassword();