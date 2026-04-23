import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ellis Mobile Repair | Lawn Mower Tune-Ups & Repair',
  description: 'Mobile lawn mower repair and tune-up service coming to you in Council Bluffs IA, Omaha NE, and Elkhorn NE. Oil changes, blade sharpening, carburetor cleaning, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
