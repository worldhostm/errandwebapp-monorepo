import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import UserTypeTabs from './UserTypeTabs'

const meta = {
  component: UserTypeTabs,
  tags: ['ai-generated'],
  args: {
    activeTab: 'receiver',
    onTabChange: fn(),
  },
} satisfies Meta<typeof UserTypeTabs>

export default meta
type Story = StoryObj<typeof meta>

export const ReceiverActive: Story = {
  args: { activeTab: 'receiver' },
  play: async ({ canvas }) => {
    const btn = canvas.getByText('심부름 찾기')
    await expect(btn).toBeVisible()
  },
}

export const PerformerActive: Story = {
  args: { activeTab: 'performer' },
}

export const RequesterActive: Story = {
  args: { activeTab: 'requester' },
}

export const TabClick: Story = {
  args: { activeTab: 'receiver' },
  play: async ({ canvas, userEvent, args }) => {
    const performerBtn = canvas.getByText('내 수행 심부름')
    await userEvent.click(performerBtn)
    await expect(args.onTabChange).toHaveBeenCalledWith('performer')
  },
}
