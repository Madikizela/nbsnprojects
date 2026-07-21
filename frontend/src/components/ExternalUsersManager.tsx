import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5213';

// No hardcoded list - document types come from the database per project

interface ExternalUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  status: number;
  createdAt: string;
  access: AccessEntry[];
}

interface AccessEntry {
  id: number;
  projectId: number;
  projectName: string;
  allowedDocumentTypes: string;
  organizationName: string | null;
}

interface Project { id: number; projectName: string; }

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organizationName: string;
  projectAccess: { projectId: number; allowedDocumentTypes: string[] }[];
}

const emptyForm = (): FormState => ({
  firstName: '', lastName: '', email: '', phoneNumber: '', organizationName: '',
  projectAccess: []
});

export default function ExternalUsersManager({ fetchWithAuth }: { fetchWithAuth: (url: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [users, setUsers] = useState<ExternalUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<ExternalUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Per-project document types: { projectId -> string[] }
  const [projectDocTypes, setProjectDocTypes] = useState<Record<number, string[]>>({});
  const [loadingDocTypes, setLoadingDocTypes] = useState<Record<number, boolean>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [usersRes, projRes] = await Promise.all([
      fetchWithAuth('/api/ExternalUsers'),
      fetchWithAuth('/api/Projects'),
    ]);
    if (usersRes?.ok) setUsers(await usersRes.json());
    if (projRes?.ok) setProjects(await projRes.json());
    setLoading(false);
  };

  const loadDocTypesForProject = async (projectId: number) => {
    setLoadingDocTypes(prev => ({ ...prev, [projectId]: true }));
    const res = await fetchWithAuth(`/api/ExternalUsers/document-types/${projectId}`);
    if (res?.ok) {
      const types: string[] = await res.json();
      // Merge with any already-seeded types (from edit mode)
      setProjectDocTypes(prev => ({
        ...prev,
        [projectId]: [...new Set([...(prev[projectId] || []), ...types])]
      }));
    } else if (!projectDocTypes[projectId]) {
      setProjectDocTypes(prev => ({ ...prev, [projectId]: [] }));
    }
    setLoadingDocTypes(prev => ({ ...prev, [projectId]: false }));
  };

  const openCreate = () => { setEditUser(null); setForm(emptyForm()); setError(''); setShowModal(true); };

  const openEdit = (u: ExternalUser) => {
    setEditUser(u);
    setError('');
    const access = u.access.map(a => ({
      projectId: a.projectId,
      allowedDocumentTypes: a.allowedDocumentTypes.split(',').map(t => t.trim()).filter(Boolean)
    }));
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber || '',
      organizationName: u.access[0]?.organizationName || '',
      projectAccess: access
    });
    // Pre-load doc types for each project, seeding with existing selected types
    // so the checkboxes show correctly before the API returns
    access.forEach(a => {
      const existing = a.allowedDocumentTypes.filter(t => t !== 'Attendance Register');
      // Seed with what's already saved (minus the special virtual type)
      if (existing.length > 0) {
        setProjectDocTypes(prev => ({
          ...prev,
          [a.projectId]: [...new Set([...(prev[a.projectId] || []), ...existing])]
        }));
      }
      loadDocTypesForProject(a.projectId);
    });
    setShowModal(true);
  };

  const addProjectRow = () => {
    const unused = projects.find(p => !form.projectAccess.some(pa => pa.projectId === p.id));
    if (!unused) return;
    loadDocTypesForProject(unused.id);
    setForm(f => ({ ...f, projectAccess: [...f.projectAccess, { projectId: unused.id, allowedDocumentTypes: [] }] }));
  };

  const removeProjectRow = (idx: number) => setForm(f => ({ ...f, projectAccess: f.projectAccess.filter((_, i) => i !== idx) }));

  const toggleDocType = (idx: number, dt: string) => {
    setForm(f => ({
      ...f,
      projectAccess: f.projectAccess.map((pa, i) => i !== idx ? pa : {
        ...pa,
        allowedDocumentTypes: pa.allowedDocumentTypes.includes(dt)
          ? pa.allowedDocumentTypes.filter(d => d !== dt)
          : [...pa.allowedDocumentTypes, dt]
      })
    }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('First name, last name and email are required.'); return;
    }
    if (form.projectAccess.length === 0) {
      setError('At least one project must be assigned.'); return;
    }
    if (form.projectAccess.some(pa => pa.allowedDocumentTypes.length === 0)) {
      setError('Select at least one document type for each project.'); return;
    }
    setSaving(true);
    const payload = editUser
      ? { firstName: form.firstName, lastName: form.lastName, phoneNumber: form.phoneNumber || null, organizationName: form.organizationName || null, status: 1, projectAccess: form.projectAccess }
      : { firstName: form.firstName, lastName: form.lastName, email: form.email, phoneNumber: form.phoneNumber || null, organizationName: form.organizationName || null, projectAccess: form.projectAccess };

    const res = await fetchWithAuth(editUser ? `/api/ExternalUsers/${editUser.id}` : '/api/ExternalUsers', {
      method: editUser ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res?.ok) {
      await loadData();
      setShowModal(false);
    } else {
      const data = res ? await res.json().catch(() => ({})) : {};
      setError(data.message || 'Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete external user "${name}"? This cannot be undone.`)) return;
    const res = await fetchWithAuth(`/api/ExternalUsers/${id}`, { method: 'DELETE' });
    if (res?.ok) await loadData();
    else alert('Failed to delete user.');
  };

  const statusLabel = (s: number) => s === 1 ? 'Active' : s === 2 ? 'Inactive' : 'Suspended';

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1e3a8a' }}>
        <h4 className="mb-0 text-white">🏢 External Users (SETA / Funder Access)</h4>
        <button className="btn btn-light btn-sm fw-bold" onClick={openCreate}>+ Create External User</button>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏢</div>
            <div>No external users yet. Click "Create External User" to get started.</div>
          </div>
        ) : (
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th>Name</th><th>Email</th><th>Organisation</th>
                <th>Projects</th><th>Status</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="fw-bold">{u.firstName} {u.lastName}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.access[0]?.organizationName || '—'}</td>
                  <td>
                    {u.access.map(a => (
                      <span key={a.id} className="badge me-1" style={{ backgroundColor: '#1e3a8a', fontSize: '0.7rem' }}>
                        📁 {a.projectName}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${u.status === 1 ? 'bg-success' : 'bg-secondary'}`}>{statusLabel(u.status)}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                <h5 className="modal-title">{editUser ? 'Edit External User' : 'Create External User'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">First Name *</label>
                    <input className="form-control" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Last Name *</label>
                    <input className="form-control" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
                  </div>
                  {!editUser && (
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Email *</label>
                      <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@organisation.com" />
                      <div className="form-text">Login credentials will be emailed to this address.</div>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Phone</label>
                    <input className="form-control" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+27..." />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold">Organisation Name</label>
                    <input className="form-control" value={form.organizationName} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))} placeholder="e.g. SETA, Funder name..." />
                  </div>
                </div>

                <hr />
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold">Project Access & Document Types</h6>
                  <button className="btn btn-sm btn-outline-primary" onClick={addProjectRow}
                    disabled={form.projectAccess.length >= projects.length}>+ Add Project</button>
                </div>

                {form.projectAccess.length === 0 && (
                  <div className="alert alert-warning py-2">Click "Add Project" to assign project access.</div>
                )}

                {form.projectAccess.map((pa, idx) => (
                  <div key={idx} className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <select className="form-select form-select-sm" style={{ maxWidth: '300px' }} value={pa.projectId}
                        onChange={e => {
                          const newId = Number.parseInt(e.target.value, 10);
                          loadDocTypesForProject(newId);
                          setForm(f => ({ ...f, projectAccess: f.projectAccess.map((x, i) => i === idx ? { ...x, projectId: newId, allowedDocumentTypes: [] } : x) }));
                        }}>
                        {projects.map(p => (
                          <option key={p.id} value={p.id} disabled={form.projectAccess.some((x, xi) => xi !== idx && x.projectId === p.id)}>
                            {p.projectName}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => removeProjectRow(idx)}>Remove</button>
                    </div>
                    <div className="mb-1 small text-muted fw-bold">Select accessible document types:</div>
                    {loadingDocTypes[pa.projectId] ? (
                      <div className="text-muted small"><span className="spinner-border spinner-border-sm me-1"></span>Loading document types...</div>
                    ) : (
                      <>
                        {(projectDocTypes[pa.projectId] || []).length === 0 ? (
                          <div className="alert alert-warning py-1 px-2 small mb-2">No uploaded documents found for this project yet.</div>
                        ) : (
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {(projectDocTypes[pa.projectId] || []).map(dt => (
                              <div key={dt} className="form-check form-check-inline m-0">
                                <input type="checkbox" className="form-check-input" id={`dt-${idx}-${dt}`}
                                  checked={pa.allowedDocumentTypes.includes(dt)}
                                  onChange={() => toggleDocType(idx, dt)} />
                                <label className="form-check-label small" htmlFor={`dt-${idx}-${dt}`}>{dt}</label>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Attendance Register - always available */}
                        <div className="border-top pt-2 mt-1">
                          <div className="form-check form-check-inline m-0">
                            <input type="checkbox" className="form-check-input" id={`dt-${idx}-attendance`}
                              checked={pa.allowedDocumentTypes.includes('Attendance Register')}
                              onChange={() => toggleDocType(idx, 'Attendance Register')} />
                            <label className="form-check-label small fw-bold" htmlFor={`dt-${idx}-attendance`}>
                              📅 Attendance Register <span className="text-muted fw-normal">(generated PDF)</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                    {pa.allowedDocumentTypes.length > 0 && (
                      <div className="mt-2">
                        {pa.allowedDocumentTypes.map(dt => (
                          <span key={dt} className="badge bg-primary me-1 mb-1" style={{ fontSize: '0.75rem' }}>{dt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : editUser ? 'Update' : 'Create & Send Credentials'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
