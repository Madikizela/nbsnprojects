import React from 'react';

const SimpleQADashboard: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>QA Manager Dashboard</h1>
      <p>Welcome to the Quality Assurance Manager Dashboard!</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Quality Assessments</h3>
          <p>Manage and review quality assessments</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Audit Reports</h3>
          <p>View and generate audit reports</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Quality Standards</h3>
          <p>Manage quality standards and compliance</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleQADashboard;