import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import router from './router/index.jsx';
import { RouterProvider } from "react-router-dom";

import StoreContext from './contexts/storeContext.js';
import createRootStore from './store/index.js';
const store = createRootStore();

store.global.setInitialColorTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreContext.Provider value={store}>
      <RouterProvider router={router} />
    </StoreContext.Provider>
  </StrictMode>
)

import '@/assets/public/css/main.css';
import '@/assets/css/index.scss';