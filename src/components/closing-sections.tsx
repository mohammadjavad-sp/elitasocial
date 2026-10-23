"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { closingContent } from "@/content/closing";
import { pricingContent, type PricingContent } from "@/content/pricing";
import { readServiceSelection, serviceLabels, type SelectedPlan } from "@/lib/service-selection";
import { Icon } from "./icons";
import { socialAccountLabel, useSiteSettings } from "./site-settings-provider";

export function TestimonialsSection() {
  const { sections } = useSiteSettings();
  return (
    <section className="testimonials-section container" id="testimonials" aria-labelledby="testimonials-title">
      <div className="section-heading">
        <h2 id="testimonials-title">{sections.testimonialsTitle}</h2>
        <p>{sections.testimonialsDescription}</p>
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

export function ContactSection({ pricing = pricingContent }: { pricing?: PricingContent }) {
  const { home: { contact, brand }, sections, faqs } = useSiteSettings();
  const [whatsappHref, setWhatsappHref] = useState("");
  const [selectedService, setSelectedService] = useState("هنوز مطمئن نیستم");
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const preparedLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    function selectFromUrl() {
      const selection = readServiceSelection(window.location.search, pricing);
      setSelectedService(selection.service ? serviceLabels[selection.service] : "هنوز مطمئن نیستم");
      setSelectedPlan(selection.selectedPlan);
      setWhatsappHref("");
    }
    selectFromUrl();
    window.addEventListener("popstate", selectFromUrl);
    return () => window.removeEventListener("popstate", selectFromUrl);
  }, [pricing]);
  useEffect(() => { if (whatsappHref) preparedLink.current?.focus(); }, [whatsappHref]);
  function prepareMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const replyContact = String(fields.get("contact") ?? "").trim();
    const service = String(fields.get("service") ?? "");
    const message = String(fields.get("message") ?? "").trim();
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const contactInput = form.elements.namedItem("contact") as HTMLInputElement;
    const messageInput = form.elements.namedItem("message") as HTMLTextAreaElement;
    const normalizedContact = replyContact.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    const digitCount = normalizedContact.replace(/\D/g, "").length;
    const isPhone = /^\+?[\d\s()-]+$/.test(normalizedContact) && digitCount >= 7 && digitCount <= 15;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyContact);
    nameInput.setCustomValidity(name.length >= 2 ? "" : "نامت را با دست‌کم دو حرف بنویس.");
    contactInput.setCustomValidity(isPhone || isEmail ? "" : "شماره موبایل یا ایمیل معتبر بنویس.");
    messageInput.setCustomValidity(message.length >= 10 ? "" : "کمی بیشتر دربارهٔ درخواستت بنویس؛ دست‌کم ۱۰ حرف.");
    if (!form.reportValidity()) return;
    const planContext = selectedPlan ? `\nپلن مورد گفت‌وگو: ${selectedPlan.plan.name} (${selectedPlan.categoryLabel}${selectedPlan.plan.isMock ? "؛ پلن و قیمت نمایشی، نیازمند پیشنهاد نهایی" : ""})` : "";
    const composed = `سلام، من ${name} هستم.\nموضوع گفتگو: ${service}${planContext}\nراه ارتباطی من: ${replyContact}\n\n${message}`;
    const destination = new URL(contact.whatsapp);
    destination.searchParams.set("text", composed);
    setWhatsappHref(destination.toString());
  }
  return (
    <section className="contact-section container" id="contact" aria-labelledby="contact-title">
      <div className="section-heading"><h2 id="contact-title">{sections.contactTitle.map((line, index) => <span key={index}>{line}</span>)}</h2><p>{sections.contactDescription}</p></div>
      <div className="contact-grid">
        <aside className="contact-info" aria-labelledby="contact-info-title">
          <h3 id="contact-info-title">{sections.contactInfoTitle}</h3>
          <p>{sections.contactInfoDescription}</p>
          <a className="contact-channel" href={contact.phone}><span className="contact-channel-icon"><Icon name="phone" /></span><span><small>تماس با {brand.name}</small><strong dir="ltr">{contact.phoneLabel}</strong></span></a>
          <a className="contact-channel" href={contact.instagram} target="_blank" rel="noopener noreferrer"><span className="contact-channel-icon"><Icon name="instagram" /></span><span><small>اینستاگرام</small><strong dir="ltr">{socialAccountLabel(contact.instagram)}</strong></span></a>
          <a className="contact-channel" href={contact.telegram} target="_blank" rel="noopener noreferrer"><span className="contact-channel-icon"><Icon name="telegram" /></span><span><small>تلگرام</small><strong dir="ltr">{socialAccountLabel(contact.telegram)}</strong></span></a>
          <a className="contact-whatsapp" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">شروع گفتگو در واتساپ<Icon name="arrow" /></a>
        </aside>
        <div className="contact-form-panel">
          <h3>{sections.contactFormTitle}</h3>
          <p>{sections.contactFormDescription}</p>
          <form className="contact-form" onSubmit={prepareMessage} onChange={event => { setWhatsappHref(""); const field = event.target; if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.setCustomValidity(""); }}>
            <div className="contact-form-row">
              <label htmlFor="contact-name">نام شما<input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="نام و نام خانوادگی" /></label>
              <label htmlFor="contact-way">موبایل یا ایمیل<input id="contact-way" name="contact" autoComplete="off" required minLength={5} maxLength={120} dir="ltr" placeholder="09… / name@example.com" /></label>
            </div>
            <label htmlFor="contact-service">خدمت موردنیاز<select id="contact-service" name="service" value={selectedService} onChange={event => {
              const nextService = event.target.value;
              setSelectedService(nextService);
              if (selectedPlan && nextService !== serviceLabels[selectedPlan.service]) setSelectedPlan(null);
            }}><option>هنوز مطمئن نیستم</option>{Object.values(serviceLabels).map(label => <option key={label}>{label}</option>)}<option>چند خدمت در کنار هم</option></select></label>
            {selectedPlan && <p className="contact-form-note" role="status"><strong>پلن انتخابی: {selectedPlan.plan.name} / {selectedPlan.categoryLabel}</strong><br />{selectedPlan.plan.isMock ? "این پلن و قیمت آن نمایشی است؛ محدوده و هزینهٔ نهایی پس از مشاوره مشخص می‌شود." : "دربارهٔ محدودهٔ همکاری و نیازهای برندت در ادامه گفتگو می‌کنیم."}</p>}
            <label htmlFor="contact-message">کمی از کسب‌وکارت بگو<textarea id="contact-message" name="message" required minLength={10} maxLength={2000} rows={4} placeholder="چه کاری انجام می‌دی و دوست داری به کجا برسی؟" /></label>
            <p className="contact-form-note" id="contact-form-note">با ادامه، متن آماده را در واتساپ می‌بینی و خودت ارسال می‌کنی.</p>
            <button type="submit" className="pill-button" aria-describedby="contact-form-note">ادامهٔ گفتگو در واتساپ<span className="button-circle"><Icon name="arrow" /></span></button>
            {whatsappHref && <div className="contact-prepared"><p role="status">پیامت آماده‌ست؛ برای بررسی و ارسال، واتساپ را باز کن.</p><a ref={preparedLink} href={whatsappHref} target="_blank" rel="noopener noreferrer">باز کردن واتساپ با متن آماده<Icon name="arrow" /></a></div>}
            <noscript><p className="contact-form-note">برای گفتگو، از لینک مستقیم واتساپ در کنار فرم استفاده کن.</p></noscript>
          </form>
        </div>
      </div>
      <div className="contact-faq" aria-labelledby="faq-title"><div><h3 id="faq-title">{sections.faqTitle}</h3><p>{sections.faqDescription}</p></div><div className="contact-faq-list">{faqs.map((faq, index) => <details key={`${index}-${faq.question}`}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div>
    </section>
  );
}
