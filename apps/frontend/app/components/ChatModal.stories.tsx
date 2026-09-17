import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import ChatModal from './ChatModal'

const meta = {
  component: ChatModal,
  tags: ['ai-generated'],
  args: {
    isOpen: true,
    onClose: fn(),
    errandTitle: '마트 장보기',
    errandId: 'errand1',
    currentUserId: 'user-me',
  },
} satisfies Meta<typeof ChatModal>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('마트 장보기')).toBeVisible()
  },
}

export const Closed: Story = {
  args: { isOpen: false },
}
