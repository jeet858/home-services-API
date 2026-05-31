const mongoose = require("mongoose");
const databaseConfig = require("../config/database.config");
const { logger } = require("../utils/logger.util");
const { DatabaseError } = require("../utils/error.util");

let cached = null;

const connectDB = async () => {
    if (cached && mongoose.connection.readyState === 1) {
        return cached;
    }

    const db = `mongodb+srv://${encodeURIComponent(databaseConfig.database_user)}:${encodeURIComponent(databaseConfig.database_password)}@cluster0.ieottwj.mongodb.net/${databaseConfig.database_name}?retryWrites=true&w=majority`;

    try {
        logger.info('Attempting to connect to MongoDB', {
            database: databaseConfig.database_name,
            user: databaseConfig.database_user
        });

        cached = await mongoose.connect(db, {
            serverSelectionTimeoutMS: 5000
        });

        logger.info('Database connected successfully');
        return cached;
    } catch (err) {
        logger.error('Database connection failed', {
            error: err.message,
            code: err.code,
            name: err.name
        });

        throw new DatabaseError(`Failed to connect to database: ${err.message}`);
    }
};

module.exports = connectDB;
