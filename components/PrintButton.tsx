'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-700 transition-colors"
    >
      Print / Save PDF
    </button>
  )
}
