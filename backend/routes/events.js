const express = require("express");
const router = express.Router();
const db = require("../db"); // Ensure you have a separate DB connection file

// 📌 Create a new event (POST /events)
router.post("/", (req, res) => {
    const { title, description, date, location } = req.body;
    if (!title || !date || !location) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    const sql = "INSERT INTO events (title, description, date, location) VALUES (?, ?, ?, ?)";
    db.query(sql, [title, description, date, location], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Event created successfully", eventId: result.insertId });
    });
});

// 📌 Get all events (GET /events)
router.get("/", (req, res) => {
    const sql = "SELECT * FROM events";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 📌 Update an event (PUT /events/:id)
router.put("/:id", (req, res) => {
    const { title, description, date, location } = req.body;
    const { id } = req.params;

    const sql = "UPDATE events SET title = ?, description = ?, date = ?, location = ? WHERE id = ?";
    db.query(sql, [title, description, date, location, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Event updated successfully" });
    });
});

// 📌 Delete an event (DELETE /events/:id)
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM events WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Event deleted successfully" });
    });
});

module.exports = router;
