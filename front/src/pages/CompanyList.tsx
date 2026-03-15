import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Building, CheckCircle2, XCircle, Search, AlertCircle
} from 'lucide-react';
import { CompanyCard } from '../components/CompanyCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { Spinner } from '../components/Spinner';
import { SearchBar } from '../components/SearchBar';
import { useCompanies } from '../hooks/useCompanies';
import { CompanySkeleton } from '../components/CompanySkeleton';

import { NotificationStatus } from '../types/enums';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export const CompanyList = () => {
  const navigate = useNavigate();
  const {
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
  } = useCompanies();

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const getStatusDisplay = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.SENT:
        return { icon: <CheckCircle2 size={18} color="#10b981" />, label: 'Enviado' };
      case NotificationStatus.PENDING:
        return { icon: <Spinner size={18} color="#38bdf8" />, label: 'Processando' };
      case NotificationStatus.FAILED:
        return { icon: <XCircle size={18} color="#ef4444" />, label: 'Falhou' };
      case NotificationStatus.FAILED_PERMANENTLY:
        return { icon: <AlertCircle size={18} color="#b91c1c" />, label: 'Falha Crítica' };
      default:
        return { icon: <AlertCircle size={18} />, label: status };
    }
  };


  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className="toast toast-success animate-slide-in">
          {toast}
        </div>
      )}

      {/* Confirmação de Exclusão (Substitui window.confirm) */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir a empresa "${deleteModal.name}"? Esta ação não pode ser desfeita e todos os históricos de auditoria serão mantidos na base original caso possua obrigações fiscais.`}
        confirmText="Sim, Excluir"
        isLoading={deleteModal.isLoading}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Logs Modal */}
      {selectedLogs && createPortal(
        <div className="modal-backdrop" onClick={closeLogs}>
          <div className="modal-content glass-card animate-slide-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Histórico de Notificações</h3>
              <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={closeLogs}>X</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{selectedLogs.name}</p>
            
            <div className="logs-list">
              {selectedLogs.logs.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Nenhuma notificação registrada.</p>
              ) : (
                selectedLogs.logs.map((log, idx) => {
                  const display = getStatusDisplay(log.status);
                  return (
                    <div key={log.id} className="log-item animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={log.status === NotificationStatus.PENDING ? 'pulse-primary' : ''}>
                          {display.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{display.label}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(log.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>Para: {log.sentTo}</p>
                          {log.error && <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>Erro: {log.error}</p>}
                        </div>
                        {(log.status === NotificationStatus.FAILED || log.status === NotificationStatus.FAILED_PERMANENTLY) && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleRetryNotification(log.id)}
                          >
                            Re-tentar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 500 }}>
          Empresas Cadastradas
          <span className="badge" style={{ marginLeft: '0.75rem' }}>{totalCount}</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flex: '1', justifyContent: 'flex-end', minWidth: '300px' }}>
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Buscar por nome ou CNPJ..." 
            />
          <button className="btn btn-primary" onClick={() => navigate('/novo')}>
            <PlusCircle size={20} />
            <span className="hide-mobile">Nova Empresa</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && companies.length === 0 ? (
        <div className="grid">
          {[...Array(6)].map((_, i) => (
            <CompanySkeleton key={i} />
          ))}
        </div>
      ) : companies.length === 0 && !searchTerm ? (
        <div className="glass-card animate-fade-in" style={{ 
          textAlign: 'center', 
          padding: '5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '2px dashed var(--surface-border)'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'var(--surface-hover)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <Building size={40} color="var(--text-muted)" />
          </div>
          <h3 style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.25rem' }}>Nenhuma empresa cadastrada ainda</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', maxWidth: '400px' }}>
            Comece cadastrando sua primeira empresa para gerenciar notificações e histórico.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/novo')}>
            <PlusCircle size={20} /> Cadastrar Agora
          </button>
        </div>
      ) : companies.length === 0 && searchTerm && !loading ? (
        <div className="glass-card animate-scale-in" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <Search size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Nenhum resultado encontrado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
            Não encontramos resultados para "<strong>{searchTerm}</strong>".<br/>Verifique se o CNPJ ou nome estão corretos.
          </p>
          <button className="btn btn-outline" onClick={() => setSearchTerm('')}>
            Limpar Busca
          </button>
        </div>
      ) : (
        <>
          <div className="grid" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            {companies.map((company, index) => (
              <CompanyCard 
                key={company.id}
                company={company}
                index={index}
                formatCnpj={formatCnpj}
                formatDate={formatDate}
                loadingLogs={loadingLogs}
                onFetchLogs={fetchLogs}
                onEdit={(id) => navigate(`/editar/${id}`)}
                onDeleteRequest={requestDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn btn-outline" 
                disabled={page === 1 || loading}
                onClick={() => handlePageChange(page - 1)}
              >
                Anterior
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Página {page} de {totalPages}
              </span>
              <button 
                className="btn btn-outline" 
                disabled={page === totalPages || loading}
                onClick={() => handlePageChange(page + 1)}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
