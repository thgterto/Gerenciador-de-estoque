import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './config/authConfig';
// Polaris styles removed
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL outside of render cycle if possible, but async init is required in v2+
// We can do it inside, or handle the promise.
// Ideally, we should initialize it once.
msalInstance.initialize().then(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error("Could not find root element to mount to");

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
            <MsalProvider instance={msalInstance}>
                <App />
            </MsalProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
});
