import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/lib/store'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LedgeX — IKIMINA Smart Ledger',
  description: 'Smart digital operations platform for IKIMINA community savings groups',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
