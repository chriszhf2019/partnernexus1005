/**
 * 腾讯云 COS 部署脚本
 *
 * 使用方法:
 * 1. 安装依赖: npm install cos-nodejs-sdk-v5
 * 2. 配置环境变量或填写下方配置
 * 3. 运行: node scripts/deploy-tencent-cos.js
 */

const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

// ============================================
// 配置 - 请根据您的腾讯云配置填写
// ============================================

const CONFIG = {
  // 腾讯云 SecretId (建议使用环境变量)
  secretId: process.env.TENCENT_SECRET_ID || 'YOUR_SECRET_ID',

  // 腾讯云 SecretKey (建议使用环境变量)
  secretKey: process.env.TENCENT_SECRET_KEY || 'YOUR_SECRET_KEY',

  // COS Bucket 名称
  bucket: 'partner-management',

  // COS 区域 (如: ap-guangzhou, ap-shanghai, ap-beijing)
  region: 'ap-guangzhou',

  // COS 路径前缀 (可选)
  prefix: '',

  // 本地构建目录
  distDir: path.join(__dirname, '..', 'dist'),
};

// ============================================
// 上传文件到 COS
// ============================================

function uploadDirectory(cos, distDir, bucket, region, prefix = '') {
  return new Promise((resolve, reject) => {
    const files = [];

    // 递归获取所有文件
    function getFiles(dir, baseDir = dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          getFiles(fullPath, baseDir);
        } else {
          const relativePath = path.relative(baseDir, fullPath);
          files.push({ fullPath, relativePath });
        }
      }
    }

    getFiles(distDir);

    console.log(`\n准备上传 ${files.length} 个文件...\n`);

    let completed = 0;
    let failed = 0;

    files.forEach((file, index) => {
      const cosPath = prefix ? `${prefix}/${file.relativePath}` : file.relativePath;

      cos.putObject(
        {
          Bucket: bucket,
          Region: region,
          Key: cosPath,
          Body: fs.createReadStream(file.fullPath),
          ContentLength: fs.statSync(file.fullPath).size,
        },
        (err, data) => {
          completed++;
          if (err) {
            console.error(`❌ 上传失败: ${cosPath}`, err.message);
            failed++;
          } else {
            console.log(`✅ [${completed}/${files.length}] ${cosPath}`);
          }

          if (completed === files.length) {
            console.log(`\n========================================`);
            console.log(`上传完成! 成功: ${completed - failed}, 失败: ${failed}`);
            console.log(`========================================\n`);

            if (failed === 0) {
              console.log(`\n📌 静态网站访问地址:`);
              console.log(`   https://${bucket}.cos.${region}.myqcloud.com\n`);
              console.log(`📌 如需绑定自定义域名 (partner.velolabs.top):`);
              console.log(`   请在腾讯云 COS 控制台 -> 域名与传输管理 -> 自定义域名`);

              // 设置静态网站配置
              setWebsiteConfig(cos, bucket, region).then(() => {
                resolve({ success: failed === 0, uploaded: completed - failed, failed });
              });
            } else {
              reject(new Error(`${failed} 个文件上传失败`));
            }
          }
        }
      );
    });
  });
}

// 设置 COS 静态网站配置
function setWebsiteConfig(cos, bucket, region) {
  return new Promise((resolve, reject) => {
    cos.putBucketWebsite(
      {
        Bucket: bucket,
        Region: region,
        WebsiteConfiguration: {
          IndexDocument: {
            Suffix: 'index.html',
          },
          ErrorDocument: {
            Key: 'index.html',
          },
          RoutingRules: [
            {
              Condition: {
                ErrorCode: '404',
              },
              Redirect: {
                ReplaceKeyWith: 'index.html',
              },
            },
          ],
        },
      },
      (err, data) => {
        if (err) {
          console.warn('⚠️ 设置静态网站配置失败:', err.message);
          resolve();
        } else {
          console.log('✅ 静态网站配置已设置');
          console.log('   支持 SPA 路由 (所有 404 请求将重定向到 index.html)\n');
          resolve();
        }
      }
    );
  });
}

// 设置 CORS 配置 (允许 Supabase 等 API 调用)
function setCorsConfig(cos, bucket, region) {
  return new Promise((resolve, reject) => {
    cos.putBucketCors(
      {
        Bucket: bucket,
        Region: region,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigin: ['*'],
              AllowedMethod: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
              AllowedHeader: ['*'],
              ExposeHeader: ['ETag'],
              MaxAgeSeconds: '3600',
            },
          ],
        },
      },
      (err, data) => {
        if (err) {
          console.warn('⚠️ 设置 CORS 配置失败:', err.message);
          resolve();
        } else {
          console.log('✅ CORS 配置已设置');
          console.log('   允许跨域请求 (Supabase 等)\n');
          resolve();
        }
      }
    );
  });
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log('==========================================');
  console.log('腾讯云 COS 部署脚本');
  console.log('==========================================\n');

  // 检查配置
  if (CONFIG.secretId === 'YOUR_SECRET_ID' || CONFIG.secretKey === 'YOUR_SECRET_KEY') {
    console.error('❌ 错误: 请先配置腾讯云 SecretId 和 SecretKey');
    console.log('\n方式 1: 修改本脚本中的 CONFIG 对象');
    console.log('方式 2: 设置环境变量:');
    console.log('   export TENCENT_SECRET_ID=your_secret_id');
    console.log('   export TENCENT_SECRET_KEY=your_secret_key\n');
    console.log('方式 3: 使用临时凭证或 CAM 角色\n');
    process.exit(1);
  }

  // 检查 dist 目录
  if (!fs.existsSync(CONFIG.distDir)) {
    console.error(`❌ 错误: 构建目录不存在 ${CONFIG.distDir}`);
    console.log('请先运行 npm run build 构建项目\n');
    process.exit(1);
  }

  // 创建 COS 客户端
  const cos = new COS({
    SecretId: CONFIG.secretId,
    SecretKey: CONFIG.secretKey,
  });

  try {
    // 设置 CORS
    await setCorsConfig(cos, CONFIG.bucket, CONFIG.region);

    // 上传文件
    await uploadDirectory(cos, CONFIG.distDir, CONFIG.bucket, CONFIG.region, CONFIG.prefix);

    console.log('🎉 部署完成!\n');
    console.log('==========================================');
    console.log('后续步骤:');
    console.log('1. 在腾讯云 COS 控制台绑定自定义域名');
    console.log('2. 配置 SSL 证书 (建议使用腾讯云免费证书)');
    console.log('3. 配置 DNS 解析 (将域名 CNAME 到 COS 默认域名)');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 运行
main();
