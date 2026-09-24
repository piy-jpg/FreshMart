// tests/run_local_audit.js
const { spawn } = require('child_process');
const http = require('http');

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:' + port + '/api/health', (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error('Status ' + res.statusCode));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

async function main() {
  const PORT = 8089;
  console.log('Starting local server on port ' + PORT + '...');
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: 'ignore'
  });

  const ready = await waitForServer(PORT);
  if (!ready) {
    console.error('Server failed to start within timeout');
    serverProcess.kill('SIGTERM');
    process.exit(1);
  }

  console.log('Server is ready! Running owner persistence audit...');
  const testProcess = spawn('node', ['tests/test_owner_changes_survive_logout_all_modules.js'], {
    env: { ...process.env, LIVE_VERCEL_URL: 'http://127.0.0.1:' + PORT },
    stdio: 'inherit'
  });

  testProcess.on('exit', (code) => {
    console.log('Test exited with code ' + code + '. Stopping local server...');
    serverProcess.kill('SIGTERM');
    process.exit(code);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
