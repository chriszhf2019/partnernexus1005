// One-click deploy to production
// Target: partner.velolabes.top
const { execSync } = require('child_process');

console.log('🏗️  Building production bundle...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('📦 Packaging...');
execSync('tar czf /tmp/deploy.tar.gz -C dist .');

console.log('📤 Uploading to partner.velolabes.top...');
execSync('SSHPASS=YOUR_PASSWORD sshpass -e scp -o StrictHostKeyChecking=no /tmp/deploy.tar.gz ubuntu@YOUR_SERVER_IP:/tmp/deploy.tar.gz', { stdio: 'inherit' });

console.log('🚀 Deploying to /var/www/partner-manage...');
execSync('SSHPASS=YOUR_PASSWORD sshpass -e ssh -o StrictHostKeyChecking=no ubuntu@YOUR_SERVER_IP \'sudo mkdir -p /var/www/partner-manage && sudo rm -rf /var/www/partner-manage/assets /var/www/partner-manage/index.html && sudo tar xzf /tmp/deploy.tar.gz -C /var/www/partner-manage/ 2>/dev/null && sudo chown -R www-data:www-data /var/www/partner-manage/ && sudo systemctl reload nginx\'', { stdio: 'inherit' });

console.log('\n✅ Deployed successfully!');
console.log('🌐 URL: https://partner.velolabes.top');
console.log('🎉 Deployment complete!');
