import Header from '../components/header';

export default {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main application header with logo and navigation toggle.',
      },
    },
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {},
};

export const OnDarkBackground = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const Mobile = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};

export const Tablet = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
