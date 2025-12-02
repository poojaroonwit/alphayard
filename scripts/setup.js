#!/usr/bin/env node
/**
 * Bondarys Application Setup Script (Node.js/JavaScript)
 * Complete setup for Docker services and database initialization
 * 
 * Usage:
 *   node scripts/setup.js
 *   node scripts/setup.js --skip-seed
 *   node scripts/setup.js --skip-migrations
 *   node scripts/setup.js --help
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    dockerComposeFile: 'docker-compose.yml',
    databaseContainer: 'bondarys-supabase-db',
    maxHealthCheckAttempts: 60,
    healthCheckIntervalSeconds: 2,
    serviceStartupDelaySeconds: 10,
    migrationPath: path.join('backend', 'src', 'database', 'migrations'),
    seedFile: path.join('backend', 'src', 'database', 'seed.sql'),
    requiredServices: [
        { name: 'supabase-db', container: 'bondarys-supabase-db', healthCheck: true },
        { name: 'supabase-auth', container: 'bondarys-supabase-auth', healthCheck: false },
        { name: 'supabase-rest', container: 'bondarys-supabase-rest', healthCheck: false },
        { name: 'supabase-storage', container: 'bondarys-supabase-storage', healthCheck: false },
        { name: 'supabase-realtime', container: 'bondarys-supabase-realtime', healthCheck: false },
        { name: 'redis', container: 'bondarys-redis', healthCheck: true }
    ]
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    skipSeed: args.includes('--skip-seed') || args.includes('-s'),
    skipMigrations: args.includes('--skip-migrations') || args.includes('-m'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
};

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    gray: '\x1b[90m'
};

// Helper functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(message, stepNum, total) {
    log(`[${stepNum}/${total}] ${message}`, 'yellow');
}

function success(message) {
    log(`✓ ${message}`, 'green');
}

function error(message) {
    log(`✗ ${message}`, 'red');
}

function warning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function info(message) {
    if (options.verbose) {
        log(`  ℹ ${message}`, 'gray');
    }
}

function header(title) {
    console.log('');
    log('========================================', 'cyan');
    log(`  ${title}`, 'cyan');
    log('========================================', 'cyan');
    console.log('');
}

function execCommand(command, options = {}) {
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        return { success: true, output };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Prerequisites check
function checkPrerequisites() {
    step('Checking prerequisites...', 1, 7);

    // Check Docker
    const dockerCheck = execCommand('docker version', { silent: true });
    if (!dockerCheck.success) {
        error('Docker is not running or not accessible');
        log('  Please start Docker Desktop and try again.', 'yellow');
        process.exit(1);
    }
    success('Docker is running');
    info('Docker version check passed');

    // Check Docker Compose
    const composeCheck = execCommand('docker-compose version', { silent: true });
    if (!composeCheck.success) {
        error('Docker Compose is not available');
        log('  Please install Docker Compose and try again.', 'yellow');
        process.exit(1);
    }
    success('Docker Compose is available');
    info('Docker Compose version check passed');

    // Check docker-compose.yml exists
    if (!fs.existsSync(CONFIG.dockerComposeFile)) {
        error(`${CONFIG.dockerComposeFile} not found`);
        log('  Please run this script from the project root directory.', 'yellow');
        process.exit(1);
    }

    success('All prerequisites met');
    return true;
}

// Start Docker services
function startDockerServices() {
    step('Starting Docker Compose services...', 2, 7);

    const result = execCommand('docker-compose up -d');
    if (!result.success) {
        error('Failed to start Docker Compose services');
        log('  Check logs with: docker-compose logs', 'yellow');
        process.exit(1);
    }

    success('Docker Compose services started');
    return true;
}

// Wait for database health
async function waitForDatabaseHealth() {
    step('Waiting for database to be healthy...', 3, 7);

    let attempt = 0;
    let isHealthy = false;

    while (attempt < CONFIG.maxHealthCheckAttempts && !isHealthy) {
        await sleep(CONFIG.healthCheckIntervalSeconds);
        attempt++;

        const healthCheck = execCommand(
            `docker inspect --format='{{.State.Health.Status}}' ${CONFIG.databaseContainer}`,
            { silent: true }
        );

        if (healthCheck.success && healthCheck.output.trim() === 'healthy') {
            isHealthy = true;
            success('Database is healthy');
            break;
        }

        if (attempt % 10 === 0) {
            info(`Still waiting... (${attempt}/${CONFIG.maxHealthCheckAttempts})`);
        }
    }

    if (!isHealthy) {
        error('Database did not become healthy within timeout period');
        log(`  Check logs with: docker-compose logs ${CONFIG.databaseContainer}`, 'yellow');
        process.exit(1);
    }

    info(`Waiting additional ${CONFIG.serviceStartupDelaySeconds} seconds for initialization...`);
    await sleep(CONFIG.serviceStartupDelaySeconds);
}

// Initialize database schemas
function initializeDatabaseSchemas() {
    step('Initializing database schemas...', 4, 7);

    const sqlCommands = [
        'CREATE SCHEMA IF NOT EXISTS auth;',
        'GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;',
        'GRANT ALL ON SCHEMA auth TO postgres;',
        'CREATE SCHEMA IF NOT EXISTS realtime;',
        'GRANT USAGE ON SCHEMA realtime TO postgres;',
        'CREATE TABLE IF NOT EXISTS realtime.schema_migrations (version bigint PRIMARY KEY, inserted_at timestamp);'
    ];

    let successCount = 0;

    sqlCommands.forEach(cmd => {
        const result = execCommand(
            `docker exec ${CONFIG.databaseContainer} psql -U postgres -d postgres -c "${cmd}"`,
            { silent: true }
        );
        if (result.success) {
            successCount++;
            info(`Executed: ${cmd.substring(0, 50)}...`);
        }
    });

    // Execute complex DO blocks
    const doBlock1 = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'schema_migrations' AND column_name = 'inserted_at') THEN ALTER TABLE schema_migrations ADD COLUMN inserted_at timestamp; END IF; END $$;`;
    const doBlock2 = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN CREATE PUBLICATION supabase_realtime FOR ALL TABLES; END IF; END $$;`;

    const result1 = execCommand(
        `docker exec ${CONFIG.databaseContainer} psql -U postgres -d postgres -c "${doBlock1}"`,
        { silent: true }
    );
    if (result1.success) successCount++;

    const result2 = execCommand(
        `docker exec ${CONFIG.databaseContainer} psql -U postgres -d postgres -c "${doBlock2}"`,
        { silent: true }
    );
    if (result2.success) successCount++;

    if (successCount > 0) {
        success(`Database schemas initialized (${successCount} operations succeeded)`);
    } else {
        warning('Some schema operations may have failed (OK if schemas already exist)');
    }
}

// Run database migrations
function runDatabaseMigrations() {
    if (options.skipMigrations) {
        step('Skipping database migrations...', 5, 7);
        info('Migrations skipped (--skip-migrations flag set)');
        return;
    }

    step('Running database migrations...', 5, 7);

    if (!fs.existsSync(CONFIG.migrationPath)) {
        warning(`Migration directory not found: ${CONFIG.migrationPath}`);
        return;
    }

    const migrationFiles = fs.readdirSync(CONFIG.migrationPath)
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => path.join(CONFIG.migrationPath, file));

    if (migrationFiles.length === 0) {
        warning(`No migration files found in ${CONFIG.migrationPath}`);
        return;
    }

    let successCount = 0;
    let failCount = 0;

    migrationFiles.forEach(file => {
        info(`Running migration: ${path.basename(file)}`);
        const content = fs.readFileSync(file, 'utf8');
        
        const result = execCommand(
            `docker exec -i ${CONFIG.databaseContainer} psql -U postgres -d postgres`,
            { input: content, silent: true }
        );

        if (result.success) {
            successCount++;
        } else {
            failCount++;
            info(`  Warning: Some errors in ${path.basename(file)} (may be OK if already applied)`);
        }
    });

    if (successCount > 0) {
        success(`Migrations completed (${successCount} succeeded, ${failCount} with warnings)`);
    } else {
        warning('No migrations succeeded (check migration files for errors)');
    }
}

// Seed database
function seedDatabase() {
    if (options.skipSeed) {
        step('Skipping database seed...', 6, 7);
        info('Seed data skipped (--skip-seed flag set)');
        return;
    }

    step('Seeding database with sample data...', 6, 7);

    if (!fs.existsSync(CONFIG.seedFile)) {
        warning(`Seed file not found: ${CONFIG.seedFile}`);
        info(`To seed manually: cat ${CONFIG.seedFile} | docker exec -i ${CONFIG.databaseContainer} psql -U postgres -d postgres`);
        return;
    }

    try {
        info(`Loading seed data from ${CONFIG.seedFile}`);
        const seedContent = fs.readFileSync(CONFIG.seedFile, 'utf8');
        
        const result = execCommand(
            `docker exec -i ${CONFIG.databaseContainer} psql -U postgres -d postgres`,
            { input: seedContent, silent: true }
        );

        if (result.success) {
            success('Database seeded successfully');
        } else {
            warning('Seed data may have errors (check seed file)');
        }
    } catch (err) {
        warning(`Failed to seed database: ${err.message}`);
        info('You can seed manually later if needed');
    }
}

// Verify service status
function verifyServiceStatus() {
    step('Verifying service status...', 7, 7);

    let allHealthy = true;
    const results = [];

    CONFIG.requiredServices.forEach(service => {
        const statusCheck = execCommand(
            `docker inspect --format='{{.State.Status}}' ${service.container}`,
            { silent: true }
        );

        let status = 'unknown';
        if (statusCheck.success) {
            status = statusCheck.output.trim();
        }

        let displayStatus = status;
        if (service.healthCheck) {
            const healthCheck = execCommand(
                `docker inspect --format='{{.State.Health.Status}}' ${service.container}`,
                { silent: true }
            );
            if (healthCheck.success && healthCheck.output.trim()) {
                displayStatus = `${status} (${healthCheck.output.trim()})`;
            }
        }

        const isHealthy = status === 'running' || status === 'healthy';
        results.push({ name: service.name, status: displayStatus, healthy: isHealthy });

        if (!isHealthy) {
            allHealthy = false;
        }
    });

    results.forEach(result => {
        if (result.healthy) {
            log(`  ✓ ${result.name}: ${result.status}`, 'green');
        } else {
            log(`  ✗ ${result.name}: ${result.status}`, 'red');
        }
    });

    return allHealthy;
}

// Show help
function showHelp() {
    console.log(`
Bondarys Application Setup Script

Usage:
  node scripts/setup.js [options]

Options:
  --skip-seed, -s          Skip seeding sample data
  --skip-migrations, -m    Skip running database migrations
  --verbose, -v            Enable verbose output
  --help, -h               Show this help message

Examples:
  node scripts/setup.js
  node scripts/setup.js --skip-seed
  node scripts/setup.js --skip-migrations --verbose
  node scripts/setup.js --help
`);
}

// Main execution
async function main() {
    if (options.help) {
        showHelp();
        process.exit(0);
    }

    header('Bondarys Application Setup');

    try {
        // Step 1: Check prerequisites
        checkPrerequisites();

        // Step 2: Start Docker services
        startDockerServices();

        // Step 3: Wait for database health
        await waitForDatabaseHealth();

        // Step 4: Initialize database schemas
        initializeDatabaseSchemas();

        // Step 5: Run migrations
        runDatabaseMigrations();

        // Step 6: Seed data (optional)
        seedDatabase();

        // Step 7: Verify service status
        const allHealthy = verifyServiceStatus();

        // Summary
        header('Setup Summary');

        if (allHealthy) {
            success('Setup completed successfully!');
            console.log('');
            log('All services are running and ready to use.', 'green');
        } else {
            warning('Setup completed with warnings');
            log('Some services may not be fully healthy. Check logs for details.', 'yellow');
        }

        console.log('');
        log('Useful commands:', 'cyan');
        log('  View logs:     docker-compose logs -f', 'gray');
        log('  Stop services: docker-compose down', 'gray');
        log('  Restart:       docker-compose restart', 'gray');
        log('  Status:        docker-compose ps', 'gray');
        log(`  Database:      docker exec ${CONFIG.databaseContainer} psql -U postgres -d postgres`, 'gray');
        console.log('');

        process.exit(0);
    } catch (err) {
        error(`Setup failed: ${err.message}`);
        console.log('');
        log('Troubleshooting:', 'yellow');
        log('  1. Check Docker Desktop is running', 'gray');
        log('  2. Check logs: docker-compose logs', 'gray');
        log('  3. Try restarting: docker-compose restart', 'gray');
        console.log('');
        process.exit(1);
    }
}

// Run main function
main();

