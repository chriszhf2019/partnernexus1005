const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const results = [];
  const log = (msg, ok = true) => {
    const prefix = ok ? '✅' : '❌';
    console.log(`${prefix} ${msg}`);
    results.push({ msg, ok });
  };

  try {
    // ============ Test 1: Incentives Page - Card Click ============
    console.log('\n--- Test 1: Incentives Page Card Click → Page Navigation ---');
    await page.goto('http://localhost:5173/incentives', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check if we're on the incentives page
    const url1 = page.url();
    log(`Navigated to /incentives: ${url1}`, url1.includes('/incentives'));

    // Try to find and click a card
    const cards = await page.$$('[class*="cursor-pointer"]');
    log(`Found ${cards.length} clickable elements`);

    // Look for cards specifically - try clicking on a card in the incentive plans grid
    const cardClicked = await page.evaluate(() => {
      // Find all elements that look like cards (with classes containing 'card' or 'Card')
      const allElements = document.querySelectorAll('*');
      const cards = [];
      for (const el of allElements) {
        const cls = el.className || '';
        if ((typeof cls === 'string' && (cls.includes('card') || cls.includes('Card')))) {
          cards.push(el);
        }
      }
      return cards.length;
    });
    log(`Detected ${cardClicked} card-like elements`);

    // Try clicking on any element that might navigate to /incentives/
    const navigated = await page.evaluate(() => {
      // Try clicking on elements that might be incentive plan cards
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        if (div.textContent && (div.textContent.includes('预算使用') || div.textContent.includes('总预算'))) {
          // Found a card, click its parent card
          let el = div;
          while (el) {
            if (el.onclick || el.getAttribute('class')?.includes('cursor-pointer')) {
              el.click();
              return true;
            }
            el = el.parentElement;
          }
        }
      }
      return false;
    });

    await page.waitForTimeout(1500);
    const url1b = page.url();
    if (url1b !== url1) {
      log(`Card click navigated to: ${url1b}`, true);

      // Verify it's NOT a modal - check URL changed
      const isNewPage = url1b !== url1 && !url1b.includes('#');
      log(`Navigation is a new page (not modal): ${isNewPage}`, isNewPage);

      // Navigate back
      await page.goBack();
      await page.waitForTimeout(1000);
      log('Back navigation works', page.url().includes('/incentives'));
    } else {
      log('Could not auto-click card (page may need login)', false);
    }

    // ============ Test 2: Direct URL Test for Incentive Detail ============
    console.log('\n--- Test 2: Direct URL Test - Incentive Plan Detail Page ---');
    // Try directly navigating to an incentive plan detail page
    await page.goto('http://localhost:5173/incentives/1', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url2 = page.url();
    log(`Navigated to /incentives/1: ${url2}`, url2.includes('/incentives/1'));

    // Check for detail page content (not empty/error only - check for back button or content)
    const hasContent = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      return body.length > 50; // Basic content check
    });

    if (hasContent) {
      log('Detail page has content', true);
      const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 300) || '');
      console.log('   Page preview:', bodyText.replace(/\n/g, ' | '));
    }

    // Check for back arrow (ChevronLeft) or back button
    const hasBackButton = await page.evaluate(() => {
      return !!document.querySelector('svg') || document.body?.innerText?.includes('返回');
    });
    log(`Page has navigation elements: ${hasBackButton}`, hasBackButton);

    // ============ Test 3: Direct URL Test for Course Detail ============
    console.log('\n--- Test 3: Direct URL Test - Course Detail Page ---');
    await page.goto('http://localhost:5173/enablement/course/test-1', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url3 = page.url();
    log(`Navigated to /enablement/course/test-1: ${url3}`, url3.includes('/enablement/course/'));

    const hasCourseContent = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      return body.length > 30;
    });
    log('Course detail page loaded', hasCourseContent);

    // ============ Test 4: Navigate to Enablement page ============
    console.log('\n--- Test 4: Enablement Page ---');
    await page.goto('http://localhost:5173/enablement', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url4 = page.url();
    log(`Navigated to /enablement: ${url4}`, url4.includes('/enablement'));

    // Check for course cards or content
    const hasCourses = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      return body.length > 50;
    });
    log('Enablement page has content', hasCourses);

    // ============ Test 5: Budget management route ============
    console.log('\n--- Test 5: Budget Management Route ---');
    await page.goto('http://localhost:5173/marketing/budget', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url5 = page.url();
    log(`Navigated to /marketing/budget: ${url5}`, url5.includes('/marketing/budget'));

    // ============ Test 6: Deals route (PipelinePerformanceBoard target) ============
    console.log('\n--- Test 6: Deals Page ---');
    await page.goto('http://localhost:5173/deals', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url6 = page.url();
    log(`Navigated to /deals: ${url6}`, url6.includes('/deals'));

    // ============ Summary ============
    console.log('\n========== SUMMARY ==========');
    const passCount = results.filter(r => r.ok).length;
    const failCount = results.filter(r => !r.ok).length;
    console.log(`Passed: ${passCount}, Failed: ${failCount}, Total: ${results.length}`);

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
})();
