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

import { v4 as uuidv4 } from 'uuid';

// Connect to MongoDB before each test file
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        // Use a unique database for each test file to prevent interference
        const dbName = `test-${uuidv4()}`;
        // Ensure URI ends with / before appending db name, or replace existing db name
        // MongoMemoryServer URI usually ends with /
        // Insert dbName before query parameters if they exist
        const [baseUrl, queryString] = mongoConfig.uri.split('?');
        const separator = baseUrl.endsWith('/') ? '' : '/';
        const uri = `${baseUrl}${separator}${dbName}${queryString ? `?${queryString}` : ''}`;

        await mongoose.connect(uri);
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
