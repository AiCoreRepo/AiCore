import ngrok from 'ngrok';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startSharing() {
    try {
        console.log('🚀 Starting ngrok tunnels...');

        // 1. Start Backend Tunnel (Port 3000)
        const backendUrl = await ngrok.connect({
            addr: 3000,
            onStatusChange: status => console.log('Backend status:', status),
        });
        console.log(`✅ Backend is live at: ${backendUrl}`);

        // 2. Start Frontend Tunnel (Port 8080)
        const frontendUrl = await ngrok.connect({
            addr: 8080,
            onStatusChange: status => console.log('Frontend status:', status),
        });
        console.log(`✅ Frontend is live at: ${frontendUrl}`);

        console.log('\n--------------------------------------------------');
        console.log('🎉 SHARE THIS URL WITH YOUR FRIEND:');
        console.log(`👉 ${frontendUrl}`);
        console.log('--------------------------------------------------\n');

        console.log('🔄 Restarting frontend with new API URL...');

        // 3. Restart Frontend with VITE_API_URL
        // We assume this script is run from AiCore/APP3005/frontend or root. 
        // Let's assume it's run from frontend directory for simplicity, or we adjust cwd.

        const frontendProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                VITE_API_URL: backendUrl,
            },
        });

        frontendProcess.on('error', (err) => {
            console.error('Failed to start frontend:', err);
        });

        // Keep the script running
        process.stdin.resume();

    } catch (error) {
        console.error('❌ Error starting ngrok:', error);
        console.log('💡 Tip: Make sure you have authenticated ngrok. Run: npx ngrok config add-authtoken <YOUR_TOKEN>');
        process.exit(1);
    }
}

startSharing();
