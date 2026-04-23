import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted!</h1>
        <p className="text-gray-500 mb-8">
          Thanks for reaching out. We'll review your request and contact you within 24 hours to confirm your appointment.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Questions? Call us at{' '}
          <a href="tel:+14027637375" className="text-green-600 font-medium">(402) 763-7375</a>
        </p>
        <Link
          href="/"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
