import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';
import App from './App.jsx';
import { store } from './store/index.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
