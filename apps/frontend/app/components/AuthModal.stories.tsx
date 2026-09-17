import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import AuthModal from './AuthModal'

const meta = {
  component: AuthModal,
  tags: ['ai-generated'],
  args: {
    isOpen: true,
    onClose: fn(),
    onLogin: fn(),
    onRegister: fn(),
  },
} satisfies Meta<typeof AuthModal>

export default meta
type Story = StoryObj<typeof meta>

export const LoginMode: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: '로그인' })).toBeVisible()
    await expect(canvas.getByPlaceholderText('이메일을 입력하세요')).toBeVisible()
  },
}

export const RegisterMode: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('회원가입'))
    await expect(canvas.getByText('반가워요!')).toBeVisible()
  },
}

export const Closed: Story = {
  args: { isOpen: false },
}
