import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { useCompanyForm } from '../hooks/useCompanyForm';
import { isValidCnpj } from '../utils/validators';

export const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    isEditing,
    formData,
    loading,
    submitting,
    error,
    success,
    handleChange,
    handleSubmit,
    clearSuccess,
  } = useCompanyForm(id);

  const cnpjIsValid = formData.cnpj.replace(/\D/g, '').length === 14 && isValidCnpj(formData.cnpj);
  const showCnpjStatus = formData.cnpj.replace(/\D/g, '').length === 14;

  // Limpa mensagem de sucesso ao mudar de rota
  useEffect(() => {
    return () => {
      clearSuccess();
    };
  }, [clearSuccess]);

  if (loading && isEditing) {
    return (
      <div className="loading-container">
        <Spinner size={40} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/')} style={{ padding: '0.5rem' }} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
          {isEditing ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
        </h2>
      </div>

      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
          <AlertCircle size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Razão Social (Nome) *</label>
          <input
            id="name"
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex: Empresa de Teste LTDA"
            autoComplete="organization"
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="cnpj">CNPJ *</label>
          <div style={{ position: 'relative' }}>
            <input
              id="cnpj"
              type="text"
              className={`form-control ${showCnpjStatus ? (cnpjIsValid ? 'border-success' : 'border-error animate-shake') : ''}`}
              style={{ 
                paddingRight: '2.5rem', 
                borderColor: showCnpjStatus ? (cnpjIsValid ? 'var(--success)' : 'var(--danger)') : '',
                opacity: submitting ? 0.7 : 1,
              }}
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              required
              placeholder="00.000.000/0000-00"
              maxLength={18}
              inputMode="numeric"
              disabled={submitting}
            />
            {showCnpjStatus && (
              <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                {cnpjIsValid ? (
                  <CheckCircle2 size={20} color="var(--success)" className="animate-scale-in" />
                ) : (
                  <AlertCircle size={20} color="var(--danger)" className="animate-scale-in" />
                )}
              </div>
            )}
          </div>
          {showCnpjStatus && !cnpjIsValid && (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
              Dígitos verificadores inválidos. Verifique o CNPJ.
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tradeName">Nome Fantasia</label>
          <input
            id="tradeName"
            type="text"
            className="form-control"
            name="tradeName"
            value={formData.tradeName ?? ''}
            onChange={handleChange}
            placeholder="Opcional"
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="address">Endereço Completo *</label>
          <input
            id="address"
            type="text"
            className="form-control"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Rua, Número, Bairro, Cidade - UF"
            autoComplete="street-address"
            disabled={submitting}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={submitting || (showCnpjStatus && !cnpjIsValid)}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Spinner size={20} />
                Salvando...
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Empresa
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
