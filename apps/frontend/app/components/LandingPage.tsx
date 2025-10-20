'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
            간편한 심부름,
            <br />
            <span className="text-blue-600">부름이</span>와 함께
          </h1>
          <p className="text-xl text-black mb-8 max-w-2xl mx-auto">
            바쁜 일상 속 필요한 심부름을 주변 사람들과 연결해드립니다.
            <br />
            간단한 일로 부수입을 얻거나, 필요한 도움을 빠르게 받아보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="bg-blue-500 text-white px-8 py-4 rounded-lg hover:bg-blue-600 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              지금 시작하기
            </button>
            <a
              href="#features"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 text-lg"
            >
              <span className="text-black">더 알아보기</span>
              <span className="text-black">↓</span>
            </a>
          </div>
        </div>

        {/* Hero Image/Illustration */}
        <div className="mt-16 relative h-96 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: 'url(/bureeme.jpg)', backgroundSize: 'cover', backgroundPosition: 'top' }}>
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">주변 이웃과 함께하는 심부름 플랫폼</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-4">
            부름이가 특별한 이유
          </h2>
          <p className="text-xl text-black">
            편리하고 안전한 심부름 중개 서비스
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-blue-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-2xl font-bold text-black mb-3">
              위치 기반 매칭
            </h3>
            <p className="text-black">
              지도에서 내 주변 심부름을 한눈에 확인하고,
              가까운 곳의 심부름을 선택할 수 있습니다.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-green-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-2xl font-bold text-black mb-3">
              합리적인 보상
            </h3>
            <p className="text-black">
              간단한 심부름으로 부수입을 얻거나,
              필요한 일을 합리적인 가격에 요청할 수 있습니다.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-purple-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-2xl font-bold text-black mb-3">
              실시간 채팅
            </h3>
            <p className="text-black">
              실시간 채팅으로 심부름 요청자와 수행자가
              원활하게 소통할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-4">
            이용 방법
          </h2>
          <p className="text-xl text-black">
            간단한 3단계로 시작하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* For Requesters */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-blue-600 mb-6 flex items-center gap-2">
              <span className="text-black">📝</span>
              심부름 요청하기
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">회원가입 및 로그인</h4>
                  <p className="text-black text-sm">간단한 정보만으로 가입하고 시작하세요</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">심부름 등록</h4>
                  <p className="text-black text-sm">필요한 심부름의 내용, 위치, 보상을 입력하세요</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">수행자와 연결</h4>
                  <p className="text-black text-sm">수락한 수행자와 채팅으로 소통하고 심부름을 완료하세요</p>
                </div>
              </div>
            </div>
          </div>

          {/* For Performers */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center gap-2">
              <span className="text-black">🏃</span>
              심부름 수행하기
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">주변 심부름 찾기</h4>
                  <p className="text-black text-sm">지도에서 내 위치 근처의 심부름을 확인하세요</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">원하는 심부름 수락</h4>
                  <p className="text-black text-sm">내가 할 수 있는 심부름을 선택하고 수락하세요</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">심부름 완료 및 보상</h4>
                  <p className="text-black text-sm">심부름을 완료하고 보상을 받으세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Carousel */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-black mb-4">
              상세 사용법
            </h3>
            <p className="text-lg text-black">
              이미지로 쉽게 알아보는 부름이 사용 가이드
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {/* Slide 1 */}
                <div className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                  <div className="bg-white rounded-xl shadow-lg p-6 mx-2 h-full">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">📱</div>
                        <p className="text-sm font-semibold text-black">앱 실행 화면</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-black mb-2">1. 회원가입</h4>
                    <p className="text-black">
                      간단한 정보 입력으로 회원가입을 완료하세요. 이메일 인증 후 바로 서비스를 이용할 수 있습니다.
                    </p>
                  </div>
                </div>

                {/* Slide 2 */}
                <div className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                  <div className="bg-white rounded-xl shadow-lg p-6 mx-2 h-full">
                    <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">🗺️</div>
                        <p className="text-sm font-semibold text-black">지도 화면</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-black mb-2">2. 심부름 찾기</h4>
                    <p className="text-black">
                      지도에서 내 주변의 심부름을 확인하세요. 카테고리별로 필터링하여 원하는 심부름을 쉽게 찾을 수 있습니다.
                    </p>
                  </div>
                </div>

                {/* Slide 3 */}
                <div className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                  <div className="bg-white rounded-xl shadow-lg p-6 mx-2 h-full">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">📝</div>
                        <p className="text-sm font-semibold text-black">등록 화면</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-black mb-2">3. 심부름 등록</h4>
                    <p className="text-black">
                      필요한 심부름을 등록하세요. 카테고리, 위치, 보상금을 설정하면 주변 사용자에게 알림이 전송됩니다.
                    </p>
                  </div>
                </div>

                {/* Slide 4 */}
                <div className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                  <div className="bg-white rounded-xl shadow-lg p-6 mx-2 h-full">
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">💬</div>
                        <p className="text-sm font-semibold text-black">채팅 화면</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-black mb-2">4. 실시간 소통</h4>
                    <p className="text-black">
                      수락된 심부름은 실시간 채팅으로 소통하세요. 세부 사항을 조율하고 진행 상황을 공유할 수 있습니다.
                    </p>
                  </div>
                </div>

                {/* Slide 5 */}
                <div className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                  <div className="bg-white rounded-xl shadow-lg p-6 mx-2 h-full">
                    <div className="aspect-video bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">✅</div>
                        <p className="text-sm font-semibold text-black">완료 화면</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-black mb-2">5. 심부름 완료</h4>
                    <p className="text-black">
                      심부름이 완료되면 확인 버튼을 눌러주세요. 상호 리뷰를 통해 신뢰도를 쌓을 수 있습니다.
                    </p>
                  </div>
                </div>

                {/* Slide 6 */}
                <div className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                  <div className="bg-white rounded-xl shadow-lg p-6 mx-2 h-full">
                    <div className="aspect-video bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">⭐</div>
                        <p className="text-sm font-semibold text-black">리뷰 화면</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-black mb-2">6. 리뷰 작성</h4>
                    <p className="text-black">
                      서로에게 리뷰를 남겨주세요. 좋은 리뷰는 더 많은 기회로 이어집니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10 hover:bg-gray-50"
              aria-label="이전 슬라이드"
            >
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10 hover:bg-gray-50"
              aria-label="다음 슬라이드"
            >
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`슬라이드 ${index + 1}로 이동`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-4">
            이런 분들께 추천합니다
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Use Case 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
            <div className="text-4xl mb-3">👨‍💼</div>
            <h4 className="font-bold text-black mb-2">바쁜 직장인</h4>
            <p className="text-sm text-black">
              업무로 바쁜 시간, 간단한 심부름을 맡기고 시간을 절약하세요
            </p>
          </div>

          {/* Use Case 2 */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
            <div className="text-4xl mb-3">🎓</div>
            <h4 className="font-bold text-black mb-2">대학생</h4>
            <p className="text-sm text-black">
              틈틈이 간단한 심부름으로 용돈을 벌어보세요
            </p>
          </div>

          {/* Use Case 3 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
            <div className="text-4xl mb-3">🏠</div>
            <h4 className="font-bold text-black mb-2">집에 계신 분</h4>
            <p className="text-sm text-black">
              외출이 어려울 때 필요한 물품을 배달받으세요
            </p>
          </div>

          {/* Use Case 4 */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
            <div className="text-4xl mb-3">🚶</div>
            <h4 className="font-bold text-black mb-2">이웃 도우미</h4>
            <p className="text-sm text-black">
              주변 이웃을 도우며 보람과 수익을 함께 얻으세요
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-4">
            다양한 카테고리
          </h2>
          <p className="text-xl text-black">
            일상의 다양한 심부름을 부름이에서
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">🛒</div>
            <p className="font-semibold text-black">장보기</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">📦</div>
            <p className="font-semibold text-black">택배</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">🍔</div>
            <p className="font-semibold text-black">음식 배달</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">🏥</div>
            <p className="font-semibold text-black">약 수령</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">🐕</div>
            <p className="font-semibold text-black">반려동물</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">🧹</div>
            <p className="font-semibold text-black">청소</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">🚗</div>
            <p className="font-semibold text-black">운전 대행</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-2">✨</div>
            <p className="font-semibold text-black">기타</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            간편한 회원가입으로 부름이의 모든 서비스를 이용할 수 있습니다
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            무료로 시작하기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">부름이</h3>
              <p className="text-black">
                이웃과 함께하는 스마트한 심부름 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-black">서비스</h4>
              <ul className="space-y-2 text-black">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">이용 방법</a></li>
                <li><a href="/guide" className="hover:text-white transition-colors">사용 가이드</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-black">고객 지원</h4>
              <ul className="space-y-2 text-black">
                <li>이메일: support@burum.com</li>
                <li>운영시간: 평일 9:00 - 18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-black">
            <p className="text-black">&copy; 2024 부름이. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
