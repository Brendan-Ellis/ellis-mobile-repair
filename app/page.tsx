import Link from 'next/link'

const SERVICES = [
  { name: 'Full Tune-Up', desc: 'Oil change, spark plug, air filter, blade sharpen & general inspection', price: 'From $65' },
  { name: 'Oil Change', desc: 'Drain and replace oil, check levels', price: 'From $25' },
  { name: 'Blade Sharpening', desc: 'Remove, sharpen, and rebalance mower blades', price: 'From $20' },
  { name: 'Spark Plug Replacement', desc: 'Replace spark plug(s) for reliable starting', price: 'From $15' },
  { name: 'Carburetor Cleaning', desc: 'Clean or rebuild carburetor to fix starting/running issues', price: 'From $45' },
  { name: 'Belt Replacement', desc: 'Replace worn drive or deck belts', price: 'From $35 + parts' },
  { name: 'Air Filter Replacement', desc: 'Replace clogged air filter for better performance', price: 'From $10' },
  { name: 'Diagnostics & Minor Repair', desc: 'Diagnose issues and handle minor fixes on the spot', price: 'Quote provided' },
]

const AREAS = ['Council Bluffs, IA', 'Omaha, NE', 'Surrounding areas']

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">Ellis Mobile Repair</p>
            <p className="text-xs text-gray-500">Lawn Mower Service · We Come To You</p>
          </div>
          <Link
            href="/book"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Book Service
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
            Mobile Service · We Come To You
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Lawn Mower Tune-Ups &<br />Repair At Your Door
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            No trailers, no hassle. We bring the shop to you. Serving Council Bluffs and Omaha with fast, affordable mower service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Schedule Service
            </Link>
            <a
              href="tel:+17123265651"
              className="border border-gray-600 hover:border-gray-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Call (712) 326-5651
            </a>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: '🚚', title: 'We Come To You', desc: 'No need to haul your mower anywhere. We show up at your home or property.' },
              { icon: '⚡', title: 'Fast Turnaround', desc: 'Most tune-ups and minor repairs done on-site in under an hour.' },
              { icon: '💰', title: 'Fair Pricing', desc: 'Upfront quotes before any work begins. No surprise charges.' },
            ].map(item => (
              <div key={item.title} className="p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Services & Pricing</h2>
            <p className="text-gray-500">Starting prices listed — final quote given before work begins.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map(s => (
              <div key={s.name} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                </div>
                <span className="text-green-600 font-bold text-sm whitespace-nowrap">{s.price}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">Parts additional where applicable. Diagnostic fee may apply for complex issues.</p>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Service Area</h2>
          <p className="text-gray-500 mb-8">We currently serve the following areas. Not sure if we cover you? Give us a call.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {AREAS.map(a => (
              <span key={a} className="bg-green-50 border border-green-200 text-green-700 font-medium text-sm px-4 py-2 rounded-full">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Do I need to be home during the service?',
                a: 'Not necessarily. As long as we can access your equipment and you\'ve provided the location details, we can often complete the job without you being present. We\'ll call or text when we\'re on our way and when the job is done.',
              },
              {
                q: 'How long does a typical service take?',
                a: 'Most tune-ups and minor repairs are completed in 1 hour or less on-site. More complex repairs like carburetor rebuilds or belt replacements may take longer. We\'ll give you an honest estimate upfront.',
              },
              {
                q: 'Do you charge a travel or trip fee?',
                a: 'No trip fee for customers in our service area (Council Bluffs and Omaha). The price you\'re quoted covers parts and labor — no hidden travel charges.',
              },
              {
                q: 'What if you can\'t fix it on the spot?',
                a: 'If a repair requires parts we don\'t have on hand, we\'ll let you know right away. We can order the parts and schedule a return visit, or provide a full quote before any work begins.',
              },
              {
                q: 'Do you work on riding mowers and zero-turns?',
                a: 'Yes! We service push mowers, self-propelled mowers, riding mowers, zero-turn mowers, and tractors. If you\'re unsure, just give us a call and we\'ll let you know.',
              },
              {
                q: 'How do I know what the final price will be?',
                a: 'We send you a quote before any work begins. You\'ll see the estimated total and can accept or decline — no surprise charges ever.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white rounded-2xl border border-gray-200 shadow-sm group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-gray-900">
                  {q}
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-gray-500 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-900 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Book?</h2>
          <p className="text-gray-400 mb-8">Fill out our quick booking form and we'll reach out to confirm your appointment.</p>
          <Link
            href="/book"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
          >
            Book Service Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-8 px-4 text-center text-sm">
        <p className="font-semibold text-white mb-1">Ellis Mobile Repair</p>
        <p>Council Bluffs, IA · Omaha, NE</p>
        <p className="mt-2">
          <a href="tel:+17123265651" className="hover:text-white transition-colors">(712) 326-5651</a>
        </p>
      </footer>
    </div>
  )
}
