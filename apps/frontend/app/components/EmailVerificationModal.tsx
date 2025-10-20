'use client'

import { useState, useEffect, useCallback } from 'react'

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onVerified: () => void
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerified
}: EmailVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isOpen, timeLeft])

  const sendVerificationCode = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setTimeLeft(600)
      setCanResend(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (isOpen) {
      sendVerificationCode()
    }
  }, [isOpen, sendVerificationCode])

  const handleResend = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError('')
    setVerificationCode(['', '', '', '', '', ''])

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code')
      }

      setTimeLeft(600)
      setCanResend(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newCode = [...verificationCode]
    newCode[index] = value.slice(-1) // Only take last character
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector<HTMLInputElement>(
        `input[name="code-${index + 1}"]`
      )
      nextInput?.focus()
    }

    // Auto-submit when all fields are filled
    if (index === 5 && value) {
      const code = [...newCode.slice(0, 5), value].join('')
      if (code.length === 6) {
        verifyCode(code)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.querySelector<HTMLInputElement>(
        `input[name="code-${index - 1}"]`
      )
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setVerificationCode(newCode)
      verifyCode(pastedData)
    }
  }

  const verifyCode = async (code: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      setSuccess(true)
      setTimeout(() => {
        onVerified()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setVerificationCode(['', '', '', '', '', ''])
      const firstInput = document.querySelector<HTMLInputElement>('input[name="code-0"]')
      firstInput?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = verificationCode.join('')
    if (code.length === 6) {
      verifyCode(code)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-black text-2xl"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            이메일 인증
          </h2>
          <p className="text-black">
            <span className="font-medium text-blue-600">{email}</span>
            <br />
            으로 전송된 인증 코드를 입력해주세요
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              인증 완료!
            </h3>
            <p className="text-black">
              이메일 인증이 성공적으로 완료되었습니다
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-3 text-center">
                  인증 코드 6자리
                </label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      name={`code-${index}`}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength={1}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      disabled={isLoading || success}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-black'}`}>
                  {timeLeft > 0 ? formatTime(timeLeft) : '시간 만료'}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || isLoading}
                  className={`font-medium ${
                    canResend && !isLoading
                      ? 'text-blue-600 hover:text-blue-700'
                      : 'text-black cursor-not-allowed'
                  }`}
                >
                  코드 재전송
                </button>
              </div>

              <button
                type="submit"
                disabled={verificationCode.join('').length !== 6 || isLoading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-black disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isLoading ? '확인 중...' : '인증하기'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-black">
                이메일을 받지 못하셨나요?
                <br />
                스팸 메일함을 확인해주세요
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
