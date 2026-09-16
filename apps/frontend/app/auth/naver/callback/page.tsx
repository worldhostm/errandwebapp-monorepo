'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NaverCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (token) {
      localStorage.setItem('authToken', token)
      // 홈으로 이동하면서 페이지가 토큰을 인식하도록 리프레시
      router.replace('/')
    } else {
      const messages: Record<string, string> = {
        invalid_state: '잘못된 요청입니다. 다시 시도해 주세요.',
        token_error: '네이버 인증에 실패했습니다.',
        user_info_error: '사용자 정보를 가져오는 데 실패했습니다.',
        server_error: '서버 오류가 발생했습니다.',
        access_denied: '로그인이 취소되었습니다.',
      }
      setErrorMessage(messages[error || ''] || '알 수 없는 오류가 발생했습니다.')
      setStatus('error')
    }
  }, [searchParams, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg p-8 shadow-md max-w-sm w-full text-center">
          <p className="text-red-500 font-medium mb-4">{errorMessage}</p>
          <button
            onClick={() => router.replace('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg p-8 shadow-md max-w-sm w-full text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4" />
        <p className="text-gray-600">네이버 로그인 처리 중...</p>
      </div>
    </div>
  )
}
