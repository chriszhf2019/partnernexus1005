import { test, expect } from '@playwright/test';

// 基础冒烟测试
test.describe('冒烟测试', () => {
  test('首页加载并跳转到登录', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/PartnerNexus/i);
  });

  test('登录页面包含表单元素', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('mock登录成功后跳转到仪表盘', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@partnernxus.com');
    await page.fill('input[type="password"]', 'any_password');
    await page.click('button[type="submit"]');
    // 登录成功应跳转到 /ecosystem
    await expect(page).toHaveURL(/\/ecosystem/);
  });
});

test.describe('核心页面加载', () => {
  test('合作伙伴列表页', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@partnernxus.com');
    await page.fill('input[type="password"]', 'any_password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/ecosystem/);

    // 导航到合作伙伴页
    await page.goto('/partners');
    await expect(page.locator('h1, .page-title')).toBeVisible({ timeout: 10000 });
  });

  test('商机管理页', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@partnernxus.com');
    await page.fill('input[type="password"]', 'any_password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/ecosystem/);

    await page.goto('/deals');
    await expect(page).toHaveURL(/\/deals/);
  });
});
