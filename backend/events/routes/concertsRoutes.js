const express = require("express");
const router = express.Router();
const { saveConcerts } = require("../controllers/concertsController");

router.get("/sync", saveConcerts); // /concerts/sync?country=GB&date=2025-12-03

module.exports = router;
