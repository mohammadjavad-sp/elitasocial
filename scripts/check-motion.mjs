import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseURL = process.env.CHECK_URL || 'http://127.0.0.1:3000';
const output = path.resolve(process.env.CHECK_OUTPUT || 'artifacts/motion-check');
const report = { baseURL, cases: [], errors: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function openPage(name, options = {}, hints = { hardwareConcurrency: 4, deviceMemory: 8, saveData: false }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
    ...options,
  });
  const page = await context.newPage();
  const result = { name, errors: [], failedAssets: [] };
  report.cases.push(result);
  page.on('pageerror', error => result.errors.push(error.message));
  page.on('response', response => {
    if (new URL(response.url()).origin === new URL(baseURL).origin && response.status() >= 400) {
      result.failedAssets.push({ url: response.url(), status: response.status() });
    }
  });
  await page.addInitScript(hints => {
    // Four logical CPUs and 8 GB must not disable native desktop effects.
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => hints.hardwareConcurrency });
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => hints.deviceMemory });
    Object.defineProperty(navigator, 'connection', { configurable: true, get: () => ({ saveData: hints.saveData }) });
    const state = window.__motionCheck = { observers: [], observed: [], calls: [] };
    const describe = element => ({
      tag: element.tagName,
      id: element.id,
      className: typeof element.className === 'string' ? element.className : '',
      reveal: element.dataset?.reveal,
      firstAboutLine: element.matches('#about-title > span:first-child'),
    });
    const originalObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends originalObserver {
      constructor(callback, options) {
        super(callback, options);
        state.observers.push({
          time: performance.now(),
          options,
          readyState: document.readyState,
          revealCount: document.querySelectorAll('[data-reveal]').length,
        });
      }
      observe(target) {
        if (target.hasAttribute('data-reveal')) state.observed.push({
          ...describe(target), time: performance.now(), top: target.getBoundingClientRect().top,
        });
        return super.observe(target);
      }
    };
    const originalAnimate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (this.hasAttribute('data-reveal')) state.calls.push({
        ...describe(this), time: performance.now(),
        // Capture the layout position before the animation adds its translation.
        top: this.getBoundingClientRect().top,
        bottom: this.getBoundingClientRect().bottom,
        viewportHeight: innerHeight,
        source: 'Element.animate', frames, options,
      });
      return originalAnimate.call(this, frames, options);
    };
  }, hints);
  return { context, page, result };
}

async function load(page, result, url = baseURL) {
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  result.status = response?.status();
  assert.equal(result.status, 200, `${result.name}: page loads`);
  await page.locator('[data-motion-root]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  // The CSS failsafe also dismisses the entrance when JavaScript is disabled.
  await page.locator('.site-preloader').waitFor({ state: 'hidden', timeout: 7000 });
  result.environment = await page.evaluate(() => ({
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    saveData: navigator.connection?.saveData,
    level: document.querySelector('[data-motion-root]').dataset.motionLevel,
    revealCount: document.querySelectorAll('[data-reveal]').length,
    nativeTimeline: CSS.supports('animation-timeline', 'view()'),
  }));
}

async function instantScroll(page, top) {
  await page.evaluate(value => window.scrollTo({ top: value, behavior: 'instant' }), top);
  await page.waitForTimeout(140);
}

async function assertReadable(page, selector) {
  const locator = page.locator(selector).first();
  assert(await locator.isVisible(), `${selector} stays readable`);
  const visibility = await locator.evaluate(element => {
    let opacity = 1;
    for (let current = element; current; current = current.parentElement) {
      opacity *= Number(getComputedStyle(current).opacity);
    }
    return { opacity, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height };
  });
  assert(visibility.opacity > 0.98 && visibility.width > 0 && visibility.height > 0,
    `${selector} is not concealed by a reveal wrapper: ${JSON.stringify(visibility)}`);
}

async function assertNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  assert(dimensions.content <= dimensions.viewport + 1, `No horizontal overflow: ${JSON.stringify(dimensions)}`);
  return dimensions;
}

async function nativeStyle(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const style = getComputedStyle(element);
    return {
      scroll: scrollY,
      top: element.getBoundingClientRect().top,
      rotate: style.rotate,
      translate: style.translate,
      scale: style.scale,
      transform: style.transform,
      animation: style.animationName,
      timeline: style.animationTimeline,
    };
  });
}

