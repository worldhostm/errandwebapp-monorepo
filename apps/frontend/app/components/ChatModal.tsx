'use client'

import { useState, useRef, useEffect } from 'react'
import type { LocalMessage } from '../lib/types'
import { chatApi } from '../lib/api'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  errandTitle: string
  errandId: string
  currentUserId: string
}

export default function ChatModal({ 
  isOpen, 
  onClose, 
  errandTitle, 
  errandId,
  currentUserId 
}: ChatModalProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 채팅 데이터 로드
  useEffect(() => {
    if (isOpen && errandId) {
      loadChatData()
    }
  }, [isOpen, errandId])

  const loadChatData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await chatApi.getChatByErrand(errandId)
      
      if (response.success && response.data) {
        const chat = response.data.chat
        setChatId((chat as any)._id)
        
        // 상대방 정보 찾기
        const otherParticipant = chat.participants.find(p => {
          // MongoDB _id 또는 id 필드를 안전하게 비교
          const participant = p as any // 백엔드에서 오는 데이터의 타입이 일치하지 않을 수 있음
          const participantId = participant._id?.toString() || participant.id?.toString()
          return participantId && participantId !== currentUserId
        })
        
        if (otherParticipant) {
          const participant = otherParticipant as any
          setOtherUser({ 
            id: participant._id?.toString() || participant.id?.toString() || 'unknown', 
            name: participant.name || '상대방'
          })
        } else {
          // 다른 참여자가 없으면 기본값 설정
          setOtherUser({ 
            id: 'unknown', 
            name: '상대방' 
          })
        }
        
        // 메시지 변환
        const convertedMessages: LocalMessage[] = chat.messages.map(msg => ({
          id: (msg as any)._id || msg.id,
          senderId: msg.senderId,
          senderName: msg.sender.name,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          type: 'text'
        }))
        
        setMessages(convertedMessages)
        
        // 메시지 읽음 처리
        if (chat.messages.some(msg => !msg.isRead && msg.senderId !== currentUserId)) {
          await chatApi.markMessagesAsRead((chat as any)._id)
        }
      } else {
        console.error('채팅 로드 실패:', response.error)
        setError(response.error || '채팅을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('채팅 로드 오류:', error)
      setError('채팅을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !chatId) return

    const messageContent = newMessage.trim()
    setNewMessage('') // 즉시 입력창 클리어
    
    try {
      const response = await chatApi.sendMessage(chatId, messageContent)
      
      if (response.success && response.data) {
        const message = response.data.message as any
        const newMsg: LocalMessage = {
          id: message._id || message.id,
          senderId: message.senderId,
          senderName: message.sender.name,
          content: message.content,
          timestamp: new Date(message.createdAt),
          type: 'text'
        }
        
        setMessages(prev => [...prev, newMsg])
      } else {
        alert(response.error || '메시지 전송에 실패했습니다.')
        setNewMessage(messageContent) // 실패 시 메시지 복원
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      alert('메시지 전송 중 오류가 발생했습니다.')
      setNewMessage(messageContent) // 실패 시 메시지 복원
    }
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full h-[600px] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">
              {loading ? '채팅 로딩 중...' : otherUser?.name || '알 수 없는 사용자'}
            </h3>
            <p className="text-sm text-black truncate">{errandTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-black">채팅을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={loadChatData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-black">채팅을 시작해보세요!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="max-w-[70%]">
                  <div
                    className={`p-3 rounded-lg ${
                      message.senderId === currentUserId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div
                    className={`text-xs text-black mt-1 ${
                      message.senderId === currentUserId ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          {/* 디버깅 정보 */}
          {(loading || error || !chatId) && (
            <div className="mb-2 p-2 bg-yellow-100 rounded text-xs">
              <div>상태: {loading ? '로딩 중' : error ? '에러' : !chatId ? 'chatId 없음' : '정상'}</div>
              <div>chatId: {chatId || '없음'}</div>
              {error && <div>에러: {error}</div>}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              disabled={loading || !!error || !chatId}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!newMessage.trim() || loading || !!error || !chatId}
            >
              전송
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}