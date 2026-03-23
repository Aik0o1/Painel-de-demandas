
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

// Define User Schema inline matching the actual application standard found in src/models/User.js
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }, // IMPORTANT: Real schema uses passwordHash
    role: { type: String, default: 'admin' },
    status: { type: String, default: 'active' },
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function fixMyAccount() {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not defined in .env.local or .env');
        }

        console.log('Connecting to MongoDB...');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
        }
        console.log('✅ Connected.');

        const targetEmail = 'matheushsc1999@gmail.com';
        const newPasswordRaw = 'jucepi123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPasswordRaw, salt);

        // Fields to enforce
        const updates = {
            name: "Henrique Carvalho",
            passwordHash: hashedPassword, // Matches schema
            role: 'admin', // Matches user request and schema default style
            status: 'active',
            isActive: true, // Legacy support
            updatedAt: new Date()
        };

        console.log(`Searching for user: ${targetEmail}...`);

        const user = await User.findOneAndUpdate(
            { email: targetEmail },
            { $set: updates },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (user) {
            console.log('----------------------------------------------------');
            console.log(`✅ SUCESSO: Conta ${targetEmail} recuperada/criada.`);
            console.log(`🔑 Nova Senha: ${newPasswordRaw}`);
            console.log(`🛡️ Role: ${user.role}`);
            console.log(`🚦 Status: ${user.status}`);
            console.log('----------------------------------------------------');
        } else {
            console.error('❌ Falha ao atualizar/criar usuário (Retorno nulo).');
        }

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

fixMyAccount();
