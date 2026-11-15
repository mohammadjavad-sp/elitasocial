/** Run with: node --import tsx --test scripts/check-portfolio-content.test.ts */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { PortfolioInvitation } from "../src/components/portfolio-invitation";
import { getNavigation } from "../src/content/home";
import { getDefaultSiteSettings, normalizeSiteSettings } from "../src/lib/site-settings";
import { cmsCollections } from "../src/lib/cms-shared";
import { getStarterSeed } from "../src/server/seed";
import { articles } from "../src/content/articles";
import { pricingContent } from "../src/content/pricing";
import { publicArticleCopy, publicPlanCopy } from "../src/lib/public-content-copy";

test("the replacement is fully server-rendered, describes all four services and offers one direct account link", () => {
  const settings = getDefaultSiteSettings();
  const html = renderToStaticMarkup(createElement(PortfolioInvitation, {
    title: settings.sections.portfolioTitle,
    description: settings.sections.portfolioDescription,
    actionLabel: settings.sections.portfolioActionLabel,
  }));
  for (const label of ["ادمینی اینستاگرام", "طراحی سایت", "سئو", "تولید محتوا"]) assert.ok(html.includes(label));
  assert.equal((html.match(/<li>/g) || []).length, 4);
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.match(html, /href="https:\/\/www\.instagram\.com\/elita\.nasl\/" target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /<iframe|project-open|portfolio-card|<dialog|href="\/portfolio/);
});

test("saved gallery copy upgrades to the invitation without overwriting the owner's custom copy", () => {
  const settings = getDefaultSiteSettings();
  settings.sections.portfolioTitle = "هر برند، یک دنیای دیدنی";
  settings.sections.portfolioDescription = "از ویترین یک فروشگاه تا قصهٔ یک پیج؛ چند ایده برای آنچه می‌توانیم با هم بسازیم.";
  settings.sections.portfolioActionLabel = "همهٔ نمونه‌ها";
  settings.home.hero.secondaryLabel = "دیدن نمونه‌کارها";
  const normalized = normalizeSiteSettings(settings);
  const defaults = getDefaultSiteSettings();
  assert.equal(normalized.sections.portfolioTitle, defaults.sections.portfolioTitle);
  assert.equal(normalized.sections.portfolioDescription, defaults.sections.portfolioDescription);
  assert.equal(normalized.sections.portfolioActionLabel, defaults.sections.portfolioActionLabel);
  assert.equal(normalized.home.hero.secondaryLabel, defaults.home.hero.secondaryLabel);
  settings.sections.portfolioTitle = "عنوان اختصاصی صاحب سایت";
  settings.sections.portfolioDescription = "معرفی اختصاصی صاحب سایت";
  settings.sections.portfolioActionLabel = "دیدن پیج من";
  const custom = normalizeSiteSettings(settings);
  assert.equal(custom.sections.portfolioTitle, settings.sections.portfolioTitle);
  assert.equal(custom.sections.portfolioDescription, settings.sections.portfolioDescription);
  assert.equal(custom.sections.portfolioActionLabel, settings.sections.portfolioActionLabel);
});

test("the removed page is absent from navigation and new seed data, with a replacement for old URLs", async () => {
  assert.equal(existsSync(new URL("../src/app/portfolio/page.tsx", import.meta.url)), false);
  assert.ok(getNavigation().every(item => !item.href?.includes("/portfolio")));
  assert.ok(getStarterSeed().every(record => String(record.collection) !== "portfolio"));
  assert.deepEqual(cmsCollections, ["articles", "services", "plans"]);
  const { default: config } = await import("../next.config");
  assert.ok(config.redirects);
  assert.deepEqual(await config.redirects(), [{ source: "/portfolio", destination: "/#portfolio", permanent: true }]);
});

test("starter and saved article/plan copy no longer refer to the retired gallery", () => {
  assert.doesNotMatch(JSON.stringify({ articles, pricingContent }), /نمونه‌کار|نمونه کار/);
  const original = { ...articles[0], sections: [{ id: "copy", heading: "عنوان", paragraphs: ["دعوت به اقدام باید بگوید با انتخاب آن چه اتفاقی می‌افتد. «درخواست مشاوره» و «دیدن نمونه‌کارها» مقصدهای مشخصی دارند. اگر دکمه به پیام‌رسان می‌رود، این موضوع را روشن کن. مخاطب نباید بعد از لمس دکمه تازه متوجه شود که قرار است از سایت خارج شود."], bullets: ["نمونه‌کارهای قابل انتشار و توضیح هر پروژه"] }] };
  const snapshot = structuredClone(original);
  const updated = publicArticleCopy(original);
  assert.doesNotMatch(JSON.stringify(updated.sections), /نمونه‌کار/);
  assert.deepEqual(original, snapshot);
  const custom = { ...original, sections: [{ ...original.sections[0], paragraphs: ["نوشتهٔ اختصاصی مالک سایت"], bullets: [] }] };
  assert.deepEqual(publicArticleCopy(custom), custom);
  const plan = { ...pricingContent.categories[1].plans[1], features: ["نمونه‌کارها و مجله", "امکان اختصاصی مالک"] };
  assert.deepEqual(publicPlanCopy(plan).features, ["مجله و معرفی خدمات", "امکان اختصاصی مالک"]);
  assert.deepEqual(plan.features, ["نمونه‌کارها و مجله", "امکان اختصاصی مالک"]);
});
