'use client'

import { useState, useRef } from 'react'

// ─── Filter opties ────────────────────────────────────────────────────────────

const TIME_OPTIONS = [
  { id: 'short',  label: 'Snel',    sub: '< 25 min' },
  { id: 'medium', label: 'Normaal', sub: '25–40 min' },
  { id: 'long',   label: 'Lang',    sub: '40+ min' },
]

const CUISINE_OPTIONS = [
  { id: 'Italiaans',  label: 'Italiaans',  flag: '🇮🇹' },
  { id: 'Frans',      label: 'Frans',      flag: '🇫🇷' },
  { id: 'Spaans',     label: 'Spaans',     flag: '🇪🇸' },
  { id: 'Japans',     label: 'Japans',     flag: '🇯🇵' },
  { id: 'Chinees',    label: 'Chinees',    flag: '🇨🇳' },
  { id: 'Thais',      label: 'Thais',      flag: '🇹🇭' },
  { id: 'Vietnamees', label: 'Vietnamees', flag: '🇻🇳' },
  { id: 'Indisch',    label: 'Indisch',    flag: '🇮🇳' },
]

const DIET_OPTIONS = [
  { id: 'vegan',        label: 'Vegan',        icon: '🌱' },
  { id: 'vegetarisch',  label: 'Vegetarisch',  icon: '🥗' },
  { id: 'vis',          label: 'Vis',          icon: '🐟' },
  { id: 'vlees',        label: 'Vlees',        icon: '🥩' },
]

const CALORIES_OPTIONS = [
  { id: 'low_carb', label: 'Low Carb', sub: '< 300 kcal' },
  { id: 'laag',     label: 'Laag',     sub: '300–400 kcal' },
  { id: 'middel',   label: 'Middel',   sub: '400–600 kcal' },
  { id: 'hoog',     label: 'Hoog',     sub: '600+ kcal' },
]

// ─── Herbruikbare UI componenten ──────────────────────────────────────────────

