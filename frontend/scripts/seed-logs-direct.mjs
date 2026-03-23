import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn('.env.local not found at', envPath);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not defined');
    process.exit(1);
}

// Inline Schema to avoid import issues
const AuditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actor_name: { type: String },
    action_type: { type: String },
    resource: { type: String },
    resource_id: { type: String },
    changes: { before: Object, after: Object },
    ip_address: { type: String },
    user_agent: { type: String }
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

async function main() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const logs = [
            {
                action_type: 'LOGIN',
                resource: 'Sistema',
                actor_id: new mongoose.Types.ObjectId(), // Fake ID
                actor_name: 'Administrador',
                ip_address: '127.0.0.1',
                user_agent: 'Chrome/SeedScript',
                timestamp: new Date()
            },
            {
                action_type: 'UPDATE',
                resource: 'Financeiro',
                resource_id: 'PAY-SEED-01',
                actor_name: 'Matheus Henrique',
                action_type: 'UPDATE',
                changes: {
                    before: { status: 'Aberto' },
                    after: { status: 'Pago' }
                },
                ip_address: '192.168.0.1',
                timestamp: new Date(Date.now() - 3600000)
            },
            {
                action_type: 'CREATE',
                resource: 'Registro',
                resource_id: 'REG-2024-JAN',
                actor_name: 'Sistema Automático',
                changes: {
                    after: { month: 1, year: 2024 }
                },
                ip_address: 'System',
                timestamp: new Date(Date.now() - 86400000)
            }
        ];

        await AuditLog.insertMany(logs);
        console.log(`Inserted ${logs.length} logs.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

main();
