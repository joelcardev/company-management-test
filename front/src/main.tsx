import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

// Nota: StrictMode removido para evitar chamadas duplicadas de API em desenvolvimento
// Em produção, isso não afeta o comportamento
createRoot(document.getElementById('root')!).render(
  <App />
)