function assertNativeChanged(before, after, label) {
  assert.notEqual(before.animation, 'none', `${label} has a native animation`);
  assert.notEqual(before.timeline, 'auto', `${label} uses a scroll timeline`);
  assert(['rotate', 'translate', 'scale', 'transform'].some(key => before[key] !== after[key]),
    `${label} responds to scroll: ${JSON.stringify({ before, after })}`);
}

async function normalMotion(name, viewport) {
  const { context, page, result } = await openPage(name, { viewport });
  try {
    await load(page, result);
    assert.equal(result.environment.reducedMotion, false);
    assert.equal(result.environment.level, viewport.width >= 1050 ? 'full' : 'subtle');
    assert(result.environment.nativeTimeline, 'Edge supports native scroll timelines');
    const target = page.locator('#about-title > span').first();
    // A slow reader used to consume the entire entrance 36 px below the fold.
    // Start only 20 px below the viewport, then move at about 45 px per second.
    const start = await target.evaluate(element => element.getBoundingClientRect().top + scrollY - innerHeight - 20);
    await instantScroll(page, Math.max(0, start));
    let call;
    for (let step = 0; step < 36; step++) {
      call = await page.evaluate(() => window.__motionCheck.calls.find(entry => entry.firstAboutLine));
      if (call) break;
      await page.mouse.wheel(0, 5);
      await page.waitForTimeout(110);
    }
    assert(call, `${name}: slow scrolling triggers the first About title entrance`);
    result.slowEntrance = { call };
    assert(call.top >= 0 && call.top <= call.viewportHeight - 48,
      `${name}: entrance starts inside the viewport, not below it: ${JSON.stringify(call)}`);
    const elapsed = await page.evaluate(time => performance.now() - time, call.time);
    await page.waitForTimeout(Math.max(0, 120 - elapsed));
    const sample = await target.evaluate((element, startTime) => ({
      elapsed: performance.now() - startTime,
      top: element.getBoundingClientRect().top,
      viewportHeight: innerHeight,
      opacity: Number(getComputedStyle(element).opacity),
      translate: getComputedStyle(element).translate,
      animations: element.getAnimations().map(animation => ({ state: animation.playState, time: animation.currentTime })),
    }), call.time);
    result.slowEntrance.sample = sample;
    assert(sample.top <= sample.viewportHeight - 32 && sample.top >= 0, `${name}: animated text is clearly in view`);
    assert(sample.opacity > 0 && sample.opacity < 0.99, `${name}: visible intermediate opacity: ${JSON.stringify(sample)}`);
    assert(sample.animations.some(animation => animation.state === 'running'), `${name}: visible entrance is running`);
    await page.screenshot({ path: path.join(output, `${name}-entrance.png`) });
    await page.waitForTimeout(1300);
    await assertReadable(page, '#about-title');
    await page.screenshot({ path: path.join(output, `${name}-settled.png`) });

    await instantScroll(page, 0);
    const paperBefore = await nativeStyle(page, '.hero-paper-pink');
    const heroEnd = await page.locator('.hero-visual').evaluate(element => element.getBoundingClientRect().bottom + scrollY);
    await instantScroll(page, Math.max(350, heroEnd - 80));
    const paperAfter = await nativeStyle(page, '.hero-paper-pink');
    assertNativeChanged(paperBefore, paperAfter, `${name}: hero sheets`);
    const photoFrame = await page.locator('.about-photo-frame').evaluate(element => ({
      top: element.getBoundingClientRect().top + scrollY,
      bottom: element.getBoundingClientRect().bottom + scrollY,
      viewport: innerHeight,
    }));
    await instantScroll(page, Math.max(0, photoFrame.top - photoFrame.viewport * 0.85));
    const photoBefore = await nativeStyle(page, '.about-photo-frame img');
    await instantScroll(page, Math.max(0, photoFrame.bottom - photoFrame.viewport * 0.15));
    const photoAfter = await nativeStyle(page, '.about-photo-frame img');
    assertNativeChanged(photoBefore, photoAfter, `${name}: primary About photo`);
    result.native = { paperBefore, paperAfter, photoBefore, photoAfter };
    result.dimensions = await assertNoOverflow(page);
    assert.deepEqual(result.errors, [], `${name}: no browser errors`);
    result.instrumentation = await page.evaluate(() => window.__motionCheck);
    console.log(`${name}: visible slow-scroll entrance; hero sheets and photo react to scroll; no overflow or JavaScript errors.`);
  } finally {
    result.instrumentation ??= await page.evaluate(() => window.__motionCheck).catch(() => null);
    await context.close();
  }
}

