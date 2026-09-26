const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const prisma = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
    cors({
        origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    })
);

// Request parsing
app.use(express.json());

// Logging
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Root
app.get("/", (req, res) => {
    res.json({
        name: "Dhaka Tesla Pool API",
        health: "/health",
        api: "/api",
    });
});

// Health check
app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: "ok",
            database: "ok",
        });
    } catch {
        res.status(503).json({
            status: "degraded",
            database: "unavailable",
        });
    }
});

// Authentication routes
app.use("/api/auth", authRoutes);

// 404 handler
app.use((req, res) => { res.status(404).json({ error: "Route not found", }); });

// Global error handler
app.use(errorHandler);

// Start server
if (require.main === module) {
    app.listen(env.PORT, () => {
        console.log(
            `Dhaka Tesla Pool API listening on port ${env.PORT}`
        );
    });
}
module.exports = app;