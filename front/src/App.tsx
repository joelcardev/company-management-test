import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompanyList } from './pages/CompanyList';
import { CompanyForm } from './pages/CompanyForm';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CompanyList />} />
          <Route path="novo" element={<CompanyForm />} />
          <Route path="editar/:id" element={<CompanyForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
