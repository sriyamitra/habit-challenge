import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { inject } from '@vercel/analytics'
import App from './App'
import { AuthProvider } from './auth'
import { isConfigured } from './supabase'
import './styles.css'

inject()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {isConfigured ? (
        <AuthProvider>
          <App />
        </AuthProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </React.StrictMode>
)
