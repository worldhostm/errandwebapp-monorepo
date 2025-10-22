'use client'

import { useState } from 'react'
import Link from 'next/link'

interface GuideSection {
  id: string
  title: string
  icon: string
  content: {
    title: string
    steps: string[]
  }[]
}

interface GuideClientProps {
  sections: GuideSection[]
}

export default function GuideClient({ sections }: GuideClientProps) {
  const [activeSection, setActiveSection] = useState('basic')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* PC 화면용 헤더 */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-black">사용 가이드</h1>
              <span className="text-lg">📖</span>
            </div>
            <p className="text-black mt-2">심부름 앱을 효과적으로 사용하는 방법을 알아보세요</p>
          </div>

          {/* 모바일 화면용 헤더 */}
          <div className="lg:hidden">
            <Link href="/" className="inline-block mb-2 min-[400px]:mb-3 sm:mb-4">
              <span className="text-base min-[400px]:text-lg sm:text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer whitespace-nowrap">
                부름이
              </span>
            </Link>
            <div className="flex items-center gap-1.5 min-[400px]:gap-2 sm:gap-3">
              <h1 className="text-lg min-[400px]:text-xl sm:text-2xl font-bold text-black whitespace-nowrap">사용 가이드</h1>
              <span className="text-sm min-[400px]:text-base sm:text-lg">📖</span>
            </div>
            <p className="text-xs min-[400px]:text-sm sm:text-base text-black mt-1.5 min-[400px]:mt-2 leading-relaxed">심부름 앱을 효과적으로 사용하는 방법을 알아보세요</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사이드바 네비게이션 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-8">
              <h3 className="font-semibold text-black mb-4">목차</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    <span>{section.icon}</span>
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">{section.icon}</span>
                    <h2 className="text-xl font-bold text-black">{section.title}</h2>
                  </div>

                  <div className="space-y-8">
                    {section.content.map((item, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-6">
                        <h3 className="text-lg font-semibold text-black mb-4">
                          {item.title}
                        </h3>
                        <div className="space-y-3">
                          {item.steps.map((step, stepIndex) => (
                            <div
                              key={stepIndex}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                {stepIndex + 1}
                              </div>
                              <p className="text-black leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 추가 도움말 */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-black mb-2">
              더 궁금한 점이 있으신가요?
            </h3>
            <p className="text-black mb-4">
              문제가 있거나 추가적인 도움이 필요하시면 언제든 연락해주세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-black">
                <span>📧</span>
                <span>support@errandapp.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black">
                <span>📞</span>
                <span>1588-0000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