async function reducedMotion() {
  const { context, page, result } = await openPage('reduced-motion', { reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  try {
    await load(page, result);
    assert.equal(result.environment.level, 'off');
    await page.locator('#about-title').scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await assertReadable(page, '#about-title');
    await assertReadable(page, '.about-photo-frame img');
    const native = await nativeStyle(page, '.about-photo-frame img');
    assert.equal(native.animation, 'none', 'Reduced motion disables scroll-driven photo effects');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await assertReadable(page, '.contact-form');
    const calls = await page.evaluate(() => window.__motionCheck.calls);
    assert.equal(calls.length, 0, 'Reduced motion never starts reveal animations');
    result.native = native;
    result.dimensions = await assertNoOverflow(page);
    assert.deepEqual(result.errors, []);
    await page.screenshot({ path: path.join(output, 'reduced-motion.png') });
    console.log('reduced-motion: no reveal or photo animation; text and contact form stay readable.');
  } finally { await context.close(); }
}

async function minimalMotion(name, hints) {
  const { context, page, result } = await openPage(name, {}, hints);
  try {
    await load(page, result);
    assert.equal(result.environment.level, 'minimal', `${name}: constrained mode is selected`);
    const paper = await nativeStyle(page, '.hero-paper-pink');
    const photo = await nativeStyle(page, '.about-photo-frame img');
    assert.equal(paper.animation, 'none', `${name}: no native sheet animation`);
    assert.equal(photo.animation, 'none', `${name}: no native parallax`);
    const top = await page.locator('#about-title > span').first().evaluate(element =>
      element.getBoundingClientRect().top + scrollY - innerHeight * 0.7);
    await instantScroll(page, Math.max(0, top));
    const calls = await page.evaluate(() => window.__motionCheck.calls);
    assert(calls.some(call => call.firstAboutLine), `${name}: a small entrance remains available`);
    assert(calls.every(call => call.options.duration === 500 && call.frames[0].rotate === '0deg' && call.frames[0].scale === 1),
      `${name}: entrances use the short, unrotated minimal variant`);
    await page.waitForTimeout(900);
    await assertReadable(page, '#about-title');
    result.native = { paper, photo };
    result.instrumentation = await page.evaluate(() => window.__motionCheck);
    result.dimensions = await assertNoOverflow(page);
    assert.deepEqual(result.errors, []);
    console.log(`${name}: no parallax; brief unrotated entrances; content remains readable.`);
  } finally { await context.close(); }
}

async function deepAnchor() {
  const { context, page, result } = await openPage('contact-anchor', { viewport: { width: 390, height: 844 } });
  try {
    await load(page, result, new URL('#contact', baseURL).href);
    await page.locator('.contact-form').scrollIntoViewIfNeeded();
    await assertReadable(page, '.contact-form');
    assert(await page.locator('#contact-name').isEnabled(), 'Direct contact navigation keeps inputs usable');
    assert.equal(await page.evaluate(() => window.__motionCheck.calls.length), 0, 'Deep link bypasses reveal entrances');
    result.dimensions = await assertNoOverflow(page);
    assert.deepEqual(result.errors, []);
    await page.screenshot({ path: path.join(output, 'contact-anchor.png') });
    console.log('contact-anchor: direct navigation opens a readable, usable form without reveal animation.');
  } finally { await context.close(); }
}

async function withoutJavaScript() {
  const { context, page, result } = await openPage('no-javascript', { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    await load(page, result);
    await assertReadable(page, '#hero-title');
    await page.locator('#about-title').scrollIntoViewIfNeeded();
    await assertReadable(page, '#about-title');
    await assertReadable(page, '.about-photo-frame img');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await assertReadable(page, '.contact-form');
    result.dimensions = await assertNoOverflow(page);
    assert.deepEqual(result.errors, []);
    await page.screenshot({ path: path.join(output, 'no-javascript.png') });
    console.log('no-javascript: content remains visible and the preloader failsafe releases the page.');
  } finally { await context.close(); }
}

try {
  await normalMotion('desktop', { width: 1440, height: 1000 });
  await normalMotion('mobile', { width: 390, height: 844 });
  await minimalMotion('save-data', { hardwareConcurrency: 4, deviceMemory: 8, saveData: true });
  await minimalMotion('low-memory', { hardwareConcurrency: 4, deviceMemory: 2, saveData: false });
  await reducedMotion();
  await deepAnchor();
  await withoutJavaScript();
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.errors.push(error instanceof Error ? error.stack : String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Motion report: ${path.join(output, 'report.json')}`);
}
