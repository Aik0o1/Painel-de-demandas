
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual env parsing to avoid dotenv dependency issues
let MONGODB_URI = process.env.MONGODB_URI;

// Navigate up from scripts/ to root
const rootDir = path.join(__dirname, '..');
const envFiles = [path.join(rootDir, '.env.local'), path.join(rootDir, '.env')];

for (const envPath of envFiles) {
    if (!MONGODB_URI && fs.existsSync(envPath)) {
        try {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            for (const line of envConfig.split('\n')) {
                const [key, ...valueParts] = line.split('=');
                if (key && key.trim() === 'MONGODB_URI') {
                    MONGODB_URI = valueParts.join('=').trim().replace(/"/g, '');
                    break;
                }
            }
        } catch (err) {
            console.warn(`Failed to read ${envPath}:`, err.message);
        }
    }
}

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['MASTER_ADMIN', 'ADMIN', 'USER'], default: 'USER' },
    status: { type: String, default: 'ACTIVE' },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedAdmin() {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not defined in .env.local or .env');
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
            console.log('Connected to MongoDB.');
        }

        const count = await User.countDocuments();
        console.log(`Current user count: ${count}`);

        const adminEmail = 'admin@jucepi.pi.gov.br';

        if (count === 0) {
            console.log('No users found. Creating Rescue Admin...');

            const hashedPassword = await bcrypt.hash('admin123', 10);

            const adminUser = new User({
                name: 'Rescue Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'MASTER_ADMIN',
                status: 'ACTIVE'
            });

            await adminUser.save();
            console.log('✅ Rescue Admin created successfully!');
            console.log(`Email: ${adminEmail}`);
            console.log('Password: admin123');
        } else {
            console.log('Users already exist. Checking for admin...');
            const existingAdmin = await User.findOne({ email: adminEmail });

            if (!existingAdmin) {
                console.log(`⚠️ Rescue Admin (${adminEmail}) NOT found.`);
                console.log('Creating specific admin anyway to ensure access...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const adminUser = new User({
                    name: 'Rescue Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'MASTER_ADMIN',
                    status: 'ACTIVE'
                });
                await adminUser.save();
                console.log('✅ Rescue Admin created.');
            } else {
                console.log('✅ Rescue Admin already exists. Updating password just in case...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                existingAdmin.password = hashedPassword;
                existingAdmin.role = 'MASTER_ADMIN'; // Ensure role
                await existingAdmin.save();
                console.log('✅ Rescue Admin password reset to: admin123');
            }
        }
    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seedAdmin();
