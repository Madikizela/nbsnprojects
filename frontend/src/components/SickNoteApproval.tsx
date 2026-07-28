import React, { useState, useEffect } from 'react';

const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');

interface SickNote {
  id: number;
  learnerId: number;
  learnerName: string;
  medicalFacility: string;
  practitionerName: string;
  startDate: string;
  endDate: string;
  issuedDate: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

interface Props {
  token: string;
}

export default function SickNoteApproval({ token }: Props) {
  const [notes, setNotes] = useState<SickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/SickNote/list`, { headers });
      if (res.ok) setNotes(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id: number) {
    const note = notes.find(n => n.id === id);
    const who = note ? `${note.learnerName} (${new Date(note.startDate).toLocaleDateString('en-ZA')} → ${new Date(note.endDate).toLocaleDateString('en-ZA')})` : `note #${id}`;
    if (!window.confirm(`Are you sure you want to APPROVE this sick note?\n\n${who}\n\nAttendance records will be updated.`)) return;
    setSaving(true); setMsg('');
    try {
      const res = await fetch(`${API}/api/SickNote/${id}/approve`, {
        method: 'POST', headers,
        body: JSON.stringify({ isApproved: true }),
      });
      setMsg(res.ok ? '✅ Approved and attendance updated.' : '❌ Failed to approve.');
      if (res.ok) load();
    } finally { setSaving(false); }
  }

  async function reject(id: number) {
    if (!rejectReason.trim()) { setMsg('❌ Please enter a rejection reason.'); return; }
    // Secondary confirmation after the user has typed a reason — prevents accidental rejection.
    const note = notes.find(n => n.id === id);
    const who = note ? `${note.learnerName} (${new Date(note.startDate).toLocaleDateString('en-ZA')} → ${new Date(note.endDate).toLocaleDateString('en-ZA')})` : `note #${id}`;
    if (!window.confirm(
      `⚠️ Please confirm REJECTION of this sick note.\n\n${who}\n\nRejection reason:\n"${rejectReason.trim()}"\n\nThis cannot be undone. The learner will NOT receive attendance credit.`
    )) return;
    setSaving(true); setMsg('');
    try {
      const res = await fetch(`${API}/api/SickNote/${id}/approve`, {
        method: 'POST', headers,
        body: JSON.stringify({ isApproved: false, rejectionReason: rejectReason }),
      });
      setMsg(res.ok ? '✅ Rejected.' : '❌ Failed to reject.');
      if (res.ok) { setRejectId(null); setRejectReason(''); load(); }
    } finally { setSaving(false); }
  }

  const filtered = filter === 'All' ? notes : notes.filter(n => n.status === filter);

  const statusColor = (s: string) =>
    s === 'Approved' ? '#10b981' : s === 'Rejected' ? '#ef4444' : '#f59e0b';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>🏥 Sick Note Approvals</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: filter === f ? '#0EA5E9' : '#334155', color: '#fff', fontSize: 13,
            }}>{f} {f !== 'All' && `(${notes.filter(n => n.status === f).length})`}</button>
          ))}
        </div>
      </div>

      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 12,
        background: msg.startsWith('✅') ? '#10b98120' : '#ef444420',
        color: msg.startsWith('✅') ? '#10b981' : '#ef4444', border: `1px solid ${msg.startsWith('✅') ? '#10b981' : '#ef4444'}`,
      }}>{msg}</div>}

      {loading ? <p style={{ color: '#94a3b8' }}>Loading…</p> : filtered.length === 0 ? (
        <p style={{ color: '#64748b' }}>No {filter.toLowerCase()} sick notes found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(note => (
            <div key={note.id} style={{
              background: '#1e293b', borderRadius: 10, padding: 16,
              border: `1px solid ${statusColor(note.status)}40`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{note.learnerName}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
                    {note.medicalFacility} · Dr {note.practitionerName}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                    📅 {new Date(note.startDate).toLocaleDateString('en-ZA')} → {new Date(note.endDate).toLocaleDateString('en-ZA')}
                    {' '}·{' '}Issued: {new Date(note.issuedDate).toLocaleDateString('en-ZA')}
                  </div>
                  {note.rejectionReason && (
                    <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>Reason: {note.rejectionReason}</div>
                  )}
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: `${statusColor(note.status)}20`, color: statusColor(note.status),
                  border: `1px solid ${statusColor(note.status)}`,
                }}>{note.status}</span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setPreviewId(note.id)} style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid #334155',
                  background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13,
                }}>👁 View Document</button>

                {note.status === 'Pending' && (
                  <>
                    <button disabled={saving} onClick={() => approve(note.id)} style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>✓ Approve</button>
                    <button disabled={saving} onClick={() => { setRejectId(note.id); setMsg(''); }} style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>✕ Reject</button>
                  </>
                )}
              </div>

              {/* Reject reason input */}
              {rejectId === note.id && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Rejection reason…" style={{
                      flex: 1, background: '#0f172a', color: '#fff', border: '1px solid #334155',
                      borderRadius: 6, padding: '8px 12px', fontSize: 13,
                    }} />
                  <button disabled={saving} onClick={() => reject(note.id)} style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600,
                  }}>Confirm Reject</button>
                  <button onClick={() => { setRejectId(null); setRejectReason(''); }} style={{
                    padding: '8px 16px', borderRadius: 6, border: '1px solid #334155',
                    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Document preview modal */}
      {previewId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setPreviewId(null)}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 8, maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <button onClick={() => setPreviewId(null)} style={{
                background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20,
              }}>✕</button>
            </div>
            <iframe
              src={`${API}/api/SickNote/${previewId}/file`}
              style={{ width: '75vw', height: '80vh', border: 'none', borderRadius: 8 }}
              title="Sick Note Document"
            />
          </div>
        </div>
      )}
    </div>
  );
}
