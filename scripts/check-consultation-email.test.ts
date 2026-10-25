import assert from "node:assert/strict";
import { test } from "node:test";
import { ConsultationEmailError, sendConsultationEmail } from "../src/lib/consultation-email";

const recipient = "elitasociall@gmail.com";
const request = { name: "مشتری آزمایشی", contact: "test@example.com", service: "طراحی وب‌سایت", message: "این یک درخواست ساختگی برای تست محلی است.", plan: "پلن نمایشی", reference: "EL-TEST-ONLY" };
const fakeFetch = (handler: (url: string, init: RequestInit) => Response | Promise<Response>): typeof fetch => async (input, init) => handler(String(input), init ?? {});

test("sends full contextual data to the chosen recipient with email Reply-To and honeypot", async () => {
  let calls = 0;
  await sendConsultationEmail(recipient, request, { fetcher: fakeFetch((url, init) => {
    calls++;
    assert.equal(url, "https://formsubmit.co/ajax/elitasociall%40gmail.com");
    assert.equal(init.method, "POST");
    assert.deepEqual(init.headers, { "Content-Type": "application/json", Accept: "application/json" });
    assert.deepEqual(JSON.parse(String(init.body)), { ...request, _subject: "درخواست مشاوره جدید | الیتا سوشیال", _template: "table", _replyto: request.contact, _honey: "" });
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json({ success: "true", message: "Request accepted" });
  }) });
  assert.equal(calls, 1);
});

test("does not turn a phone contact into an email Reply-To or disable provider CAPTCHA", async () => {
  await sendConsultationEmail(recipient, { ...request, contact: "09330000000", website: "bot-filled-field" }, { fetcher: fakeFetch((_url, init) => {
    const payload = JSON.parse(String(init.body));
    assert.equal(payload.contact, "09330000000");
    assert.equal(payload._honey, "bot-filled-field");
    assert.equal("_replyto" in payload, false);
    assert.equal("_captcha" in payload, false);
    return Response.json({ success: true });
  }) });
});

test("rejects HTTP failures even when the JSON contains success", async () => {
  await assert.rejects(sendConsultationEmail(recipient, request, { fetcher: fakeFetch(() => Response.json({ success: true }, { status: 429 })) }), { code: "rejected" });
});

for (const payload of [{ success: false }, { success: "false" }, { success: 1 }, { success: "TRUE" }, { message: "accepted" }, null, [], "success"]) {
  test(`rejects non-success or malformed response ${JSON.stringify(payload)}`, async () => {
    await assert.rejects(sendConsultationEmail(recipient, request, { fetcher: fakeFetch(() => Response.json(payload)) }), { code: "rejected" });
  });
}

test("rejects malformed JSON instead of displaying success", async () => {
  await assert.rejects(sendConsultationEmail(recipient, request, { fetcher: fakeFetch(() => new Response("<html>blocked</html>", { status: 200 })) }), { code: "unavailable" });
});

test("times out an unresponsive request and aborts its fetch", async () => {
  let aborted = false;
  await assert.rejects(sendConsultationEmail(recipient, request, {
    timeoutMs: 5,
    fetcher: fakeFetch((_url, init) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => {
        aborted = true;
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    })),
  }), { code: "timeout" });
  assert.equal(aborted, true);
});

test("reports network failure without propagating provider-specific details", async () => {
  await assert.rejects(sendConsultationEmail(recipient, request, { fetcher: fakeFetch(() => { throw new TypeError("Private provider detail"); }) }), (caught: unknown) => {
    assert.ok(caught instanceof ConsultationEmailError);
    assert.equal(caught.code, "unavailable");
    assert.equal(caught.message.includes("Private provider detail"), false);
    return true;
  });
});

test("invalid destination is rejected without sending any data", async () => {
  await assert.rejects(sendConsultationEmail("not-an-email", request, { fetcher: fakeFetch(() => { assert.fail("Unexpected network call"); }) }), { code: "invalid-recipient" });
});
