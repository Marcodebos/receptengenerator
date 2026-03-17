import Anthropic from '@anthropic-ai/sdk'

const TIME_LABELS = {
  short: 'Snel — minder dan 25 minuten totaal',
  medium: 'Normaal — 25 tot 40 minuten totaal',
  long: 'Lang — meer dan 40 minuten totaal',
}

const CALORIES_LABELS = {
  low_carb: 'Low Carb (minder dan 300 kcal per persoon, weinig koolhydraten, veel eiwitten en groenten)',
  laag: 'Laag calorie (300–400 kcal per persoon)',
  middel: 'Middel calorie (400–600 kcal per persoon)',
  hoog: 'Hoog calorie (600–900 kcal per persoon, stevige maaltijd)',
}

export async function POST(request) {
  try {
    const { time, cuisine, diet, calories, people } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'ANTHROPIC_API_KEY is niet ingesteld' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const timeLabel = TIME_LABELS[time] || TIME_LABELS.short
    const caloriesLabel = CALORIES_LABELS[calories] || CALORIES_LABELS.middel

    const prompt = `Je bent een professionele chef-kok en receptenschrijver. Genereer precies 5 heerlijke, gevarieerde en goed uitgewerkte recepten op basis van onderstaande criteria.

CRITERIA:
- Bereidingstijd: ${timeLabel}
- Keuken: ${cuisine}
- Dieet/voorkeur: ${diet}
- Calorieën: ${caloriesLabel}
- Aantal personen: ${people}

STRIKTE REGELS:
1. Gebruik UITSLUITEND ingrediënten die standaard verkrijgbaar zijn bij Albert Heijn of Jumbo in Nederland. Geen speciale toko's of buitenlandse winkels.
2. Alle prijzen in EUR, realistisch voor Nederlandse supermarkten (2024/2025 prijzen).
3. De totale bereidingstijd (prep_time + cook_time) MOET precies kloppen met het gevraagde tijdsframe.
4. Calorieën per persoon MOETEN overeenkomen met de gevraagde categorie.
5. Alles in het NEDERLANDS: ingrediëntnamen, instructies, receptnamen en beschrijvingen.
6. De 5 recepten moeten onderling gevarieerd zijn qua bereiding en smaak.
7. Ingrediënthoeveelheden zijn voor ${people} ${people === 1 ? 'persoon' : 'personen'}.
8. Geef accurate, realistische calorie- en prijsberekeningen.
9. Instructies moeten duidelijk, stap voor stap en uitvoerbaar zijn.

ANTWOORD UITSLUITEND met valid JSON, geen markdown, geen code blocks, geen uitleg. Begin direct met {

{
  "recipes": [
    {
      "id": 1,
      "name": "Naam van het recept",
      "description": "Smakelijke beschrijving van 1-2 zinnen die de smaken, texturen en het karakter van het gerecht omschrijft",
      "prep_time": 10,
      "cook_time": 15,
      "total_time": 25,
      "difficulty": "Makkelijk",
      "calories_per_person": 420,
      "price_per_person": 3.50,
      "servings": ${people},
      "ingredients": [
        {"amount": "400", "unit": "g", "item": "kipfilet"},
        {"amount": "2", "unit": "stuks", "item": "uien"},
        {"amount": "3", "unit": "el", "item": "olijfolie"},
        {"amount": "1", "unit": "tl", "item": "paprikapoeder"}
      ],
      "instructions": [
        "Verwarm de oven voor op 200°C.",
        "Snij de ui in halve ringen.",
        "Verhit de olijfolie in een koekenpan op middelhoog vuur.",
        "Verdere stappen..."
      ],
      "image_prompt": "Professional food photography of [dish name], [cuisine] cuisine, beautifully plated on white ceramic, restaurant quality"
    }
  ]
}`

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })

    const finalMessage = await stream.finalMessage()

    const contentBlock = finalMessage.content[0]
    if (contentBlock.type !== 'text') {
      throw new Error('Onverwacht antwoord type van Claude')
    }

    let jsonText = contentBlock.text.trim()

    // Strip markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim()
    }

    const data = JSON.parse(jsonText)

    if (!data.recipes || !Array.isArray(data.recipes)) {
      throw new Error('Ongeldig JSON formaat ontvangen')
    }

    return Response.json(data)
  } catch (error) {
    console.error('Receptgeneratie fout:', error)
    return Response.json(
      { error: error.message || 'Recepten konden niet worden gegenereerd' },
      { status: 500 }
    )
  }
}
