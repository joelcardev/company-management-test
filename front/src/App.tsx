import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompanyList } from './pages/CompanyList';
import { CompanyForm } from './pages/CompanyForm';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<CompanyList />} />
            <Route path="novo" element={<CompanyForm />} />
            <Route path="editar/:id" element={<CompanyForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
