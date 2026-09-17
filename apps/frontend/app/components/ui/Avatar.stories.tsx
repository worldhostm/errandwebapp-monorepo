import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import Avatar from './Avatar'

const meta = {
  component: Avatar,
  tags: ['ai-generated'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithInitials: Story = {
  args: { name: '홍길동', size: 'md' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('홍')).toBeVisible()
  },
}

export const Online: Story = {
  args: { name: '김철수', size: 'md', online: true },
}

export const Offline: Story = {
  args: { name: '이영희', size: 'md', offline: true },
}

export const SizeXs: Story = { args: { name: '박민준', size: 'xs' } }
export const SizeSm: Story = { args: { name: '최지현', size: 'sm' } }
export const SizeLg: Story = { args: { name: '정다운', size: 'lg' } }
export const SizeXl: Story = { args: { name: '장서연', size: 'xl' } }

export const Fallback: Story = {
  args: { size: 'md' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('?')).toBeVisible()
  },
}
