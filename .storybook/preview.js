import '../src/styles/globals.css';
import { HoveredModelProvider } from '../src/components/HoveredModelContext';

/** @type { import('@storybook/nextjs').Preview } */
const preview = {
  decorators: [
    (Story) => (
      <HoveredModelProvider>
        <Story />
      </HoveredModelProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        large: {
          name: 'Large Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#000000',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
    },
  },
};

export default preview;