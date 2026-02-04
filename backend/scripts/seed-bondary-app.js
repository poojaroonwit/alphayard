const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bondarys',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
};

if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
}

const pool = new Pool(poolConfig);

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🚀 Seeding Bondarys App (Unified Version)...');

        // 1. Create Bondary App
        const appRes = await client.query(`
            INSERT INTO public.applications (name, slug, description, branding, settings, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (slug) DO UPDATE SET 
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                branding = EXCLUDED.branding,
                updated_at = NOW()
            RETURNING id;
        `, [
            'Bondary',
            'bondary',
            'Main Bondary mobile and web application',
            JSON.stringify({
                primaryColor: '#0d7eff',
                secondaryColor: '#0066e6',
                logo: 'https://cdn-icons-png.flaticon.com/512/3665/3665922.png',
                welcomeBackgroundImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop',
                loginBackgroundImage: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2029&auto=format&fit=crop',
                homeBackgroundImage: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop',
                primaryFont: 'Inter',
                secondaryFont: 'Inter'
            }),
            JSON.stringify({
                allowRegistration: true,
                requireEmailVerification: false,
                componentStyles: {
                    categories: [
                        { id: 'buttons', name: 'Buttons', icon: 'buttons', components: [
                            { id: 'primary', name: 'Primary Button', styles: { backgroundColor: { mode: 'solid', solid: '#0d7eff' }, textColor: { mode: 'solid', solid: '#FFFFFF' }, borderRadius: 12, shadowLevel: 'sm' } }
                        ]},
                        { id: 'cards', name: 'Cards', icon: 'cards', components: [
                            { id: 'default', name: 'Default Card', styles: { backgroundColor: { mode: 'solid', solid: 'rgba(255, 255, 255, 0.9)' }, textColor: { mode: 'solid', solid: '#1f2937' }, borderRadius: 16, shadowLevel: 'md' } }
                        ]}
                    ]
                }
            }),
            true
        ]);

        const appId = appRes.rows[0].id;
        console.log(`✅ Bondarys App seeded with ID: ${appId}`);

        // 2. Create a test user
        const userId = 'f739edde-45f8-4aa9-82c8-c1876f434683'; // Fixed ID for testing
        await client.query(`
            INSERT INTO users (id, email, first_name, last_name, is_active, is_onboarding_complete)
            VALUES ($1, $2, $3, $4, true, true)
            ON CONFLICT (id) DO UPDATE SET 
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name
        `, [userId, 'test@example.com', 'Test', 'User']);
        console.log(`✅ Test user created.`);

        // 3. Create a default circle as an ENTITY
        const circleRes = await client.query(`
            INSERT INTO unified_entities (type, owner_id, application_id, status, data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [
            'circle', 
            userId, 
            appId, 
            'active', 
            JSON.stringify({ name: 'Bondarys Home', description: 'Our family home circle' })
        ]);

        const circleId = circleRes.rows[0].id;
        console.log(`✅ Default circle entity created with ID: ${circleId}`);

        // 4. Create membership relation
        await client.query(`
            INSERT INTO entity_relations (source_id, target_id, relation_type, metadata)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
        `, [userId, circleId, 'member_of', JSON.stringify({ role: 'owner' })]);
        console.log(`✅ Membership relation created.`);

        // 5. Create app_settings for global branding (used by AppConfigController)
        await client.query(`
            INSERT INTO app_settings (key, value, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (key) DO UPDATE SET 
                value = EXCLUDED.value,
                updated_at = NOW()
        `, [
            'branding',
            JSON.stringify({
                appName: 'Bondarys',
                primaryColor: '#FA7272',
                secondaryColor: '#FFD700',
                logoUrl: '/assets/logo.png',
                logoWhiteUrl: '/assets/logo-white.png'
            }),
            'Global application branding settings'
        ]);
        console.log(`✅ Global app_settings branding created.`);

        await client.query('COMMIT');
        console.log('🎉 Seeding completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
