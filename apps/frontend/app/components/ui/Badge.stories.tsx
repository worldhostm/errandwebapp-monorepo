import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import Badge from './Badge'

const meta = {
  component: Badge,
  tags: ['ai-generated'],
  args: { children: '라벨' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary', children: '진행 중' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('진행 중')).toBeVisible()
  },
}

export const Success: Story = { args: { variant: 'success', children: '완료' } }
export const Error: Story = { args: { variant: 'error', children: '취소됨' } }
export const Warning: Story = { args: { variant: 'warning', children: '마감 임박' } }
export const Info: Story = { args: { variant: 'info', children: '새 메시지' } }
export const Ghost: Story = { args: { variant: 'ghost', children: '기타' } }
export const Outline: Story = { args: { variant: 'outline', children: '심부름' } }

export const SizeXs: Story = { args: { size: 'xs', children: 'XS' } }
export const SizeSm: Story = { args: { size: 'sm', children: 'SM' } }
export const SizeLg: Story = { args: { size: 'lg', children: 'LG' } }

export const UnreadCount: Story = {
  args: { variant: 'error', size: 'sm', children: '3' },
}
