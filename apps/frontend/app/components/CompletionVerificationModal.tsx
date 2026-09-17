'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Modal from './ui/Modal'
import Button from './ui/Button'

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
  onSubmit,
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
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
            setCapturedImage(URL.createObjectURL(blob))
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
        setCapturedImage(URL.createObjectURL(file))
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="심부름 완료 인증" size="lg">
      <div className="mb-4">
        <h4 className="font-medium mb-2">심부름 제목</h4>
        <p className="bg-base-200 p-3 rounded-md text-sm">{errandTitle}</p>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-3">완료 인증 사진</h4>

        {!capturedImage ? (
          <div className="space-y-4">
            {!useCamera ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-base-300 rounded-lg hover:border-primary transition-colors"
                >
                  <span className="text-2xl">📷</span>
                  <span>카메라로 촬영</span>
                </button>
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-base-300 rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <span className="text-2xl">📁</span>
                  <span>파일 업로드</span>
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
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" style={{ maxHeight: '400px', objectFit: 'cover' }} />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={capturePhoto} className="flex-1">📸 촬영하기</Button>
                  <Button variant="ghost" onClick={stopCamera}>취소</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Image
              src={capturedImage}
              alt="완료 인증 사진"
              width={600}
              height={400}
              className="w-full rounded-lg object-contain bg-base-200"
              style={{ maxHeight: '400px' }}
            />
            <Button variant="ghost" fullWidth onClick={resetImage}>다시 촬영/업로드</Button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block font-medium mb-2">
          완료 메시지 <span className="text-error">*</span>
        </label>
        <textarea
          value={completionMessage}
          onChange={(e) => setCompletionMessage(e.target.value)}
          placeholder="심부름을 어떻게 완료했는지 간단히 설명해주세요..."
          className="textarea textarea-bordered w-full resize-none"
          rows={4}
          maxLength={500}
        />
        <div className="text-right text-xs text-base-content/50 mt-1">{completionMessage.length}/500</div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-base-200">
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="flex-1">취소</Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={!capturedImage || !completionMessage.trim()}
          loading={isSubmitting}
          className="flex-1"
        >
          완료 인증 제출
        </Button>
      </div>
    </Modal>
  )
}
