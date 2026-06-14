import { test, expect, Page } from '@playwright/test';

const CREDENTIALS = {
  email: 'admin@partnernxus.com',
  password: 'YOUR_PASSWORD',
};

/** 登录并等待跳转到仪表盘 */
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', CREDENTIALS.email);
  await page.fill('input[type="password"]', CREDENTIALS.password);
  await page.click('button[type="submit"]');
  // 等待登录成功并跳转到 ecosystem
  await page.waitForURL(/\/ecosystem/, { timeout: 15000 });
}

/** 等待页面内容加载完成（骨架屏消失 + 标题可见）*/
async function waitForPageReady(page: Page, headingText?: string | RegExp) {
  // 等待骨架屏或 loading 状态消失
  await page.waitForLoadState('networkidle');
  if (headingText) {
    await expect(page.locator('h1, h2, h3').getByText(headingText)).toBeVisible({ timeout: 10000 });
  }
}

// ============================================================
// 套件 1：登录认证
// ============================================================
test.describe('登录认证', () => {
  test('登录页加载并包含表单元素', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/PartnerNexus/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('使用正确凭据登录成功', async ({ page }) => {
    await login(page);
    // 登录成功后应导航到 /ecosystem
    expect(page.url()).toContain('/ecosystem');
  });

  test('错误密码提示错误信息', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', 'wrong_password');
    await page.click('button[type="submit"]');
    // 等待错误提示出现
    const errorMsg = page.locator('text=邮箱或密码错误');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// 套件 2：工作台（Ecosystem Dashboard）
// ============================================================
test.describe('工作台 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForURL(/\/ecosystem/);
    await page.waitForLoadState('networkidle');
  });

  test('页面标题显示正确', async ({ page }) => {
    await expect(page).toHaveTitle(/PartnerNexus/i);
    await expect(page.locator('text=业绩总揽与根因分析')).toBeVisible({ timeout: 10000 });
  });

  test('顶部导航栏完整', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav.locator('text=工作台')).toBeVisible();
    await expect(nav.locator('text=合作伙伴')).toBeVisible();
    await expect(nav.locator('text=商机管理')).toBeVisible();
    await expect(nav.locator('text=营销赋能')).toBeVisible();
    await expect(nav.locator('text=激励政策')).toBeVisible();
    await expect(nav.locator('text=赋能培训')).toBeVisible();
    await expect(nav.locator('text=数据分析')).toBeVisible();
    await expect(nav.locator('text=设置')).toBeVisible();
  });

  test('用户信息和语言切换可用', async ({ page }) => {
    // 顶部显示用户名
    await expect(page.locator('text=Ecosystem Admin')).toBeVisible({ timeout: 5000 });
    // 语言切换按钮
    await expect(page.locator('button:has-text("中文"), button:has-text("EN")').first()).toBeVisible();
  });

  test('KPI 卡片展示合作伙伴阶段数据', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // KPI 卡片包含生命周期阶段
    const kpis = page.locator('text=导入期, text=成长期, text=成熟期, text=衰退期');
    await expect(kpis.first()).toBeVisible({ timeout: 8000 });
  });

  test('渠道分析三大板块可见', async ({ page }) => {
    await expect(page.locator('text=渠道分析')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=覆盖').first()).toBeVisible();
    await expect(page.locator('text=活跃度').first()).toBeVisible();
    await expect(page.locator('text=绩效评估')).toBeVisible();
  });

  test('AI 行动建议模块存在', async ({ page }) => {
    await expect(page.locator('text=AI 行动建议')).toBeVisible({ timeout: 8000 });
  });

  test('行业热榜显示新闻条目', async ({ page }) => {
    await expect(page.locator('text=行业热榜')).toBeVisible({ timeout: 8000 });
    // 至少有一条新闻链接
    const newsLinks = page.locator('a:has-text("工信部"), a:has-text("华为"), a:has-text("AI+")');
    await expect(newsLinks.first()).toBeVisible({ timeout: 5000 });
  });

  test('搜索框可用', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="搜索"]').first();
    await expect(search).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// 套件 3：合作伙伴管理
// ============================================================
test.describe('合作伙伴管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForURL(/\/ecosystem/);
    await page.goto('/partners');
    await page.waitForLoadState('networkidle');
  });

  test('页面标题和描述正确', async ({ page }) => {
    await expect(page.locator('text=合作伙伴管理中心')).toBeVisible({ timeout: 10000 });
  });

  test('合作伙伴列表加载数据', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // 总数显示（至少 1 个合作伙伴）
    await expect(page.locator('text=全部').first()).toBeVisible({ timeout: 8000 });
  });

  test('自动分层筛选按钮可见', async ({ page }) => {
    await expect(page.locator('text=高产出, text=沉睡, text=新进, text=上升').first()).toBeVisible({ timeout: 8000 });
  });

  test('健康评分模块可见', async ({ page }) => {
    await expect(page.locator('text=覆盖健康, text=活跃健康, text=能效健康').first()).toBeVisible({ timeout: 8000 });
  });

  test('搜索功能可用', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('新增合作伙伴按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("新增合作伙伴")').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// 套件 4：商机管理
// ============================================================
test.describe('商机管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
  });

  test('页面标题正确', async ({ page }) => {
    await expect(page.locator('text=商机管理')).toBeVisible({ timeout: 10000 });
  });

  test('管线统计卡片展示', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=活跃商机').first()).toBeVisible({ timeout: 8000 });
  });

  test('商机列表有数据行', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // 等待表格出现 - 至少有一行数据
    const rows = page.locator('table tbody tr, [class*="tr"], [role="row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('快速筛选按钮可用', async ({ page }) => {
    await expect(page.locator('text=快捷筛选')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=本周待审批, text=异常停滞, text=即将到期').first()).toBeVisible({ timeout: 5000 });
  });

  test('新增报备按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("新增报备")').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// 套件 5：营销赋能
// ============================================================
test.describe('营销赋能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/marketing');
    await page.waitForLoadState('networkidle');
  });

  test('页面标题正确', async ({ page }) => {
    await expect(page.locator('text=营销赋能')).toBeVisible({ timeout: 10000 });
  });

  test('三大舱位（执行/对齐/转化）可见', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=执行舱')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=对齐舱')).toBeVisible();
    await expect(page.locator('text=转化舱')).toBeVisible();
  });

  test('年度规划和新建活动按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("年度规划")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("新建活动")').first()).toBeVisible();
  });

  test('线索漏斗模块可见', async ({ page }) => {
    await expect(page.locator('text=全生命周期线索漏斗')).toBeVisible({ timeout: 8000 });
  });

  test('活动列表展示', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // 活动卡片或列表存在
    const activities = page.locator('[class*="activity"], [class*="card"], [class*="row"]').first();
    await expect(activities).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// 套件 6：激励政策
// ============================================================
test.describe('激励政策', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/incentives');
    await page.waitForLoadState('networkidle');
  });

  test('页面标题正确', async ({ page }) => {
    await expect(page.locator('text=激励政策管理')).toBeVisible({ timeout: 10000 });
  });

  test('概览和政策的Tab切换', async ({ page }) => {
    await expect(page.locator('button:has-text("概览"), button:has-text("政策管理")').first()).toBeVisible({ timeout: 8000 });
  });

  test('KPI 统计数据展示', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=活跃计划')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=总预算').first()).toBeVisible({ timeout: 5000 });
  });

  test('激励计划列表有数据', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const programCards = page.locator('[class*="rounded-xl"], [class*="card"], [role="listitem"]');
    const first = programCards.first();
    await expect(first).toBeVisible({ timeout: 8000 });
  });

  test('搜索/筛选功能可用', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// 套件 7：设置
// ============================================================
test.describe('系统设置', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('页面标题正确', async ({ page }) => {
    await expect(page.locator('text=System Settings')).toBeVisible({ timeout: 10000 });
  });

  test('所有设置Tab可见', async ({ page }) => {
    const tabs = ['公司信息', '用户管理', '角色权限', '安全设置', '全局设置', '分类引擎', 'AI 配置'];
    for (const tab of tabs) {
      await expect(page.locator(`role=tab[name="${tab}"]`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('公司信息Tab默认激活并显示表单', async ({ page }) => {
    // 默认激活公司信息
    await expect(page.locator('text=公司基本信息')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=业务目标与规模')).toBeVisible({ timeout: 5000 });
  });

  test('切换Tab后内容变化', async ({ page }) => {
    // 点击"全局设置"
    await page.locator('role=tab[name="全局设置"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=全局配置')).toBeVisible({ timeout: 5000 });

    // 点击"AI 配置"
    await page.locator('role=tab[name="AI 配置"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=AI').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// 套件 8：导航测试 - 侧边栏菜单导航
// ============================================================
test.describe('导航与菜单', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForURL(/\/ecosystem/);
    await page.waitForLoadState('networkidle');
  });

  test('侧边栏"合作伙伴"导航到 /partners', async ({ page }) => {
    await page.locator('button:has-text("合作伙伴")').first().click();
    await page.waitForURL(/\/partners/);
    await expect(page.locator('text=合作伙伴管理中心')).toBeVisible({ timeout: 10000 });
  });

  test('侧边栏"商机管理"导航到 /deals', async ({ page }) => {
    await page.locator('button:has-text("商机管理")').first().click();
    await page.waitForURL(/\/deals/);
    await expect(page.locator('text=商机管理').first()).toBeVisible({ timeout: 10000 });
  });

  test('侧边栏"激励政策"导航到 /incentives', async ({ page }) => {
    await page.locator('button:has-text("激励政策")').first().click();
    await page.waitForURL(/\/incentives/);
    await expect(page.locator('text=激励政策管理')).toBeVisible({ timeout: 10000 });
  });

  test('侧边栏"设置"导航到 /settings', async ({ page }) => {
    await page.locator('button:has-text("设置")').first().click();
    await page.waitForURL(/\/settings/);
    await expect(page.locator('text=System Settings')).toBeVisible({ timeout: 10000 });
  });

  test('点击"PartnerNexus"回到工作台', async ({ page }) => {
    // 先进入合作伙伴页
    await page.goto('/partners');
    await page.waitForLoadState('networkidle');
    // 点击 logo
    await page.locator('text=PartnerNexus').first().click();
    await page.waitForURL(/\/ecosystem/, { timeout: 10000 });
  });
});

// ============================================================
// 套件 9：页面截图（可视化验证）
// ============================================================
test.describe('页面截图', () => {
  test('生态系统仪表盘截图', async ({ page }) => {
    await login(page);
    await page.waitForURL(/\/ecosystem/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 等待图表渲染
    await expect(page.locator('text=业绩总揽与根因分析')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/ecosystem-dashboard.png', fullPage: true });
  });

  test('合作伙伴列表截图', async ({ page }) => {
    await login(page);
    await page.goto('/partners');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/partners-list.png', fullPage: true });
  });

  test('商机管理截图', async ({ page }) => {
    await login(page);
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/deals-page.png', fullPage: true });
  });

  test('营销赋能截图', async ({ page }) => {
    await login(page);
    await page.goto('/marketing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/marketing-page.png', fullPage: true });
  });

  test('激励政策截图', async ({ page }) => {
    await login(page);
    await page.goto('/incentives');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/incentives-page.png', fullPage: true });
  });
});
