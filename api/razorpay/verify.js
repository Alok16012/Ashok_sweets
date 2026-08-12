import crypto from "node:crypto";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return response.status(503).json({ error: "Payment service is not configured" });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = request.body || {};
  if (![orderId, paymentId, signature].every((value) => typeof value === "string" && value.length > 0)) {
    return response.status(400).json({ verified: false });
  }
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const verified = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  return response.status(verified ? 200 : 400).json({ verified });
}

