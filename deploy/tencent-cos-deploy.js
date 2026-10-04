/**
 * 腾讯云 COS 部署脚本
 * 
 * 使用方法:
 * 1. 安装腾讯云 COS CLI: npm install -g cos-cli
 * 2. 配置凭证: cos-cli config
 * 3. 运行部署: node deploy/tencent-cos-deploy.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  // 腾讯云 COS 配置
  cos: {
    bucket: 'partner-nexus-1312345678',  // 替换为你的存储桶名称
    region: 'ap-shanghai',                 // 替换为你的地域
  },
  
  // 部署源目录
  distDir: path.join(__dirname, '..', 'dist'),
  
  // 清理远程文件的模式（空数组表示不清除，保留远程其他文件）
  cleanPatterns: [
    // '*.js',
    // 'assets/*',
  ],
};

console.log('🚀 开始部署到腾讯云 COS...\n');

// 1. 检查构建输出
if (!fs.existsSync(CONFIG.distDir)) {
  console.error('❌ 错误: dist 目录不存在');
  console.log('请先运行: npm run build');
  process.exit(1);
}

// 2. 构建项目
console.log('📦 正在构建项目...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ 构建成功\n');
} catch (error) {
  console.error('❌ 构建失败');
  process.exit(1);
}

// 3. 上传到 COS
console.log('📤 正在上传到腾讯云 COS...');
console.log(`   存储桶: ${CONFIG.cos.bucket}`);
console.log(`   地域: ${CONFIG.cos.region}\n`);

const uploadCommand = `cos-cli upload --local-dir "${CONFIG.distDir}" --bucket-dir / --bucket ${CONFIG.cos.bucket} --region ${CONFIG.cos.region}`;

try {
  execSync(uploadCommand, { stdio: 'inherit' });
  console.log('\n✅ 上传成功\n');
} catch (error) {
  console.error('\n❌ 上传失败');
  console.log('请确保已安装并配置腾讯云 COS CLI');
  console.log('安装: npm install -g cos-cli');
  console.log('配置: cos-cli config');
  process.exit(1);
}

// 4. 刷新 CDN 缓存（可选）
console.log('🗑️ 刷新 CDN 缓存...');
const purgeCommand = `cos-cli purge --url https://partner.velolabs.top --bucket ${CONFIG.cos.bucket} --region ${CONFIG.cos.region}`;

try {
  execSync(purgeCommand, { stdio: 'inherit' });
  console.log('✅ 缓存刷新成功\n');
} catch (error) {
  console.log('⚠️ 缓存刷新失败（可忽略，稍后手动刷新）\n');
}

console.log('🎉 部署完成!');
console.log('\n访问地址: https://partner.velolabs.top');
