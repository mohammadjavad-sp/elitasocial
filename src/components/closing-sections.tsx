"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { closingContent } from "@/content/closing";
import { homeContent } from "@/content/home";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";

export function TestimonialsSection() {
  return (
    <section className="testimonials-section container" id="testimonials" aria-labelledby="testimonials-title">
      <div className="section-heading">
        <h2 id="testimonials-title">بازخوردهای نمایشی</h2>
        <p>تصویری از نیازهای متفاوت برندها؛ متن‌های این بخش نمونه‌اند و نظر مشتری واقعی نیستند.</p>
      </div>
      <div className="testimonials-grid">
        {closingContent.testimonials.map(item => (
          <figure className={`sample-quote sample-quote-${item.theme}`} key={item.category}>
            <div className="quote-top"><span className="quote-mark" aria-hidden="true">«</span><span className="closing-sample-label">نمونهٔ نمایشی</span></div>
            <blockquote>{item.text}</blockquote>
            <figcaption><span className="quote-avatar" aria-hidden="true">{item.initials}</span><span><strong>{item.category}</strong><small>سناریوی فرضی همکاری</small></span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function InsightsSection() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(closingContent.articles[0]);
  return (
    <section className="insights-section container" id="insights" aria-labelledby="insights-title">
      <div className="section-heading">
        <h2 id="insights-title"><span>چند دقیقه برای</span><span>حضور بهترِ برندت</span></h2>
        <p>یادداشت‌های کوتاه دربارهٔ محتوا، طراحی و ارتباط با مخاطب. نسخهٔ نمایشی مجلهٔ الیتا.</p>
        <span className="section-spark insights-spark" aria-hidden="true"><Icon name="sparkle" /></span>
      </div>
      <div className="insights-grid">
        {closingContent.articles.map(article => (
          <article className="insight-card" key={article.id}>
            <div className="insight-image"><Image src={sitePath(article.image)} alt={article.alt} fill sizes="(min-width: 1050px) 380px, (min-width: 700px) 45vw, 90vw" /><span>یادداشت نمونه</span></div>
            <div className="insight-copy">
              <div className="insight-meta"><span>{article.category}</span><span>{article.duration}</span></div>
              <h3>{article.title}</h3>
              <p>{article.intro}</p>
              <button type="button" className="insight-read" aria-haspopup="dialog" aria-label={`خواندن یادداشت: ${article.title}`} onClick={() => { setSelected(article); dialog.current?.showModal(); }}>خواندن یادداشت<span className="button-circle"><Icon name="arrow" /></span></button>
            </div>
          </article>
        ))}
      </div>
      <dialog ref={dialog} className="insight-dialog" aria-labelledby="insight-dialog-title">
        <div className="insight-dialog-top"><span className="closing-sample-label">یادداشت نمونه</span><button className="insight-dialog-close" type="button" aria-label="بستن یادداشت" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div>
        <p className="insight-dialog-category">{selected.category} / {selected.duration}</p>
        <h2 id="insight-dialog-title">{selected.title}</h2>
        <p className="insight-dialog-intro">{selected.intro}</p>
        {selected.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <a className="pill-button" href={homeContent.contact.whatsapp} target="_blank" rel="noopener noreferrer">دربارهٔ برندم صحبت کنیم<span className="button-circle"><Icon name="arrow" /></span></a>
      </dialog>
    </section>
  );
}

export function ContactSection() {
  const [whatsappHref, setWhatsappHref] = useState("");
  const preparedLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => { if (whatsappHref) preparedLink.current?.focus(); }, [whatsappHref]);
  function prepareMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const contact = String(fields.get("contact") ?? "").trim();
    const service = String(fields.get("service") ?? "");
    const message = String(fields.get("message") ?? "").trim();
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const contactInput = form.elements.namedItem("contact") as HTMLInputElement;
    const messageInput = form.elements.namedItem("message") as HTMLTextAreaElement;
    const normalizedContact = contact.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    const digitCount = normalizedContact.replace(/\D/g, "").length;
    const isPhone = /^\+?[\d\s()-]+$/.test(normalizedContact) && digitCount >= 7 && digitCount <= 15;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    nameInput.setCustomValidity(name.length >= 2 ? "" : "نامت را با دست‌کم دو حرف بنویس.");
    contactInput.setCustomValidity(isPhone || isEmail ? "" : "شماره موبایل یا ایمیل معتبر بنویس.");
    messageInput.setCustomValidity(message.length >= 10 ? "" : "کمی بیشتر دربارهٔ درخواستت بنویس؛ دست‌کم ۱۰ حرف.");
    if (!form.reportValidity()) return;
    const composed = `سلام، من ${name} هستم.\nموضوع گفتگو: ${service}\nراه ارتباطی من: ${contact}\n\n${message}`;
    setWhatsappHref(`${homeContent.contact.whatsapp}?text=${encodeURIComponent(composed)}`);
  }
  const { contact } = homeContent;
  return (
    <section className="contact-section container" id="contact" aria-labelledby="contact-title">
      <div className="section-heading"><h2 id="contact-title"><span>از ایده‌ات بگو،</span><span>قدم اول را با هم برداریم</span></h2><p>برای پیجت برنامه داری یا به یک وب‌سایت فکر می‌کنی؟ راه ارتباطی دلخواهت را انتخاب کن.</p></div>
      <div className="contact-grid">
        <aside className="contact-info" aria-labelledby="contact-info-title">
          <h3 id="contact-info-title">مستقیم در ارتباط باشیم</h3>
          <p>من الهه طاهری‌ام. دربارهٔ برندت و چیزی که می‌خوای بسازی، برام بنویس.</p>
          <a className="contact-channel" href={contact.phone}><span className="contact-channel-icon"><Icon name="phone" /></span><span><small>تماس با الیتا</small><strong dir="ltr">{contact.phoneLabel}</strong></span></a>
          <a className="contact-channel" href={contact.instagram} target="_blank" rel="noopener noreferrer"><span className="contact-channel-icon"><Icon name="instagram" /></span><span><small>اینستاگرام</small><strong dir="ltr">@elita.nasl</strong></span></a>
          <a className="contact-channel" href={contact.telegram} target="_blank" rel="noopener noreferrer"><span className="contact-channel-icon"><Icon name="telegram" /></span><span><small>تلگرام</small><strong dir="ltr">@elitanasl</strong></span></a>
          <a className="contact-whatsapp" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">شروع گفتگو در واتساپ<Icon name="arrow" /></a>
        </aside>
        <div className="contact-form-panel">
          <h3>برندت به چی نیاز داره؟</h3>
          <p>اطلاعات را بنویس تا پیامت برای ادامهٔ گفتگو در واتساپ آماده شود.</p>
          <form className="contact-form" onSubmit={prepareMessage} onChange={event => { setWhatsappHref(""); const field = event.target; if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.setCustomValidity(""); }}>
            <div className="contact-form-row">
              <label htmlFor="contact-name">نام شما<input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="نام و نام خانوادگی" /></label>
              <label htmlFor="contact-way">موبایل یا ایمیل<input id="contact-way" name="contact" autoComplete="off" required minLength={5} maxLength={120} dir="ltr" placeholder="09… / name@example.com" /></label>
            </div>
            <label htmlFor="contact-service">خدمت موردنیاز<select id="contact-service" name="service" defaultValue="هنوز مطمئن نیستم"><option>هنوز مطمئن نیستم</option><option>مدیریت اینستاگرام</option><option>طراحی وب‌سایت</option><option>تولید محتوا</option><option>سئو و پشتیبانی سایت</option><option>چند خدمت در کنار هم</option></select></label>
            <label htmlFor="contact-message">کمی از کسب‌وکارت بگو<textarea id="contact-message" name="message" required minLength={10} maxLength={2000} rows={4} placeholder="چه کاری انجام می‌دی و دوست داری به کجا برسی؟" /></label>
            <p className="contact-form-note" id="contact-form-note">با ادامه، متن آماده را در واتساپ می‌بینی و خودت ارسال می‌کنی.</p>
            <button type="submit" className="pill-button" aria-describedby="contact-form-note">ادامهٔ گفتگو در واتساپ<span className="button-circle"><Icon name="arrow" /></span></button>
            {whatsappHref && <div className="contact-prepared"><p role="status">پیامت آماده‌ست؛ برای بررسی و ارسال، واتساپ را باز کن.</p><a ref={preparedLink} href={whatsappHref} target="_blank" rel="noopener noreferrer">باز کردن واتساپ با متن آماده<Icon name="arrow" /></a></div>}
            <noscript><p className="contact-form-note">برای گفتگو، از لینک مستقیم واتساپ در کنار فرم استفاده کن.</p></noscript>
          </form>
        </div>
      </div>
      <div className="contact-faq" aria-labelledby="faq-title"><div><h3 id="faq-title">قبل از شروع، <br />شاید سؤال تو هم باشه</h3><p>چند نکته دربارهٔ مسیر همکاری</p></div><div className="contact-faq-list">{closingContent.faqs.map(faq => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div>
    </section>
  );
}
