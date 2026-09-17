const multer = require("multer");

// Store uploaded file in memory
const storage = multer.memoryStorage();

// Accept only Excel files
const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only Excel files (.xlsx, .xls) are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;