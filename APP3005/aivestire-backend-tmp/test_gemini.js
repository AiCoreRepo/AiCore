const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log("Starting test...");
  // Use a small 1x1 black JPEG for both images
  const b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const mime = "image/jpeg";
  const avatarData = { data: b64, mimeType: mime };
  const clothingData = { data: b64, mimeType: mime };

  const prompt = [
    'Create exactly one new photorealistic virtual try-on image.',
    'The first image is the real person/avatar whose identity must remain unchanged in the final result.',
    'The second image is the garment or outfit reference.',
    'Take the garment from the second image and make the person from the first image actually wear it.',
    'First-image person profile:\n- Gender: female',
    'Identity requirements:',
    '- Preserve the exact same face, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, and body proportions of the first image.',
    '- Keep the first-image person as the only person in the result.',
    '- Do not replace, beautify, reshape, or blend the first-image face or body with the clothing-model or mannequin identity from the second image.',
  ].join('\n');

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Find the key from the running process environment
      console.log("No GEMINI_API_KEY in env, using hardcoded test or we can extract from .env");
      require('dotenv').config({ path: '/home/atul/Desktop/AiCore/APP3005/.env' });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-image-preview',
      generationConfig: { temperature: 0.2 },
    });

    console.log("Calling generateContent...");
    const result = await model.generateContent([
      { inlineData: { data: avatarData.data, mimeType: avatarData.mimeType } },
      { inlineData: { data: clothingData.data, mimeType: clothingData.mimeType } },
      { text: prompt },
    ]);
    
    console.log("Success!");
    console.log("Response text:", result.response.text());
  } catch (error) {
    console.error("Error occurred:");
    console.error(error.message);
    if (error.status) console.error("Status:", error.status);
    console.error(error.stack);
  }
}

testGemini();
