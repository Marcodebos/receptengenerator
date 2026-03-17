import OpenAI from 'openai'

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { url: null, error: 'OPENAI_API_KEY niet ingesteld' },
      { status: 400 }
    )
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const { recipeName, imagePrompt } = await request.json()

    const fullPrompt = `${imagePrompt}. Overhead shot, clean white ceramic plate, beautifully garnished, professional food styling, shallow depth of field, warm natural light, appetizing and vibrant colors. Photorealistic.`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    const url = response.data[0]?.url

    if (!url) {
      throw new Error('Geen afbeelding URL ontvangen')
    }

    return Response.json({ url })
  } catch (error) {
    console.error('Afbeeldingsgeneratie fout:', error)
    return Response.json(
      { url: null, error: error.message },
      { status: 500 }
    )
  }
}
