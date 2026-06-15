# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-online.spec.ts >> 在线冒烟测试 (partner.velolabs.top) >> mock登录后导航到列表页
- Location: e2e/smoke-online.spec.ts:18:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h1').first()

```

```yaml
- navigation "Main navigation":
  - text: PartnerNexus
  - navigation:
    - button "工作台"
    - button "合作伙伴"
    - button "商机管理"
    - button "营销赋能"
    - button "激励政策"
    - button "赋能培训"
    - button "数据分析"
    - button "设置"
  - button "合作伙伴中心"
  - text: "?"
  - paragraph: 暂无数据
  - button "Toggle theme"
  - button "中文"
  - button "EN"
  - text: 系
  - paragraph: 系统管理员
  - paragraph: 系统管理员
  - button "Logout"
- banner:
  - searchbox "Search partners"
  - button "Notifications"
  - text: PartnerNexus
- main:
  - text: 生态健康度
  - paragraph: 覆盖
  - paragraph: "0"
  - text: 覆盖决定了生意的上限。诊断区域分布、行业渗透和空白市场，指导招商策略。
  - paragraph: 活跃
  - paragraph: "0"
  - text: 活跃决定了过程。诊断伙伴的参与深度，识别「僵尸伙伴」和「超级贡献者」。
  - paragraph: 能力
  - paragraph: "0"
  - text: 能效决定了利润。诊断投入产出比，识别「高投入低产出」和「低资源高成长」伙伴。
  - paragraph: 综合评分
  - paragraph: "0"
  - text: 覆盖 0 · 活跃 0 · 能力 0 0 家伙伴 · 0 待批复 · 0 沉睡
  - paragraph: 覆盖健康
  - paragraph: 伙伴总数与分布
  - text: 覆盖决定了生意的上限。诊断区域分布、行业渗透和空白市场，指导招商策略。
  - paragraph: "0"
  - text: — +0 本月 — -0 本月 同比 — 0% 环比 — 0%
  - paragraph: 区域分布
  - paragraph: 行业分布
  - paragraph: 等级结构
  - button "查看详情"
  - paragraph: 活跃健康
  - paragraph: 近30天活跃率
  - text: 活跃决定了过程。诊断伙伴的参与深度，识别「僵尸伙伴」和「超级贡献者」。
  - paragraph: 0%
  - text: 0 家活跃 0 家沉睡
  - paragraph: 市场参与
  - paragraph: 0%
  - text: 市场参与度：参与市场活动、报备商机的伙伴比例
  - paragraph: 激励执行
  - paragraph: 0%
  - text: 激励执行率：参与激励计划并完成目标的伙伴比例
  - paragraph: 业务互动
  - paragraph: 0%
  - text: 业务互动率：有商机报备或成交记录的伙伴比例
  - paragraph: 参与度漏斗
  - text: 注册伙伴 0 合作中 0 有商机 0 高产出(≥50%) 0
  - button "查看详情"
  - paragraph: 能力健康
  - paragraph: 能力达标率
  - text: 能效决定了利润。诊断投入产出比，识别「高投入低产出」和「低资源高成长」伙伴。
  - paragraph: 0%
  - text: 0 家实战成果 0% 认证深度
  - paragraph: 实战成果
  - paragraph: "0"
  - text: 实战成果：有成功交付项目经验的伙伴数量
  - paragraph: 拓新能力
  - paragraph: "0"
  - text: 拓新能力：赢单率超过30%的伙伴数量
  - paragraph: 认证深度
  - paragraph: 0%
  - text: 认证深度：技术人员认证覆盖率
  - paragraph: 能力雷达
  - text: 技术能力 0 销售能力 0 服务能力 0 市场能力 0
  - button "查看详情"
  - heading "智能诊断区" [level=3]
  - text: 综合预警
  - button "综合"
  - button "覆盖"
  - button "活跃"
  - button "能力"
  - text: 待批复超时预警
  - paragraph: 0 家伙伴超过3天未批复，影响入驻体验
  - button "立即处理 →"
  - text: 沉睡伙伴预警
  - paragraph: 0 家合作中伙伴无商机产出，存在流失风险
  - button "制定唤醒计划 →"
  - text: 高产出伙伴
  - paragraph: 0 家伙伴赢单率≥50%，建议重点扶持
  - button "查看名单 →"
  - heading "📋 生态健康摘要" [level=4]
  - paragraph: "0"
  - paragraph: 伙伴总数
  - paragraph: "0"
  - paragraph: 合作中
  - paragraph: "0"
  - paragraph: 待批复
  - paragraph: "0"
  - paragraph: 有赢单
  - heading "行动中心" [level=3]
  - text: 0 项待办
  - button "刷新"
  - paragraph: 招募任务
  - paragraph: 新伙伴入驻
  - paragraph: 暂无待批复申请
  - button "查看招募状态"
  - paragraph: 激励任务
  - paragraph: 唤醒沉睡伙伴
  - paragraph: 所有伙伴均有产出 ✓
  - button "查看激励状态"
  - paragraph: 赋能任务
  - paragraph: 能力提升计划
  - text: 0 高产出
  - button "查看高产出名单"
  - textbox "搜索名称/区域/类型/级别/联系人..."
  - button "全部 0"
  - text: 显示全部合作伙伴
  - button "🏆 高产出 0"
  - text: 赢单率超过 50% 的活跃伙伴
  - button "💤 沉睡 0"
  - text: 合作中但无商机产出的伙伴
  - button "🆕 新进 0"
  - text: 待审核的新伙伴
  - button "📈 上升 0"
  - text: 近 90 天内新加入的伙伴
  - button "高级筛选"
  - button "导出"
  - button "导入"
  - button "新增合作伙伴"
  - button "全部"
  - button "待批复"
  - button
  - button "区域地图视图"
  - button
  - heading "没有找到合作伙伴" [level=3]
  - paragraph: 尝试调整搜索条件或筛选器
