import { mount } from 'svelte';
import './styles/fonts.css';
import './lib/styles/study-tokens.css';
import './lib/styles/study-controls.css';
import DevStudyShowcase from './lib/views/DevStudyShowcase.svelte';

const target = document.getElementById('study-showcase');

if (!target) {
  throw new Error('Study showcase root element missing');
}

const showcase = mount(DevStudyShowcase, {
  target,
  props: {
    onExampleAction: () => undefined,
  },
});

export default showcase;
