const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function setupSchema() {
  try {
    console.log('Setting up database schema...');

    // Users table (already exists likely, but ensuring)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50),
        avatar_url TEXT,
        date_of_birth TIMESTAMP,
        user_type VARCHAR(50) DEFAULT 'hourse',
        subscription_tier VARCHAR(50) DEFAULT 'free',
        is_email_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Families table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS families (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'hourse',
        description TEXT,
        invite_code VARCHAR(20),
        owner_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Family Members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id UUID REFERENCES families(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(family_id, user_id)
      );
    `);

    // Family Invitations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS family_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id UUID REFERENCES families(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        invited_by UUID REFERENCES users(id),
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Financial Accounts (Wallets)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        family_id UUID REFERENCES families(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'THB',
        color VARCHAR(50),
        is_included_in_net_worth BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Financial Categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
        icon VARCHAR(255),
        color VARCHAR(50),
        parent_category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
        is_system_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Financial Transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE,
        category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        date TIMESTAMP DEFAULT NOW(),
        note TEXT,
        is_family_shared BOOLEAN DEFAULT false,
        location_label VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Financial Budgets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES financial_categories(id) ON DELETE CASCADE,
        amount_limit DECIMAL(15, 2) NOT NULL,
        period VARCHAR(50) DEFAULT 'monthly',
        start_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Financial Goals
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target_amount DECIMAL(15, 2) NOT NULL,
        current_amount DECIMAL(15, 2) DEFAULT 0.00,
        target_date DATE,
        color VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Schema setup complete.');
  } catch (err) {
    console.error('Schema setup failed:', err);
  } finally {
    await pool.end();
  }
}

setupSchema();
