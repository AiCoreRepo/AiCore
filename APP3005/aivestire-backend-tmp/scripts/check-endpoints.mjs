#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const getArg = (name, dflt = undefined) => {
  const i = args.indexOf(name);
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return dflt;
};
const hasArg = (name) => args.includes(name);

const baseUrl = (getArg('--base', 'http://localhost:3000') || '').replace(/\/$/, '');
const includeDynamic = hasArg('--include-dynamic');
const token = getArg('--token', process.env.ACCESS_TOKEN || '');
const timeoutMs = Number(getArg('--timeout-ms', '10000'));
const root = path.resolve('src');

if (!fs.existsSync(root)) {
  console.error('Run this script from APP3005/aivestire-backend-tmp');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && entry.name.endsWith('controller.ts')) out.push(p);
  }
  return out;
}

function stripBlockComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function normalizePath(s) {
  return s.replace(/^\/+|\/+$/g, '');
}

function makeRoute(controllerPath, methodPath) {
  const c = normalizePath(controllerPath || '');
  const m = normalizePath(methodPath || '');
  const internal = '/' + [c, m].filter(Boolean).join('/');
  const internalPath = internal === '/' ? '/' : internal;
  const externalPath = internalPath === '/' ? '/' : '/api' + internalPath;
  return { internalPath, externalPath };
}

function parseRoutes() {
  const files = walk(root).sort();
  const routes = [];

  for (const file of files) {
    const content = stripBlockComments(fs.readFileSync(file, 'utf8'));
    const lines = content.split(/\r?\n/);
    let controllerPath = '';

    for (const raw of lines) {
      const line = raw.replace(/\/\/.*$/, '').trim();
      if (!line) continue;

      const ctrl = line.match(/^@Controller\((.*)\)/);
      if (ctrl) {
        const m = ctrl[1].match(/['\"]([^'\"]*)['\"]/);
        controllerPath = m ? m[1] : '';
        continue;
      }

      const method = line.match(/^@(Get|Post|Put|Patch|Delete)\((.*)\)/);
      if (method) {
        const verb = method[1].toUpperCase();
        const arg = method[2].trim();
        const m = arg.match(/['\"]([^'\"]*)['\"]/);
        const methodPath = m ? m[1] : '';
        const { internalPath, externalPath } = makeRoute(controllerPath, methodPath);
        routes.push({ verb, internalPath, externalPath, file: path.relative(process.cwd(), file) });
      }
    }
  }

  const dedup = new Map();
  for (const r of routes) dedup.set(`${r.verb} ${r.externalPath}`, r);
  return [...dedup.values()].sort((a, b) =>
    a.externalPath.localeCompare(b.externalPath) || a.verb.localeCompare(b.verb),
  );
}

function isDynamic(routePath) {
  return routePath.includes(':');
}

function materializeDynamic(routePath) {
  return routePath
    .replace(/:addressId/g, '00000000-0000-0000-0000-000000000001')
    .replace(/:productId/g, '00000000-0000-0000-0000-000000000002')
    .replace(/:orderId/g, '00000000-0000-0000-0000-000000000003')
    .replace(/:refundId/g, '00000000-0000-0000-0000-000000000004')
    .replace(/:replacementId/g, '00000000-0000-0000-0000-000000000005')
    .replace(/:returnId/g, '00000000-0000-0000-0000-000000000006')
    .replace(/:wishlistItemId/g, '00000000-0000-0000-0000-000000000007')
    .replace(/:cartItemId/g, '00000000-0000-0000-0000-000000000008')
    .replace(/:creatorId/g, '00000000-0000-0000-0000-000000000009')
    .replace(/:userId/g, '00000000-0000-0000-0000-000000000010')
    .replace(/:jobId/g, 'job-test-id')
    .replace(/:id/g, '00000000-0000-0000-0000-000000000011');
}

async function request(route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const urlPath = isDynamic(route.externalPath)
    ? materializeDynamic(route.externalPath)
    : route.externalPath;
  const url = `${baseUrl}${urlPath}`;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = {
    method: route.verb,
    headers,
    signal: controller.signal,
  };

  if (['POST', 'PUT', 'PATCH'].includes(route.verb)) {
    headers['Content-Type'] = 'application/json';
    init.body = '{}';
  }

  try {
    const res = await fetch(url, init);
    clearTimeout(timeout);
    return { ok: true, status: res.status, url };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, error: err?.message || String(err), url };
  }
}

function classify(status) {
  if (status === 404) return 'NOT_FOUND';
  if (status >= 200 && status < 400) return 'REACHABLE';
  if (status === 400 || status === 401 || status === 403 || status === 405 || status === 409 || status === 422) return 'REACHABLE_GUARDED';
  if (status >= 500) return 'SERVER_ERROR';
  return 'OTHER';
}

const routes = parseRoutes();
const targetRoutes = routes.filter((r) => includeDynamic || !isDynamic(r.externalPath));

console.log(`Base URL: ${baseUrl}`);
console.log(`Total parsed routes: ${routes.length}`);
console.log(`Routes under test: ${targetRoutes.length} (${includeDynamic ? 'including dynamic' : 'static only'})`);

const results = [];
for (const route of targetRoutes) {
  const res = await request(route);
  if (!res.ok) {
    results.push({ route, status: 'ERROR', detail: res.error, url: res.url });
    continue;
  }
  results.push({ route, status: res.status, class: classify(res.status), url: res.url });
}

const counts = {
  REACHABLE: 0,
  REACHABLE_GUARDED: 0,
  NOT_FOUND: 0,
  SERVER_ERROR: 0,
  OTHER: 0,
  ERROR: 0,
};
for (const r of results) {
  if (r.status === 'ERROR') counts.ERROR++;
  else counts[r.class] = (counts[r.class] || 0) + 1;
}

console.log('\nSummary:');
for (const k of Object.keys(counts)) console.log(`${k}: ${counts[k]}`);

console.log('\nDetailed results:');
for (const r of results) {
  const key = `${r.route.verb.padEnd(6)} ${r.route.externalPath}`;
  if (r.status === 'ERROR') {
    console.log(`${key} -> ERROR (${r.detail})`);
  } else {
    console.log(`${key} -> ${r.status} [${r.class}]`);
  }
}

const notFound = results.filter((r) => r.class === 'NOT_FOUND');
if (notFound.length) {
  console.log('\nPotential 404 issues:');
  for (const r of notFound) console.log(`${r.route.verb} ${r.route.externalPath} (${r.url})`);
}
