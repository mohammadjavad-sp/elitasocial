import { getSiteSettings } from "@/server/settings";

export async function FrequentlyAskedSection() {
  const { faqs, sections } = await getSiteSettings();
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="faq-section container" aria-labelledby="faq-title">
      <div><h2 id="faq-title">{sections.faqTitle}</h2><p>{sections.faqDescription}</p></div>
      <div className="faq-list">{faqs.map((faq, index) => (
        <details key={`${index}-${faq.question}`}>
          <summary>{faq.question}<span aria-hidden="true">+</span></summary>
          <p>{faq.answer}</p>
        </details>
      ))}</div>
    </section>
  );
}
