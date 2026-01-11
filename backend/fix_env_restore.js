const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let content = '';

try {
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }
} catch (e) {
    console.log('Could not read .env, starting fresh.');
}

// RESTORE CORRECT CREDENTIALS
const vars = {
    'AWS_ACCESS_KEY_ID': 'minioadmin',
    'AWS_SECRET_ACCESS_KEY': 'minioadmin',
    'AWS_S3_ENDPOINT': 'http://localhost:9000'
};

const lines = content.split('\n');
const newLines = [];
const foundKeys = new Set();

for (let line of lines) {
    const match = line.match(/^([^=]+)=/);
    if (match) {
        const key = match[1];
        if (vars[key]) {
            newLines.push(`${key}=${vars[key]}`);
            foundKeys.add(key);
            delete vars[key]; // Mark as handled
        } else {
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
}

// Append remaining new keys
for (const [key, val] of Object.entries(vars)) {
    newLines.push(`${key}=${val}`);
}

fs.writeFileSync(envPath, newLines.join('\n'));
console.log('Restored .env to minioadmin');
