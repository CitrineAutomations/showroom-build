import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
})

export const metadata: Metadata = {
  title: 'Division PR — Client Portal',
  description: 'Division Public Relations sample loan portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body style={{ fontFamily: 'var(--font-inter, var(--font-sans))' }}>
        {children}
      </body>
    </html>
  )
}
