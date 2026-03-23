import { createRoot } from 'react-dom/client';
import { html } from './core.js';
import { App } from './App.js';

const root = createRoot(document.getElementById('root'));
root.render(html`<${App} />`);
