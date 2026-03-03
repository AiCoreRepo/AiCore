const baseUrl = process.env.HEALTH_CHECK_BASE_URL?.trim() || 'http://127.0.0.1:3000';
const startupTimeoutMs = Number(process.env.HEALTH_CHECK_STARTUP_TIMEOUT_MS || 120000);
const requestTimeoutMs = Number(process.env.HEALTH_CHECK_REQUEST_TIMEOUT_MS || 5000);

const checks = [
  {
    name: 'root',
    path: '/',
    shouldBeText: 'Hello World!',
  },
  {
    name: 'backend-health',
    path: '/health',
    parseJson: true,
    validators: [
      {
        key: 'status',
        expectation: 'ok',
      },
    ],
  },
  {
    name: 'tryon-health',
    path: '/api/v1/tryon/health',
    parseJson: true,
    validators: [
      {
        key: 'healthy',
        type: 'boolean',
      },
    ],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < startupTimeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (response.ok) {
        return;
      }
    } catch (_) {
      // keep trying until timeout
    }
    await sleep(2000);
  }

  throw new Error(`Server did not become ready at ${baseUrl} within ${startupTimeoutMs}ms`);
}

function validateBoolean(value) {
  if (typeof value !== 'boolean') {
    throw new Error(`Expected boolean but got ${typeof value}`);
  }
}

async function runChecks() {
  const errors = [];

  for (const check of checks) {
    const url = `${baseUrl}${check.path}`;
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
    } catch (error) {
      errors.push(`${check.name}: failed to call ${url}: ${error.message}`);
      continue;
    }

    if (!response.ok) {
      errors.push(`${check.name}: ${url} returned status ${response.status}`);
      continue;
    }

    if (check.shouldBeText) {
      const body = await response.text();
      if (!body.includes(check.shouldBeText)) {
        errors.push(`${check.name}: expected body to include "${check.shouldBeText}", got "${body}"`);
      }
      continue;
    }

    if (check.parseJson) {
      let json;
      try {
        json = await response.json();
      } catch (error) {
        errors.push(`${check.name}: response at ${url} is not valid JSON`);
        continue;
      }

      for (const validator of check.validators) {
        if (!(validator.key in json)) {
          errors.push(`${check.name}: missing key "${validator.key}" in response`);
          continue;
        }

        if (validator.expectation !== undefined && json[validator.key] !== validator.expectation) {
          errors.push(
            `${check.name}: expected "${validator.key}" to be ${validator.expectation}, got ${json[validator.key]}`,
          );
          continue;
        }

        if (validator.type === 'boolean') {
          try {
            validateBoolean(json[validator.key]);
          } catch (error) {
            errors.push(`${check.name}: invalid ${validator.key}: ${error.message}`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('CI health check failed:\\n' + errors.join('\\n'));
    process.exitCode = 1;
    return;
  }

  console.log('CI smoke checks passed:', checks.map((check) => check.name).join(', '));
}

async function main() {
  try {
    await waitForServer();
    await runChecks();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

void main();
