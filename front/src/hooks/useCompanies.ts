import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { Company, NotificationLog } from '../services/api';
import { NotificationStatus } from '../types/enums';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  
  // Pagination & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Modals state
  const [selectedLogs, setSelectedLogs] = useState<{name: string, logs: NotificationLog[]} | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string, name: string, isLoading: boolean }>({
    isOpen: false, id: '', name: '', isLoading: false
  });

  const loadCompanies = useCallback(async (currentPage: number = page, currentSearch: string = searchTerm) => {
    try {
      setLoading(true);
      const res = await api.getCompanies(currentPage, limit, currentSearch);
      setCompanies(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }, [limit, page, searchTerm]);

  // Handle Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Quando o usuário digita, volta para a página 1
      loadCompanies(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, loadCompanies]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const requestDelete = useCallback((id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name, isLoading: false });
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteModal(prev => prev.isLoading ? prev : { isOpen: false, id: '', name: '', isLoading: false });
  }, []);

  const confirmDelete = useCallback(async () => {
    const { id, name } = deleteModal;
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      await api.deleteCompany(id);
      // Recarrega a página atual para atualizar a lista corretamente no server-side
      await loadCompanies(page, searchTerm);
      showToast(`Empresa "${name}" excluída com sucesso!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleteModal({ isOpen: false, id: '', name: '', isLoading: false });
    }
  }, [deleteModal, showToast, loadCompanies, page, searchTerm]);

  const fetchLogs = useCallback(async (id: string, name: string) => {
    try {
      setLoadingLogs(true);
      const logs = await api.getCompanyLogs(id);
      setSelectedLogs({ name, logs });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const closeLogs = useCallback(() => {
    setSelectedLogs(null);
  }, []);

  // Smart Polling para logs PENDING
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (selectedLogs && selectedLogs.logs.some(l => l.status === NotificationStatus.PENDING)) {
      interval = setInterval(async () => {
        // Encontra o ID da empresa (um pouco hacky mas funciona dado o estado atual)
        const company = companies.find(c => c.name === selectedLogs.name);
        if (company) {
          const updatedLogs = await api.getCompanyLogs(company.id);
          setSelectedLogs(prev => prev ? { ...prev, logs: updatedLogs } : null);
        }
      }, 3000);
    }
    
    return () => clearInterval(interval);
  }, [selectedLogs]); // Removed 'companies' from dependency array as selectedLogs now contains 'id'

  const handleRetryNotification = useCallback(async (notificationId: string) => {
    if (!selectedLogs) return;
    
    // Tenta encontrar a empresa pelo nome (já que o estado selectedLogs só tem o nome)
    const company = companies.find(c => c.name === selectedLogs.name);
    if (!company) {
      setError('Empresa não encontrada para re-tentativa');
      return;
    }

    try {
      await api.retryNotification(company.id, notificationId);
      showToast('Re-envio solicitado com sucesso!');
      
      // Atualiza os logs imediatamente
      const updatedLogs = await api.getCompanyLogs(company.id);
      setSelectedLogs({ ...selectedLogs, logs: updatedLogs });
    } catch (err: any) {
      console.error('Erro ao re-tentar:', err);
      showToast(`Erro ao re-tentar: ${err.message || 'Falha no servidor'}`);
    }
  }, [selectedLogs, companies, showToast, api]);

  const handlePageChange = useCallback((newPage: number) => {
    loadCompanies(newPage, searchTerm);
  }, [loadCompanies, searchTerm]);

  return {
    companies,
    totalCount,
    loading,
    error,
    toast,
    searchTerm,
    setSearchTerm,
    page,
    totalPages,
    handlePageChange,
    selectedLogs,
    loadingLogs,
    deleteModal,
    loadCompanies,
    requestDelete,
    confirmDelete,
    cancelDelete,
    fetchLogs,
    closeLogs,
    handleRetryNotification
  };
}
