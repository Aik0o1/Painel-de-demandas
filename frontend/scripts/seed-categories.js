import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
}
const client = new MongoClient(uri);

async function seedCategories() {
    try {
        await client.connect();
        const db = client.db('demandas'); // Adjust if database name differs in string
        const collection = db.collection('budgetcategories');

        const defaults = [
            { name: 'Diárias Civis', total_allocated: 50000, type: 'variable', year: 2026, updatedAt: new Date() },
            { name: 'Passagens Aéreas', total_allocated: 80000, type: 'variable', year: 2026, updatedAt: new Date() },
            { name: 'Material de Consumo', total_allocated: 30000, type: 'variable', year: 2026, updatedAt: new Date() },
            { name: 'Contratos de Serviço', total_allocated: 1200000, type: 'fixed', year: 2026, updatedAt: new Date() }
        ];

        for (const cat of defaults) {
            const exists = await collection.findOne({ name: cat.name });
            if (!exists) {
                await collection.insertOne(cat);
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Category exists: ${cat.name}`);
            }
        }

    } finally {
        await client.close();
    }
}

seedCategories().catch(console.error);
