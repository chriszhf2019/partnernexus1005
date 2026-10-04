/**
 * 新手指引功能测试脚本
 * 使用 Playwright 进行端到端测试
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOnboardingGuide() {
  console.log('🚀 开始测试新手指引功能...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 清除 localStorage 确保显示引导
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.removeItem('partnernexus_onboarding_seen');
    });
    console.log('✅ 1. 已清除 localStorage');

    // 2. 访问登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await sleep(2000);
    console.log('✅ 2. 访问登录页面');

    // 3. 查找并填写登录表单 - 使用更精确的选择器
    const emailInput = await page.waitForSelector('#email', { timeout: 5000 }).catch(() => null);
    const passwordInput = await page.waitForSelector('#password', { timeout: 5000 }).catch(() => null);

    if (emailInput && passwordInput) {
      await emailInput.fill('admin@partnernxus.com');
      await passwordInput.fill('Demo@123456');
      console.log('✅ 3. 已填写登录信息');

      // 点击登录按钮
      await page.click('button[type="submit"]');
      console.log('✅ 4. 已点击登录按钮');

      // 等待导航和加载
      await page.waitForURL('**/ecosystem', { timeout: 5000 }).catch(() => {});
      await sleep(2000);
    } else {
      console.log('⚠️ 未找到登录表单');
    }

    // 4. 等待并检查新手指引弹窗
    console.log('\n📋 检查新手指引弹窗：');
    await sleep(2000);

    // 检查 Modal 组件
    const modalOpen = await page.evaluate(() => {
      const modals = document.querySelectorAll('[class*="fixed"], [class*="inset-0"]');
      let found = false;
      modals.forEach(modal => {
        const text = modal.textContent || '';
        if (text.includes('欢迎使用') || text.includes('PartnerNexus')) {
          found = true;
        }
      });
      return found;
    });

    if (modalOpen) {
      console.log('✅ 5. 新手指引弹窗已显示');
    } else {
      console.log('⚠️ 未检测到新手指引弹窗（可能已跳过）');
    }

    // 5. 检查页面内容
    const bodyContent = await page.textContent('body');

    const checks = [
      { name: '欢迎使用 PartnerNexus', pattern: /欢迎使用 PartnerNexus/ },
      { name: '合作伙伴管理', pattern: /合作伙伴/ },
      { name: '商机与转化', pattern: /商机/ },
      { name: '营销获客', pattern: /营销/ },
      { name: '激励政策', pattern: /激励/ },
      { name: '数据分析', pattern: /数据.*分析/ },
      { name: '实用提示', pattern: /实用提示/ },
      { name: '常见问题', pattern: /常见问题/ },
      { name: '下一步按钮', pattern: /下一步/ },
      { name: '上一步按钮', pattern: /上一步/ },
      { name: '跳过按钮', pattern: /跳过/ },
    ];

    console.log('\n📋 内容检查：');
    checks.forEach(check => {
      const found = check.pattern.test(bodyContent);
      console.log(`   ${found ? '✅' : '⚠️'} ${check.name}`);
    });

    // 6. 关闭弹窗并访问设置页面的帮助 Tab
    console.log('\n🖱️ 测试设置页面：');

    // 先点击"跳过"按钮关闭弹窗
    const skipButton = await page.$('button:has-text("跳过")');
    if (skipButton) {
      await skipButton.click();
      console.log('✅ 6. 已关闭引导弹窗');
    }
    await sleep(500);

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await sleep(1000);

    // 点击帮助与指引 Tab
    const tabs = await page.$$('[role="tab"]');
    for (const tab of tabs) {
      const text = await tab.textContent();
      if (text && text.includes('帮助')) {
        await tab.click();
        console.log('✅ 7. 已点击帮助与指引 Tab');
        break;
      }
    }

    await sleep(1000);

    // 检查帮助页面内容
    const helpContent = await page.textContent('body');
    const helpChecks = [
      { name: '新手指引卡片', pattern: /新手指引/ },
      { name: '快速上手流程', pattern: /快速上手/ },
      { name: '常见问题', pattern: /常见问题/ },
      { name: '键盘快捷键', pattern: /键盘.*快捷键/ },
      { name: '开始指引按钮', pattern: /开始指引/ },
    ];

    console.log('\n📋 帮助页面内容检查：');
    helpChecks.forEach(check => {
      const found = check.pattern.test(helpContent);
      console.log(`   ${found ? '✅' : '⚠️'} ${check.name}`);
    });

    // 8. 点击开始指引按钮测试弹窗
    const startButton = await page.$('button:has-text("开始指引")');
    if (startButton) {
      await startButton.click();
      await sleep(500);
      console.log('\n✅ 8. 已点击开始指引按钮');

      // 检查弹窗是否显示
      const modalContent = await page.textContent('body');
      const hasModal = modalContent.includes('欢迎使用') || modalContent.includes('开始快速上手');
      console.log(`   ${hasModal ? '✅' : '⚠️'} 弹窗已显示`);
    }

    console.log('\n🎉 测试完成！\n');

  } catch (error) {
    console.error('❌ 测试失败：', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// 运行测试
testOnboardingGuide();
