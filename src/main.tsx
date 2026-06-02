import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { ToastProvider } from './components/common/Toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>
)
