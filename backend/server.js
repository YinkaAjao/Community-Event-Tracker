require("dotenv").config();
console.log("DB Config:");
console.log("Host:", process.env.DB_HOST);
console.log("User:", process.env.DB_USER);
console.log("Database:", process.env.DB_NAME);
console.log("Port:", process.env.PORT);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed: ", err);
        return;
    }
    console.log("Connected to MySQL database");
});

const eventRoutes = require("./routes/events");
app.use("/events", eventRoutes);

app.get("/", (req, res) => {
    res.send("Community Events Tracker API Running...");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
