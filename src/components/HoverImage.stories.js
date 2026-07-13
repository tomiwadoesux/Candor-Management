import HoverImage from './HoverImage';

export default {
  title: 'Components/HoverImage',
  component: HoverImage,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    cursorText: { control: 'text' },
  },
};

export const Default = {
  args: {
    src: '/images/placeholder.jpg',
    alt: 'Model Image',
    cursorText: 'JOHN DOE MODEL 6\'1',
  },
};

export const WithDifferentImage = {
  args: {
    src: '/images/model1.jpg',
    alt: 'Fashion Model',
    cursorText: 'JANE SMITH MODEL 5\'9',
  },
};
