import OpenAI from 'openai'

// Primair: gpt-image-1 (sneller + goedkoper). Levert base64 terug (geen URL).
async function generateWithGptImage(openai, prompt) {
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'low',
  })
  const b64 = response.data[0]?.b64_json
  if (!b64) throw new Error('gpt-image-1: geen afbeelding ontvangen')
  return `data:image/png;base64,${b64}`
}

// Fallback: dall-e-3 (levert een URL). Wordt gebruikt als gpt-image-1 faalt.
async function generateWithDallE(openai, prompt) {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  })
  const url = response.data[0]?.url
  if (!url) throw new Error('dall-e-3: geen afbeelding URL ontvangen')
  return url
}

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

    let url
    try {
      url = await generateWithGptImage(openai, fullPrompt)
    } catch (primaryError) {
      // Automatische fallback naar dall-e-3 als gpt-image-1 niet beschikbaar is
      console.warn('gpt-image-1 mislukt, terugvallen op dall-e-3:', primaryError.message)
      url = await generateWithDallE(openai, fullPrompt)
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
