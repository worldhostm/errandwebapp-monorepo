'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TestLoginClient() {
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '1234') {
      // 테스트 사용자로 로그인 처리
      localStorage.setItem('testUser', JSON.stringify({
        id: 'test-user',
        name: '테스트사용자',
        email: 'test@example.com'
      }))
      router.push('/')
    } else {
      alert('비밀번호가 틀렸습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">테스트 로그인</h1>
        <p className="text-black text-center mb-4">
          개발/테스트 목적으로만 사용하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              사용자명
            </label>
            <input
              type="text"
              value="test"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
          >
            테스트 로그인
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            메인 페이지로 돌아가기
          </Link>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-xs text-yellow-800">
            <strong>힌트:</strong> 비밀번호는 &quot;1234&quot;입니다
          </p>
        </div>
      </div>
    </div>
  )
}
