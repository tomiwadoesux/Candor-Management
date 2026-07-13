import BlackLogo from '../components/black-logo';

export default {
  title: 'Components/BlackLogo',
  component: BlackLogo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Black variant of the Candor logo.',
      },
    },
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {},
};

export const OnLightBackground = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

export const OnGrayBackground = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'gray',
    },
  },
};