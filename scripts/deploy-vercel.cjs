#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read Vercel OIDC token from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const tokenMatch = envContent.match(/VERCEL_OIDC_TOKEN="([^"]+)"/);
const token = tokenMatch ? tokenMatch[1] : null;

if (!token) {
  console.error('❌ Vercel token not found in .env.local');
  process.exit(1);
}

const projectId = 'prj_3ZujACEzEt2qZfUvMVepZ5iDZA30';

async function deploy() {
  console.log('🚀 Deploying to Vercel...\n');

  // Read dist directory
  const distPath = path.join(__dirname, '..', 'dist');
  
  function getFiles(dir, baseDir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getFiles(fullPath, baseDir));
      } else {
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha1').update(content).digest('hex');
        files.push({
          file: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
          sha: hash,
          size: content.length,
          data: content
        });
      }
    }
    return files;
  }

  const distFiles = getFiles(distPath, distPath);
  console.log(`📦 Found ${distFiles.length} files to deploy\n`);

  // Calculate file digests
  const fileDigests = distFiles.map(f => ({
    sha: f.sha,
    size: f.size,
    file: f.file
  }));

  // Create deployment
  console.log('🏗️ Creating deployment...');
  
  const deploymentBody = JSON.stringify({
    name: 'partner-management-1-main',
    project: projectId,
    target: 'production',
    files: fileDigests,
    projectSettings: {
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      installCommand: 'npm install'
    }
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: '/v13/deployments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(deploymentBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('\n✅ Deployment created successfully!');
            console.log(`🔗 URL: https://${result.url}`);
            resolve(result);
          } else {
            console.log('\n❌ Deployment failed:', result);
            reject(result);
          }
        } catch(e) {
          console.log('\n❌ Parse error:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(deploymentBody);
    req.end();
  });
}

deploy().catch(console.error);