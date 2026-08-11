// First, before anything can make a request: point /api at the live server
// and send it through Android rather than the WebView, when we are running
// inside the packaged app.
import { installNet } from './lib/net'
installNet()

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initNative } from './lib/native'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Native shell setup (no-op on the web).
void initNative()
