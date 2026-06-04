// One-click deploy to production
const { execSync } = require('child_process');

console.log('Building...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('Packaging...');
execSync('tar czf /tmp/deploy.tar.gz -C dist .');

console.log('Uploading...');
execSync('SSHPASS=YOUR_PASSWORD sshpass -e scp -o StrictHostKeyChecking=no /tmp/deploy.tar.gz ubuntu@YOUR_SERVER_IP:/tmp/deploy.tar.gz', { stdio: 'inherit' });

console.log('Deploying...');
execSync('SSHPASS=YOUR_PASSWORD sshpass -e ssh -o StrictHostKeyChecking=no ubuntu@YOUR_SERVER_IP \'sudo rm -rf /var/www/partner-manage/assets /var/www/partner-manage/index.html && sudo tar xzf /tmp/deploy.tar.gz -C /var/www/partner-manage/ 2>/dev/null && sudo chown -R www-data:www-data /var/www/partner-manage/\'', { stdio: 'inherit' });

const hash = execSync("grep -o '/assets/index-[^\"]*\\\\.js' dist/index.html", { encoding: 'utf8' }).trim();
console.log('Deployed: ' + hash);
console.log('Done!');
