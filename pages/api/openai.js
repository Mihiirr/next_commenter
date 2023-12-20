import OpenAI from "openai";
import Cors from "cors";

const cors = Cors({
  methods: ["POST"], // Allow only POST method
  origin: ["https://www.linkedin.com", "http://localhost:3000"], // Add more origins as needed
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { postContent, tone, imageSource } = req.body;
  console.log(`ImageSRSCS: ${imageSource}`)
  try {
    // Replace "text-davinci-003" with the latest model you intend to use
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: postContent ? imageSource ? `Generate a brief, ${tone} comment for a LinkedIn post: ${postContent} and also refer the image/images: ${imageSource}. The comment should be professional, relevant to the post's content, and aim to add value by [providing insight/asking a question/showing support]. Ensure the language is clear, concise, and appropriate for a professional networking platform.
` : `Generate a brief, ${tone} comment for a LinkedIn post: ${postContent}. The comment should be professional, relevant to the post's content, and aim to add value by [providing insight/asking a question/showing support]. Ensure the language is clear, concise, and appropriate for a professional networking platform.` : imageSource ? `Generate a brief, ${tone} comment for a LinkedIn post that only has image or images: ${imageSource}. The comment should be professional, relevant to the post's content, and aim to add value by [providing insight/asking a question/showing support]. Ensure the language is clear, concise, and appropriate for a professional networking platform.` : "write a messege that you did'nt get any information so not able to give any linkedIn comment suggestion in 15 words",
        },
      ],
      model: "gpt-3.5-turbo-1106",
    });

    return res.status(200).json(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return res.status(500).json({ message: "Error processing your request" });
  }
}
