import { MongoMemoryServer } from 'mongodb-memory-server';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Global setup for Jest tests
 * Starts MongoDB Memory Server before all tests run
 */
export default async function globalSetup() {
    console.log('\n🚀 Starting MongoDB Memory Server...\n');

    // Create MongoDB Memory Server instance
    const mongod = await MongoMemoryServer.create({
        binary: {
            version: '7.0.0', // Match your production MongoDB version
        },
    });

    const uri = mongod.getUri();

    // Store the URI and instance info for tests to use
    const mongoConfig = {
        uri,
        instanceInfo: mongod.instanceInfo,
    };

    // Write config to a temp file that tests can read
    const configPath = join(__dirname, 'mongo-config.json');
    writeFileSync(configPath, JSON.stringify(mongoConfig));

    // Store mongod instance globally for teardown
    (global as any).__MONGOD__ = mongod;

    console.log(`✅ MongoDB Memory Server started at: ${uri}\n`);
}
