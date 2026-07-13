import ModelProfile from './ModelProfile';
import { models } from '../../data/models';

export default {
  title: 'Components/ModelProfile',
  component: ModelProfile,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Model profile page with measurements, images, and tabs.',
      },
    },
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    model: models[1], // John Smith with full measurements
  },
};

export const WithDifferentModel = {
  args: {
    model: models[0],
  },
};
