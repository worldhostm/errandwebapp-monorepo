'use client'

import { useState, useEffect } from 'react'
import { supportApi, reportApi } from '../lib/api'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Badge from './ui/Badge'

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'warning' | 'info' | 'success' | 'ghost'; text: string }> = {
      pending:     { variant: 'warning', text: '대기중' },
      in_progress: { variant: 'info',    text: '처리중' },
      resolved:    { variant: 'success', text: '해결됨' },
      closed:      { variant: 'ghost',   text: '종료됨' },
    }
    const badge = variants[status] || variants.pending
    return <Badge variant={badge.variant}>{badge.text}</Badge>
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="고객센터" size="xl">
      {/* 탭 메뉴 */}
      <div className="flex mb-6 border-b border-base-200 -mx-1">
        {(['inquiry', 'myTickets', 'report', 'myReports'] as TabType[]).map((tab) => {
          const labels: Record<TabType, string> = {
            inquiry: '문의하기', myTickets: '내 문의', report: '신고하기', myReports: '내 신고'
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-base-content/70'
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
      </div>

      {/* 문의하기 탭 */}
      {activeTab === 'inquiry' && (
        <form onSubmit={handleSubmitInquiry} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">문의 유형</label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value as 'inquiry' | 'bug' | 'feature' | 'other')}
              className="select select-bordered w-full"
            >
              <option value="inquiry">일반 문의</option>
              <option value="bug">버그 신고</option>
              <option value="feature">기능 제안</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input input-bordered w-full"
              placeholder="문의 제목을 입력하세요"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">내용</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered w-full min-h-[200px]"
              placeholder="문의 내용을 상세히 입력해주세요"
            />
          </div>

          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            문의 등록
          </Button>
        </form>
      )}

      {/* 내 문의 탭 */}
      {activeTab === 'myTickets' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <span className="loading loading-spinner loading-md" />
              <p className="text-base-content/60">로딩 중...</p>
            </div>
          ) : myTickets?.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              등록된 문의가 없습니다.
            </div>
          ) : (
            myTickets && myTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-base-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{ticket.subject}</h3>
                  {getStatusBadge(ticket.status)}
                </div>
                <p className="text-sm mb-2 line-clamp-2 text-base-content/70">{ticket.description}</p>
                <div className="flex justify-between items-center text-xs text-base-content/50">
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
            <label className="block text-sm font-medium mb-2">신고 사유</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as 'inappropriate' | 'scam' | 'spam' | 'harassment' | 'other')}
              className="select select-bordered w-full"
            >
              <option value="inappropriate">부적절한 콘텐츠</option>
              <option value="scam">사기/사칭</option>
              <option value="spam">스팸</option>
              <option value="harassment">괴롭힘</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">신고 대상 사용자 ID (선택)</label>
            <input
              type="text"
              value={reportedUserId}
              onChange={(e) => setReportedUserId(e.target.value)}
              className="input input-bordered w-full"
              placeholder="신고할 사용자 ID를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">신고 대상 심부름 ID (선택)</label>
            <input
              type="text"
              value={reportedErrandId}
              onChange={(e) => setReportedErrandId(e.target.value)}
              className="input input-bordered w-full"
              placeholder="신고할 심부름 ID를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">신고 내용</label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="textarea textarea-bordered w-full min-h-[200px]"
              placeholder="신고 내용을 상세히 입력해주세요"
            />
          </div>

          <Button type="submit" variant="error" fullWidth loading={isLoading}>
            신고 접수
          </Button>
        </form>
      )}

      {/* 내 신고 탭 */}
      {activeTab === 'myReports' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <span className="loading loading-spinner loading-md" />
              <p className="text-base-content/60">로딩 중...</p>
            </div>
          ) : myReports?.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              접수된 신고가 없습니다.
            </div>
          ) : (
            myReports?.map((report) => (
              <div
                key={report.id}
                className="border border-base-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">
                    {report.reason === 'inappropriate' && '부적절한 콘텐츠'}
                    {report.reason === 'scam' && '사기/사칭'}
                    {report.reason === 'spam' && '스팸'}
                    {report.reason === 'harassment' && '괴롭힘'}
                    {report.reason === 'other' && '기타'}
                  </h3>
                  {getStatusBadge(report.status)}
                </div>
                <p className="text-sm mb-2 line-clamp-2 text-base-content/70">{report.description}</p>
                <div className="text-xs text-base-content/50">
                  {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Modal>
  )
}
