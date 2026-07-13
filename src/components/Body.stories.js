import Body from './body';

export default {
  title: 'Components/Body',
  component: Body,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The Body section displaying talent information with grid layout.',
      },
    },
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {},
};

export const Desktop = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const Mobile = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
