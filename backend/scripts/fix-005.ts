import fs from 'fs';
import path from 'path';

const filePath = 'e:/GitCloneProject/boundary/backend/src/database/migrations/005_cms_content_tables.sql';
let content = fs.readFileSync(filePath, 'utf8');

// Use a regex to find CREATE POLICY and prepend DROP POLICY
content = content.replace(/CREATE POLICY "(.*?)" ON (.*?) FOR/g, 
    'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1" ON $2 FOR');

fs.writeFileSync(filePath, content);
console.log('Fixed 005 policies');
