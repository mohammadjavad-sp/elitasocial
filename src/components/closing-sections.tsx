"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { pricingContent, type PricingContent } from "@/content/pricing";
import { readServiceSelection, type SelectedPlan } from "@/lib/service-selection";
import { consultationServiceLabels, type ConsultationService } from "@/lib/consultations-shared";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";
import { socialAccountLabel, useSiteSettings } from "./site-settings-provider";

const acceptsConsultations = process.env.NEXT_PUBLIC_CMS_ENABLED === "true";

function newRequestId() {
  if (typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function ContactSection({ pricing = pricingContent }: { pricing?: PricingContent }) {
  const { home: { contact, brand }, sections, faqs } = useSiteSettings();
  const [whatsappHref, setWhatsappHref] = useState("");
  const [selectedService, setSelectedService] = useState<ConsultationService>("undecided");
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const submissionId = useRef<string | null>(null);
  const busy = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  function clearFeedback() {
    setWhatsappHref(""); setError(""); setReference(""); submissionId.current = null;
  }
  useEffect(() => {
    function selectFromUrl() {
      if (busy.current) return;
      const selection = readServiceSelection(window.location.search, pricing);
      setSelectedService(selection.service ?? "undecided");
      setSelectedPlan(selection.selectedPlan);
      clearFeedback();
    }
    selectFromUrl();
    window.addEventListener("popstate", selectFromUrl);
    return () => window.removeEventListener("popstate", selectFromUrl);
  }, [pricing]);
  useEffect(() => { if (reference || error || whatsappHref && !submitting) feedback.current?.focus(); }, [reference, error, whatsappHref, submitting]);
  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const replyContact = String(fields.get("contact") ?? "").trim();
    const service = String(fields.get("service") ?? "");
    const message = String(fields.get("message") ?? "").trim();
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const contactInput = form.elements.namedItem("contact") as HTMLInputElement;
    const messageInput = form.elements.namedItem("message") as HTMLTextAreaElement;
    const normalizedContact = replyContact.includes("@") ? replyContact : replyContact.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    const digitCount = normalizedContact.replace(/\D/g, "").length;
    const isPhone = /^\+?[\d\s()-]+$/.test(normalizedContact) && digitCount >= 7 && digitCount <= 15;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyContact);
    nameInput.setCustomValidity(name.length >= 2 ? "" : "نامت را با دست‌کم دو حرف بنویس.");
    contactInput.setCustomValidity(isPhone || isEmail ? "" : "شماره موبایل یا ایمیل معتبر بنویس.");
    messageInput.setCustomValidity(message.length >= 10 ? "" : "کمی بیشتر دربارهٔ درخواستت بنویس؛ دست‌کم ۱۰ حرف.");
    if (!form.reportValidity()) return;
    const planContext = selectedPlan ? `\nپلن مورد گفت‌وگو: ${selectedPlan.plan.name} (${selectedPlan.categoryLabel}${selectedPlan.plan.isMock ? "؛ پلن و قیمت نمایشی، نیازمند پیشنهاد نهایی" : ""})` : "";
    const composed = `سلام، من ${name} هستم.\nموضوع گفتگو: ${consultationServiceLabels[service as ConsultationService]}${planContext}\nراه ارتباطی من: ${replyContact}\n\n${message}`;
    const destination = new URL(contact.whatsapp);
    destination.searchParams.set("text", composed);
    setWhatsappHref(destination.toString());
    setError(""); setReference("");
    if (!acceptsConsultations) return;
    busy.current = true; setSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      submissionId.current ??= newRequestId();
      const response = await fetch(sitePath("/api/cms/consultations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact: normalizedContact, service, message, plan: selectedPlan ? { id: selectedPlan.plan.id, categoryId: selectedPlan.categoryId } : undefined, website: String(fields.get("website") ?? ""), requestId: submissionId.current }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as { reference?: unknown; message?: unknown } | null;
      if (!response.ok || typeof result?.reference !== "string" || !result.reference) {
        throw new Error(typeof result?.message === "string" ? result.message : "ثبت درخواست تأیید نشد. دوباره تلاش کن یا مستقیم از واتساپ پیام بده.");
      }
      setReference(result.reference);
    } catch (caught) {
      setError(caught instanceof Error && caught.name !== "AbortError" && !(caught instanceof TypeError) ? caught.message : "پاسخ ثبت درخواست دریافت نشد. اطلاعاتت در فرم باقی مانده؛ دوباره تلاش کن یا مستقیم از واتساپ پیام بده.");
    } finally {
      window.clearTimeout(timeout); busy.current = false; setSubmitting(false);
    }
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
          <p>{acceptsConsultations ? sections.contactFormDescription : "در این پیش‌نمایش، فرم به ثبت درخواست متصل نیست. متن را آماده کن و خودت در واتساپ ارسال کن."}</p>
          <form className="contact-form" onSubmit={submitRequest} aria-busy={submitting} onChange={event => { clearFeedback(); const field = event.target; if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.setCustomValidity(""); }}>
            <fieldset className="contact-form-fields" disabled={submitting}>
            <div hidden aria-hidden="true"><label htmlFor="contact-website">وب‌سایت<input id="contact-website" name="website" tabIndex={-1} autoComplete="off" maxLength={200} /></label></div>
            <div className="contact-form-row">
              <label htmlFor="contact-name">نام شما<input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="نام و نام خانوادگی" /></label>
              <label htmlFor="contact-way">موبایل یا ایمیل<input id="contact-way" name="contact" autoComplete="off" required minLength={5} maxLength={120} dir="ltr" placeholder="09… / name@example.com" /></label>
            </div>
            <label htmlFor="contact-service">خدمت موردنیاز<select id="contact-service" name="service" value={selectedService} onChange={event => {
              const nextService = event.target.value;
              setSelectedService(nextService as ConsultationService);
              if (selectedPlan && nextService !== selectedPlan.service) setSelectedPlan(null);
            }}>{Object.entries(consultationServiceLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            {selectedPlan && <p className="contact-form-note" role="status"><strong>پلن انتخابی: {selectedPlan.plan.name} / {selectedPlan.categoryLabel}</strong><br />{selectedPlan.plan.isMock ? "این پلن و قیمت آن نمایشی است؛ محدوده و هزینهٔ نهایی پس از مشاوره مشخص می‌شود." : "دربارهٔ محدودهٔ همکاری و نیازهای برندت در ادامه گفتگو می‌کنیم."}</p>}
            <label htmlFor="contact-message">کمی از کسب‌وکارت بگو<textarea id="contact-message" name="message" required minLength={10} maxLength={2000} rows={4} placeholder="چه کاری انجام می‌دی و دوست داری به کجا برسی؟" /></label>
            <p className="contact-form-note" id="contact-form-note">{acceptsConsultations ? "نام، راه ارتباطی و متن درخواستت فقط برای پیگیری همین مشاوره ذخیره می‌شود." : "این فرم اطلاعات را در سایت ذخیره نمی‌کند؛ ارسال پیام را خودت در واتساپ انجام می‌دهی."}</p>
            <button type="submit" className="pill-button" disabled={submitting || Boolean(reference)} aria-describedby="contact-form-note">{submitting ? "در حال ثبت درخواست…" : reference ? "درخواست ثبت شد" : acceptsConsultations ? "ثبت درخواست مشاوره" : "آماده‌کردن پیام واتساپ"}<span className="button-circle"><Icon name="arrow" /></span></button>
            </fieldset>
            {(reference || error || whatsappHref && !submitting) && <div ref={feedback} tabIndex={-1} className={`contact-prepared${error ? " contact-request-error" : ""}`}>
              {reference ? <p role="status"><strong>درخواست مشاوره‌ات ثبت شد.</strong><br />کد پیگیری: <bdi dir="ltr">{reference}</bdi><br />این کد را نگه دار؛ برای هماهنگی از راه ارتباطی‌ای که نوشتی با تو تماس می‌گیریم.</p> : error ? <p role="alert">{error}</p> : <p role="status">متن آماده است. هنوز پیامی ارسال نشده؛ برای ارسال، واتساپ را باز کن.</p>}
              {whatsappHref && <><p>{acceptsConsultations ? "اگر دوست داری، می‌توانی جداگانه در واتساپ هم گفتگو را ادامه بدهی." : "اطلاعاتی در سایت ثبت نشده است."}</p><a href={whatsappHref} target="_blank" rel="noopener noreferrer">باز کردن واتساپ با متن آماده<Icon name="arrow" /></a></>}
            </div>}
            <noscript><p className="contact-form-note">برای گفتگو، از لینک مستقیم واتساپ در کنار فرم استفاده کن.</p></noscript>
          </form>
        </div>
      </div>
      <div className="contact-faq" aria-labelledby="faq-title"><div><h3 id="faq-title">{sections.faqTitle}</h3><p>{sections.faqDescription}</p></div><div className="contact-faq-list">{faqs.map((faq, index) => <details key={`${index}-${faq.question}`}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div>
    </section>
  );
}
