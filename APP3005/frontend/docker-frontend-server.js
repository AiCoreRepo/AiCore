const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 8080);
const root = path.join(process.cwd(), 'dist');
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveFile(requestPath) {
  const normalized = path.posix.normalize(requestPath || '/');
  const safe = normalized === '/' ? '/index.html' : normalized;
  const filePath = path.join(root, safe);

  if (!filePath.startsWith(path.join(root, path.sep))) {
    return path.join(root, 'index.html');
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return path.join(filePath, 'index.html');
    }
    return filePath;
  } catch {
    return path.join(root, 'index.html');
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function respondWithProxyError(res, error) {
  if (res.headersSent) return;
  const message = error instanceof Error ? error.message : 'Proxy request failed';

  res.statusCode = 502;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Bad Gateway', message }));
}

function getProxyPath(urlPathname) {
  if (urlPathname === '/api' || urlPathname === '/api/') {
    return '/';
  }

  if (urlPathname.startsWith('/api/api/')) {
    return `/${urlPathname.replace(/^\/api\/api\//, '')}`;
  }

  if (urlPathname.startsWith('/api/')) {
    return `/${urlPathname.replace(/^\/api\//, '')}`;
  }

  return null;
}

async function forwardToBackend(req, res, pathname) {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    const target = new URL(pathname + requestUrl.search, BACKEND_URL);
    const headers = { ...req.headers };
    const method = req.method || 'GET';

    const body =
      method === 'GET' || method === 'HEAD' ? undefined : await readRequestBody(req);

    const transport = target.protocol === 'https:' ? https : http;
    const upstreamReq = transport.request(
      {
        method,
        protocol: target.protocol,
        host: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        headers: {
          ...headers,
          host: target.host,
        },
      },
      (upstreamRes) => {
        res.statusCode = upstreamRes.statusCode || 502;

        Object.entries(upstreamRes.headers).forEach(([key, value]) => {
          if (!value) return;
          if (key.toLowerCase() === 'content-encoding') {
            res.setHeader('content-encoding', value);
            return;
          }
          if (Array.isArray(value)) {
            res.setHeader(key, value.join(','));
          } else {
            res.setHeader(key, value);
          }
        });

        upstreamRes.pipe(res);
      },
    );

    upstreamReq.on('error', (error) => {
      respondWithProxyError(res, error);
    });

    if (body && body.length) {
      upstreamReq.write(body);
    }
    upstreamReq.end();
  } catch (error) {
    res.statusCode = 502;
    res.end(error instanceof Error ? error.message : 'Proxy failed');
  }
}

const server = http.createServer(async (req, res) => {
  const requestPath = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname || '/');
  const proxyPath = getProxyPath(requestPath);

  if (proxyPath !== null) {
    await forwardToBackend(req, res, proxyPath);
    return;
  }

  const filePath = resolveFile(requestPath);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
});
