'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface CompletionVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  errandTitle: string
  onSubmit: (imageFile: File, message: string) => Promise<void>
}

export default function CompletionVerificationModal({
  isOpen,
  onClose,
  errandTitle,
  onSubmit
}: CompletionVerificationModalProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [completionMessage, setCompletionMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useCamera, setUseCamera] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // 후면 카메라 사용
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setUseCamera(true)
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error)
      alert('카메라에 접근할 수 없습니다. 파일 업로드를 사용해주세요.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setUseCamera(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `completion-${Date.now()}.jpg`, { type: 'image/jpeg' })
            const imageUrl = URL.createObjectURL(blob)
            
            setCapturedImage(imageUrl)
            setImageFile(file)
            stopCamera()
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }, [stopCamera])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file)
        setCapturedImage(imageUrl)
        setImageFile(file)
      } else {
        alert('이미지 파일만 업로드 가능합니다.')
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!imageFile || !completionMessage.trim()) {
      alert('사진과 완료 메시지를 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(imageFile, completionMessage.trim())
      handleClose()
    } catch (error) {
      console.error('완료 인증 제출 오류:', error)
      alert('완료 인증 제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    stopCamera()
    setCapturedImage(null)
    setImageFile(null)
    setCompletionMessage('')
    onClose()
  }

  const resetImage = () => {
    setCapturedImage(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-black">
              심부름 완료 인증
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-black hover:text-black"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-black mb-2">심부름 제목</h4>
            <p className="text-black bg-gray-50 p-3 rounded-md">{errandTitle}</p>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-black mb-3">완료 인증 사진</h4>
            
            {!capturedImage ? (
              <div className="space-y-4">
                {!useCamera ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={startCamera}
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <span className="text-2xl">📷</span>
                      <span className="text-black">카메라로 촬영</span>
                    </button>
                    
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                      <span className="text-2xl">📁</span>
                      <span className="text-black">파일 업로드</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        📸 촬영하기
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Image
                    src={capturedImage}
                    alt="완료 인증 사진"
                    width={600}
                    height={400}
                    className="w-full rounded-lg object-contain bg-gray-100"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
                
                <button
                  onClick={resetImage}
                  className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  다시 촬영/업로드
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block font-medium text-black mb-2">
              완료 메시지 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={completionMessage}
              onChange={(e) => setCompletionMessage(e.target.value)}
              placeholder="심부름을 어떻게 완료했는지 간단히 설명해주세요..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-sm text-black mt-1">
              {completionMessage.length}/500
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!capturedImage || !completionMessage.trim() || isSubmitting}
              className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '제출 중...' : '완료 인증 제출'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}