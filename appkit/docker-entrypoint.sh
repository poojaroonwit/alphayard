#!/bin/sh

set -eu

# Ensure persistent key directory is writable by app user (uid/gid 1001)
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/secrets /app/secrets/oidc
  chown -R 1001:1001 /app/secrets || true
  chmod 700 /app/secrets /app/secrets/oidc || true
fi

# OIDC key bootstrap (secure auto-generate if missing)
# Priority:
# 1) Explicit OIDC_PRIVATE_KEY / OIDC_PUBLIC_KEY env values
# 2) Explicit OIDC_*_KEY_PATH files
# 3) Auto-generate into OIDC_KEY_DIR (default: /app/secrets/oidc)
if [ -z "${OIDC_PRIVATE_KEY:-}" ] && [ -z "${OIDC_PUBLIC_KEY:-}" ]; then
  KEY_DIR="${OIDC_KEY_DIR:-/app/secrets/oidc}"
  PRIVATE_KEY_PATH="${OIDC_PRIVATE_KEY_PATH:-$KEY_DIR/private.key}"
  PUBLIC_KEY_PATH="${OIDC_PUBLIC_KEY_PATH:-$KEY_DIR/public.key}"

  # Ensure we can write to target key dir/path. Some managed bind mounts are not writable
  # for non-root users at startup (e.g. Railway volume ownership mismatch).
  CAN_WRITE_TARGET="true"
  if ! mkdir -p "$KEY_DIR" 2>/dev/null; then
    CAN_WRITE_TARGET="false"
  fi
  if [ "$CAN_WRITE_TARGET" = "true" ] && ! ( : > "$KEY_DIR/.appkit-write-test" ) 2>/dev/null; then
    CAN_WRITE_TARGET="false"
  fi
  rm -f "$KEY_DIR/.appkit-write-test" 2>/dev/null || true

  if [ "$CAN_WRITE_TARGET" = "false" ]; then
    FALLBACK_KEY_DIR="/tmp/appkit-oidc"
    echo "[entrypoint] WARNING: $KEY_DIR is not writable. Falling back to $FALLBACK_KEY_DIR"
    KEY_DIR="$FALLBACK_KEY_DIR"
    PRIVATE_KEY_PATH="$KEY_DIR/private.key"
    PUBLIC_KEY_PATH="$KEY_DIR/public.key"
  fi

  if [ ! -s "$PRIVATE_KEY_PATH" ] || [ ! -s "$PUBLIC_KEY_PATH" ]; then
    echo "[entrypoint] OIDC keys not found. Generating RSA key pair..."
    umask 077
    mkdir -p "$KEY_DIR"
    openssl genrsa -out "$PRIVATE_KEY_PATH" 2048
    openssl rsa -in "$PRIVATE_KEY_PATH" -pubout -out "$PUBLIC_KEY_PATH"
    chmod 600 "$PRIVATE_KEY_PATH" "$PUBLIC_KEY_PATH"
    if [ "$(id -u)" = "0" ]; then
      chown 1001:1001 "$PRIVATE_KEY_PATH" "$PUBLIC_KEY_PATH" 2>/dev/null || true
    fi
    echo "[entrypoint] OIDC key pair generated at $KEY_DIR"
  else
    if [ "$(id -u)" = "0" ] && [ -w "$PRIVATE_KEY_PATH" ] && [ -w "$PUBLIC_KEY_PATH" ]; then
      chown 1001:1001 "$PRIVATE_KEY_PATH" "$PUBLIC_KEY_PATH" 2>/dev/null || true
    fi
    echo "[entrypoint] Reusing existing OIDC key pair at $KEY_DIR"
  fi

  export OIDC_PRIVATE_KEY_PATH="$PRIVATE_KEY_PATH"
  export OIDC_PUBLIC_KEY_PATH="$PUBLIC_KEY_PATH"
fi

echo "[entrypoint] Pushing database schema..."
if [ "$(id -u)" = "0" ]; then
  su-exec 1001:1001 npx prisma db push --accept-data-loss || {
    echo "[entrypoint] db push failed, retrying in 3s..."
    sleep 3
    su-exec 1001:1001 npx prisma db push --accept-data-loss || echo "[entrypoint] WARNING: db push failed"
  }
else
  npx prisma db push --accept-data-loss || {
    echo "[entrypoint] db push failed, retrying in 3s..."
    sleep 3
    npx prisma db push --accept-data-loss || echo "[entrypoint] WARNING: db push failed"
  }
fi

echo "[entrypoint] Running production seed..."
if [ "$(id -u)" = "0" ]; then
  su-exec 1001:1001 node prisma/seed-prod.js
else
  node prisma/seed-prod.js
fi

echo "[entrypoint] Starting application..."
if [ "$(id -u)" = "0" ]; then
  exec su-exec 1001:1001 "$@"
else
  exec "$@"
fi
