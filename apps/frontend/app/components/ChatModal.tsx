'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { LocalMessage } from '../lib/types'
import { chatApi } from '../lib/api'
import { getSocket } from '../lib/socket'
import type { Socket } from 'socket.io-client'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  errandTitle: string
  errandId: string
  currentUserId: string
}

type RawMessage = {
  _id?: string
  id?: string
  senderId?: string
  sender: { _id?: string; name: string }
  content: string
  timestamp?: string
  createdAt?: string
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
  const socketRef = useRef<Socket | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toLocalMessage = (msg: RawMessage): LocalMessage => ({
    id: msg._id || msg.id || '',
    senderId: msg.sender._id || msg.senderId || '',
    senderName: msg.sender.name,
    content: msg.content,
    timestamp: new Date(msg.timestamp || msg.createdAt || new Date()),
    type: 'text'
  })

  const loadChatData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await chatApi.getChatByErrand(errandId)

      if (response.success && response.data) {
        const chat = response.data.chat
        const resolvedChatId = (chat as unknown as { _id: string })._id || chat.id
        setChatId(resolvedChatId)

        const otherParticipant = chat.participants.find(p => {
          const participant = p as { _id?: string; id?: string; name: string }
          const participantId = participant._id?.toString() || participant.id?.toString()
          return participantId && participantId !== currentUserId
        })

        if (otherParticipant) {
          const participant = otherParticipant as { _id?: string; id?: string; name: string }
          setOtherUser({
            id: participant._id?.toString() || participant.id?.toString() || 'unknown',
            name: participant.name || '상대방'
          })
        } else {
          setOtherUser({ id: 'unknown', name: '상대방' })
        }

        const convertedMessages: LocalMessage[] = chat.messages.map(msg =>
          toLocalMessage(msg as unknown as RawMessage)
        )
        setMessages(convertedMessages)

        // 채팅 열면 항상 읽음 처리
        await chatApi.markMessagesAsRead(resolvedChatId)

        // 소켓 채팅방 입장
        if (socketRef.current && resolvedChatId) {
          socketRef.current.emit('join_chat', resolvedChatId)
        }
      } else {
        setError(response.error || '채팅을 불러올 수 없습니다.')
      }
    } catch {
      setError('채팅을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [errandId, currentUserId])

  // 소켓 연결 및 new_message 수신
  useEffect(() => {
    if (!isOpen) return

    const token = localStorage.getItem('authToken')
    if (!token) return

    const socket = getSocket(token)
    socketRef.current = socket

    const handleNewMessage = (data: { chatId: string; message: RawMessage }) => {
      const msgSenderId = data.message.sender._id || data.message.senderId
      // 내가 보낸 메시지는 REST 응답으로 이미 추가했으므로 소켓 이벤트는 무시
      if (msgSenderId === currentUserId) return
      const msgId = data.message._id || data.message.id
      setMessages(prev => {
        if (msgId && prev.some(m => m.id === msgId)) return prev
        return [...prev, toLocalMessage(data.message)]
      })
    }

    // 핸들러 중복 등록 방지: 기존 핸들러 전부 제거 후 등록
    socket.off('new_message')
    socket.on('new_message', handleNewMessage)

    return () => {
      socket.off('new_message', handleNewMessage)
      if (chatId) socket.emit('leave_chat', chatId)
    }
  }, [isOpen, chatId, currentUserId])

  // 채팅 데이터 로드
  useEffect(() => {
    if (isOpen && errandId) {
      loadChatData()
    }
  }, [isOpen, errandId, loadChatData])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !chatId) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await chatApi.sendMessage(chatId, messageContent)

      if (response.success && response.data) {
        const msg = response.data.message as RawMessage
        setMessages(prev => [...prev, toLocalMessage(msg)])
      } else {
        alert(response.error || '메시지 전송에 실패했습니다.')
        setNewMessage(messageContent)
      }
    } catch {
      alert('메시지 전송 중 오류가 발생했습니다.')
      setNewMessage(messageContent)
    }
  }

  const formatTime = (timestamp: Date) => {
    if (!timestamp || isNaN(timestamp.getTime())) return '--:--'
    return timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full h-[600px] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg text-black">
              {loading ? '채팅 로딩 중...' : otherUser?.name || '알 수 없는 사용자'}
            </h3>
            <p className="text-sm text-black truncate">{errandTitle}</p>
          </div>
          <button onClick={onClose} className="text-black hover:text-black">
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
            messages
              .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
              .map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[70%]">
                  <div
                    className={`p-3 rounded-lg ${
                      message.senderId === currentUserId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-black'
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
