#!/usr/bin/env node

import net from 'node:net';
import process from 'node:process';
import { URL } from 'node:url';

const DEFAULT_TIMEOUT_MS = Number(process.env.SERVICE_WAIT_TIMEOUT_MS || 120000);
const DEFAULT_INTERVAL_MS = Number(process.env.SERVICE_WAIT_INTERVAL_MS || 2000);
const DB_RETRY_ATTEMPTS = Math.max(
  1,
  Math.floor(DEFAULT_TIMEOUT_MS / Math.max(250, DEFAULT_INTERVAL_MS)),
);

function parseDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname || '127.0.0.1',
    port: Number(parsed.port || '5432'),
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function testTcpConnection(host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: 2000 });

    socket.once('connect', () => {
      socket.end();
      resolve();
    });

    socket.once('error', (error) => {
      socket.destroy();
      reject(error);
    });

    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timed out'));
    });
  });
}

async function waitForService(host, port, name) {
  let lastError;

  for (let attempt = 1; attempt <= DB_RETRY_ATTEMPTS; attempt += 1) {
    const ts = new Date().toISOString();
    process.stdout.write(`[${ts}] [service-wait] ${name} attempt ${attempt}/${DB_RETRY_ATTEMPTS} -> ${host}:${port}\n`);

    try {
      await testTcpConnection(host, port);
      process.stdout.write(`[${new Date().toISOString()}] [service-wait] ${name} is reachable at ${host}:${port}\n`);
      return;
    } catch (error) {
      lastError = error;
    }

    if (attempt < DB_RETRY_ATTEMPTS) {
      await wait(DEFAULT_INTERVAL_MS);
    }
  }

  throw new Error(
    `[service-wait] ${name} not reachable at ${host}:${port} after ${DB_RETRY_ATTEMPTS} attempts. ` +
      `Last error: ${lastError?.message || 'unknown'}`,
  );
}

async function main() {
  if (process.env.SKIP_SERVICE_WAIT === 'true') {
    process.stdout.write('[service-wait] Skipping service readiness check (SKIP_SERVICE_WAIT=true)\n');
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('[service-wait] DATABASE_URL is missing');
  }

  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = Number(process.env.REDIS_PORT || '6379');

  const database = parseDatabaseUrl(databaseUrl);

  process.stdout.write(`[service-wait] Starting dependency checks with timeout ${DEFAULT_TIMEOUT_MS}ms\n`);
  process.stdout.write(`[service-wait] DATABASE_URL=${databaseUrl}\n`);
  process.stdout.write(
    `[service-wait] REDIS_HOST=${redisHost} REDIS_PORT=${redisPort}\n`,
  );

  await waitForService(database.host, database.port, 'PostgreSQL');
  if (process.env.SKIP_REDIS_SERVICE_WAIT !== 'true') {
    await waitForService(redisHost, redisPort, 'Redis');
  } else {
    process.stdout.write('[service-wait] Skipping Redis wait (SKIP_REDIS_SERVICE_WAIT=true)\n');
  }

  process.stdout.write('[service-wait] All required services are reachable.\n');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${String(error?.message || error)}\n`);
    process.exit(1);
  });
