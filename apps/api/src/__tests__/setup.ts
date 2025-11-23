import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Setup file that runs before each test file
 * Connects to MongoDB Memory Server
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-for-testing';

// Read MongoDB URI from config file created by globalSetup
const configPath = join(__dirname, 'mongo-config.json');
const mongoConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
process.env.MONGODB_URI = mongoConfig.uri;

// Connect to MongoDB before each test file
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoConfig.uri);
    }
});

// Clear all collections after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Disconnect after each test file
afterAll(async () => {
    await mongoose.connection.close();
});
