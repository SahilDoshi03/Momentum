import { unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Global teardown for Jest tests
 * Stops MongoDB Memory Server after all tests complete
 */
export default async function globalTeardown() {
    console.log('\n🛑 Stopping MongoDB Memory Server...\n');

    const mongod = (global as any).__MONGOD__;

    if (mongod) {
        await mongod.stop();
        console.log('✅ MongoDB Memory Server stopped\n');
    }

    // Clean up the config file
    try {
        const configPath = join(__dirname, 'mongo-config.json');
        unlinkSync(configPath);
    } catch (error) {
        // File might not exist, that's okay
    }
}
