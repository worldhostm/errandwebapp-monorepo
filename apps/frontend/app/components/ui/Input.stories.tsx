import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import Input from './Input'

const meta = {
  component: Input,
  tags: ['ai-generated'],
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: '텍스트를 입력하세요' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox')
    await expect(input).toBeVisible()
  },
}

export const WithLabel: Story = {
  args: { label: '이메일', placeholder: 'example@email.com', type: 'email' },
}

export const WithHelperText: Story = {
  args: {
    label: '비밀번호',
    type: 'password',
    placeholder: '비밀번호 입력',
    helperText: '6자 이상으로 설정해주세요',
  },
}

export const WithError: Story = {
  args: {
    label: '이메일',
    type: 'email',
    value: 'invalid',
    error: '올바른 이메일 형식이 아닙니다.',
    readOnly: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('올바른 이메일 형식이 아닙니다.')).toBeVisible()
  },
}

export const WithLeftIcon: Story = {
  args: { label: '검색', leftIcon: '🔍', placeholder: '심부름 검색' },
}

export const SizeSm: Story = {
  args: { inputSize: 'sm', placeholder: '작은 입력창' },
}

export const SizeLg: Story = {
  args: { inputSize: 'lg', label: '금액', placeholder: '0', type: 'number' },
}

export const Disabled: Story = {
  args: { label: '읽기 전용', value: '변경 불가', disabled: true, readOnly: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled()
  },
}

export const TypeInteraction: Story = {
  args: { label: '이름', placeholder: '이름을 입력하세요' },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox')
    await userEvent.type(input, '홍길동')
    await expect(input).toHaveValue('홍길동')
  },
}
