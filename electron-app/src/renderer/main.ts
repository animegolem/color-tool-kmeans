import App from './App.svelte';
import './styles.css';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Renderer root element missing');
}

export const app = new App({ target });

export default app;
