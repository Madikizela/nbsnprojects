import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5213';

interface Project { id: number; projectName: string; }

interface Props { token: string; }

export default function FunderReport({ token }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<number | null>(null);
  const [learners, setLearners] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/api/Projects`, { headers })
      .then(r => r.json()).then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    fetch(`${API}/api/Learners/project/${selectedProject}`, { headers })
      .then(r => r.json())
      .then((data: any[]) => setLearners(data))
      .catch(() => {});
  }, [selectedProject]);

  async function download(url: string, filename: string) {
    setDownloading(true); setMsg('');
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) { setMsg('❌ Failed to generate report.'); return; }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { setMsg('❌ Download error.'); }
    finally { setDownloading(false); }
  }

  return (
    <div>
      <h2 style={{ color: '#fff', marginTop: 0 }}>📊 Reports & Certificates</h2>

      {msg && <div style={{
        padding: '10px 16px', borderRadius: 8, marginBottom: 16,
        background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444',
      }}>{msg}</div>}

      {/* Project selector */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 20, marginBottom: 16, border: '1px solid #334155' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>Select Project</label>
        <select value={selectedProject ?? ''} onChange={e => { setSelectedProject(Number(e.target.value)); setSelectedLearner(null); }}
          style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}>
          <option value="">— choose a project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
        </select>
      </div>

      {selectedProject && (
        <>
          {/* Funder PDF Report */}
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 20, marginBottom: 16, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>📄 Funder / SETA Compliance Report (PDF)</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
              Full project compliance report: learner headcount, attendance %, document compliance, competency rates.
            </div>
            <button disabled={downloading} onClick={() =>
              download(`${API}/api/FunderReport/project/${selectedProject}/pdf`, `FunderReport_${selectedProject}.pdf`)}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              {downloading ? 'Generating…' : '⬇ Download PDF'}
            </button>
          </div>

          {/* Monthly Attendance Excel */}
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 20, marginBottom: 16, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>📅 Monthly Attendance Register (Excel)</div>
            <MonthPicker onDownload={(year, month) =>
              download(`${API}/api/AttendanceExport/project/${selectedProject}/monthly?year=${year}&month=${month}`,
                `Attendance_${selectedProject}_${year}_${month}.xlsx`)}
              downloading={downloading} />
          </div>

          {/* Stipend Schedule */}
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 20, marginBottom: 16, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>💳 Stipend Schedule (Excel)</div>
            <StipendPicker onDownload={(year, month, rate) =>
              download(`${API}/api/AttendanceExport/project/${selectedProject}/stipend?year=${year}&month=${month}&dailyRate=${rate}`,
                `Stipend_${selectedProject}_${year}_${month}.xlsx`)}
              downloading={downloading} />
          </div>

          {/* Competency Certificate */}
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 20, border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>🎓 Competency Certificate (PDF)</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
              Individual certificate for learners who have achieved competency in all unit standards.
            </div>
            <select value={selectedLearner ?? ''} onChange={e => setSelectedLearner(Number(e.target.value))}
              style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', fontSize: 14, marginBottom: 12 }}>
              <option value="">— select learner —</option>
              {learners.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
            </select>
            <button disabled={downloading || !selectedLearner} onClick={() =>
              download(`${API}/api/FunderReport/learner/${selectedLearner}/certificate?projectId=${selectedProject}`,
                `Certificate_${selectedLearner}.pdf`)}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 600,
                opacity: !selectedLearner ? 0.5 : 1 }}>
              {downloading ? 'Generating…' : '🎓 Download Certificate'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MonthPicker({ onDownload, downloading }: { onDownload: (y: number, m: number) => void; downloading: boolean }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2020} max={2099}
        style={{ width: 90, background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px' }} />
      <select value={month} onChange={e => setMonth(Number(e.target.value))}
        style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px' }}>
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>
      <button disabled={downloading} onClick={() => onDownload(year, month)}
        style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#0EA5E9', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        ⬇ Download
      </button>
    </div>
  );
}

function StipendPicker({ onDownload, downloading }: { onDownload: (y: number, m: number, rate: number) => void; downloading: boolean }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rate, setRate] = useState(150);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2020} max={2099}
        style={{ width: 90, background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px' }} />
      <select value={month} onChange={e => setMonth(Number(e.target.value))}
        style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px' }}>
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>R/day:</span>
        <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} min={0}
          style={{ width: 80, background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px' }} />
      </div>
      <button disabled={downloading} onClick={() => onDownload(year, month, rate)}
        style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#0EA5E9', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        ⬇ Download
      </button>
    </div>
  );
}
