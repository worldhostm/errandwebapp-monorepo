import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import Select from './Select'

const categoryOptions = [
  { value: '배달/픽업', label: '🚚 배달/픽업' },
  { value: '쇼핑/구매', label: '🛒 쇼핑/구매' },
  { value: '청소/정리', label: '🧹 청소/정리' },
  { value: '이사/운반', label: '📦 이사/운반' },
  { value: '반려동물', label: '🐕 반려동물' },
  { value: '심부름', label: '🏃 심부름' },
  { value: '기타', label: '✨ 기타' },
]

const meta = {
  component: Select,
  tags: ['ai-generated'],
  args: {
    options: categoryOptions,
    onChange: fn(),
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '카테고리', defaultValue: '배달/픽업' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toBeVisible()
  },
}

export const WithPlaceholder: Story = {
  args: { label: '카테고리 선택', placeholder: '카테고리를 선택하세요', value: '' },
}

export const WithError: Story = {
  args: { label: '카테고리', error: '카테고리를 선택해주세요.', value: '' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('카테고리를 선택해주세요.')).toBeVisible()
  },
}

export const SizeSm: Story = {
  args: { selectSize: 'sm', options: categoryOptions, defaultValue: '기타' },
}

export const SizeLg: Story = {
  args: { label: '카테고리', selectSize: 'lg', options: categoryOptions, defaultValue: '심부름' },
}

export const ChangeSelection: Story = {
  args: { label: '카테고리', defaultValue: '배달/픽업' },
  play: async ({ canvas, userEvent, args }) => {
    const select = canvas.getByRole('combobox')
    await userEvent.selectOptions(select, '쇼핑/구매')
    await expect(args.onChange).toHaveBeenCalled()
  },
}