- contentinfo: Secure Enterprise Connection 2026/06/15 10:06:55 GMT+8 Need assistance?
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('在线冒烟测试 (partner.velolabs.top)', () => {
  4  | 
  5  |   test('首页加载', async ({ page }) => {
  6  |     const response = await page.goto('https://partner.velolabs.top/');
  7  |     expect(response?.ok()).toBeTruthy();
  8  |     await expect(page).toHaveTitle(/PartnerNexus|Hermes/i);
  9  |     console.log('首页 title:', await page.title());
  10 |   });
  11 | 
  12 |   test('登录页面包含表单元素', async ({ page }) => {
  13 |     await page.goto('https://partner.velolabs.top/login');
  14 |     await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  15 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  16 |   });
  17 | 
  18 |   test('mock登录后导航到列表页', async ({ page }) => {
  19 |     await page.goto('https://partner.velolabs.top/login');
  20 |     await page.fill('input[type="email"]', 'admin@partnernxus.com');
  21 |     await page.fill('input[type="password"]', 'any_password');
  22 |     await page.click('button[type="submit"]');
  23 |     await expect(page).toHaveURL(/\/ecosystem/, { timeout: 10000 });
  24 |     console.log('Dash URL:', page.url());
  25 | 
  26 |     await page.goto('https://partner.velolabs.top/partners');
  27 |     await page.waitForLoadState('networkidle');
> 28 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
     |                                              ^ Error: expect(locator).toBeVisible() failed
  29 | 
  30 |     await page.goto('https://partner.velolabs.top/deals');
  31 |     await page.waitForLoadState('networkidle');
  32 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  33 |   });
  34 | 
  35 |   test('合作伙伴详情页打开正常', async ({ page }) => {
  36 |     await page.goto('https://partner.velolabs.top/login');
  37 |     await page.fill('input[type="email"]', 'admin@partnernxus.com');
  38 |     await page.fill('input[type="password"]', 'any_password');
  39 |     await page.click('button[type="submit"]');
  40 |     await page.waitForURL(/\/ecosystem/, { timeout: 10000 });
  41 | 
  42 |     await page.goto('https://partner.velolabs.top/partners');
  43 |     await page.waitForLoadState('networkidle');
  44 |     await page.waitForTimeout(2000);
  45 | 
  46 |     // Click first deal row
  47 |     const firstRow = page.locator('tbody tr, [class*="cursor-pointer"]').first();
  48 |     if (await firstRow.count() > 0) {
  49 |       await firstRow.click();
  50 |       await page.waitForTimeout(3000);
  51 |       console.log('Detail URL:', page.url());
  52 |       const hasError = await page.locator('text=未找到').count();
  53 |       expect(hasError).toBe(0);
  54 |     }
  55 |   });
  56 | 
  57 |   test('商机详情页打开正常', async ({ page }) => {
  58 |     await page.goto('https://partner.velolabs.top/login');
  59 |     await page.fill('input[type="email"]', 'admin@partnernxus.com');
  60 |     await page.fill('input[type="password"]', 'any_password');
  61 |     await page.click('button[type="submit"]');
  62 |     await page.waitForURL(/\/ecosystem/, { timeout: 10000 });
  63 | 
  64 |     await page.goto('https://partner.velolabs.top/deals');
  65 |     await page.waitForLoadState('networkidle');
  66 |     await page.waitForTimeout(2000);
  67 | 
  68 |     const firstRow = page.locator('tbody tr').first();
  69 |     if (await firstRow.count() > 0) {
  70 |       await firstRow.click();
  71 |       await page.waitForTimeout(3000);
  72 |       console.log('Deal detail URL:', page.url());
  73 |       const hasError = await page.locator('text=未找到').count();
  74 |       expect(hasError).toBe(0);
  75 |     }
  76 |   });
  77 | 
  78 |   test('合作伙伴新建表单加载', async ({ page }) => {
  79 |     await page.goto('https://partner.velolabs.top/login');
  80 |     await page.fill('input[type="email"]', 'admin@partnernxus.com');
  81 |     await page.fill('input[type="password"]', 'any_password');
  82 |     await page.click('button[type="submit"]');
  83 |     await page.waitForURL(/\/ecosystem/, { timeout: 10000 });
  84 | 
  85 |     await page.goto('https://partner.velolabs.top/partners/new');
  86 |     await page.waitForLoadState('networkidle');
  87 |     await expect(page.locator('h1')).toContainText('合作伙伴注册申请', { timeout: 10000 });
  88 |   });
  89 | });
  90 | 
```