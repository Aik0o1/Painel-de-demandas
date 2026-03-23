import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    status: String,
    passwordHash: String
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUser() {
    if (!MONGODB_URI) { console.log('No Mongo URI'); return; }
    try {
        await mongoose.connect(MONGODB_URI);
        const email = 'matheushsc1999@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('--- USER FOUND ---');
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`Status: ${user.status}`);
            console.log(`Hash Info: ${user.passwordHash ? 'Present (' + user.passwordHash.substring(0, 10) + '...)' : 'MISSING'}`);
            console.log('------------------');
        } else {
            console.log('--- USER NOT FOUND ---');
        }
        await mongoose.disconnect();
    } catch (e) { console.error(e); }
}

checkUser();
