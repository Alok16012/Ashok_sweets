// netlify/functions/collections.js
// Returns collections in client API format

const COLLECTIONS = [
  {
    id: 1,
    title: "Premium Mithai",
    handle: "premium-mithai",
    description: "Premium dryfruit and special occasion sweets",
    image_url: "https://static.wixstatic.com/media/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg/v1/fill/w_980,h_1307,al_c,q_85/57b89c_9a4a7311b25a41439084b657062603aa~mv2.jpg",
    products_count: 2,
    created_at: "2024-01-01T00:00:00+05:30",
    updated_at: "2024-03-01T00:00:00+05:30"
  },
  {
    id: 2,
    title: "Traditional Favourites",
    handle: "traditional-favourites",
    description: "Classic Indian sweets made with traditional recipes",
    image_url: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG",
    products_count: 2,
    created_at: "2024-01-01T00:00:00+05:30",
    updated_at: "2024-03-01T00:00:00+05:30"
  },
  {
    id: 3,
    title: "Wedding Orders",
    handle: "wedding-orders",
    description: "Custom wedding mithai boxes and hampers",
    image_url: "https://weddingsutra.com/images/Vendor_Images/Wedding-Favors-%26-Gifts/meetha-by-radisson/meetha-by-radisson-03.jpg",
    products_count: 1,
    created_at: "2024-02-01T00:00:00+05:30",
    updated_at: "2024-03-01T00:00:00+05:30"
  },
  {
    id: 4,
    title: "Bengali Sweets",
    handle: "bengali-sweets",
    description: "Authentic Bengali sweets from Dombivli",
    image_url: "https://media.pri.org/s3fs-public/story/images/Mithai.JPG",
    products_count: 1,
    created_at: "2024-03-01T00:00:00+05:30",
    updated_at: "2024-03-10T00:00:00+05:30"
  }
];

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: {
          total: COLLECTIONS.length,
          collections: COLLECTIONS
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
