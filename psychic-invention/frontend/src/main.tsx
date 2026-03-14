import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SelectedAssetsProvider } from './context/SelectedAssetsContext';
import { DataProviderProvider } from './context/DataProviderContext';
import App from './App.tsx';
import 'katex/dist/katex.min.css';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SelectedAssetsProvider>
        <DataProviderProvider>
          <App />
        </DataProviderProvider>
      </SelectedAssetsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
