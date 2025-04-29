import fetch from 'node-fetch';

const generateEmbedding = async (text) => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Error fetching embedding: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data[0] || !data[0].embedding) {
    throw new Error("Embedding not found in the response");
  }

  return data[0].embedding;
};

export { generateEmbedding };
