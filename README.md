# 🍽️ Recepten Generator

Genereer 5 gepersonaliseerde recepten op basis van keuken, dieet, bereidingstijd en calorieën — met ingrediënten van Albert Heijn & Jumbo.

## Functies

- 🌍 8 keukens: Italiaans, Frans, Spaans, Japans, Chinees, Thais, Vietnamees, Indisch
- 🥗 4 diëten: Vegan, Vegetarisch, Vis, Vlees
- ⏱ 3 tijdscategorieën: Snel (<25 min), Normaal (25–40 min), Lang (40+ min)
- 🔥 4 calorieopties: Low Carb, Laag, Middel, Hoog
- 👥 1–8 personen
- 📸 AI-gegenereerde afbeeldingen per recept (DALL-E 3)
- 💰 Prijs per persoon & calorieën per recept
- 🛒 Alleen ingrediënten van AH & Jumbo

---

## Lokale installatie

### 1. Vereisten

- [Node.js 18+](https://nodejs.org/)

### 2. Kloon & installeer

```bash
git clone https://github.com/JOUW-GEBRUIKER/receptengenerator.git
cd receptengenerator
npm install
```

### 3. API keys instellen

Maak een `.env.local` bestand aan (op basis van `.env.local.example`):

```bash
cp .env.local.example .env.local
```

Vul je API keys in:

```env
ANTHROPIC_API_KEY=sk-ant-...     # via console.anthropic.com
OPENAI_API_KEY=sk-...            # via platform.openai.com (optioneel, voor afbeeldingen)
```

> **Zonder OpenAI key** werkt de receptgeneratie gewoon — alleen de afbeeldingen worden niet gegenereerd.

### 4. Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployen op Vercel

### 1. GitHub repository aanmaken

```bash
git init
git add .
git commit -m "Initial commit: Recepten Generator"
git remote add origin https://github.com/JOUW-GEBRUIKER/receptengenerator.git
git push -u origin main
```

### 2. Vercel koppelen

1. Ga naar [vercel.com](https://vercel.com) → **New Project**
2. Selecteer je GitHub repository
3. Klik **Deploy** (Vercel detecteert Next.js automatisch)

### 3. Omgevingsvariabelen toevoegen in Vercel

In het Vercel dashboard → **Settings** → **Environment Variables**:

| Naam | Waarde |
|------|--------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `OPENAI_API_KEY` | `sk-...` *(optioneel)* |

Daarna **Redeploy** uitvoeren.

---

## Technische stack

- **Next.js 14** (App Router)
- **Tailwind CSS** voor styling
- **Claude Opus 4.6** (Anthropic) voor receptgeneratie
- **DALL-E 3** (OpenAI) voor afbeeldingen
- API keys zijn server-side (nooit zichtbaar voor de gebruiker)
