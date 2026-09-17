import { http, HttpResponse } from 'msw'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

export const mswHandlers = [
  http.get(`${API}/api/errands/nearby`, () =>
    HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'errand1',
          title: '마트 장보기',
          description: '이마트에서 우유, 계란 구매 부탁드려요',
          location: { type: 'Point', coordinates: [127.027, 37.498], address: '서울 강남구' },
          reward: 10000,
          status: 'pending',
          category: '쇼핑',
          deadline: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          requestedBy: { _id: 'user1', name: '김철수', email: 'kim@example.com' },
        },
      ],
    })
  ),
  http.get(`${API}/api/notifications`, () =>
    HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'notif1',
          type: 'errand_accepted',
          title: '심부름 수락',
          message: '이박사님이 심부름을 수락했습니다.',
          isRead: false,
          createdAt: new Date().toISOString(),
          relatedErrand: { id: 'errand1', title: '마트 장보기' },
        },
        {
          _id: 'notif2',
          type: 'chat_message',
          title: '새 메시지',
          message: '안녕하세요! 심부름 관련해서 연락드려요.',
          isRead: true,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          relatedErrand: { id: 'errand1', title: '마트 장보기' },
        },
      ],
    })
  ),
  http.post(`${API}/api/notifications/read-all`, () =>
    HttpResponse.json({ success: true })
  ),
  http.get(`${API}/api/chat/unread-counts`, () =>
    HttpResponse.json({ success: true, counts: { errand1: 2 } })
  ),
]
