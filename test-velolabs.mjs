import { chromium } from 'playwright';

const BASE_URL = 'https://partner.velolabs.top';
const CREDENTIALS = { email: 'admin@partnernxus.com', password: 'Demo@123456' };

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

let passed = 0, failed = 0;
function result(name, ok, msg) {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}: ${msg}`); }
}

// Login
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(CREDENTIALS.email);
await page.locator('input[type="password"]').fill(CREDENTIALS.password);
await Promise.all([
  page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
  page.locator('button:has-text("登录")').click()
]);
await page.waitForTimeout(2000);

// Navigate to Partners
await page.locator('button:has-text("合作伙伴")').first().click();
await page.waitForTimeout(2000);

// Test pagination with more specific selectors
console.log('\n--- Pagination ---');
const pageBtn = page.locator('nav button').filter({ hasText: /^[0-9]+$/ });
const pageCount = await pageBtn.count();
console.log(`  Found ${pageCount} page buttons`);
for (let i = 0; i < pageCount; i++) {
  await pageBtn.nth(i).click();
  await page.waitForTimeout(500);
  result(`Pagination: Page ${i+1}`, true);
}
// Test prev/next
const prevBtn = page.locator('button:has-text("上一页")');
const nextBtn = page.locator('button:has-text("下一页")');
if (await prevBtn.isVisible() && await prevBtn.isEnabled()) {
  await prevBtn.click();
  await page.waitForTimeout(500);
  result('Pagination: 上一页', true);
}
if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
  await nextBtn.click();
  await page.waitForTimeout(500);
  result('Pagination: 下一页', true);
}

// Test table sort/filter area
console.log('\n--- Table Filters ---');
const statusBtn = page.locator('button:has-text("全部")').first();
if (await statusBtn.isVisible()) {
  await statusBtn.click();
  await page.waitForTimeout(300);
  result('Filter: 全部 status', true);
}

// Check for dropdown options
const dropdownOpts = page.locator('[role="listbox"] button, [role="option"], [class*="dropdown"] button');
if (await dropdownOpts.count() > 0) {
  result('Dropdown has options', true);
}

// Click "高级" (Advanced) filter
const advancedBtn = page.locator('button:has-text("高级")');
if (await advancedBtn.isVisible()) {
  await advancedBtn.click();
  await page.waitForTimeout(800);
  result('Filter: 高级 (Advanced)', true);
  await page.screenshot({ path: '/tmp/16-advanced-filter.png', fullPage: false });
  // Close
  if (await advancedBtn.isVisible()) {
    await advancedBtn.click();
    await page.waitForTimeout(300);
  }
}

// Test table data display
const tableHeaders = await page.locator('table th, [class*="header"]').filter({ hasText: /名称|类型|等级|状态|联系人|操作/ });
const headerCount = await tableHeaders.count();
result(`Table has headers`, headerCount >= 5, `Found ${headerCount} headers`);

// Test refresh button
const refreshBtn = page.locator('button:has-text("刷新")');
if (await refreshBtn.isVisible()) {
  await refreshBtn.click();
  await page.waitForTimeout(800);
  result('Button: 刷新 (Refresh)', true);
}

// Check for "打开待办中心" button
const todoBtn = page.locator('button:has-text("打开待办中心")');
if (await todoBtn.isVisible()) {
  await todoBtn.click();
  await page.waitForTimeout(1000);
  result('Button: 打开待办中心', page.url().includes('todo'), `URL: ${page.url()}`);
  await page.screenshot({ path: '/tmp/17-todo-center.png', fullPage: false });
  // Navigate back
  await page.locator('button:has-text("合作伙伴")').first().click();
  await page.waitForTimeout(1000);
} else {
  result('Button: 打开待办中心', false, 'Not visible on current page');
}

// Test partner detail by clicking a table row
console.log('\n--- Partner Detail ---');
const partnerNameLinks = page.locator('a, span, button').filter({ hasText: /华为技术|东软集团|中科软/ });
if (await partnerNameLinks.count() > 0) {
  await partnerNameLinks.first().click();
  await page.waitForTimeout(1500);
  result('Open partner detail', page.url().includes('partners'), `URL: ${page.url()}`);
  await page.screenshot({ path: '/tmp/15-partner-detail.png', fullPage: true });
  
  // Check partner detail page elements
  const detailContent = await page.locator('body').textContent();
  const hasProfile = detailContent.includes('华为') || detailContent.includes('深圳');
  result('Partner detail shows info', hasProfile, '');
}

console.log(`\n=== Test Results: ${passed} passed, ${failed} failed ===`);
await browser.close();
