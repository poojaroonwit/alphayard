const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function apply() {
    try {
        // Enable uuid-ossp if not exists
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_rooms (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              family_id UUID references families(id) ON DELETE CASCADE, 
              name VARCHAR(255) NOT NULL,
              type VARCHAR(50) DEFAULT 'hourse',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
              sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
              content TEXT NOT NULL,
              type VARCHAR(50) DEFAULT 'text',
              metadata JSONB DEFAULT '{}',
              reply_to_id UUID,
              is_pinned BOOLEAN DEFAULT FALSE,
              edited_at TIMESTAMP WITH TIME ZONE,
              deleted_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS chat_message_reactions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
              user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              emoji VARCHAR(10) NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(message_id, user_id, emoji)
            );

            CREATE TABLE IF NOT EXISTS chat_message_reads (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
              user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(room_id, user_id)
            );
            
             CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
             CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

        `);
        console.log("Chat tables applied.");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
apply();
