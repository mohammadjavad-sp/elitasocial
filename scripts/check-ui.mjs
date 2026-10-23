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
    const failedLocalAssets = [];
    page.on('pageerror', error => errors.push(`${viewport.name}: ${error.message}`));
    page.on('response', response => {
      if (new URL(response.url()).origin === new URL(baseURL).origin && response.status() >= 400) {
        failedLocalAssets.push({ url: response.url(), status: response.status(), type: response.request().resourceType() });
      }
    });
    const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200, `${viewport.name}: page should load`);
    assert.equal(await page.locator('header a.brand').getAttribute('href'), new URL(baseURL).pathname, 'Brand home link preserves the deployment subpath');
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
    const sections = { about, services, approach, benefits, ...Object.fromEntries(['portfolio', 'pricing', 'testimonials', 'insights', 'contact'].map(id => [id, page.locator(`#${id}`)])) };
    for (const section of Object.values(sections)) {
      await section.waitFor({ state: 'visible' });
      assert.equal(await section.locator('h2:visible').count(), 1, 'Each section has a descriptive visible heading');
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
    assert.match(await sections.portfolio.locator('.portfolio-demo-notice').innerText(), /نمایشی/, 'Portfolio mock status is visible');
    const portfolioLink = sections.portfolio.locator('a.portfolio-all-link');
    assert.equal(await portfolioLink.getAttribute('href'), `${new URL(baseURL).pathname.replace(/\/$/, '')}/portfolio/`, 'Gallery link preserves deployment path');
    const featuredProject = sections.portfolio.locator('.project-open').first();
    await featuredProject.focus();
    await page.keyboard.press('Enter');
    await page.locator('dialog.project-dialog').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.locator('dialog.project-dialog').waitFor({ state: 'hidden' });
    assert(await featuredProject.evaluate(button => document.activeElement === button), 'Featured project modal restores keyboard focus');
    const pricing = sections.pricing;
    assert.match(await pricing.locator('.pricing-notice').innerText(), /نمایشی/, 'Pricing clearly identifies sample amounts');
    const pricingCategories = pricing.locator('.pricing-tabs button');
    assert.equal(await pricingCategories.count(), 3, 'Three pricing service categories');
    const categoryPrices = [];
    for (let index = 0; index < await pricingCategories.count(); index++) {
      const category = pricingCategories.nth(index);
      await category.focus();
      await page.keyboard.press(index % 2 ? 'Space' : 'Enter');
      assert.equal(await category.getAttribute('aria-pressed'), 'true', 'Keyboard selects pricing category');
      assert.equal(await pricing.locator('.pricing-tabs button[aria-pressed="true"]').count(), 1, 'One pricing category selected');
      const plans = pricing.locator('.pricing-card');
      assert.equal(await plans.count(), 3, 'Each pricing category provides three plans');
      assert.equal(await pricing.locator('.pricing-recommended').count(), 1, 'One plan is suggested in each category');
      const prices = [];
      for (const plan of await plans.all()) {
        assert.match(await plan.locator('.plan-badges').innerText(), /پلن نمایشی/, 'Every plan carries its own mock label');
        const amount = Number(await plan.locator('data').getAttribute('value'));
        assert(Number.isFinite(amount) && amount > 0, 'Plan amount is a positive number');
        assert.match(await plan.locator('.plan-price').innerText(), /تومان/, 'Plan states its currency');
        assert.match(await plan.locator('.plan-price small').innerText(), index === 1 ? /پروژه‌ای/ : /ماهانه/, 'Plan states the correct pricing period');
        assert(await plan.locator('li').count() >= 4, 'Plan includes useful scope details');
        const consultation = new URL(await plan.locator('a').getAttribute('href'), page.url());
        assert.equal(consultation.origin, new URL(baseURL).origin, 'Plan consultation opens the site contact form');
        assert.equal(consultation.pathname, new URL(baseURL).pathname, 'Plan consultation preserves the deployment subpath');
        assert.equal(consultation.hash, '#contact', 'Plan consultation targets the contact form');
        assert.equal(consultation.searchParams.get('planCategory'), ['instagram', 'website', 'support'][index], 'Consultation preserves the selected pricing category');
        assert.equal(consultation.searchParams.get('service'), ['instagram', 'website', 'seo'][index], 'Consultation preserves the selected service');
        assert(consultation.searchParams.get('plan')?.startsWith(['ig-', 'web-', 'care-'][index]), 'Consultation identifies the selected plan');
        prices.push(amount);
      }
      assert(prices.every((amount, planIndex) => planIndex === 0 || amount > prices[planIndex - 1]), 'Increasing plan scope has increasing sample pricing');
      categoryPrices.push(prices);
    }
    assert(new Set(categoryPrices.map(prices => prices.join(','))).size === 3, 'Switching categories changes pricing content');
    await pricingCategories.first().click();
    const articleButtons = sections.insights.locator('.insight-read');
    assert.equal(await articleButtons.count(), 3, 'Three readable article previews');
    for (const trigger of await articleButtons.all()) {
      const title = await trigger.locator('xpath=ancestor::article').locator('h3').innerText();
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.locator('dialog.insight-dialog');
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await dialog.locator('h2').innerText(), title, 'Preview opens the selected article');
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert(await trigger.evaluate(button => document.activeElement === button), 'Article preview restores keyboard focus');
    }
    assert.match(await sections.testimonials.innerText(), /نظر مشتری واقعی نیستند/, 'Demo testimonials clearly identify fictional content');
    const form = sections.contact.locator('form.contact-form');
    const urlBeforeForm = page.url();
    const submit = form.locator('button[type="submit"]');
    await submit.click();
    assert.equal(await form.evaluate(element => element.checkValidity()), false, 'Empty request form is blocked by required field validation');
    assert.equal(await page.locator('.contact-prepared').count(), 0, 'Invalid request creates no WhatsApp message');
    await form.locator('#contact-name').fill('تست رابط کاربری');
    await form.locator('#contact-way').fill('invalid-contact');
    await form.locator('#contact-message').fill('این یک متن آزمایشی برای بررسی فرم است.');
    await submit.click();
    assert.equal(await form.locator('#contact-way').evaluate(element => element.validity.valid), false, 'Malformed contact information is rejected');
    await form.locator('#contact-way').fill('preview@example.com');
    await form.locator('#contact-service').selectOption({ label: 'طراحی وب‌سایت' });
    await submit.click();
    const preparedLink = form.locator('.contact-prepared a');
    await preparedLink.waitFor({ state: 'visible' });
    const preparedURL = new URL(await preparedLink.getAttribute('href'));
    assert.equal(preparedURL.hostname, 'wa.me');
    for (const expected of ['تست رابط کاربری', 'preview@example.com', 'طراحی وب‌سایت', 'این یک متن آزمایشی']) assert(preparedURL.searchParams.get('text')?.includes(expected), 'Composed message contains submitted information');
    assert(await preparedLink.evaluate(link => document.activeElement === link), 'Prepared message link receives focus');
    assert.equal(page.url(), urlBeforeForm, 'Form prepares a message without navigation or sending');
    await form.locator('#contact-name').fill('');
    assert.equal(await form.locator('.contact-prepared').count(), 0, 'Editing form clears stale prepared message');
    await form.locator('#contact-way').fill('');
    await form.locator('#contact-message').fill('');
    const faq = sections.contact.locator('details').first();
    await faq.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await faq.getAttribute('open'), '', 'FAQ opens with keyboard');
    assert(await faq.locator('p').isVisible(), 'FAQ answer becomes visible');
    await page.keyboard.press('Enter');
    const clippedContent = await page.locator('main section h2, main section p:not(.sr-only), #services article, #benefits button, .project-card-title, .pricing-card').evaluateAll(elements => elements.flatMap(element => {
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
    const servicesPath = `${new URL(baseURL).pathname.replace(/\/$/, '')}/services/`;
    const servicesLink = page.locator(`header a[href="${servicesPath}"]:visible`);
    assert.equal(await servicesLink.count(), 1, 'Services navigation is available');
    await servicesLink.click();
    await page.waitForURL(url => url.pathname === servicesPath);
    assert.equal(new URL(page.url()).pathname, servicesPath, 'Services navigation opens the dedicated services page');
    if (await toggle.isVisible()) assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Selecting a page closes the mobile menu');
    await page.goBack({ waitUntil: 'networkidle' });

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
    assert.deepEqual(failedLocalAssets, [], `${viewport.name}: local deployment assets load successfully`);
    results.push({ viewport, layout, typography, failedLocalAssets, homePathTested: new URL(baseURL).pathname, whatsappLinks: whatsapp.length, upcomingItems: upcoming.length, menuTested, sectionsTested: Object.keys(sections), serviceCards: 4, benefitPanels: 5, benefitKeyboardTested: true, servicesNavigationTested: true, featuredDialogTested: true, pricingCategoriesTested: 3, pricingPlansTested: 9, articleDialogsTested: 3, contactValidationAndCompositionTested: true, faqKeyboardTested: true, title: await page.title() });
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
