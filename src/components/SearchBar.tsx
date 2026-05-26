'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const path = query.trim()
      ? `/clubs?search=${encodeURIComponent(query.trim())}`
      : '/clubs'
    router.push(path)
  }

  return (
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="관심있는 동아리를 검색해보세요..."
          className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>
      <button
        type="submit"
        className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors shrink-0"
      >
        검색
      </button>
    </form>
  )
}
