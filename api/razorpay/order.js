export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return response.status(503).json({ error: "Payment service is not configured" });
  const amount = Number(request.body?.amount);
  if (!Number.isInteger(amount) || amount < 100 || amount > 50000000) {
    return response.status(400).json({ error: "Invalid amount" });
  }
  const receipt = String(request.body?.receipt || `ashok-${Date.now()}`).slice(0, 40);
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const razorpay = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { authorization: `Basic ${authorization}`, "content-type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt }),
  });
  const data = await razorpay.json();
  if (!razorpay.ok) return response.status(502).json({ error: "Unable to create payment order" });
  return response.status(200).json({ id: data.id, amount: data.amount, currency: data.currency });
}

