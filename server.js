
require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001; // Use PORT from .env or default to 5000
const CLIENT_ORIGIN = process.env.REACT_APP_CLIENT_ORIGIN || "http://localhost:3000"; // Use CLIENT_ORIGIN from .env or default to localhost:3000

// Enable CORS for the specified origin
const allowedOrigins = [
    "http://localhost:5003", // Development frontend
    "http://localhost:5002", // Development frontend
    "http://localhost:3000", // Development frontend
    "https://wedease.netlify.app", // Production frontend
    CLIENT_ORIGIN
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
}));

// Allowed folders for uploads
const ALLOWED_FOLDERS = ["vendors", "albums", "profile"];

// Set up storage for multer
const fs = require("fs");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.query.folder || "default"; // Get folder from query parameter
        console.log(`Requested folder: ${folder}`); // Debugging log
        if (!ALLOWED_FOLDERS.includes(folder)) {
            return cb(new Error("Invalid folder specified"));
        }
        const uploadPath = path.join(__dirname, `public/uploads/${folder}`);
        console.log(`Upload path: ${uploadPath}`); // Debugging log

        // Create the folder if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            console.log(`Creating folder: ${uploadPath}`); // Debugging log
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath); // Save files to the specified folder
    },
    filename: (req, file, cb) => {
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize file name
        console.log(`Sanitized file name: ${sanitizedFileName}`); // Debugging log
        cb(null, sanitizedFileName);
    },
});



const upload = multer({ storage });
app.get("/", (req, res) => {
    res.send("Server is running!");
});
app.post("/upload", upload.array("images", 3), (req, res) => {
    try {
        console.log("Files received:", req.files); // Debugging log
        const folder = req.query.folder || "default";
        const filePaths = req.files.map((file) => `/uploads/${folder}/${file.filename}`);
        console.log("File paths:", filePaths); // Debugging log
        res.status(200).json({ message: "Files uploaded successfully", filePaths });
    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({ message: "Failed to upload files" });
    }
});

// Serve static files from the public folder
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



