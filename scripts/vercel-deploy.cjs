#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

// Read token from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const tokenMatch = envContent.match(/VERCEL_OIDC_TOKEN="([^"]+)"/);
const token = tokenMatch ? tokenMatch[1] : null;

if (!token) {
  console.error('❌ Token not found');
  process.exit(1);
}

// Write token to vercel auth file
const vercelDir = require('os').homedir() + '/.local/share/com.vercel.cli';
if (!fs.existsSync(vercelDir)) {
  fs.mkdirSync(vercelDir, { recursive: true });
}

const authFile = vercelDir + '/auth.json';
fs.writeFileSync(authFile, JSON.stringify({ token: token }, null, 2));

console.log('✅ Token configured');

// Now deploy
const projectId = 'prj_3ZujACEzEt2qZfUvMVepZ5iDZA30';
const orgId = 'team_Lqdwm9sPykh0Lqn4cxek78WP';

try {
  const result = execSync(
    `cd /Volumes/z/101/partner-management-1-main && npx vercel --prod --yes --token="${token}"`,
    { encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, VERCEL_ORG_ID: orgId, VERCEL_PROJECT_ID: projectId } }
  );
  console.log(result);
} catch(e) {
  console.error('Deploy error:', e.stderr || e.message);
}
