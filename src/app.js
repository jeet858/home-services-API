const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");

const connectDB = require("./database/mongodb.database");
const { logger, stream, logRequest } = require("./utils/logger.util");
const { createErrorHandler, NotFoundError } = require("./utils/error.util");

const authRoutes = require("./routes/auth.route.js");
const userRoutes = require("./routes/user.route.js");
const addressRoutes = require("./routes/address.route.js");
const serviceRoutes = require("./routes/service.route.js");
const adminRoutes = require("./routes/admin.route.js");
const subserviceRoutes = require("./routes/subservice.route.js");
const bookingRoutes = require("./routes/booking.route.js");
const ratingRoutes = require("./routes/rating.route.js");
const serviceProviderRoutes = require("./routes/serviceProvider.route.js");

// Load environment variables
dotenv.config();

const app = express();

// Connect database
connectDB()
  .then(() => {
    logger.info("✅ Database connected successfully");
  })
  .catch((err) => {
    logger.error("❌ Database connection failed:", err);
  });

// Security middleware
app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || []
        : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Compression
app.use(compression());

// Logging
app.use(logRequest);
app.use(morgan("combined", { stream }));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subservice", subserviceRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/service-providers", serviceProviderRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global error handler
app.use(createErrorHandler(logger));

// Export Express app for Vercel
module.exports = app;