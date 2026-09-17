import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import Modal from './Modal'
import Button from './Button'

const meta = {
  component: Modal,
  tags: ['ai-generated'],
  args: {
    isOpen: true,
    onClose: fn(),
    title: '모달 제목',
    children: <p>모달 내용이 들어갑니다.</p>,
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithFooter: Story = {
  args: {
    title: '심부름 삭제',
    children: <p>정말로 이 심부름을 삭제하시겠습니까?</p>,
    footer: (
      <>
        <Button variant="ghost">취소</Button>
        <Button variant="error">삭제</Button>
      </>
    ),
  },
}

export const NoTitle: Story = {
  args: {
    title: undefined,
    children: <p>타이틀 없는 모달입니다.</p>,
  },
}

export const SizeSm: Story = { args: { size: 'sm' } }
export const SizeLg: Story = { args: { size: 'lg' } }

export const Closed: Story = {
  args: { isOpen: false },
}

export const CloseButton: Story = {
  args: { title: '닫기 테스트' },
  play: async ({ canvas, userEvent, args }) => {
    // aria-label로 버튼 찾기 (DaisyUI modal 내부 콘텐츠는 in-document로만 확인)
    const closeBtn = canvas.getByLabelText('닫기')
    await userEvent.click(closeBtn)
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
