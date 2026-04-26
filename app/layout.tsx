import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ellis Mobile Repair | Lawn Mower Tune-Ups & Repair',
  description: 'Mobile lawn mower repair and tune-up service coming to you in Council Bluffs IA, Omaha NE, and Elkhorn NE. Oil changes, blade sharpening, carburetor cleaning, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-LPDD7R1G62" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-LPDD7R1G62');
        `}</Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
