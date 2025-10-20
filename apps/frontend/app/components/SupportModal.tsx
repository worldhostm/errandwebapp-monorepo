'use client'

import { useState, useEffect } from 'react'
import { supportApi, reportApi } from '../lib/api'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'inquiry' | 'myTickets' | 'report' | 'myReports'

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('inquiry')

  // 문의 작성 폼 상태
  const [inquiryType, setInquiryType] = useState<'inquiry' | 'bug' | 'feature' | 'other'>('inquiry')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  // 신고 작성 폼 상태
  const [reportReason, setReportReason] = useState<'inappropriate' | 'scam' | 'spam' | 'harassment' | 'other'>('inappropriate')
  const [reportDescription, setReportDescription] = useState('')
  const [reportedUserId, setReportedUserId] = useState('')
  const [reportedErrandId, setReportedErrandId] = useState('')

  // 목록 상태
  const [myTickets, setMyTickets] = useState<Array<{
    id: string
    type: string
    subject: string
    description: string
    status: string
    createdAt: string
    responses?: Array<{ content: string }>
  }>>([])
  const [myReports, setMyReports] = useState<Array<{
    id: string
    reason: string
    description: string
    status: string
    createdAt: string
  }>>([])
  const [isLoading, setIsLoading] = useState(false)

  // 내 문의 목록 조회
  const loadMyTickets = async () => {
    setIsLoading(true)
    try {
      const response = await supportApi.getMySupportTickets()
      if (response.success && response.data) {
        setMyTickets(response.data.supports)
      }
    } catch (error) {
      console.error('문의 목록 조회 오류:', error)
    }
    setIsLoading(false)
  }

  // 내 신고 목록 조회
  const loadMyReports = async () => {
    setIsLoading(true)
    try {
      const response = await reportApi.getMyReports()
      if (response.success && response.data) {
        setMyReports(response.data.reports)
      }
    } catch (error) {
      console.error('신고 목록 조회 오류:', error)
    }
    setIsLoading(false)
  }

  // 탭 변경 시 목록 로드
  useEffect(() => {
    if (activeTab === 'myTickets') {
      loadMyTickets()
    } else if (activeTab === 'myReports') {
      loadMyReports()
    }
  }, [activeTab])

  // 문의 제출
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !description.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const response = await supportApi.createSupport({
        type: inquiryType,
        subject,
        description
      })

      if (response.success) {
        alert('문의가 성공적으로 등록되었습니다.')
        setSubject('')
        setDescription('')
        setInquiryType('inquiry')
        setActiveTab('myTickets')
        void loadMyTickets()
      } else {
        alert(response.error || '문의 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('문의 등록 오류:', error)
      alert('문의 등록 중 오류가 발생했습니다.')
    }
    setIsLoading(false)
  }

  // 신고 제출
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reportDescription.trim()) {
      alert('신고 내용을 입력해주세요.')
      return
    }

    if (!reportedUserId && !reportedErrandId) {
      alert('신고할 대상(사용자 ID 또는 심부름 ID)을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const response = await reportApi.createReport({
        reason: reportReason,
        description: reportDescription,
        ...(reportedUserId && { reportedUser: reportedUserId }),
        ...(reportedErrandId && { reportedErrand: reportedErrandId })
      })

      if (response.success) {
        alert('신고가 성공적으로 접수되었습니다.')
        setReportDescription('')
        setReportedUserId('')
        setReportedErrandId('')
        setReportReason('inappropriate')
        setActiveTab('myReports')
        void loadMyReports()
      } else {
        alert(response.error || '신고 접수에 실패했습니다.')
      }
    } catch (error) {
      console.error('신고 접수 오류:', error)
      alert('신고 접수 중 오류가 발생했습니다.')
    }
    setIsLoading(false)
  }

  if (!isOpen) return null

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { text: '처리중', color: 'bg-blue-100 text-blue-800' },
      resolved: { text: '해결됨', color: 'bg-green-100 text-green-800' },
      closed: { text: '종료됨', color: 'bg-gray-100 text-black' }
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    return <span className={`px-2 py-1 rounded text-xs ${badge.color}`}>{badge.text}</span>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-black">고객센터</h2>
          <button onClick={onClose} className="text-black hover:text-black text-2xl">
            ×
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('inquiry')}
            className={`flex-1 px-4 py-3 font-medium ${
              activeTab === 'inquiry'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-black hover:text-black'
            }`}
          >
            문의하기
          </button>
          <button
            onClick={() => setActiveTab('myTickets')}
            className={`flex-1 px-4 py-3 font-medium ${
              activeTab === 'myTickets'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-black hover:text-black'
            }`}
          >
            내 문의
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 px-4 py-3 font-medium ${
              activeTab === 'report'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-black hover:text-black'
            }`}
          >
            신고하기
          </button>
          <button
            onClick={() => setActiveTab('myReports')}
            className={`flex-1 px-4 py-3 font-medium ${
              activeTab === 'myReports'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-black hover:text-black'
            }`}
          >
            내 신고
          </button>
        </div>

        <div className="p-6">
          {/* 문의하기 탭 */}
          {activeTab === 'inquiry' && (
            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">문의 유형</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value as 'inquiry' | 'bug' | 'feature' | 'other')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="inquiry">일반 문의</option>
                  <option value="bug">버그 신고</option>
                  <option value="feature">기능 제안</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">제목</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="문의 제목을 입력하세요"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">내용</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                  placeholder="문의 내용을 상세히 입력해주세요"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? '등록 중...' : '문의 등록'}
              </button>
            </form>
          )}

          {/* 내 문의 탭 */}
          {activeTab === 'myTickets' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-black mt-4">로딩 중...</p>
                </div>
              ) : myTickets.length === 0 ? (
                <div className="text-center py-12 text-black">
                  등록된 문의가 없습니다.
                </div>
              ) : (
                myTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg text-black">{ticket.subject}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-black text-sm mb-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex justify-between items-center text-xs text-black">
                      <span>{new Date(ticket.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span>답변 {ticket.responses?.length || 0}개</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 신고하기 탭 */}
          {activeTab === 'report' && (
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">신고 사유</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as 'inappropriate' | 'scam' | 'spam' | 'harassment' | 'other')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="inappropriate">부적절한 콘텐츠</option>
                  <option value="scam">사기/사칭</option>
                  <option value="spam">스팸</option>
                  <option value="harassment">괴롭힘</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">신고 대상 사용자 ID (선택)</label>
                <input
                  type="text"
                  value={reportedUserId}
                  onChange={(e) => setReportedUserId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="신고할 사용자 ID를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">신고 대상 심부름 ID (선택)</label>
                <input
                  type="text"
                  value={reportedErrandId}
                  onChange={(e) => setReportedErrandId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="신고할 심부름 ID를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">신고 내용</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] text-black"
                  placeholder="신고 내용을 상세히 입력해주세요"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? '접수 중...' : '신고 접수'}
              </button>
            </form>
          )}

          {/* 내 신고 탭 */}
          {activeTab === 'myReports' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-black mt-4">로딩 중...</p>
                </div>
              ) : myReports.length === 0 ? (
                <div className="text-center py-12 text-black">
                  접수된 신고가 없습니다.
                </div>
              ) : (
                myReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-black">
                        {report.reason === 'inappropriate' && '부적절한 콘텐츠'}
                        {report.reason === 'scam' && '사기/사칭'}
                        {report.reason === 'spam' && '스팸'}
                        {report.reason === 'harassment' && '괴롭힘'}
                        {report.reason === 'other' && '기타'}
                      </h3>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-black text-sm mb-2 line-clamp-2">{report.description}</p>
                    <div className="text-xs text-black">
                      {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
