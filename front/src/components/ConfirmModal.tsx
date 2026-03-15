import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Spinner } from './Spinner';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={!isLoading ? onCancel : undefined}>
      <div 
        className="modal-content glass-card animate-slide-in" 
        style={{ maxWidth: '400px', borderTop: '4px solid var(--danger)' }} 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
            <h3 id="modal-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <button 
            className="btn-icon" 
            onClick={onCancel} 
            disabled={isLoading}
            aria-label="Fechar"
            style={{ margin: '-0.5rem -0.5rem 0 0' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-outline" 
            onClick={onCancel} 
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size={16} /> Processando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
