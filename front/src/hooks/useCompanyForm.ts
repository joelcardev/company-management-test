import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { CompanyDTO } from '../services/api';

/**
 * Aplica máscara de CNPJ limitando a 14 dígitos.
 */
function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

interface UseCompanyFormReturn {
  isEditing: boolean;
  formData: CompanyDTO;
  loading: boolean;
  submitting: boolean;
  error: string;
  success: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  clearSuccess: () => void;
}

export function useCompanyForm(id?: string): UseCompanyFormReturn {
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<CompanyDTO>({
    name: '',
    cnpj: '',
    tradeName: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCompany = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getCompany(id);
      setFormData({
        name: data.name,
        cnpj: maskCnpj(data.cnpj),
        tradeName: data.tradeName || '',
        address: data.address,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Empresa não encontrada');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cnpj' ? maskCnpj(value) : value
    }));
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess('');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
      };

      if (isEditing) {
        await api.updateCompany(id, payload);
        setSuccess('Empresa atualizada com sucesso!');
      } else {
        await api.createCompany(payload);
        setSuccess('Empresa cadastrada com sucesso!');
      }

      // Aguarda o usuário ver a mensagem de sucesso antes de navegar
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setSubmitting(false); // Só remove o loading se houve erro
    }
  }, [formData, id, isEditing, navigate]);

  return {
    isEditing,
    formData,
    loading,
    submitting,
    error,
    success,
    handleChange,
    handleSubmit,
    clearSuccess,
  };
}
