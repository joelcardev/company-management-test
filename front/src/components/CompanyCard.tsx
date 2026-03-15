import { memo } from 'react';
import { Edit2, Trash2, History, Calendar, Clock } from 'lucide-react';
import type { Company } from '../services/api';

interface CompanyCardProps {
  company: Company;
  index: number;
  formatCnpj: (cnpj: string) => string;
  formatDate: (date: string) => string;
  loadingLogs: boolean;
  onFetchLogs: (id: string, name: string) => void;
  onEdit: (id: string) => void;
  onDeleteRequest: (id: string, name: string) => void;
}

export const CompanyCard = memo(({
  company,
  index,
  formatCnpj,
  formatDate,
  loadingLogs,
  onFetchLogs,
  onEdit,
  onDeleteRequest
}: CompanyCardProps) => {
  return (
    <div
      className="glass-card animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', animationDelay: `${index * 0.05}s` }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{company.name}</h3>
          <button 
            className="btn-icon" 
            title="Ver Histórico de Notificações"
            onClick={() => onFetchLogs(company.id, company.name)}
            disabled={loadingLogs}
          >
            <History size={18} />
            {company._count && company._count.notifications > 0 && (
              <span className="dot-indicator"></span>
            )}
          </button>
        </div>
        
        {company.tradeName && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>
            {company.tradeName}
          </p>
        )}

        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>CNPJ:</strong>{' '}
            <span className="cnpj-display">{formatCnpj(company.cnpj)}</span>
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{company.address}</p>
        </div>

        <div className="dates-container">
          <div className="date-item">
            <Calendar size={14} />
            <span>Criado: {formatDate(company.createdAt)}</span>
          </div>
          <div className="date-item">
            <Clock size={14} />
            <span>Alterado: {formatDate(company.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
        <button
          className="btn btn-outline"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => onEdit(company.id)}
        >
          <Edit2 size={16} /> Editar
        </button>
        <button
          className="btn btn-danger"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => onDeleteRequest(company.id, company.name)}
        >
          <Trash2 size={16} /> Excluir
        </button>
      </div>
    </div>
  );
});

CompanyCard.displayName = 'CompanyCard';
