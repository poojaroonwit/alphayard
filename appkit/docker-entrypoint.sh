#!/bin/sh

# Database seeding script for Docker container
# This script will check if the admin user exists and seed the database if needed

echo "Starting database seeding check..."

# Wait for database to be ready
echo "Waiting for database..."
while ! npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"

# Check if admin user exists
ADMIN_EMAIL="admin@appkit.com"
ADMIN_EXISTS=$(npx prisma db execute --stdin --schema=prisma/schema.prisma <<EOF
SELECT COUNT(*) as count FROM "users" WHERE email = '$ADMIN_EMAIL';
EOF
)

if [ "$ADMIN_EXISTS" = "0" ]; then
  echo "Admin user not found, running seed..."
  npx prisma db seed
  echo "Database seeded successfully!"
else
  echo "Admin user already exists, skipping seed."
fi

echo "Starting application..."
exec "$@"
