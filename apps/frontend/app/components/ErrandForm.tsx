'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse"></div>
})

import type { ErrandFormData } from '../lib/types'

interface ErrandFormProps {
  onSubmit: (data: ErrandFormData) => void
  onCancel: () => void
}

const categories = [
  '배달/픽업',
  '쇼핑/구매',
  '청소/정리',
  '이사/운반',
  '기타'
]

export default function ErrandForm({ onSubmit, onCancel }: ErrandFormProps) {
  const [formData, setFormData] = useState<ErrandFormData>({
    title: '',
    description: '',
    reward: 0,
    lat: null,
    lng: null,
    deadline: '',
    category: categories[0]
  })
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // 사용자 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // 위치 가져오기 실패 시 서울시청으로 기본 설정
          setUserLocation({ lat: 37.5665, lng: 126.9780 })
        }
      )
    } else {
      setUserLocation({ lat: 37.5665, lng: 126.9780 })
    }
  }, [])

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lat || !formData.lng) {
      alert('지도에서 위치를 선택해주세요.')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">심부름 요청하기</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="심부름 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="심부름 내용을 자세히 설명해주세요"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  보상 금액 (원)
                </label>
                <input
                  type="number"
                  value={formData.reward}
                  onChange={(e) => setFormData(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                  min="1000"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  마감 시간
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                위치 선택
              </label>
              <p className="text-sm text-gray-500 mb-2">
                지도를 클릭하여 심부름 위치를 선택하세요
                {formData.lat && formData.lng && (
                  <span className="text-green-600 ml-2">
                    ✓ 위치 선택됨
                  </span>
                )}
              </p>
              <MapComponent 
                onLocationSelect={handleLocationSelect} 
                userLocation={userLocation}
                centerLocation={userLocation}
                errands={[]} // 등록 폼에서는 빈 배열로 설정
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                심부름 등록하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}