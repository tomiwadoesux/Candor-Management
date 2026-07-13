import ModelList from './ModelList';
import { HoveredModelProvider } from './HoveredModelContext';

export default {
  title: 'Components/ModelList',
  component: ModelList,
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
      defaultViewport: 'mobile',
    },
  },
};
