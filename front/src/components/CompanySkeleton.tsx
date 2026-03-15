export const CompanySkeleton = () => {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '0.4rem' }}></div>
      </div>
      <div className="skeleton skeleton-meta"></div>
      <div style={{ marginTop: '0.5rem' }}>
        <div className="skeleton skeleton-row" style={{ width: '80%', marginBottom: '0.5rem' }}></div>
        <div className="skeleton skeleton-row" style={{ width: '90%' }}></div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton skeleton-button"></div>
        <div className="skeleton skeleton-button"></div>
      </div>
    </div>
  );
};
