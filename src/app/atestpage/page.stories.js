import ATestPage from './page';
import { HoveredModelProvider } from '../../components/HoveredModelContext';

export default {
  title: 'Pages/ATestPage',
  component: ATestPage,
  decorators: [
    (Story) => (
      <HoveredModelProvider>
        <Story />
      </HoveredModelProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {},
};

export const HorizontalScroll = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'large',
    },
  },
};
