import NavMenu from '../components/NavMenu';

export default {
  title: 'Components/NavMenu',
  component: NavMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An animated navigation menu with GSAP morphing SVG animation on hover.',
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

export const OnLightBackground = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};