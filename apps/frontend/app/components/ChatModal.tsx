'use client'

import { useState, useRef, useEffect } from 'react'
import type { Message } from '../lib/types'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  errandTitle: string
  otherUser: {
    id: string
    name: string
  }
  currentUserId: string
}

export default function ChatModal({ 
  isOpen, 
  onClose, 
  errandTitle, 
  otherUser, 
  currentUserId 
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: otherUser.id,
      senderName: otherUser.name,
      content: '안녕하세요! 심부름에 관심이 있어서 연락드렸습니다.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'text'
    },
    {
      id: '2', 
      senderId: currentUserId,
      senderName: '나',
      content: '네 안녕하세요! 어떤 부분이 궁금하신가요?',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      type: 'text'
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: '나',
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full h-[600px] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">{otherUser.name}</h3>
            <p className="text-sm text-gray-600 truncate">{errandTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
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
                  className={`text-xs text-gray-500 mt-1 ${
                    message.senderId === currentUserId ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!newMessage.trim()}
            >
              전송
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}