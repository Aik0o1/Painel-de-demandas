import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// import dotenv from 'dotenv'; // Removed dependency
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

// Manual env parsing to avoid dotenv dependency issues if not installed
// Manual env parsing to avoid dotenv dependency issues if not installed
let MONGODB_URI = process.env.MONGODB_URI;

const envFiles = [path.join(__dirname, '../.env.local'), path.join(__dirname, '../.env')];

for (const envPath of envFiles) {
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
}

// User Schema (simplified)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: { type: String, default: 'user' },
    status: { type: String, default: 'active' },
    passwordHash: { type: String, required: true },
    sector_id: { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createUser() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to DB');

        const email = 'matheushsc1999@gmail.com';
        const password = 'password123';
        const name = 'Matheus Henrique Sales Carvalho';

        const existing = await User.findOne({ email });
        if (existing) {
            console.log('⚠️ User already exists. Updating password...');
            const hash = await bcrypt.hash(password, 10);
            existing.passwordHash = hash;
            existing.name = name;
            existing.role = 'admin'; // Grant admin for convenience
            await existing.save();
            console.log('✅ User updated successfully!');
        } else {
            const hash = await bcrypt.hash(password, 10);
            await User.create({
                name,
                email,
                passwordHash: hash,
                role: 'admin',
                status: 'active'
            });
            console.log('✅ User created successfully!');
        }

        console.log('------------------------------------------------');
        console.log('Login credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('------------------------------------------------');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error creating user:', error);
    }
}

createUser();
