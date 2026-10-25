/** Public contact forms use FormSubmit; no Gmail password or SMTP secret is sent to browsers. */
export type ConsultationEmail = {
  name: string;
  contact: string;
  service: string;
  message: string;
  plan?: string;
  reference?: string;
  website?: string;
};

export class ConsultationEmailError extends Error {
  constructor(readonly code: "invalid-recipient" | "rejected" | "unavailable" | "timeout") {
    super(`Consultation email: ${code}`);
    this.name = "ConsultationEmailError";
  }
}

type DeliveryOptions = { fetcher?: typeof fetch; timeoutMs?: number };
const emailPattern = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;

/** Acceptance confirms the provider received the request, never that an inbox received an email. */
export async function sendConsultationEmail(recipient: string, request: ConsultationEmail, options: DeliveryOptions = {}) {
  const address = recipient.trim();
  if (!emailPattern.test(address)) throw new ConsultationEmailError("invalid-recipient");
  const payload = {
    name: request.name,
    contact: request.contact,
    service: request.service,
    message: request.message,
    ...(request.plan ? { plan: request.plan } : {}),
    ...(request.reference ? { reference: request.reference } : {}),
    ...(emailPattern.test(request.contact) ? { _replyto: request.contact } : {}),
    _subject: "درخواست مشاوره جدید | الیتا سوشیال",
    _template: "table",
    _honey: request.website ?? "",
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  try {
    const response = await (options.fetcher ?? fetch)(`https://formsubmit.co/ajax/${encodeURIComponent(address)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw new ConsultationEmailError("rejected");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("success" in result) || (result.success !== true && result.success !== "true")) {
      throw new ConsultationEmailError("rejected");
    }
  } catch (caught) {
    if (caught instanceof ConsultationEmailError) throw caught;
    throw new ConsultationEmailError(controller.signal.aborted ? "timeout" : "unavailable");
  } finally {
    clearTimeout(timeout);
  }
}
