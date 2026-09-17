import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import NotificationModal from './NotificationModal'
import type { Notification } from '../lib/types'

const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'errand_accepted',
    title: '심부름 수락',
    message: '이박사님이 심부름을 수락했습니다.',
    isRead: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    relatedErrand: { id: 'e1', title: '마트 장보기', status: 'pending' },
  },
  {
    id: 'n2',
    type: 'chat_message',
    title: '새 메시지',
    message: '안녕하세요! 심부름 관련해서 연락드려요.',
    isRead: true,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    relatedErrand: { id: 'e1', title: '마트 장보기', status: 'pending' },
  },
]

const meta = {
  component: NotificationModal,
  tags: ['ai-generated'],
  args: {
    isOpen: true,
    onClose: fn(),
    onMarkAsRead: fn(),
    onMarkAllAsRead: fn(),
    onRefresh: fn(),
    onChatOpen: fn(),
    notifications,
    unreadCount: 1,
  },
} satisfies Meta<typeof NotificationModal>

export default meta
type Story = StoryObj<typeof meta>

export const WithNotifications: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('심부름 수락')).toBeVisible()
    await expect(canvas.getByText('새 메시지')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { notifications: [], unreadCount: 0 },
}

export const Closed: Story = {
  args: { isOpen: false },
}
