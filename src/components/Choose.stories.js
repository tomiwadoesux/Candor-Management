import Choose from './Choose';

export default {
  title: 'Components/Choose',
  component: Choose,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Full-screen category selection menu with hover effects.',
      },
    },
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {},
};

export const WithWhiteBackground = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};
