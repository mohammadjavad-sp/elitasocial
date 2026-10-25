import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const homeURL = new URL(process.env.CHECK_URL || 'http://127.0.0.1:3000/');
if (!homeURL.pathname.endsWith('/')) homeURL.pathname += '/';
const portfolioURL = new URL('portfolio/', homeURL);
const output = path.resolve('artifacts/ui-check');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
const errors = [];
try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'breakpoint', width: 1050, height: 1000 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'narrow', width: 320, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const failedAssets = [];
    page.on('pageerror', error => errors.push(`${viewport.name}: ${error.message}`));
    page.on('response', response => {
      if (new URL(response.url()).origin === homeURL.origin && response.status() >= 400) failedAssets.push({ url: response.url(), status: response.status() });
    });
    assert.equal((await page.goto(portfolioURL.href, { waitUntil: 'networkidle' }))?.status(), 200, 'Portfolio direct route loads');
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('lang'), 'fa');
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('header .brand').getAttribute('href'), homeURL.pathname, 'Home URL retains deployment subpath');
    assert.equal(await page.locator('header nav a[aria-current="page"]').first().getAttribute('href'), portfolioURL.pathname, 'Portfolio navigation identifies current route');
    assert.equal(await page.locator('.portfolio-demo-notice, .project-demo, .art-demo-label').count(), 0, 'Portfolio omits temporary content labels');
    const cards = page.locator('.portfolio-card');
    const total = await cards.count();
    assert.equal(total, 8, 'Complete initial demo portfolio');
    const filters = page.locator('.portfolio-filters button');
    assert.equal(await filters.count(), 5, 'All and four service filters are available');
    let filteredTotal = 0;
    const categories = [];
    for (let index = 1; index < await filters.count(); index++) {
      const filter = filters.nth(index);
      const label = await filter.innerText();
      await filter.focus();
      await page.keyboard.press(index % 2 ? 'Enter' : 'Space');
      assert.equal(await filter.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.portfolio-filters button[aria-pressed="true"]').count(), 1);
      const count = await cards.count();
      assert(count > 0 && count < total, 'Service filter changes the visible results');
      filteredTotal += count;
      assert((await page.locator('.portfolio-count').innerText()).includes(label), 'Live count announces active category');
      assert.equal(await cards.locator('.project-demo, .art-demo-label').count(), 0, 'Project cards omit temporary content labels');
      const trigger = cards.first().locator('.project-open');
      const title = await cards.first().locator('.project-card-title').innerText();
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ state: 'visible' });
      assert((await dialog.locator('h2').innerText()).trim().length > 0, 'Dialog has a project name');
      assert(title.includes(await dialog.locator('h2').innerText()), 'Dialog describes selected project');
      assert.equal(await dialog.locator('#project-dialog-notice, .project-demo, .art-demo-label').count(), 0, 'Project dialog omits temporary content labels');
      assert.doesNotMatch(await dialog.locator('#project-dialog-description').innerText(), /نمایشی|ساختگی|فرضی/, 'Project description uses neutral design details');
      const consultation = new URL(await dialog.locator('a[href*="wa.me"]').getAttribute('href'));
      assert.equal(consultation.hostname, 'wa.me');
      assert(consultation.searchParams.get('text')?.includes(await dialog.locator('h2').innerText()), 'Consultation includes selected concept, without sending a message');
      await dialog.locator('a').focus();
      await page.keyboard.press('Tab');
      // Native modal dialogs permit tabbing to browser chrome before wrapping;
      // page content behind the modal must remain unavailable to focus.
      if (!await page.evaluate(() => document.hasFocus())) await page.keyboard.press('Tab');
      assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Tab returns to modal controls without visiting background content');
      await page.locator('header .brand').evaluate(element => element.focus());
      assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Background content is inert while modal is open');
      if (viewport.name === 'mobile' && index === 1) await dialog.screenshot({ path: path.join(output, 'mobile-project-dialog.png'), animations: 'disabled' });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert(await trigger.evaluate(element => document.activeElement === element), 'Escape restores focus to project trigger');
      assert.equal(await page.locator('body').evaluate(element => element.style.overflow), '', 'Closing modal restores page scrolling');
      categories.push({ label, count, keyboardFilterAndDialogTested: true });
    }
    assert.equal(filteredTotal, total, 'Service filters cover the complete portfolio without duplication');
    await filters.first().click();
    assert.equal(await cards.count(), total, 'All restores every project');
    const brokenLinks = await page.locator('a').evaluateAll(links => links.flatMap(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return [href || '(empty href)'];
      const url = new URL(href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash && !document.getElementById(decodeURIComponent(url.hash.slice(1)))) return [href];
      return [];
    }));
    assert.deepEqual(brokenLinks, [], 'No placeholder or broken same-page links');
    const localRoutes = await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(link => new URL(link.href)).filter(url => url.origin === location.origin).map(url => url.origin + url.pathname))]);
    for (const route of localRoutes) assert.equal((await page.request.get(route)).status(), 200, `Local link resolves: ${route}`);
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
    assert(layout.scrollWidth <= layout.width + 1 && layout.bodyWidth <= layout.width + 1, `${viewport.name}: no horizontal overflow ${JSON.stringify(layout)}`);
    const clippedText = await page.locator('h1, main > section > p, .portfolio-demo-notice, .project-card-title, .project-card-caption, .portfolio-filters button').evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect();
      return rect.width && (rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1) ? [{ text: element.textContent, left: rect.left, right: rect.right }] : [];
    }));
    assert.deepEqual(clippedText, [], `${viewport.name}: portfolio text is not clipped`);
    await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); scrollTo(0, 0); });
    await page.screenshot({ path: path.join(output, `${viewport.name}-portfolio-page.png`), fullPage: true, animations: 'disabled' });
    assert.deepEqual(failedAssets, [], 'Deployment assets load');
    results.push({ viewport, total, categories, layout, localRoutes, failedAssets });
    await page.close();
  }
  assert.deepEqual(errors, [], 'No unhandled browser errors');
  await writeFile(path.join(output, 'portfolio-report.json'), JSON.stringify({ passed: true, portfolioURL: portfolioURL.href, results, errors }, null, 2));
  console.log(JSON.stringify({ passed: true, portfolioURL: portfolioURL.href, viewports: results.length }, null, 2));
} catch (error) {
  await writeFile(path.join(output, 'portfolio-report.json'), JSON.stringify({ passed: false, portfolioURL: portfolioURL.href, results, errors, failure: error.message }, null, 2));
  throw error;
} finally {
  await browser.close();
}
