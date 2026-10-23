import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.CHECK_URL || 'http://127.0.0.1:3000';
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
    page.on('pageerror', error => errors.push(`${viewport.name}: ${error.message}`));
    const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200, `${viewport.name}: page should load`);
    await page.evaluate(() => document.fonts.ready);
    const typography = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      const normalize = value => value.trim().replaceAll('"', '').replaceAll("'", '');
      const expected = normalize(style.getPropertyValue('--font-estedad').split(',')[0]);
      return {
        family: style.fontFamily,
        expected,
        correctFamily: normalize(style.fontFamily.split(',')[0]) === expected,
        loadedLocalFont: [...document.fonts].some(font => normalize(font.family) === expected && font.status === 'loaded'),
      };
    });
    assert(typography.expected && typography.correctFamily && typography.loadedLocalFont, `Local Persian font should render: ${JSON.stringify(typography)}`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'fa');
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.equal(await page.locator('h1').count(), 1, 'One primary heading');
    const about = page.locator('#about');
    const services = page.locator('#services');
    const approach = page.locator('#approach');
    const benefits = page.locator('#benefits');
    const sections = { about, services, approach, benefits };
    assert.equal(await page.locator('main h2').count(), 4, 'Four section headings beneath the hero');
    for (const section of Object.values(sections)) {
      await section.waitFor({ state: 'visible' });
      assert.equal(await section.locator('h2').count(), 1, 'Each section has a descriptive heading');
      await section.scrollIntoViewIfNeeded();
      for (const image of await section.locator('img').all()) {
        // Decode lazy images even when an inactive accordion panel is collapsed.
        await image.evaluate(async img => { img.loading = 'eager'; await img.decode(); });
        assert(await image.evaluate(img => img.complete && img.naturalWidth > 0), `${viewport.name}: section image loads`);
        assert((await image.getAttribute('alt'))?.trim(), 'Content image has meaningful alternative text');
      }
    }
    assert.equal(await services.locator('article').count(), 4, 'Four offered services');
    assert.equal(await about.locator('img').count(), 2, 'About uses two marketing photos');
    assert(await about.locator('img').evaluateAll(images => images.every(img => !decodeURIComponent(img.src).includes('elaheh'))), 'About no longer reuses the founder portraits');
    assert(await approach.locator('img').count() > 0, 'Approach includes an editorial marketing photo');
    assert.equal(await benefits.locator('img').count(), 5, 'Benefits includes five photo panels');

    const benefitButtons = benefits.locator('button[aria-expanded][aria-controls]');
    assert.equal(await benefitButtons.count(), 5, 'Five accessible benefit disclosures');
    assert.equal(await benefits.locator('button[aria-expanded="true"]').count(), 1, 'One benefit initially expanded');
    for (let index = 0; index < 5; index++) {
      const button = benefitButtons.nth(index);
      const panelId = await button.getAttribute('aria-controls');
      const panel = page.locator(`[id="${panelId}"]`);
      assert.equal(await panel.count(), 1, 'Each benefit controls a real description');
      assert((await button.innerText()).trim().length > 3, 'Benefit has a descriptive button label');
      if (await button.getAttribute('aria-expanded') !== 'true') {
        await button.focus();
        await page.keyboard.press(index % 2 ? 'Space' : 'Enter');
      }
      assert.equal(await button.getAttribute('aria-expanded'), 'true', 'Keyboard opens benefit');
      assert.equal(await benefits.locator('button[aria-expanded="true"]').count(), 1, 'Only one benefit is expanded at a time');
      assert(await panel.isVisible(), 'Active benefit description is visible');
      assert((await panel.innerText()).trim().length > 20, 'Expanded benefit provides useful information');
      for (let other = 0; other < 5; other++) {
        if (other === index) continue;
        const otherId = await benefitButtons.nth(other).getAttribute('aria-controls');
        assert.equal(await page.locator(`[id="${otherId}"]`).isVisible(), false, 'Inactive benefit description is hidden');
      }
    }
    await benefitButtons.first().focus();
    await page.keyboard.press('Enter');
    const clippedContent = await page.locator('#about h2, #about p, #services h2, #services p, #services article, #approach h2, #approach p, #benefits h2, #benefits p, #benefits button').evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      return rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1
        ? [{ tag: element.tagName, text: element.textContent?.slice(0, 80), left: rect.left, right: rect.right }]
        : [];
    }));
    assert.deepEqual(clippedContent, [], `${viewport.name}: section content is not clipped`);
    const portrait = page.getByAltText('الهه طاهری، بنیان‌گذار الیتا سوشال', { exact: true });
    await portrait.first().waitFor({ state: 'visible' });
    assert(await portrait.first().evaluate(img => img.complete && img.naturalWidth > 0), 'Real portrait should load');
    const whatsapp = await page.locator('a[href*="wa.me/"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
    assert(whatsapp.length > 0, 'WhatsApp contact is available');
    for (const href of whatsapp) assert(/^https:\/\/wa\.me\/\d+/.test(href), `Valid WhatsApp URL: ${href}`);
    const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => href === '#' || !document.getElementById(decodeURIComponent(href.slice(1)))));
    assert.deepEqual(brokenAnchors, [], 'Internal links have real targets');
    const upcoming = await page.locator('header [aria-disabled="true"]').evaluateAll(items => items.map(item => ({
      label: item.textContent,
      status: item.parentElement?.textContent,
      deadLink: Boolean(item.closest('a[href]')),
    })));
    for (const item of upcoming) {
      assert(item.status?.includes('به‌زودی'), `Future navigation has clear status: ${item.label}`);
      assert.equal(item.deadLink, false, 'Future navigation does not lead to an unfinished page');
    }
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
    assert(layout.scrollWidth <= layout.width + 1 && layout.bodyWidth <= layout.width + 1, `${viewport.name}: horizontal overflow ${JSON.stringify(layout)}`);

    const toggle = page.getByRole('button', { name: 'باز کردن منو', exact: true });
    let menuTested = false;
    if (await toggle.isVisible()) {
      await toggle.focus();
      await page.keyboard.press('Enter');
      const menu = page.getByRole('navigation', { name: 'منوی موبایل', exact: true });
      await menu.waitFor({ state: 'visible' });
      assert.equal(await page.getByRole('button', { name: 'بستن منو', exact: true }).getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Tab');
      assert(await menu.evaluate(nav => nav.contains(document.activeElement) && document.activeElement?.tagName === 'A'), 'Tab moves into a usable menu link');
      await page.keyboard.press('Escape');
      await menu.waitFor({ state: 'hidden' });
      assert(await toggle.evaluate(button => document.activeElement === button), 'Escape returns focus to menu toggle');
      menuTested = true;
      if (viewport.name === 'mobile') {
        await toggle.click();
        await menu.waitFor({ state: 'visible' });
        await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
        await page.screenshot({ path: path.join(output, 'mobile-menu.png'), fullPage: true, animations: 'disabled' });
        await page.keyboard.press('Escape');
      }
    }

    await page.evaluate(() => scrollTo(0, 0));
    if (await toggle.isVisible()) await toggle.click();
    const servicesLink = page.locator('header a[href="#services"]:visible');
    assert.equal(await servicesLink.count(), 1, 'Services navigation is available');
    await servicesLink.click();
    assert.equal(new URL(page.url()).hash, '#services', 'Services navigation opens the actual section');
    if (await toggle.isVisible()) assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Selecting a section closes the mobile menu');
    const servicesPosition = await services.boundingBox();
    assert(servicesPosition && servicesPosition.y < viewport.height && servicesPosition.y + servicesPosition.height > 0, 'Services section is in view after navigation');

    await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
    if (viewport.name === 'desktop' || viewport.name === 'mobile') {
      // Edge can paint a transformed fixed skip link inside a tall element capture,
      // even though it is above the viewport; preserve its normal unfocused state.
      const sectionCapture = { animations: 'disabled', style: '.skip-link:not(:focus) { visibility: hidden !important; }' };
      for (const [name, section] of Object.entries(sections)) {
        await section.screenshot({ ...sectionCapture, path: path.join(output, `${viewport.name}-${name}.png`) });
      }
    }
    await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); scrollTo(0, 0); });
    await page.screenshot({ path: path.join(output, `${viewport.name}.png`), fullPage: true, animations: 'disabled' });
    results.push({ viewport, layout, typography, whatsappLinks: whatsapp.length, upcomingItems: upcoming.length, menuTested, sectionsTested: Object.keys(sections), serviceCards: 4, benefitPanels: 5, benefitKeyboardTested: true, servicesNavigationTested: true, title: await page.title() });
    await page.close();
  }
  assert.deepEqual(errors, [], 'No unhandled browser errors');
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ baseURL, passed: true, results, errors }, null, 2));
  console.log(JSON.stringify({ passed: true, screenshots: output, results }, null, 2));
} catch (error) {
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ baseURL, passed: false, results, errors, failure: error.message }, null, 2));
  throw error;
} finally {
  await browser.close();
}
