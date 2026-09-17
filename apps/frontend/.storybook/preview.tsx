import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'

const fontFaceStyle = document.createElement('style')
fontFaceStyle.textContent = `
  @font-face { font-family: 'A2G'; src: url('/font/에이투지체-3Light.woff2') format('woff2'); font-weight: 300; font-style: normal; }
  @font-face { font-family: 'A2G'; src: url('/font/에이투지체-4Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; }
  @font-face { font-family: 'A2G'; src: url('/font/에이투지체-5Medium.woff2') format('woff2'); font-weight: 500; font-style: normal; }
  @font-face { font-family: 'A2G'; src: url('/font/에이투지체-6SemiBold.woff2') format('woff2'); font-weight: 600; font-style: normal; }
  @font-face { font-family: 'A2G'; src: url('/font/에이투지체-7Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; }
`
document.head.appendChild(fontFaceStyle)

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo'
    }
  },
  decorators: [
    (Story) => (
      <div data-theme="lemonade" style={{ fontFamily: 'A2G, sans-serif' }}>
        <Story />
      </div>
    )
  ],
};

export default preview;
