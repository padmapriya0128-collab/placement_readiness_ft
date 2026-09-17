const express = require("express");
const router = express.Router();
const datasetController = require("../controllers/datasetController");

router.get("/", datasetController.getDatasets);
router.post("/", datasetController.uploadDataset);

module.exports = router;
