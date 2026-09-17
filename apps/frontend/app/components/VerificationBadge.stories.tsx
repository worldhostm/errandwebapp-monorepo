import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import VerificationBadge from './VerificationBadge'
import type { User } from '../lib/types'

const baseUser: User = {
  id: 'u1',
  name: '홍길동',
  email: 'hong@example.com',
  isVerified: true,
  verificationLevel: 1,
  rating: 4.5,
  totalErrands: 10,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const meta = {
  component: VerificationBadge,
  tags: ['ai-generated'],
  args: { user: baseUser },
} satisfies Meta<typeof VerificationBadge>

export default meta
type Story = StoryObj<typeof meta>

export const BasicVerified: Story = {
  args: { user: { ...baseUser, verificationLevel: 1 }, showLabel: true },
  play: async ({ canvas }) => {
    const badge = canvas.getByText('기본 인증')
    await expect(badge).toBeVisible()
  },
}

// CSS check: green background for level-1 badge
// Tailwind v4 uses oklch color space — value confirmed from live render
export const CssCheck: Story = {
  args: { user: { ...baseUser, verificationLevel: 1 }, showLabel: true },
  play: async ({ canvas }) => {
    const badge = canvas.getByText('기본 인증').closest('div')!
    const bg = getComputedStyle(badge).backgroundColor
    // bg-green-100 in Tailwind v4 resolves to oklch(0.962 0.044 156.743)
    await expect(bg).toBe('oklch(0.962 0.044 156.743)')
  },
}

export const AdvancedVerified: Story = {
  args: { user: { ...baseUser, verificationLevel: 2 }, showLabel: true },
}

export const PremiumVerified: Story = {
  args: { user: { ...baseUser, verificationLevel: 3 }, showLabel: true },
}

export const IconOnly: Story = {
  args: { user: { ...baseUser, verificationLevel: 2 }, showLabel: false },
}

export const Large: Story = {
  args: { user: { ...baseUser, verificationLevel: 3 }, showLabel: true, size: 'large' },
}
