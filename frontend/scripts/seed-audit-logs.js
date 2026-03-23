import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Define Schema inline
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

async function seedLogs() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not found in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const logs = [
            {
                action_type: 'LOGIN',
                resource: 'Sistema',
                actor_name: 'Sistema Admin',
                ip_address: '127.0.0.1',
                user_agent: 'System Seeder',
                timestamp: new Date()
            },
            {
                action_type: 'UPDATE',
                resource: 'Pagamentos',
                resource_id: 'PAY-SAMPLE',
                actor_name: 'Matheus Henrique',
                changes: {
                    before: { status: 'PENDING', amount: 5000 },
                    after: { status: 'PAID', amount: 5000 }
                },
                ip_address: '10.0.0.5',
                timestamp: new Date(Date.now() - 1000 * 60 * 60)
            }
        ];

        await AuditLog.insertMany(logs);
        console.log('Successfully seeded sample audit logs');

    } catch (error) {
        console.error('Error seeding logs:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedLogs();
