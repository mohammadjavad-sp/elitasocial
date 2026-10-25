"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { pricingContent, type PricingContent } from "@/content/pricing";
import { readServiceSelection, type SelectedPlan } from "@/lib/service-selection";
import { consultationServiceLabels, type ConsultationService } from "@/lib/consultations-shared";
import { sendConsultationEmail, type ConsultationEmail } from "@/lib/consultation-email";
import { sitePath } from "@/lib/site-path";
import { Icon } from "./icons";
import { socialAccountLabel, useSiteSettings } from "./site-settings-provider";
import { ContactChannels, ContactIcon, contactEmailHref } from "./contact-channels";

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
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "accepted" | "failed">("idle");
  const [submissionStage, setSubmissionStage] = useState<"saving" | "email" | null>(null);
  const pendingEmail = useRef<{ recipient: string; request: ConsultationEmail } | null>(null);
  const formElement = useRef<HTMLFormElement>(null);
  const submissionId = useRef<string | null>(null);
  const busy = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  function clearFeedback() {
    setWhatsappHref(""); setError(""); setReference(""); submissionId.current = null;
    setEmailStatus("idle"); pendingEmail.current = null;
  }
  function startNewRequest() {
    if (busy.current) return;
    formElement.current?.reset();
    setSelectedService("undecided"); setSelectedPlan(null);
    clearFeedback();
    window.setTimeout(() => (formElement.current?.elements.namedItem("name") as HTMLInputElement | null)?.focus(), 0);
  }
  async function deliverEmail(envelope: { recipient: string; request: ConsultationEmail }) {
    setEmailStatus("sending"); setSubmissionStage("email");
    try {
      await sendConsultationEmail(envelope.recipient, envelope.request);
      setEmailStatus("accepted");
    } catch {
      setEmailStatus("failed");
      setError("ارسال ایمیل تأیید نشد. اطلاعاتت حفظ شده؛ دوباره ارسال کن یا از راه‌های ارتباطی کنار فرم استفاده کن.");
    }
  }
  async function retryEmail() {
    if (busy.current || !pendingEmail.current || emailStatus !== "failed") return;
    busy.current = true; setSubmitting(true); setError("");
    try {
      // Retry only the captured email; an already saved CMS request must never be submitted again.
      await deliverEmail(pendingEmail.current);
    } finally {
      busy.current = false; setSubmitting(false); setSubmissionStage(null);
    }
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
  useEffect(() => { if (!submitting && (reference || error || emailStatus === "accepted")) feedback.current?.focus(); }, [reference, error, emailStatus, submitting]);
  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || reference || emailStatus === "accepted") return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const replyContact = String(fields.get("contact") ?? "").trim();
    const service = String(fields.get("service") ?? "");
    const message = String(fields.get("message") ?? "").trim();
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const contactInput = form.elements.namedItem("contact") as HTMLInputElement;
    const messageInput = form.elements.namedItem("message") as HTMLTextAreaElement;
    const serviceInput = form.elements.namedItem("service") as HTMLSelectElement;
    const normalizedContact = replyContact.includes("@") ? replyContact : replyContact.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    const digitCount = normalizedContact.replace(/\D/g, "").length;
    const isPhone = /^\+?[\d\s()-]+$/.test(normalizedContact) && digitCount >= 7 && digitCount <= 15;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyContact);
    nameInput.setCustomValidity(name.length >= 2 ? "" : "نامت را با دست‌کم دو حرف بنویس.");
    contactInput.setCustomValidity(isPhone || isEmail ? "" : "شماره موبایل یا ایمیل معتبر بنویس.");
    messageInput.setCustomValidity(message.length >= 10 ? "" : "کمی بیشتر دربارهٔ درخواستت بنویس؛ دست‌کم ۱۰ حرف.");
    serviceInput.setCustomValidity(Object.hasOwn(consultationServiceLabels, service) ? "" : "خدمت موردنیازت را انتخاب کن.");
    if (!form.reportValidity()) return;
    const planContext = selectedPlan ? `\nپلن مورد گفت‌وگو: ${selectedPlan.plan.name} (${selectedPlan.categoryLabel}${selectedPlan.plan.isMock ? "؛ پلن و قیمت نمایشی، نیازمند پیشنهاد نهایی" : ""})` : "";
    const composed = `سلام، من ${name} هستم.\nموضوع گفتگو: ${consultationServiceLabels[service as ConsultationService]}${planContext}\nراه ارتباطی من: ${replyContact}\n\n${message}`;
    const destination = new URL(contact.whatsapp);
    destination.searchParams.set("text", composed);
    setWhatsappHref(destination.toString());
    setError(""); setReference("");
    busy.current = true; setSubmitting(true);
    setEmailStatus("idle"); pendingEmail.current = null;
    try {
      let savedReference: string | undefined;
      if (acceptsConsultations) {
        setSubmissionStage("saving");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);
        try {
          submissionId.current ??= newRequestId();
          const response = await fetch(sitePath("/api/cms/consultations"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, contact: normalizedContact, service, message, plan: selectedPlan ? { id: selectedPlan.plan.id, categoryId: selectedPlan.categoryId } : undefined, website: String(fields.get("_honey") ?? ""), requestId: submissionId.current }),
            signal: controller.signal,
          });
          const result = await response.json().catch(() => null) as { reference?: unknown; message?: unknown } | null;
          if (!response.ok || typeof result?.reference !== "string" || !result.reference) {
            throw new Error(typeof result?.message === "string" ? result.message : "ثبت درخواست تأیید نشد. دوباره تلاش کن یا یکی از راه‌های ارتباطی کنار فرم را انتخاب کن.");
          }
          savedReference = result.reference;
          setReference(savedReference);
        } finally {
          window.clearTimeout(timeout);
        }
      }
      const envelope = {
        recipient: contact.email,
        request: {
          name, contact: normalizedContact, service: consultationServiceLabels[service as ConsultationService], message,
          plan: selectedPlan ? `${selectedPlan.plan.name} / ${selectedPlan.categoryLabel}${selectedPlan.plan.isMock ? " (نمایشی؛ نیازمند پیشنهاد نهایی)" : ""}` : undefined,
          website: String(fields.get("_honey") ?? ""), reference: savedReference,
        },
      };
      pendingEmail.current = envelope;
      await deliverEmail(envelope);
    } catch (caught) {
      setError(caught instanceof Error && caught.name !== "AbortError" && !(caught instanceof TypeError) ? caught.message : "پاسخ ثبت درخواست دریافت نشد. اطلاعاتت در فرم باقی مانده؛ دوباره تلاش کن یا یکی از راه‌های ارتباطی کنار فرم را انتخاب کن.");
    } finally {
      busy.current = false; setSubmitting(false); setSubmissionStage(null);
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
          <a className="contact-channel" href={contact.bale} target="_blank" rel="noopener noreferrer"><span className="contact-channel-icon"><ContactIcon channel="bale" /></span><span><small>بله</small><strong dir="ltr">{socialAccountLabel(contact.bale)}</strong></span></a>
          <a className="contact-channel" href={contact.eitaa} target="_blank" rel="noopener noreferrer"><span className="contact-channel-icon"><ContactIcon channel="eitaa" /></span><span><small>ایتا</small><strong dir="ltr">{socialAccountLabel(contact.eitaa)}</strong></span></a>
          {contact.rubika ? <a className="contact-channel" href={contact.rubika} target="_blank" rel="noopener noreferrer"><span className="contact-channel-icon"><ContactIcon channel="rubika" /></span><span><small>روبیکا</small><strong dir="ltr">{socialAccountLabel(contact.rubika)}</strong></span></a> : <div className="contact-channel contact-channel-pending"><span className="contact-channel-icon"><ContactIcon channel="rubika" /></span><span><small>روبیکا</small><strong>لینک به‌زودی</strong></span></div>}
          <a className="contact-channel contact-channel-email" href={contactEmailHref(contact.email)}><span className="contact-channel-icon"><ContactIcon channel="email" /></span><span><small>جیمیل</small><strong dir="ltr">{contact.email}</strong></span></a>
          <a className="contact-whatsapp" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">شروع گفتگو در واتساپ<Icon name="arrow" /></a>
        </aside>
        <div className="contact-form-panel">
          <h3>{sections.contactFormTitle}</h3>
          <p>{acceptsConsultations ? sections.contactFormDescription : "از کسب‌وکارت بنویس؛ درخواستت را برای هماهنگی به ایمیل الیتا می‌فرستیم."}</p>
          <form ref={formElement} action={`https://formsubmit.co/${encodeURIComponent(contact.email)}`} method="post" className="contact-form" onSubmit={submitRequest} aria-busy={submitting} onChange={event => { clearFeedback(); const field = event.target; if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.setCustomValidity(""); }}>
            <fieldset className="contact-form-fields" disabled={submitting || Boolean(reference) || emailStatus === "accepted"}>
            <input type="hidden" name="_subject" value="درخواست مشاوره جدید | الیتا سوشیال" />
            <input type="hidden" name="_template" value="table" />
            <div hidden aria-hidden="true"><label htmlFor="contact-website">وب‌سایت<input id="contact-website" name="_honey" tabIndex={-1} autoComplete="off" maxLength={200} /></label></div>
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
            <p className="contact-form-note" id="contact-form-note">نام، راه ارتباطی و متن درخواستت برای پیگیری مشاوره از طریق سرویس ایمیل FormSubmit به الیتا ارسال می‌شود.{acceptsConsultations ? " نسخه‌ای از درخواست در سایت هم ذخیره می‌شود." : " این نسخه اطلاعات را در دیتابیس سایت ذخیره نمی‌کند."}</p>
            <button type="submit" className="pill-button" disabled={submitting || Boolean(reference) || emailStatus === "accepted"} aria-describedby="contact-form-note">{submitting ? submissionStage === "saving" ? "در حال ثبت درخواست…" : "در حال ارسال ایمیل…" : emailStatus === "accepted" ? "درخواست ارسال شد" : reference ? "درخواست ثبت شد" : acceptsConsultations ? "ثبت و ارسال درخواست مشاوره" : "ارسال درخواست مشاوره"}<span className="button-circle"><Icon name="arrow" /></span></button>
            </fieldset>
            {(reference || error || emailStatus === "accepted") && !submitting && <div ref={feedback} tabIndex={-1} data-email-status={emailStatus} className={`contact-prepared${error ? " contact-request-error" : ""}`}>
              {reference && <p role="status"><strong>درخواست مشاوره‌ات در سایت ثبت شد.</strong><br />کد پیگیری: <bdi dir="ltr">{reference}</bdi><br />این کد را برای پیگیری نگه دار؛ درخواستت در پنل الیتا محفوظ است.</p>}
              {emailStatus === "accepted" && <p role="status"><strong>درخواستت برای ارسال ایمیل پذیرفته شد.</strong><br />برای هماهنگی از راه ارتباطی‌ای که نوشتی با تو تماس می‌گیریم.</p>}
              {error && <p role="alert">{error}</p>}
              {emailStatus === "failed" && <button type="button" className="pill-button" id="contact-email-retry" onClick={retryEmail} disabled={submitting}>تلاش دوباره برای ارسال ایمیل<Icon name="arrow" /></button>}
              {(reference || emailStatus === "accepted") && <button type="button" className="contact-new-request" onClick={startNewRequest}>شروع درخواست تازه</button>}
              {whatsappHref && <><p>اگر دوست داری، می‌توانی جداگانه در واتساپ هم گفتگو را ادامه بدهی.</p><a href={whatsappHref} target="_blank" rel="noopener noreferrer">باز کردن واتساپ با متن آماده<Icon name="arrow" /></a></>}
              <ContactChannels contact={contact} includeWhatsapp={false} compact label="راه‌های دیگر برای ادامهٔ گفتگو" />
            </div>}
            <noscript><p className="contact-form-note">با ارسال فرم به سرویس ایمیل منتقل می‌شوی؛ در این حالت درخواست در دیتابیس سایت ثبت نمی‌شود. برای گفتگو می‌توانی از تماس، ایمیل، واتساپ، تلگرام، اینستاگرام، بله یا ایتا هم استفاده کنی.</p></noscript>
          </form>
        </div>
      </div>
      <div className="contact-faq" aria-labelledby="faq-title"><div><h3 id="faq-title">{sections.faqTitle}</h3><p>{sections.faqDescription}</p></div><div className="contact-faq-list">{faqs.map((faq, index) => <details key={`${index}-${faq.question}`}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div>
    </section>
  );
}
