const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not defined in .env.local');
    // process.exit(1); 
    // Fallback? No, just exit.
}

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
                actor_id: new mongoose.Types.ObjectId(),
                actor_name: 'Seed Admin',
                ip_address: '127.0.0.1',
                user_agent: 'SeedScript/1.0',
                timestamp: new Date()
            },
            {
                action_type: 'UPDATE',
                resource: 'Financeiro',
                resource_id: 'PAY-SEED-02',
                actor_name: 'Usuário Teste',
                changes: {
                    before: { status: 'Pendente' },
                    after: { status: 'Pago', amount: 350.00 }
                },
                ip_address: '10.0.0.15',
                timestamp: new Date(Date.now() - 7200000)
            }
        ];

        await AuditLog.insertMany(logs);
        console.log('Seeded logs successfully via CJS.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
