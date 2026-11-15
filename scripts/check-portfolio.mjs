import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const homeURL = new URL(process.env.CHECK_URL || 'http://127.0.0.1:3000/');
if (!homeURL.pathname.endsWith('/')) homeURL.pathname += '/';
const accountURL = 'https://www.instagram.com/elita.nasl/';
const output = path.resolve('artifacts/portfolio-invitation-check');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
try {
  for (const width of [1440, 768, 390, 320]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(value => localStorage.setItem('elita-theme', value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    assert.equal((await page.goto(homeURL.href, { waitUntil: 'networkidle' }))?.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    const section = page.locator('#portfolio');
    assert.equal(await section.locator('.portfolio-social-topics li').count(), 4);
    assert.equal(await page.locator('.portfolio-card, .project-open, .project-dialog, iframe[src*="instagram"]').count(), 0);
    const invitation = section.locator('a.portfolio-social-action');
    assert.equal(await invitation.getAttribute('href'), accountURL);
    assert.equal(await invitation.getAttribute('target'), '_blank');
    assert.match(await invitation.getAttribute('rel'), /noopener/);
    assert.equal(await page.locator('.hero .secondary-button').getAttribute('href'), accountURL);
    assert.equal(await page.locator('.footer-links a[href*="instagram.com"]').getAttribute('href'), accountURL);
    const oldLinks = await page.locator('a[href]').evaluateAll(links => links.filter(link => new URL(link.href).origin === location.origin && /\/portfolio\/?$/.test(new URL(link.href).pathname)).map(link => link.href));
    assert.deepEqual(oldLinks, [], 'No public links point to the retired page');
    await invitation.scrollIntoViewIfNeeded();
    await invitation.focus();
    assert(await invitation.evaluate(link => document.activeElement === link));
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    assert(layout.scrollWidth <= width + 1, `No horizontal overflow at ${width} in ${theme}`);
    for (const element of await section.locator('h2, .portfolio-social-action, .portfolio-social-profile').all()) {
      const rect = await element.boundingBox();
      assert(rect.x >= -1 && rect.x + rect.width <= width + 1, 'Invitation content stays inside the viewport');
    }
    await invitation.evaluate(element => element.blur());
    await section.screenshot({ path: path.join(output, `${width}-${theme}.png`), animations: 'disabled' });
    if (width === 390) {
      for (const slug of ['instagram', 'website', 'seo', 'content']) {
        assert.equal((await page.goto(new URL(`services/${slug}/`, homeURL).href, { waitUntil: 'networkidle' }))?.status(), 200);
        assert.equal(await page.locator('.service-related-heading > a').getAttribute('href'), accountURL);
      }
    }
    assert.deepEqual(errors, [], 'No unhandled browser errors');
    results.push({ width, theme, layout, passed: true });
    await context.close();
  }
  if (process.env.CHECK_STATIC !== 'true') {
    const context = await browser.newContext();
    const oldURL = new URL('portfolio', homeURL);
    const response = await context.request.get(oldURL.href, { maxRedirects: 0 });
    assert.equal(response.status(), 308, 'The removed page permanently redirects');
    const target = new URL(response.headers().location, homeURL);
    assert.equal(target.pathname, homeURL.pathname);
    assert.equal(target.hash, '#portfolio');
    await context.close();
  }
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ passed: true, results }, null, 2));
  console.log(JSON.stringify({ passed: true, homeURL: homeURL.href, viewportsAndThemes: results.length }, null, 2));
} catch (error) {
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ passed: false, results, failure: error.message }, null, 2));
  throw error;
} finally { await browser.close(); }
