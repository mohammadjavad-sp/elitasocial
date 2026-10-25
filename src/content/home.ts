/** Presentation-independent content; replace this adapter with CMS data later. */
export type NavigationItem = {
  label: string;
  href?: string;
  external?: boolean;
  upcoming?: boolean;
};

export const homeContent = {
  brand: { name: "الیتا سوشیال", latinName: "Elita Social", owner: "الهه طاهری" },
  contact: {
    whatsapp: "https://wa.me/989338234473",
    instagram: "https://www.instagram.com/elita.nasl/",
    telegram: "https://t.me/elitanasl",
    phone: "tel:+989338234473",
    phoneLabel: "۰۹۳۳ ۸۲۳ ۴۴۷۳",
  },
  navigation: [
    { label: "خانه", href: "/" },
    { label: "خدمات", href: "/services/" },
    { label: "نمونه‌کارها", href: "/portfolio/" },
    { label: "پلن‌ها", href: "/pricing/" },
    { label: "مجله الیتا", href: "/blog/" },
  ] satisfies NavigationItem[],
  about: {
    title: ["یک حضور منسجم،", "از پیج تا وب‌سایت"],
    description: "هر برند، قصه و مسیر خودش را دارد. در الیتا سوشیال از شناخت کسب‌وکارت شروع می‌کنیم؛ بعد، مدیریت اینستاگرام و طراحی سایت را در یک مسیر هماهنگ پیش می‌بریم.",
    detail: "از برنامه‌ریزی و تولید محتوا تا طراحی و پشتیبانی سایت، کنارتم تا ارتباط برندت با مخاطب، روشن‌تر و یکپارچه‌تر باشه.",
    actionLabel: "با خدمات الیتا آشنا شو",
    image: { src: "/images/social-marketing.webp", alt: "برنامه‌ریزی محتوای شبکه‌های اجتماعی با لپ‌تاپ و تقویم محتوا", width: 960, height: 1280 },
    secondaryImage: { src: "/images/website-workspace.webp", alt: "فضای طراحی وب‌سایت با لپ‌تاپ و ابزار طراحی دیجیتال", width: 960, height: 1280 },
    caption: "از برنامه‌ریزی تا اجرا",
    captionDetail: "محتوا و طراحی، در یک مسیر مشترک",
  },
  services: {
    title: ["برای حرفه‌ای دیده شدن،", "از اینجا شروع کن"],
    description: "از پیج اینستاگرام تا خانهٔ آنلاین برندت؛ خدماتی که کنار هم، حضورت را در دنیای دیجیتال کامل می‌کنند.",
    actionLabel: "همهٔ خدمات الیتا",
    items: [
      { id: "instagram", title: "ادمینی و مدیریت اینستاگرام", description: "برنامه‌ریزی محتوا، مدیریت پیج و همراهی در ارتباط با مخاطب؛ با لحنی که به برندت میاد.", label: "برای مدیریت پیجم مشاوره می‌خوام.", theme: "pink" },
      { id: "website", title: "طراحی و توسعهٔ وب‌سایت", description: "وب‌سایتی متناسب با هویت برندت؛ با طراحی خوانا، تجربهٔ کاربری روان و نمایش درست در موبایل.", label: "برای طراحی سایت مشاوره می‌خوام.", theme: "lilac" },
      { id: "content", title: "تولید محتوا برای برندت", description: "از ایده و سناریو تا متن و محتوای بصری؛ برای اینکه حرف برندت، واضح و یکدست شنیده بشه.", label: "برای تولید محتوای برندم مشاوره می‌خوام.", theme: "yellow" },
      { id: "seo", title: "سئو و پشتیبانی سایت", description: "رسیدگی به محتوای سایت، بهینه‌سازی و پشتیبانی فنی؛ برای سایتی که به‌روز و قابل استفاده بمونه.", label: "برای سئو و پشتیبانی سایتم مشاوره می‌خوام.", theme: "mint" },
    ],
  },
  approach: {
    title: ["همکاری خوب،", "از شناخت برندت شروع می‌شه"],
    description: "قبل از هر طرح و تقویم محتوا، دربارهٔ کسب‌وکار، مخاطب و اولویت‌هات حرف می‌زنیم.",
    image: { src: "/images/campaign-workspace.webp", alt: "میز کار دیجیتال مارکتینگ با لپ‌تاپ، موبایل و ابزار برنامه‌ریزی محتوا", width: 1500, height: 1000 },
    featureLabel: "قدم اولِ همکاری",
    featureTitle: ["اول قصهٔ برندت را می‌شنویم،", "بعد مسیر را با هم می‌چینیم"],
    featureDescription: "چه بخوای پیجت را منظم‌تر پیش ببری، چه وب‌سایتت را بسازی؛ نقطهٔ شروع، نیاز واقعی کسب‌وکارته.",
    actionLabel: "از برندت برام بگو",
    values: [
      { title: "نگاهمون به برند تو", text: "نسخهٔ یکسان برای همه نداریم. لحن، طراحی و محتوا باید از شخصیت برندت و نیاز مخاطبت بیاد.", theme: "lilac", icon: "sparkle" },
      { title: "روشمون در همکاری", text: "دربارهٔ محدودهٔ کار و اولویت‌ها شفاف حرف می‌زنیم؛ بعد با هماهنگی و بازخورد، قدم‌های بعدی را جلو می‌بریم.", theme: "pink", icon: "arrow" },
    ],
  },
  benefits: {
    title: ["هر بخشِ برندت،", "یک قدم هماهنگ‌تر"],
    description: "روی هر بخش بزن و ببین این خدمت چطور به حضور دیجیتال برندت کمک می‌کنه.",
    items: [
      { id: "instagram", title: "پیجی با هویت یکدست", description: "وقتی تقویم محتوا، لحن و ظاهر پیج با هم هماهنگ باشند، مخاطب راحت‌تر می‌فهمه برندت چه حرفی برای گفتن داره.", image: { src: "/images/social-marketing.webp", alt: "تقویم محتوا و چیدمان پست‌های شبکه‌های اجتماعی", width: 960, height: 1280 }, actionLabel: "گفتگو دربارهٔ مدیریت پیج", href: "https://wa.me/989338234473?text=" + encodeURIComponent("سلام، دربارهٔ مدیریت اینستاگرام مشاوره می‌خوام.") },
      { id: "website", title: "سایتی برای مخاطب تو", description: "ساختار روشن، طراحی متناسب با برند و نمایش درست در موبایل، پیدا کردن خدمات و راه ارتباط را برای بازدیدکننده ساده‌تر می‌کنه.", image: { src: "/images/website-workspace.webp", alt: "طراحی ساختار و ظاهر یک وب‌سایت در لپ‌تاپ", width: 960, height: 1280 }, actionLabel: "گفتگو دربارهٔ طراحی سایت", href: "https://wa.me/989338234473?text=" + encodeURIComponent("سلام، دربارهٔ طراحی وب‌سایت مشاوره می‌خوام.") },
      { id: "content", title: "محتوایی با حرف مشخص", description: "از ایده و سناریو تا متن و تصویر، هر محتوا با یک موضوع و هدف مشخص شکل می‌گیره تا پیام برندت واضح‌تر منتقل بشه.", image: { src: "/images/content-studio.webp", alt: "دوربین و موبایل در فضای تولید محتوای محصول", width: 1000, height: 1333 }, actionLabel: "گفتگو دربارهٔ تولید محتوا", href: "https://wa.me/989338234473?text=" + encodeURIComponent("سلام، دربارهٔ تولید محتوا مشاوره می‌خوام.") },
      { id: "seo", title: "ساختاری قابل جست‌وجو", description: "رسیدگی به ساختار صفحه‌ها، عنوان‌ها و محتوای سایت کمک می‌کنه موضوع خدماتت برای کاربر و موتور جست‌وجو روشن‌تر باشه.", image: { src: "/images/campaign-workspace.webp", alt: "بررسی محتوای دیجیتال و ساختار صفحه‌ها در فضای کار", width: 1500, height: 1000 }, actionLabel: "گفتگو دربارهٔ سئوی سایت", href: "https://wa.me/989338234473?text=" + encodeURIComponent("سلام، دربارهٔ سئوی سایت مشاوره می‌خوام.") },
      { id: "support", title: "همراهی پس از اجرا", description: "به‌روزرسانی محتوا و رسیدگی به نیازهای فنی، بخشی از مسیر نگهداری سایته؛ تا تغییرات کسب‌وکارت در سایت هم دیده بشه.", image: { src: "/images/website-workspace.webp", alt: "ابزار طراحی و نگهداری وب‌سایت روی میز کار", width: 960, height: 1280 }, actionLabel: "گفتگو دربارهٔ پشتیبانی سایت", href: "https://wa.me/989338234473?text=" + encodeURIComponent("سلام، دربارهٔ پشتیبانی سایت مشاوره می‌خوام.") },
    ],
  },
  hero: {
    eyebrow: "یک قدم نزدیک‌تر به برندِ دلخواهت",
    title: ["از اینستاگرام تا وب‌سایت،", "حرفه‌ای دیده شو"],
    description: "من الهه طاهری‌ام؛ در الیتا سوشیال با مدیریت اینستاگرام و طراحی وب‌سایت، به برندت کمک می‌کنم حضوری منسجم و حرفه‌ای در دنیای دیجیتال داشته باشه.",
    primaryLabel: "مشاوره و شروع همکاری",
    secondaryLabel: "دیدن نمونه‌کارها",
    portrait: {
      src: "/images/elaheh-hero.jpg",
      alt: "الهه طاهری، بنیان‌گذار الیتا سوشیال",
      width: 853,
      height: 1280,
    },
    services: [
      { title: "مدیریت اینستاگرام", caption: "محتوا، برنامه‌ریزی، همراهی", icon: "instagram" },
      { title: "طراحی وب‌سایت", caption: "زیبا، کاربردی، متناسب با برند", icon: "website" },
    ],
  },
};

export function getNavigation(page: "home" | "portfolio" | "services" | "blog" | "pricing" = "home"): NavigationItem[] {
  return homeContent.navigation.map((item) => ({
    ...item,
    href: page !== "home" && item.href?.startsWith("#") ? `/${item.href}` : item.href,
  }));
}
