// netlify/functions/collections.js
// Fetches collections from client API with fallback mock data

const CLIENT_API_BASE = process.env.CLIENT_API_BASE_URL || "https://api.example.com/api/v1";
const CLIENT_API_KEY = process.env.CLIENT_API_KEY || "";

const FALLBACK_COLLECTIONS = [
  {
    id: 482865238,
    title: "Premium Mithai",
    handle: "premium-mithai",
    description: "Premium handcrafted sweets made with finest ingredients",
    image: { src: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg" },
    created_at: "2023-01-01T00:00:00-05:00",
    updated_at: "2023-11-01T00:00:00-05:00"
  },
  {
    id: 482865239,
    title: "Wedding Orders",
    handle: "wedding-orders",
    description: "Bulk wedding favour boxes and custom orders",
    image: { src: "https://weddingsutra.com/images/Vendor_Images/Wedding-Favors-%26-Gifts/meetha-by-radisson/meetha-by-radisson-03.jpg" },
    created_at: "2023-02-15T00:00:00-05:00",
    updated_at: "2023-10-15T00:00:00-05:00"
  },
  {
    id: 482865240,
    title: "Traditional Favourites",
    handle: "traditional-favourites",
    description: "Classic Indian sweets made with traditional recipes",
    image: { src: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG" },
    created_at: "2023-03-10T00:00:00-05:00",
    updated_at: "2023-09-20T00:00:00-05:00"
  }
];

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
    let collections = [];

    // Try client API first
    try {
      const apiRes = await fetch(`${CLIENT_API_BASE}/collections`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": CLIENT_API_KEY
        }
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        collections = data?.data?.collections || data?.collections || [];
      }
    } catch (err) {
      console.warn("[collections] Client API unreachable, using fallback:", err.message);
    }

    // Use fallback if no collections from API
    if (collections.length === 0) {
      collections = [...FALLBACK_COLLECTIONS];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: collections.length,
        data: {
          total: collections.length,
          collections
        }
      })
    };
  } catch (error) {
    console.error("[collections] error:", error);
    // Return fallback data even on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: FALLBACK_COLLECTIONS.length,
        data: {
          total: FALLBACK_COLLECTIONS.length,
          collections: FALLBACK_COLLECTIONS
        }
      })
    };
  }
};
