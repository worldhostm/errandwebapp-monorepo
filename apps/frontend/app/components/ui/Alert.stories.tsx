import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import Alert from './Alert'

const meta = {
  component: Alert,
  tags: ['ai-generated'],
  args: { children: '알림 메시지입니다.' },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { variant: 'info', children: '새로운 심부름이 등록되었습니다.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeVisible()
  },
}

export const Success: Story = {
  args: { variant: 'success', title: '완료!', children: '심부름이 성공적으로 완료되었습니다.' },
}

export const Warning: Story = {
  args: { variant: 'warning', title: '마감 임박', children: '심부름 마감까지 1시간 남았습니다.' },
}

export const Error: Story = {
  args: { variant: 'error', title: '오류 발생', children: '요청을 처리하는 중 오류가 발생했습니다.' },
}

export const Dismissible: Story = {
  args: {
    variant: 'info',
    children: '닫기 버튼이 있는 알림입니다.',
    onClose: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '닫기' }))
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
