'use client'

import { useState } from 'react'

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('basic')

  const sections = [
    {
      id: 'basic',
      title: '기본 사용법',
      icon: '🚀',
      content: [
        {
          title: '1. 회원가입 및 로그인',
          steps: [
            '우상단 로그인 버튼을 클릭합니다',
            '회원가입 탭에서 이메일, 비밀번호, 이름을 입력합니다',
            '가입 완료 후 자동으로 로그인됩니다'
          ]
        },
        {
          title: '2. 현재 위치 설정',
          steps: [
            '지도에서 "현재 내 위치" 버튼을 클릭합니다',
            '브라우저에서 위치 접근을 허용합니다',
            '내 위치 주변의 심부름들이 표시됩니다'
          ]
        }
      ]
    },
    {
      id: 'request',
      title: '심부름 의뢰하기',
      icon: '📝',
      content: [
        {
          title: '1. 심부름 등록',
          steps: [
            '"심부름 등록" 버튼을 클릭합니다',
            '제목, 설명, 보상금액을 입력합니다',
            '카테고리를 선택합니다 (배달, 심부름, 기타)',
            '지도에서 위치를 클릭하여 선택합니다',
            '마감일을 설정합니다 (선택사항)',
            '"등록하기" 버튼을 클릭합니다'
          ]
        },
        {
          title: '2. 내 심부름 관리',
          steps: [
            '"내 심부름" 탭에서 등록한 심부름을 확인합니다',
            '상태별로 필터링할 수 있습니다',
            '완료된 심부름의 인증 내용을 확인할 수 있습니다',
            '필요시 이의제기를 할 수 있습니다'
          ]
        }
      ]
    },
    {
      id: 'accept',
      title: '심부름 수행하기',
      icon: '💪',
      content: [
        {
          title: '1. 심부름 찾기',
          steps: [
            '지도에서 심부름 마커를 클릭합니다',
            '심부름 상세 정보를 확인합니다',
            '거리, 보상금액, 마감일 등을 검토합니다',
            '"심부름 수락" 버튼을 클릭합니다'
          ]
        },
        {
          title: '2. 심부름 완료',
          steps: [
            '"수락한 심부름" 탭에서 진행 중인 심부름을 확인합니다',
            '심부름 완료 후 "완료" 버튼을 클릭합니다',
            '카메라로 완료 인증 사진을 촬영하거나 파일을 선택합니다',
            '완료 메시지를 작성합니다',
            '"완료 인증" 버튼을 클릭합니다'
          ]
        },
        {
          title: '3. 주의사항',
          steps: [
            '한 번에 하나의 심부름만 수행할 수 있습니다',
            '완료 인증은 정확하고 명확한 사진으로 해주세요',
            '의뢰자가 이의제기를 할 수 있으니 성실히 수행해주세요'
          ]
        }
      ]
    },
    {
      id: 'features',
      title: '주요 기능',
      icon: '⭐',
      content: [
        {
          title: '1. 지도 기능',
          steps: [
            '실시간으로 주변 심부름을 확인할 수 있습니다',
            '확대/축소로 원하는 지역을 탐색합니다',
            '마커를 클릭하면 상세 정보를 볼 수 있습니다',
            '현재 위치 버튼으로 내 위치로 이동합니다'
          ]
        },
        {
          title: '2. 알림 기능',
          steps: [
            '우상단 벨 아이콘에서 알림을 확인합니다',
            '심부름 수락, 완료, 이의제기 시 알림이 옵니다',
            '읽지 않은 알림은 빨간 점으로 표시됩니다',
            '"모든 알림 읽음 처리" 버튼으로 일괄 처리할 수 있습니다'
          ]
        },
        {
          title: '3. 검색 및 필터',
          steps: [
            '카테고리별로 심부름을 필터링할 수 있습니다',
            '상태별로 내 심부름을 정렬할 수 있습니다',
            '새로고침 버튼으로 최신 정보를 업데이트합니다'
          ]
        }
      ]
    },
    {
      id: 'tips',
      title: '이용 팁',
      icon: '💡',
      content: [
        {
          title: '1. 효과적인 심부름 등록',
          steps: [
            '명확하고 구체적인 제목을 작성하세요',
            '상세한 설명으로 오해를 방지하세요',
            '적정한 보상금액을 설정하세요',
            '정확한 위치를 지정하세요'
          ]
        },
        {
          title: '2. 안전한 심부름 수행',
          steps: [
            '심부름 내용을 꼼꼼히 확인하고 수락하세요',
            '의문사항이 있으면 미리 문의하세요',
            '완료 인증을 확실히 해주세요',
            '이상한 요청이나 위험한 상황은 피하세요'
          ]
        },
        {
          title: '3. 분쟁 방지',
          steps: [
            '완료 인증 사진은 명확하게 촬영하세요',
            '요청사항을 정확히 수행하세요',
            '소통을 통해 오해를 해결하세요',
            '이의제기 시 합리적인 근거를 제시하세요'
          ]
        }
      ]
    }
  ]

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
            <a href="/" className="inline-block mb-2 min-[400px]:mb-3 sm:mb-4">
              <span className="text-base min-[400px]:text-lg sm:text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer whitespace-nowrap">
                부름이
              </span>
            </a>
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