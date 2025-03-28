const fs = require('fs');
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Configure rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later"
});
app.use(limiter);

// Enhanced CORS configuration
const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Additional headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Configure body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}
app.use('/uploads', express.static(uploadsDir));

// Database connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "communityvibe",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verify database connection
async function verifyDatabaseConnection() {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SELECT DATABASE() as db');
        console.log("Connected to MySQL database:", rows[0].db);
        connection.release();
    } catch (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
}
verifyDatabaseConnection();

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'event-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    cb(null, mimeType && extName);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
}).single("eventImage");

// Create Event Route - Updated version
app.post("/create-event", (req, res) => {
    upload(req, res, async (err) => {
        let uploadedFile = null;
        
        try {
            // Handle upload errors
            if (err) {
                if (err instanceof multer.MulterError) {
                    throw new Error(`File upload error: ${err.message}`);
                } else {
                    throw err;
                }
            }

            uploadedFile = req.file;

            // Validate input
            const {
                eventTitle: title,
                eventCategory: category,
                eventDate,
                startTime,
                endTime,
                venueName: venue,
                address,
                eventDescription: description
            } = req.body;

            if (!title || !category || !eventDate || !startTime || !endTime || !venue || !address) {
                throw new Error("All required fields must be provided");
            }

            // Create the event
            const [result] = await db.query(
                `INSERT INTO events 
                (title, category, event_date, start_time, end_time, venue, address, description, image) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, category, eventDate, startTime, endTime, venue, address, description, req.file?.filename || "default.jpg"]
            );

            // Successful response
            res.status(201).json({
                success: true,
                message: "Event created successfully",
                eventId: result.insertId
            });

        } catch (error) {
            // Clean up uploaded file if there was an error
            if (uploadedFile && fs.existsSync(path.join(uploadsDir, uploadedFile.filename))) {
                fs.unlinkSync(path.join(uploadsDir, uploadedFile.filename));
            }

            console.error('Error in create-event:', {
                message: error.message,
                stack: error.stack,
                body: req.body,
                file: req.file
            });

            const statusCode = error.message.includes("required fields") ? 400 : 500;
            
            res.status(statusCode).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    });
});

// Fetch Events Route
app.get("/events", async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT 
                id,
                title,
                category,
                DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
                TIME_FORMAT(start_time, '%H:%i') as start_time,
                TIME_FORMAT(end_time, '%H:%i') as end_time,
                venue,
                address,
                description,
                image,
                created_at
            FROM events 
            ORDER BY event_date DESC
        `);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch events",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uploadsDir: uploadsDir
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        body: req.body,
        file: req.file
    });
    
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Uploads directory:', uploadsDir);
});