function FilterPill({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
        selected
          ? 'bg-green-600 text-white shadow-sm ring-2 ring-green-600 ring-offset-1'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

function FilterSection({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
      <div className="h-52 bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-2 pt-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-6 w-16 bg-gray-200 rounded-full" />
          ))}
        </div>
        <div className="pt-2 space-y-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RecipeCard({ recipe, tab, onTabChange }) {
  const formatPrice = (price) => {
    if (typeof price === 'number') return `€${price.toFixed(2)}`
    return `€${parseFloat(price).toFixed(2)}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* Afbeelding */}
      <div className="relative h-52 bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex-shrink-0">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : recipe.imageLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
            <p className="text-xs text-green-600 font-medium">Afbeelding laden…</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-40">🍽️</span>
          </div>
        )}
        {/* Moeilijkheidsgraad badge */}
        {recipe.difficulty && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              {recipe.difficulty}
            </span>
          </div>
        )}
      </div>

      {/* Inhoud */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">{recipe.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-shrink-0">{recipe.description}</p>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
            ⏱ {recipe.total_time} min
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
            🔥 {recipe.calories_per_person} kcal/p
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
            💰 {formatPrice(recipe.price_per_person)}/p
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
            👥 {recipe.servings} pers.
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('ingredients')}
            className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
              tab === 'ingredients'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Ingrediënten
          </button>
          <button
            type="button"
            onClick={() => onTabChange('instructions')}
            className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
              tab === 'instructions'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Bereiding
          </button>
        </div>

        {/* Tab inhoud */}
        <div className="flex-1 overflow-y-auto max-h-64 pr-1 text-sm">
          {tab === 'ingredients' ? (
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                  <span>
                    <span className="font-semibold text-gray-800">
                      {ing.amount} {ing.unit}
                    </span>{' '}
                    <span className="text-gray-600">{ing.item}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-600 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────

export default function Home() {
  const [time, setTime] = useState('short')
  const [cuisine, setCuisine] = useState('Italiaans')
  const [diet, setDiet] = useState('vlees')
  const [calories, setCalories] = useState('middel')
  const [people, setPeople] = useState(2)

  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tabs, setTabs] = useState({})

  const resultsRef = useRef(null)

  function setTab(recipeId, tab) {
    setTabs(prev => ({ ...prev, [recipeId]: tab }))
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setRecipes([])

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, cuisine, diet, calories, people }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data = await res.json()

      const withState = data.recipes.map(r => ({
        ...r,
        imageUrl: null,
        imageLoading: true,
      }))

      setRecipes(withState)
      setTabs(Object.fromEntries(data.recipes.map(r => [r.id, 'ingredients'])))

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)

      // Genereer afbeeldingen parallel op de achtergrond
      data.recipes.forEach(async recipe => {
        try {
          const imgRes = await fetch('/api/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipeName: recipe.name,
              imagePrompt: recipe.image_prompt,
            }),
          })

          if (imgRes.ok) {
            const { url } = await imgRes.json()
            setRecipes(prev =>
              prev.map(r =>
                r.id === recipe.id ? { ...r, imageUrl: url, imageLoading: false } : r
              )
            )
          } else {
            setRecipes(prev =>
              prev.map(r =>
                r.id === recipe.id ? { ...r, imageLoading: false } : r
              )
            )
          }
        } catch {
          setRecipes(prev =>
            prev.map(r =>
              r.id === recipe.id ? { ...r, imageLoading: false } : r
            )
          )
        }
      })
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const dietLabel = DIET_OPTIONS.find(d => d.id === diet)?.label ?? diet
  const calLabel = CALORIES_OPTIONS.find(c => c.id === calories)?.label ?? calories

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <span className="text-3xl">🍽️</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Recepten Generator</h1>
            <p className="text-xs text-gray-400 mt-0.5">Ingrediënten van Albert Heijn &amp; Jumbo</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── Filter kaart ── */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <h2 className="text-base font-bold text-gray-700 mb-6">Stel je voorkeuren in</h2>

          <div className="space-y-6">

            {/* Rij 1: Bereidingstijd + Dieet */}
            <div className="grid sm:grid-cols-2 gap-6">
              <FilterSection label="Bereidingstijd">
                {TIME_OPTIONS.map(opt => (
                  <FilterPill key={opt.id} selected={time === opt.id} onClick={() => setTime(opt.id)}>
                    {opt.label}
                    <span className="ml-1 opacity-60 font-normal">{opt.sub}</span>
                  </FilterPill>
                ))}
              </FilterSection>

              <FilterSection label="Dieet">
                {DIET_OPTIONS.map(opt => (
                  <FilterPill key={opt.id} selected={diet === opt.id} onClick={() => setDiet(opt.id)}>
                    {opt.icon} {opt.label}
                  </FilterPill>
                ))}
              </FilterSection>
            </div>

            {/* Rij 2: Keuken */}
            <FilterSection label="Keuken">
              {CUISINE_OPTIONS.map(opt => (
                <FilterPill key={opt.id} selected={cuisine === opt.id} onClick={() => setCuisine(opt.id)}>
                  {opt.flag} {opt.label}
                </FilterPill>
              ))}
            </FilterSection>

            {/* Rij 3: Calorieën + Personen */}
            <div className="grid sm:grid-cols-2 gap-6">
              <FilterSection label="Calorieën">
                {CALORIES_OPTIONS.map(opt => (
                  <FilterPill key={opt.id} selected={calories === opt.id} onClick={() => setCalories(opt.id)}>
                    {opt.label}
                    <span className="ml-1 opacity-60 font-normal">{opt.sub}</span>
                  </FilterPill>
                ))}
              </FilterSection>

              <FilterSection label="Aantal personen">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPeople(n)}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-150 ${
                        people === n
                          ? 'bg-green-600 text-white shadow-sm ring-2 ring-green-600 ring-offset-1'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>

          </div>

          {/* Genereer knop */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-8 py-4 px-6 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Recepten worden gegenereerd…
              </>
            ) : (
              <>
                <span className="text-xl">✨</span>
                Genereer 5 Recepten
              </>
            )}
          </button>
        </div>

        {/* ── Foutmelding ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex gap-3">
            <span className="flex-shrink-0 text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Er is iets misgegaan</p>
              <p className="mt-0.5 opacity-75">{error}</p>
            </div>
          </div>
        )}

        {/* ── Resultaten ── */}
        <div ref={resultsRef}>
          {loading && (
            <div>
              <div className="mb-6">
                <div className="h-6 bg-gray-200 rounded-lg w-48 animate-pulse" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {!loading && recipes.length > 0 && (
            <div>
              {/* Sectie header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Jouw recepten</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {cuisine} &middot; {dietLabel} &middot; {calLabel} calorie &middot; {people} {people === 1 ? 'persoon' : 'personen'}
                </p>
              </div>

              {/* Receptkaarten grid — 2 kolommen, 5e kaart gecentreerd */}
              <div className="grid sm:grid-cols-2 gap-6">
                {recipes.slice(0, 4).map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    tab={tabs[recipe.id] || 'ingredients'}
                    onTabChange={tab => setTab(recipe.id, tab)}
                  />
                ))}
              </div>

              {recipes[4] && (
                <div className="mt-6 sm:max-w-md sm:mx-auto">
                  <RecipeCard
                    recipe={recipes[4]}
                    tab={tabs[recipes[4].id] || 'ingredients'}
                    onTabChange={tab => setTab(recipes[4].id, tab)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>Recepten gegenereerd met AI &middot; Ingrediënten van Albert Heijn &amp; Jumbo &middot; Afbeeldingen door DALL-E 3</p>
      </footer>

    </div>
  )
}
