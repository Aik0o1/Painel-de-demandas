import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

// Manual env parsing
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI && fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        if (key && key.trim() === 'MONGODB_URI') {
            MONGODB_URI = valueParts.join('=').trim().replace(/"/g, '');
            break;
        }
    }
}

// Minimal User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    updatedAt: Date
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUsers() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing');
        process.exit(1);
    }

    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGODB_URI);

        const users = await User.find({}).sort({ updatedAt: -1 });

        console.log(`\n✅ Found ${users.length} user(s) in the database:\n`);

        users.forEach(u => {
            console.log(`- ID: ${u._id}`);
            console.log(`  Name: ${u.name}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Role: ${u.role}`);
            console.log(`  Last Update: ${u.updatedAt}`);
            console.log('---');
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error reading database:', error);
    }
}

checkUsers();
