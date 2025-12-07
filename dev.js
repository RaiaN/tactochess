const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const shell = isWindows ? true : false;

console.log('🎮 Starting Tactochess local development...\n');

// Start server
const server = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  shell,
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[SERVER] ${data.toString().trim()}`);
});

// Wait a bit for server to start, then start client
setTimeout(() => {
  const client = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'client'),
    shell,
    stdio: 'pipe'
  });

  client.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[CLIENT] ${output}`);
    
    // Print helpful message when Vite is ready
    if (output.includes('Local:')) {
      console.log('\n✅ Ready! Open TWO browser windows to test multiplayer:');
      console.log('   http://localhost:5173\n');
    }
  });

  client.stderr.on('data', (data) => {
    console.error(`[CLIENT] ${data.toString().trim()}`);
  });

  client.on('close', (code) => {
    console.log(`[CLIENT] Exited with code ${code}`);
    server.kill();
    process.exit(code);
  });
}, 2000);

server.on('close', (code) => {
  console.log(`[SERVER] Exited with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
});

