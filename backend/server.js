const fs = require('fs');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
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
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

// Ensure the `events` table exists
async function ensureEventsTableExists() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                event_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME,
                venue VARCHAR(255) NOT NULL,
                address VARCHAR(255),
                description TEXT NOT NULL,
                image VARCHAR(255) DEFAULT 'default.jpg',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.query(createTableQuery);
        console.log("✅ Ensured `events` table exists.");
    } catch (err) {
        console.error("❌ Failed to ensure `events` table exists:", err.message);
        process.exit(1);
    }
}

// Ensure the `users` table exists
async function ensureUsersTableExists() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.query(createTableQuery);
        console.log("✅ Ensured `users` table exists.");
    } catch (err) {
        console.error("❌ Failed to ensure `users` table exists:", err.message);
        process.exit(1);
    }
}

// Ensure the `user_categories` table exists
async function ensureUserCategoriesTableExists() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS user_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE KEY unique_user_category (user_id, category)
            );
        `;
        await db.query(createTableQuery);
        console.log("✅ Ensured `user_categories` table exists.");
    } catch (err) {
        console.error("❌ Failed to ensure `user_categories` table exists:", err.message);
        process.exit(1);
    }
}

// Ensure the `notifications` table exists
async function ensureNotificationsTableExists() {
    try {
        // First drop the existing table if it exists
        const dropTableQuery = `DROP TABLE IF EXISTS notifications;`;
        await db.query(dropTableQuery);
        console.log("✅ Dropped existing notifications table if it existed.");

        // Create the table with all required fields including category
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                \`read\` BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await db.query(createTableQuery);
        console.log("✅ Created new notifications table with category field.");
    } catch (err) {
        console.error("❌ Failed to ensure notifications table exists:", err.message);
        process.exit(1);
    }
}

// Initialize database
async function initializeDatabase() {
    await verifyDatabaseConnection();
    await ensureEventsTableExists();
    await ensureUsersTableExists();
    await ensureUserCategoriesTableExists();
    await ensureNotificationsTableExists();
}

initializeDatabase();

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

// Create Event Route
app.post("/create-event", (req, res) => {
    upload(req, res, async (err) => {
        let uploadedFile = null;
        let connection;
        
        try {
            // Handle upload error check
            if (err) {
                if (err instanceof multer.MulterError) {
                    throw new Error(`File upload error: ${err.message}`);
                } else {
                    throw err;
                }
            }

            uploadedFile = req.file;
            connection = await db.getConnection();
            await connection.beginTransaction();

            // Get request body data
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

            // Validate required fields
            if (!title || !category || !eventDate || !startTime || !venue || !description) {
                throw new Error("All required fields must be provided");
            }

            // 1. Create the event
            const [eventResult] = await connection.query(
                `INSERT INTO events 
                (title, category, event_date, start_time, end_time, venue, address, description, image) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, category, eventDate, startTime, endTime, venue, address, description, req.file?.filename || "default.jpg"]
            );

            // 2. Find users who are interested in this category
            const [interestedUsers] = await connection.query(
                `SELECT DISTINCT u.id 
                 FROM users u 
                 INNER JOIN user_categories uc ON u.id = uc.user_id 
                 WHERE LOWER(uc.category) = LOWER(?)`,
                [category]
            );

            // 3. Create notifications for interested users
            if (interestedUsers.length > 0) {
                const notificationValues = interestedUsers.map(user => [
                    user.id,
                    `New ${category} Event`,
                    `A new ${category} event "${title}" has been added`,
                    category,
                    false,
                    new Date()
                ]);

                const [notificationResult] = await connection.query(
                    `INSERT INTO notifications 
                    (user_id, title, message, category, \`read\`, created_at) 
                    VALUES ?`,
                    [notificationValues]
                );

                console.log(`✅ Created ${notificationResult.affectedRows} notifications`);
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: "Event created successfully",
                eventId: eventResult.insertId,
                notificationsCreated: interestedUsers.length
            });

        } catch (error) {
            if (connection) await connection.rollback();
            
            if (uploadedFile && fs.existsSync(path.join(uploadsDir, uploadedFile.filename))) {
                fs.unlinkSync(path.join(uploadsDir, uploadedFile.filename));
            }

            console.error('Error creating event:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    });
});

// Fetch Events Route
app.get("/events", async (req, res) => {
    try {
        const userId = req.query.userId;
        let userCategories = [];

        // If userId provided, get their interests
        if (userId) {
            const [categories] = await db.query(
                "SELECT category FROM user_categories WHERE user_id = ?",
                [userId]  
            );
            userCategories = categories.map(c => c.category);
        }

        // Modify query based on whether user has any categories
        const query = `
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
                created_at,
                ${userCategories.length > 0 ? 
                    `CASE 
                        WHEN category IN (${userCategories.map(() => '?').join(',')}) THEN 1 
                        ELSE 0 
                    END`
                    : '0'
                } as interest_match
            FROM events 
            ORDER BY interest_match DESC, event_date ASC
        `;
        
        const [results] = await db.query(query, userCategories);
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch events"
        });
    }
});

// User Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];
        
        // In a real app, you would hash and compare the password here
        // For demo purposes, we'll do a simple comparison (NOT RECOMMENDED for production)
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        
        // Create a safe user object (without password)
        const safeUser = {
            id: user.id,
            username: user.username,
            email: user.email
        };
        
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: safeUser
        });
    } catch (error) {
        console.error('Error in user login:', {
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            message: "Failed to log in",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// User Registration Route
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email, and password are required"
            });
        }
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Check if user already exists
        const [existingUsers] = await db.query(
            "SELECT * FROM users WHERE email = ? OR username = ?",
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User with this email or username already exists"
            });
        }

        // In a real app, you would hash the password here
        // For demo purposes, we'll store it as is (NOT RECOMMENDED for production)
        
        // Create the user
        const [result] = await db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, password]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error in user registration:', {
            message: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: "Failed to register user",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Save user categories
app.post("/user-categories", async (req, res) => {
    try {
        const { userId, categories } = req.body;
        
        if (!userId || !Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request data"
            });
        }

        // Delete existing categories for user
        await db.query("DELETE FROM user_categories WHERE user_id = ?", [userId]);

        // Insert new categories
        for (const category of categories) {
            await db.query(
                "INSERT INTO user_categories (user_id, category) VALUES (?, ?)",
                [userId, category]
            );
        }

        res.status(200).json({
            success: true,
            message: "Categories updated successfully"
        });
    } catch (error) {
        console.error('Error updating user categories:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update categories",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user categories
app.get("/user-categories/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const [results] = await db.query(
            "SELECT category FROM user_categories WHERE user_id = ?",
            [userId]
        );

        res.json({
            success: true,
            data: results.map(row => row.category)
        });
    } catch (error) {
        console.error('Error fetching user categories:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
});

// Get notifications for a user
app.get("/notifications/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const [notifications] = await db.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [userId]
        );
        
        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
});

// Mark a notification as read
app.put("/notifications/:notificationId/read", async (req, res) => {
    try {
        const { notificationId } = req.params;
        await db.query(
            "UPDATE notifications SET `read` = TRUE WHERE id = ?",
            [notificationId]
        );
        
        res.json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update notification"
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
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Uploads directory:', uploadsDir);
});