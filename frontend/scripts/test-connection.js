import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        if (key && key.trim() === 'MONGODB_URI') {
            MONGODB_URI = valueParts.join('=').trim().replace(/"/g, ''); // remove quotes if any
            break;
        }
    }
}

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env');
    process.exit(1);
}

console.log('Testing connection...');

async function testConnection() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connection successful!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();
