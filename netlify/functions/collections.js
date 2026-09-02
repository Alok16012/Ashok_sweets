// netlify/functions/collections.js
// Fetches collections from the actual client API

const CLIENT_API_BASE = process.env.VITE_CLIENT_API_BASE_URL || "https://api.example.com/api/v1";
const CLIENT_API_KEY = process.env.VITE_CLIENT_API_KEY || "";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const url = `${CLIENT_API_BASE}/collections`;

    const apiRes = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLIENT_API_KEY
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Client API responded ${apiRes.status}: ${errText}`);
    }

    const data = await apiRes.json();
    const collections = data?.data?.collections || data?.collections || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: {
          total: data?.data?.total || collections.length,
          collections
        }
      })
    };
  } catch (error) {
    console.error("[collections] error:", error);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
