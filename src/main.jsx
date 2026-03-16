import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './sidebar-collapsed.css'
import App from './App.jsx'
import AuthProvider from "./context/AuthProvider";
import { ToastProvider } from "./components/ui/Toast";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
