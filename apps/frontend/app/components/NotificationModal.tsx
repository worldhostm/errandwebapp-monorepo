'use client'

import { useState } from 'react'
import type { Notification } from '../lib/types'
import Badge from './ui/Badge'
import Button from './ui/Button'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onRefresh: () => void
  onChatOpen?: (errandId: string, errandTitle: string) => void
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
  onChatOpen
}: NotificationModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'errand_completed': return '✅'
      case 'errand_accepted': return '👋'
      case 'errand_disputed': return '⚠️'
      case 'chat_message': return '💬'
      case 'system': return '🔔'
      default: return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'errand_completed': return 'bg-success/10 border-success/30'
      case 'errand_accepted': return 'bg-primary/10 border-primary/30'
      case 'errand_disputed': return 'bg-error/10 border-error/30'
      case 'chat_message': return 'bg-info/10 border-info/30'
      case 'system': return 'bg-base-200 border-base-300'
      default: return 'bg-base-200 border-base-300'
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return '방금 전'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`

    return date.toLocaleDateString('ko-KR')
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.type === 'chat_message' && notification.relatedErrand && onChatOpen) {
      onClose()
      onChatOpen(notification.relatedErrand.id, notification.relatedErrand.title)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  if (!isOpen) return null

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 슬라이드 모달 */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-base-100 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="p-4 border-b border-base-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">알림</h3>
                {unreadCount > 0 && (
                  <Badge variant="error" size="sm">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="text-base-content hover:text-base-content/70 p-1 transition-colors"
                  title="새로고침"
                  disabled={isRefreshing}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-500 ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
                <button onClick={onClose} className="text-base-content hover:text-base-content/70 p-1">
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* 모든 알림 읽음 처리 버튼 */}
          {unreadCount > 0 && (
            <div className="p-3 border-b border-base-200">
              <Button variant="ghost" fullWidth onClick={onMarkAllAsRead} className="text-sm">
                모든 알림 읽음 처리
              </Button>
            </div>
          )}

          {/* 알림 목록 */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-base-content/60">
                <div className="text-4xl mb-2">📭</div>
                <p>알림이 없습니다</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 m-1 rounded-lg border cursor-pointer transition-colors hover:bg-base-200 ${
                      getNotificationColor(notification.type)
                    } ${!notification.isRead ? 'ring-1 ring-primary/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm mt-1 text-base-content/80">
                          {notification.message}
                        </p>
                        {notification.relatedErrand && (
                          <div className="mt-2 p-2 bg-base-100/50 rounded text-xs text-base-content/60">
                            관련 심부름: {notification.relatedErrand.title}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-base-content/50">
                          {formatRelativeTime(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-4 border-t border-base-300 text-center">
            <p className="text-xs text-base-content/50">
              총 {notifications.length}개의 알림
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
