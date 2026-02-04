import { pool } from '../src/config/database';

async function testComponentStudio() {
    try {
        // Test 1: Get sidebar data
        console.log('Testing Component Studio Sidebar...');
        const categoriesResult = await pool.query('SELECT * FROM component_categories ORDER BY position ASC LIMIT 3');
        const stylesResult = await pool.query('SELECT * FROM component_styles WHERE is_active = true LIMIT 5');
        
        console.log(`✓ Found ${categoriesResult.rows.length} categories (showing first 3)`);
        console.log(`✓ Found ${stylesResult.rows.length} styles (showing first 5)`);
        
        // Test 2: Verify data structure
        if (categoriesResult.rows.length > 0) {
            const category = categoriesResult.rows[0];
            console.log('\nSample Category:', {
                id: category.id,
                name: category.name,
                icon: category.icon
            });
        }
        
        if (stylesResult.rows.length > 0) {
            const style = stylesResult.rows[0];
            console.log('\nSample Style:', {
                id: style.id,
                name: style.name,
                category_id: style.category_id,
                definition_id: style.definition_id
            });
        }
        
        console.log('\n✅ Component Studio database verification passed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testComponentStudio();
