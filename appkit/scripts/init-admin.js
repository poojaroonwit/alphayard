const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });


async function main() {
    const prisma = new PrismaClient();
    const email = 'admin@example.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 12);
    
    try {
        const admins = await prisma.adminUser.findMany();
        console.log(`There are ${admins.length} admin users in the database.`);
        console.log(`Current admins:`, admins.map(a => a.email));

        const admin = await prisma.adminUser.upsert({
            where: { email },
            update: { passwordHash, isSuperAdmin: true, isActive: true },
            create: { email, name: 'Super Admin', passwordHash, isSuperAdmin: true, isActive: true }
        });
        
        console.log('Admin user ensured:', admin.email, 'password:', password);
    } catch (e) {
        console.error('Error ensuring admin user:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
