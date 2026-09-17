import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import Button from './Button'

const meta = {
  component: Button,
  tags: ['ai-generated'],
  args: {
    children: '버튼',
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary', children: '확인' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: '확인' })
    await expect(btn).toBeVisible()
    await expect(btn).not.toBeDisabled()
  },
}

// CSS check: btn-primary background from DaisyUI
export const CssCheck: Story = {
  args: { variant: 'primary', children: 'CSS Check' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: 'CSS Check' })
    const bg = getComputedStyle(btn).backgroundColor
    // DaisyUI primary — must not be transparent (proves DaisyUI loaded)
    await expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  },
}

export const Secondary: Story = { args: { variant: 'secondary', children: '취소' } }
export const Ghost: Story = { args: { variant: 'ghost', children: '닫기' } }
export const Outline: Story = { args: { variant: 'outline', children: '더보기' } }
export const Success: Story = { args: { variant: 'success', children: '완료' } }
export const Error: Story = { args: { variant: 'error', children: '삭제' } }
export const Warning: Story = { args: { variant: 'warning', children: '경고' } }

export const SizeXs: Story = { args: { size: 'xs', children: 'XS' } }
export const SizeSm: Story = { args: { size: 'sm', children: 'SM' } }
export const SizeLg: Story = { args: { size: 'lg', children: 'LG' } }

export const FullWidth: Story = {
  args: { fullWidth: true, children: '전체 너비 버튼' },
}

export const Loading: Story = {
  args: { loading: true, children: '처리 중...' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button')
    await expect(btn).toBeDisabled()
    await expect(canvas.getByRole('button').querySelector('.loading')).toBeTruthy()
  },
}

export const Disabled: Story = {
  args: { disabled: true, children: '비활성화' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '비활성화' })).toBeDisabled()
  },
}

export const WithLeftIcon: Story = {
  args: { leftIcon: '🔍', children: '검색' },
}

export const WithRightIcon: Story = {
  args: { rightIcon: '→', children: '다음' },
}

export const ClickHandler: Story = {
  args: { variant: 'primary', children: '클릭하기' },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '클릭하기' }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}
