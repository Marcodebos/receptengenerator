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
  const { time, cuisine, diet, calories, people } = await request.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is niet ingesteld' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const timeLabel = TIME_LABELS[time] || TIME_LABELS.short
  const caloriesLabel = CALORIES_LABELS[calories] || CALORIES_LABELS.middel

  const prompt = `Je bent een van de meest gerenommeerde chefs ter wereld — denk aan het niveau van Ferran Adrià, René Redzepi of Heston Blumenthal. Je hebt tientallen jaren in de beste keukens van de wereld gewerkt en je weet als geen ander hoe je smaken tot leven brengt. Jouw recepten zijn nooit saai of voorspelbaar: ze verrassen, ze prikkelen de nieuwsgierigheid, maar bovenal zijn ze gegarandeerd onweerstaanbaar lekker. Je stelt nooit een recept voor dat je zelf niet met volle overtuiging zou serveren.

Genereer precies 5 verrassende, onverwachte en buitengewoon smaakvolle recepten op basis van onderstaande criteria. Vermijd de voor de hand liggende standaardrecepten — kies voor onverwachte combinaties, originele bereidingstechnieken of vergeten klassieken die mensen verrassen. Elk recept moet iets hebben waardoor je denkt: "Dit had ik zelf nooit bedacht, maar het is geniaal."

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
6. De 5 recepten moeten onderling sterk gevarieerd zijn — in bereidingstechniek, smaakprofiel en presentatie.
7. Ingrediënthoeveelheden zijn voor ${people} ${people === 1 ? 'persoon' : 'personen'}.
8. Geef accurate, realistische calorie- en prijsberekeningen.
9. Instructies moeten duidelijk, stap voor stap en uitvoerbaar zijn voor een thuiskok.
10. Vermijd de meest bekende, voor de hand liggende recepten voor deze combinatie. Verras.

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

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Incrementele scanner: plukt complete recept-objecten uit de "recipes"-array
      // zodra ze binnen zijn, zonder op de volledige JSON te wachten.
      let buffer = ''
      let started = false   // array-start "recipes": [ gevonden?
      let i = 0             // scan-positie in buffer
      let depth = 0         // accolade-diepte
      let objStart = -1     // start-index van het huidige top-level object
      let inStr = false
      let esc = false
      let done = false

      const scanAndEmit = () => {
        if (done) return
        if (!started) {
          const key = buffer.indexOf('"recipes"')
          if (key === -1) return
          const br = buffer.indexOf('[', key)
          if (br === -1) return
          i = br + 1
          started = true
        }
        for (; i < buffer.length; i++) {
          const c = buffer[i]
          if (inStr) {
            if (esc) esc = false
            else if (c === '\\') esc = true
            else if (c === '"') inStr = false
            continue
          }
          if (c === '"') { inStr = true; continue }
          if (c === '{') {
            if (depth === 0) objStart = i
            depth++
          } else if (c === '}') {
            depth--
            if (depth === 0 && objStart !== -1) {
              const objStr = buffer.slice(objStart, i + 1)
              objStart = -1
              try {
                const recipe = JSON.parse(objStr)
                controller.enqueue(encoder.encode(JSON.stringify(recipe) + '\n'))
              } catch {
                // onvolledig/ongeldig object — overslaan
              }
            }
          } else if (c === ']' && depth === 0) {
            done = true
            return
          }
        }
      }

      try {
        const llmStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const event of llmStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            buffer += event.delta.text
            scanAndEmit()
          }
        }
        controller.close()
      } catch (error) {
        console.error('Receptgeneratie fout:', error)
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ error: error.message || 'Recepten konden niet worden gegenereerd' }) + '\n'
          )
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
