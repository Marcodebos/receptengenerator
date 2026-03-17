import './globals.css'

export const metadata = {
  title: 'Recepten Generator',
  description: 'Genereer heerlijke recepten op basis van jouw voorkeuren — ingrediënten van Albert Heijn & Jumbo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
