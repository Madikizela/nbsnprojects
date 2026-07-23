import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5213';

interface Demographics { totalLearners:number; male:number; female:number; youth:number; above35:number; ageUnknown:number; }
interface DocSummaryItem { documentType:string; count:number; }
interface SiteItem { id:number; siteName:string; city:string; province:string; learnerCount:number; }
interface LearnerDoc { id:number; documentType:string; fileName:string; uploadedAt:string; approvalStatus:string; isAttendanceRegister?:boolean; }
interface Learner { id:number; firstName:string; lastName:string; idNumber:string; gender:string; age:number|null; profilePhotoPath:string|null; documents:LearnerDoc[]; }
interface ProjectAccess {
  accessId:number;
  project:{ id:number; projectName:string; province:string; startDate:string; endDate:string; projectFunder:string; leadEmployerPartner:string; numberOfBeneficiaries:number; };
  allowedDocumentTypes:string[]; organizationName:string;
  demographics:Demographics; documentSummary:DocSummaryItem[]; totalDocuments:number; sites:SiteItem[]; learners:Learner[];
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const icon = (t:string) => {
  const l = t.toLowerCase();
  if(l.includes('attendance')) return '📅';
  if(l.includes('id')||l.includes('identity')) return '🪪';
  if(l.includes('bank')) return '🏦';
  if(l.includes('certif')||l.includes('qualif')) return '🎓';
  if(l.includes('contract')) return '📄';
  if(l.includes('matric')) return '📜';
  if(l.includes('address')) return '🏠';
  if(l.includes('portfolio')||l.includes('poe')) return '📁';
  if(l.includes('medical')||l.includes('sick')) return '🏥';
  return '📋';
};

export default function ExternalPortal() {
  const navigate = useNavigate();
  const [accessList, setAccessList] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<ProjectAccess|null>(null);
  const [learner, setLearner] = useState<Learner|null>(null);
  const [userName, setUserName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [search, setSearch] = useState('');
  const [docFilter, setDocFilter] = useState('');
  const [viewDoc, setViewDoc] = useState<{url:string;fileName:string;mime:string;type:string;id:number;learner:Learner|null}|null>(null);
  const [viewAtt, setViewAtt] = useState<{learner:Learner;year:number;month:number}|null>(null);
  const [attData, setAttData] = useState<unknown>(null);
  const [attLoading, setAttLoading] = useState(false);
  // Bulk download state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkSelLearners, setBulkSelLearners] = useState<Set<number>>(new Set());
  const [bulkSelTypes, setBulkSelTypes] = useState<Set<string>>(new Set());
  const [bulkAttYear, setBulkAttYear] = useState(new Date().getFullYear());
  const [bulkAttMonth, setBulkAttMonth] = useState(new Date().getMonth()+1);
  const [bulkAttToYear, setBulkAttToYear] = useState(new Date().getFullYear());
  const [bulkAttToMonth, setBulkAttToMonth] = useState(new Date().getMonth()+1);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  // Summary report state
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth()+1);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    try {
      const d = JSON.parse(atob(token.split('.')[1]));
      if (d['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] !== 'ExternalUser') { navigate('/login'); return; }
      setUserName(d['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '');
    } catch { navigate('/login'); return; }
    fetch(`${API}/api/ExternalUsers/my-access`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        setAccessList(data);
        if (data.length) { setSel(data[0]); setOrgName(data[0].organizationName||''); }
      }).finally(() => setLoading(false));
  }, []);

  const loadAtt = (lid:number, y:number, m:number) => {
    setAttLoading(true); setAttData(null);
    fetch(`${API}/api/AttendanceTracking/learner/${lid}/calendar?year=${y}&month=${m}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => setAttData(d)).finally(() => setAttLoading(false));
  };

  const openDoc = async (doc:LearnerDoc, lid:number) => {
    if (doc.isAttendanceRegister) {
      const now = new Date();
      setViewAtt({ learner:learner!, year:now.getFullYear(), month:now.getMonth()+1 });
      loadAtt(lid, now.getFullYear(), now.getMonth()+1);
      return;
    }
    const res = await fetch(`${API}/api/ExternalUsers/document/${doc.id}/download`, { headers:{ Authorization:`Bearer ${token}` } });
    if (!res.ok) { alert(`Failed (${res.status})`); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const ct = res.headers.get('content-type')||blob.type||'';
    const ext = doc.fileName.split('.').pop()?.toLowerCase()||'';
    const isPdf = ct.includes('pdf')||ext==='pdf';
    const isImg = ct.includes('image')||['jpg','jpeg','png','gif','webp'].includes(ext);
    if (isPdf||isImg) setViewDoc({ url, fileName:doc.fileName, mime:isPdf?'application/pdf':ct, type:doc.documentType, id:doc.id, learner });
    else { const a=document.createElement('a'); a.href=url; a.download=doc.fileName; a.click(); }
  };

  const dlDoc = async (doc:LearnerDoc, lid?:number) => {
    let url = `${API}/api/ExternalUsers/document/${doc.id}/download`;
    if (doc.isAttendanceRegister && lid) {
      const y = viewAtt?.year ?? new Date().getFullYear();
      const m = viewAtt?.month ?? new Date().getMonth()+1;
      url = `${API}/api/AttendanceTracking/learner/${lid}/calendar/pdf?year=${y}&month=${m}`;
    }
    const res = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } });
    if (!res.ok) { alert('Download failed'); return; }
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = doc.fileName; a.click();
  };

  const filtered = sel?.learners.filter(l => {
    const s = `${l.firstName} ${l.lastName} ${l.idNumber}`.toLowerCase();
    return s.includes(search.toLowerCase()) && (docFilter===''||l.documents.some(d=>d.documentType===docFilter));
  })||[];

  const doBulkDownload = async () => {
    if (!sel || bulkSelLearners.size === 0 || bulkSelTypes.size === 0) return;
    setBulkDownloading(true);
    try {
      const res = await fetch(`${API}/api/ExternalUsers/bulk-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectId: sel.project.id,
          learnerIds: Array.from(bulkSelLearners),
          documentTypes: Array.from(bulkSelTypes),
          attendanceFromYear: bulkAttYear,
          attendanceFromMonth: bulkAttMonth,
          attendanceToYear: bulkAttToYear,
          attendanceToMonth: bulkAttToMonth
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${sel.project.projectName.replace(/ /g,'_')}_Documents_${new Date().toISOString().slice(0,10)}.zip`;
        a.click();
        setShowBulk(false);
      } else { alert('Bulk download failed'); }
    } catch { alert('Bulk download failed'); }
    setBulkDownloading(false);
  };

  if (loading) return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#0f172a',color:'white'}}><div className="spinner-border text-primary"></div></div>;

  return (
    <div style={{backgroundColor:'#0f172a',minHeight:'100vh',color:'white'}}>
      {/* Header */}
      <div style={{backgroundColor:'#1e3a8a',padding:'10px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div className="d-flex align-items-center gap-2">
          <span>🏢</span>
          <div>
            <div style={{fontWeight:'bold'}}>NBSN Project – External Portal</div>
            {orgName&&<div style={{fontSize:'0.75rem',color:'#93c5fd'}}>{orgName}</div>}
          </div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span style={{fontSize:'0.8rem',color:'#93c5fd'}}>👤 {userName}</span>
          <button className="btn btn-outline-light btn-sm" onClick={()=>{localStorage.removeItem('token');navigate('/login');}}>Logout</button>
        </div>
      </div>

      <div className="d-flex" style={{height:'calc(100vh - 52px)'}}>
        {/* Sidebar */}
        <div style={{width:'220px',backgroundColor:'#1e293b',borderRight:'1px solid #334155',overflowY:'auto',flexShrink:0}}>
          <div style={{padding:'10px 14px',borderBottom:'1px solid #334155',fontSize:'0.65rem',color:'#94a3b8',textTransform:'uppercase'}}>Projects</div>
          {accessList.map(a=>(
            <button key={a.accessId} onClick={()=>{setSel(a);setLearner(null);setSearch('');setDocFilter('');}}
              style={{width:'100%',textAlign:'left',padding:'10px 14px',border:'none',backgroundColor:sel?.accessId===a.accessId?'#1e3a8a':'transparent',color:'white',borderLeft:sel?.accessId===a.accessId?'3px solid #3b82f6':'3px solid transparent',cursor:'pointer'}}>
              <div style={{fontWeight:'bold',fontSize:'0.82rem'}}>📁 {a.project.projectName}</div>
              <div style={{fontSize:'0.68rem',color:'#94a3b8'}}>{a.demographics.totalLearners} learners · {a.totalDocuments} docs</div>
            </button>
          ))}
        </div>

        {/* Main */}
        <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
          {!sel ? <div className="text-center py-5" style={{color:'#94a3b8'}}>Select a project</div>
          : !learner ? (
            <>
              {/* Project info */}
              <div style={{backgroundColor:'#1e293b',borderRadius:'8px',padding:'12px',marginBottom:'12px',border:'1px solid #334155'}}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div style={{flex:1}}>
                    <h5 style={{color:'#3b82f6',marginBottom:'8px'}}>{sel.project.projectName}</h5>
                    <div className="row g-2" style={{fontSize:'0.76rem'}}>
                      {[['Province',sel.project.province||'N/A'],['Funder',sel.project.projectFunder],['Partner',sel.project.leadEmployerPartner],
                        ['Start',new Date(sel.project.startDate).toLocaleDateString()],['End',new Date(sel.project.endDate).toLocaleDateString()],
                        ['Beneficiaries',sel.project.numberOfBeneficiaries.toString()]].map(([l,v])=>(
                        <div key={l} className="col-6 col-md-4 col-lg-2"><span style={{color:'#94a3b8'}}>{l}: </span><span className="fw-bold">{v}</span></div>
                      ))}
                    </div>
                  </div>
                  {/* Summary Report */}
                  <div className="d-flex align-items-center gap-2 flex-wrap" style={{flexShrink:0}}>
                    <select value={summaryMonth} onChange={e=>setSummaryMonth(+e.target.value)}
                      style={{backgroundColor:'#0f172a',color:'white',border:'1px solid #334155',borderRadius:'5px',padding:'4px 7px',fontSize:'0.76rem'}}>
                      {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                    </select>
                    <select value={summaryYear} onChange={e=>setSummaryYear(+e.target.value)}
                      style={{backgroundColor:'#0f172a',color:'white',border:'1px solid #334155',borderRadius:'5px',padding:'4px 7px',fontSize:'0.76rem'}}>
                      {Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={async()=>{
                      const url=`${API}/api/ExternalUsers/project/${sel.project.id}/summary-report?year=${summaryYear}&month=${summaryMonth}`;
                      const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
                      if(res.ok){const a=document.createElement('a');a.href=URL.createObjectURL(await res.blob());a.download=`Summary_${sel.project.projectName.replace(/ /g,'_')}_${summaryYear}_${String(summaryMonth).padStart(2,'0')}.pdf`;a.click();}
                      else alert('Failed to generate summary report');
                    }} style={{backgroundColor:'#0EA5E9',color:'white',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer',fontSize:'0.78rem',whiteSpace:'nowrap',fontWeight:'bold'}}>
                      📊 Summary Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary cards */}
              <div className="row g-3 mb-3">
                <div className="col-lg-4">
                  <div style={{backgroundColor:'#1e293b',borderRadius:'8px',padding:'12px',border:'1px solid #334155',height:'100%'}}>
                    <div style={{fontSize:'0.65rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'8px'}}>📊 Demographics</div>
                    <div className="row g-2">
                      {[['👥','Total',sel.demographics.totalLearners,'#3b82f6'],['👨','Male',sel.demographics.male,'#06b6d4'],
                        ['👩','Female',sel.demographics.female,'#ec4899'],['🧑','Youth ≤35',sel.demographics.youth,'#10b981'],
                        ['🧓','Above 35',sel.demographics.above35,'#f59e0b']].map(([ic,lb,va,co])=>(
                        <div key={String(lb)} className="col-6">
                          <div style={{backgroundColor:'#0f172a',borderRadius:'6px',padding:'7px',borderLeft:`3px solid ${co}`,display:'flex',alignItems:'center',gap:'6px'}}>
                            <span>{ic}</span><div><div style={{fontWeight:'bold',color:String(co)}}>{va}</div><div style={{fontSize:'0.6rem',color:'#94a3b8'}}>{lb}</div></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div style={{backgroundColor:'#1e293b',borderRadius:'8px',padding:'12px',border:'1px solid #334155',height:'100%'}}>
                    <div style={{fontSize:'0.65rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'8px'}}>🏫 Sites ({sel.sites.length})</div>
                    <div style={{overflowY:'auto',maxHeight:'180px'}}>
                      {sel.sites.map(s=>(
                        <div key={s.id} style={{backgroundColor:'#0f172a',borderRadius:'6px',padding:'8px',marginBottom:'5px',borderLeft:'3px solid #6366f1',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div><div style={{fontWeight:'bold',fontSize:'0.8rem'}}>🏫 {s.siteName}</div><div style={{fontSize:'0.62rem',color:'#94a3b8'}}>{s.city}{s.city&&s.province?' · ':''}{s.province}</div></div>
                          <div style={{textAlign:'right'}}><div style={{fontWeight:'bold',color:'#6366f1'}}>{s.learnerCount}</div><div style={{fontSize:'0.58rem',color:'#94a3b8'}}>learners</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div style={{backgroundColor:'#1e293b',borderRadius:'8px',padding:'12px',border:'1px solid #334155',height:'100%'}}>
                    <div style={{fontSize:'0.65rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'8px'}}>📄 Documents</div>
                    <div className="row g-2">
                      {sel.documentSummary.map(({documentType:dt,count})=>(
                        <div key={dt} className="col-6"><div style={{backgroundColor:'#0f172a',borderRadius:'6px',padding:'7px',border:'1px solid #334155'}}>
                          <div>{icon(dt)}</div><div style={{fontWeight:'bold',color:count>0?'#10b981':'#94a3b8'}}>{count}</div><div style={{fontSize:'0.6rem',color:'#94a3b8'}}>{dt}</div>
                        </div></div>
                      ))}
                      <div className="col-6"><div style={{backgroundColor:'#0f172a',borderRadius:'6px',padding:'7px',border:'1px solid #1e3a8a'}}>
                        <div>📦</div><div style={{fontWeight:'bold',color:'#3b82f6'}}>{sel.totalDocuments}</div><div style={{fontSize:'0.6rem',color:'#94a3b8'}}>Total</div>
                      </div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="d-flex gap-2 mb-3">
                <input className="form-control form-control-sm" placeholder="🔍 Search learners..." value={search} onChange={e=>setSearch(e.target.value)} style={{backgroundColor:'#1e293b',border:'1px solid #334155',color:'white',maxWidth:'260px'}}/>
                <select className="form-select form-select-sm" value={docFilter} onChange={e=>setDocFilter(e.target.value)} style={{backgroundColor:'#1e293b',border:'1px solid #334155',color:'white',maxWidth:'190px'}}>
                  <option value="">All types</option>
                  {sel.allowedDocumentTypes.map(dt=><option key={dt} value={dt}>{dt}</option>)}
                </select>
                <button className="btn btn-sm ms-auto" style={{backgroundColor:'#7c3aed',color:'white',whiteSpace:'nowrap'}}
                  onClick={()=>{
                    setBulkSelLearners(new Set(sel.learners.map(l=>l.id)));
                    setBulkSelTypes(new Set(sel.allowedDocumentTypes.filter(t=>t!=='Attendance Register')));
                    setShowBulk(true);
                  }}>📦 Bulk Download</button>
              </div>

              {/* Learner cards */}
              <div className="row g-3">
                {filtered.map(l => {
                  const docs = docFilter ? l.documents.filter(d=>d.documentType===docFilter) : l.documents;
                  return (
                    <div key={l.id} className="col-lg-4 col-md-6">
                      <div onClick={()=>setLearner(l)} style={{backgroundColor:'#1e293b',borderRadius:'8px',border:'1px solid #334155',padding:'12px',cursor:'pointer'}}
                        onMouseEnter={e=>(e.currentTarget.style.borderColor='#3b82f6')} onMouseLeave={e=>(e.currentTarget.style.borderColor='#334155')}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {l.profilePhotoPath?<img src={`${API}/${l.profilePhotoPath}`} style={{width:'40px',height:'40px',borderRadius:'50%',objectFit:'cover',border:'2px solid #334155'}} alt=""/>
                            :<div style={{width:'40px',height:'40px',borderRadius:'50%',backgroundColor:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',border:'2px solid #334155'}}>👤</div>}
                          <div><div style={{fontWeight:'bold',fontSize:'0.85rem'}}>{l.firstName} {l.lastName}</div><div style={{fontSize:'0.7rem',color:'#94a3b8'}}>ID: {l.idNumber}</div></div>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span style={{fontSize:'0.7rem',color:'#94a3b8'}}>{l.gender}{l.age!=null?` · ${l.age}yrs`:''}</span>
                          <span style={{fontSize:'0.7rem',backgroundColor:docs.length>0?'#064e3b':'#1e293b',color:docs.length>0?'#10b981':'#94a3b8',padding:'1px 7px',borderRadius:'10px',border:`1px solid ${docs.length>0?'#10b981':'#334155'}`}}>{docs.length} doc{docs.length!==1?'s':''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length===0&&<div className="col-12 text-center py-4" style={{color:'#94a3b8'}}>No learners found</div>}
              </div>
            </>
          ) : (
            /* Learner detail */
            <>
              <button onClick={()=>setLearner(null)} className="btn btn-outline-secondary btn-sm mb-3">← Back</button>
              <div style={{backgroundColor:'#1e293b',borderRadius:'8px',border:'1px solid #334155',padding:'14px',marginBottom:'14px'}}>
                <div className="d-flex align-items-center gap-3">
                  {learner.profilePhotoPath?<img src={`${API}/${learner.profilePhotoPath}`} style={{width:'60px',height:'60px',borderRadius:'50%',objectFit:'cover',border:'3px solid #3b82f6'}} alt=""/>
                    :<div style={{width:'60px',height:'60px',borderRadius:'50%',backgroundColor:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',border:'3px solid #3b82f6'}}>👤</div>}
                  <div><h5 className="mb-1">{learner.firstName} {learner.lastName}</h5>
                    <div style={{color:'#94a3b8',fontSize:'0.8rem'}}>ID: {learner.idNumber} · {learner.gender}{learner.age!=null?` · Age ${learner.age}`:''}</div></div>
                </div>
              </div>
              <div style={{fontSize:'0.68rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'8px'}}>Documents ({learner.documents.length})</div>
              {learner.documents.length===0
                ? <div style={{color:'#94a3b8',textAlign:'center',padding:'32px',backgroundColor:'#1e293b',borderRadius:'8px'}}>No documents available</div>
                : <div className="row g-3">
                    {learner.documents.map(doc=>(
                      <div key={doc.id} className="col-md-4 col-sm-6">
                        <div style={{backgroundColor:'#1e293b',borderRadius:'8px',border:'1px solid #334155',padding:'12px'}}>
                          <div className="d-flex gap-2 mb-2">
                            <span style={{fontSize:'1.5rem'}}>{icon(doc.documentType)}</span>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:'bold',fontSize:'0.82rem'}}>{doc.documentType}</div>
                              <div style={{fontSize:'0.68rem',color:'#94a3b8',wordBreak:'break-all'}}>{doc.fileName}</div>
                              <div style={{fontSize:'0.65rem',color:'#94a3b8'}}>{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="mb-2">
                            <span style={{fontSize:'0.65rem',padding:'2px 7px',borderRadius:'10px',backgroundColor:doc.approvalStatus==='Approved'?'#064e3b':doc.approvalStatus==='Declined'?'#7f1d1d':'#78350f',color:doc.approvalStatus==='Approved'?'#10b981':doc.approvalStatus==='Declined'?'#fca5a5':'#fcd34d'}}>{doc.approvalStatus}</span>
                          </div>
                          <div className="d-flex gap-2">
                            <button onClick={()=>openDoc(doc,learner.id)} className="btn btn-sm flex-fill" style={{backgroundColor:'#1e3a8a',color:'white',fontSize:'0.73rem'}}>👁 View</button>
                            <button onClick={()=>dlDoc(doc,learner.id)} className="btn btn-sm flex-fill" style={{backgroundColor:'#065f46',color:'white',fontSize:'0.73rem'}}>⬇ Download</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </>
          )}
        </div>
      </div>

      {/* Bulk Download Modal */}
      {showBulk && sel && (
        <div className="modal show d-block" style={{backgroundColor:'rgba(0,0,0,0.8)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{backgroundColor:'#1e293b',color:'white',border:'1px solid #334155'}}>
              <div className="modal-header py-2" style={{backgroundColor:'#1e3a8a',borderBottom:'1px solid #334155'}}>
                <h6 className="modal-title mb-0 text-white">📦 Bulk Download – {sel.project.projectName}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={()=>setShowBulk(false)}></button>
              </div>
              <div className="modal-body">
                {/* Document Types Selection */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="fw-bold" style={{fontSize:'0.82rem'}}>📄 Document Types</label>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-light" style={{fontSize:'0.7rem'}} onClick={()=>setBulkSelTypes(new Set(sel.allowedDocumentTypes))}>All</button>
                      <button className="btn btn-sm btn-outline-secondary" style={{fontSize:'0.7rem'}} onClick={()=>setBulkSelTypes(new Set())}>None</button>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {sel.allowedDocumentTypes.map(dt=>(
                      <div key={dt} className="form-check form-check-inline m-0 p-2 rounded" style={{backgroundColor:bulkSelTypes.has(dt)?'#1e3a8a':'#0f172a',border:`1px solid ${bulkSelTypes.has(dt)?'#3b82f6':'#334155'}`,cursor:'pointer'}}
                        onClick={()=>setBulkSelTypes(prev=>{const s=new Set(prev); if (s.has(dt)) s.delete(dt); else s.add(dt); return s;})}>
                        <span style={{fontSize:'0.8rem'}}>{icon(dt)} {dt}</span>
                        {bulkSelTypes.has(dt)&&<span style={{color:'#10b981',marginLeft:'6px'}}>✓</span>}
                      </div>
                    ))}
                  </div>

                  {/* Attendance month/year if attendance selected */}
                  {bulkSelTypes.has('Attendance Register')&&(
                    <div className="p-2 mt-2 rounded" style={{backgroundColor:'#0f172a',border:'1px solid #334155'}}>
                      <div style={{fontSize:'0.78rem',color:'#94a3b8',marginBottom:'6px',fontWeight:'bold'}}>📅 Attendance Date Range</div>
                      <div className="d-flex gap-2 align-items-center flex-wrap">
                        <span style={{fontSize:'0.75rem',color:'#94a3b8'}}>From:</span>
                        <select value={bulkAttMonth} onChange={e=>setBulkAttMonth(+e.target.value)} style={{backgroundColor:'#1e293b',color:'white',border:'1px solid #334155',borderRadius:'4px',padding:'3px 6px',fontSize:'0.78rem'}}>
                          {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <select value={bulkAttYear} onChange={e=>setBulkAttYear(+e.target.value)} style={{backgroundColor:'#1e293b',color:'white',border:'1px solid #334155',borderRadius:'4px',padding:'3px 6px',fontSize:'0.78rem'}}>
                          {Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=><option key={y} value={y}>{y}</option>)}
                        </select>
                        <span style={{fontSize:'0.75rem',color:'#94a3b8'}}>To:</span>
                        <select value={bulkAttToMonth} onChange={e=>setBulkAttToMonth(+e.target.value)} style={{backgroundColor:'#1e293b',color:'white',border:'1px solid #334155',borderRadius:'4px',padding:'3px 6px',fontSize:'0.78rem'}}>
                          {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <select value={bulkAttToYear} onChange={e=>setBulkAttToYear(+e.target.value)} style={{backgroundColor:'#1e293b',color:'white',border:'1px solid #334155',borderRadius:'4px',padding:'3px 6px',fontSize:'0.78rem'}}>
                          {Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=><option key={y} value={y}>{y}</option>)}
                        </select>
                        <span style={{fontSize:'0.7rem',color:'#94a3b8'}}>
                          ({(() => { const months=(bulkAttToYear-bulkAttYear)*12+(bulkAttToMonth-bulkAttMonth)+1; return months>0?`${months} month${months>1?'s':''}`:' — check range'; })()})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <hr style={{borderColor:'#334155'}}/>

                {/* Learner Selection grouped by site */}
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="fw-bold" style={{fontSize:'0.82rem'}}>👥 Select Learners ({bulkSelLearners.size} of {sel.learners.length})</label>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-light" style={{fontSize:'0.7rem'}} onClick={()=>setBulkSelLearners(new Set(sel.learners.map(l=>l.id)))}>All</button>
                      <button className="btn btn-sm btn-outline-secondary" style={{fontSize:'0.7rem'}} onClick={()=>setBulkSelLearners(new Set())}>None</button>
                    </div>
                  </div>
                  {/* Simple learner grid */}
                  <div style={{maxHeight:'300px',overflowY:'auto'}}>
                    <div className="row g-2">
                      {sel.learners.map(l=>(
                        <div key={l.id} className="col-md-4 col-6">
                          <div onClick={()=>setBulkSelLearners(prev=>{const s=new Set(prev); if (s.has(l.id)) s.delete(l.id); else s.add(l.id); return s;})}
                            style={{padding:'8px',borderRadius:'6px',cursor:'pointer',backgroundColor:bulkSelLearners.has(l.id)?'#1e3a8a':'#0f172a',border:`1px solid ${bulkSelLearners.has(l.id)?'#3b82f6':'#334155'}`,display:'flex',alignItems:'center',gap:'8px'}}>
                            <div style={{width:'16px',height:'16px',borderRadius:'3px',backgroundColor:bulkSelLearners.has(l.id)?'#3b82f6':'#334155',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              {bulkSelLearners.has(l.id)&&<span style={{color:'white',fontSize:'0.65rem'}}>✓</span>}
                            </div>
                            <div>
                              <div style={{fontSize:'0.75rem',fontWeight:'bold'}}>{l.firstName} {l.lastName}</div>
                              <div style={{fontSize:'0.62rem',color:'#94a3b8'}}>{l.idNumber}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ZIP structure preview */}
                <div className="mt-3 p-2 rounded" style={{backgroundColor:'#0f172a',border:'1px solid #334155',fontSize:'0.72rem',color:'#94a3b8'}}>
                  <div className="fw-bold mb-1" style={{color:'white'}}>📦 ZIP Structure Preview:</div>
                  <div>{sel.project.projectName.replace(/ /g,'_')}.zip</div>
                  {sel.sites.slice(0,2).map(s=>(
                    <div key={s.id} className="ms-3">├── {s.siteName.replace(/ /g,'_')}/
                      <div className="ms-3">└── [LearnerName_ID]/ → {Array.from(bulkSelTypes).slice(0,3).join(', ')}{bulkSelTypes.size>3?`...`:''}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer py-2" style={{borderTop:'1px solid #334155'}}>
                <span style={{fontSize:'0.75rem',color:'#94a3b8'}}>{bulkSelLearners.size} learner{bulkSelLearners.size!==1?'s':''} · {bulkSelTypes.size} doc type{bulkSelTypes.size!==1?'s':''}</span>
                <button className="btn btn-secondary btn-sm" onClick={()=>setShowBulk(false)}>Cancel</button>
                <button className="btn btn-sm" style={{backgroundColor:'#7c3aed',color:'white'}}
                  onClick={doBulkDownload}
                  disabled={bulkDownloading||bulkSelLearners.size===0||bulkSelTypes.size===0}>
                  {bulkDownloading?<><span className="spinner-border spinner-border-sm me-2"></span>Building ZIP...</>:<>📦 Download ZIP</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document split-screen viewer */}
      {viewDoc && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1050,display:'flex',flexDirection:'column',backgroundColor:'#0f172a'}}>
          <div style={{backgroundColor:'#1e3a8a',padding:'7px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <span style={{fontWeight:'bold',color:'white',fontSize:'0.88rem'}}>📄 {viewDoc.type} – Split View</span>
            <div className="d-flex gap-2">
              <a href={viewDoc.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-light" style={{fontSize:'0.73rem'}}>🔗 New Tab</a>
              <a href={viewDoc.url} download={viewDoc.fileName} className="btn btn-sm" style={{backgroundColor:'#10b981',color:'white',fontSize:'0.73rem'}}>⬇ Download</a>
              <button className="btn btn-sm btn-outline-light" style={{fontSize:'0.73rem'}} onClick={()=>setViewDoc(null)}>✕ Close</button>
            </div>
          </div>
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            <div style={{flex:1,overflow:'auto',borderRight:'1px solid #334155'}}>
              {viewDoc.mime.includes('pdf')
                ? <iframe src={viewDoc.url} style={{width:'100%',height:'100%',border:'none'}} title={viewDoc.fileName}/>
                : <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
                    <img src={viewDoc.url} alt={viewDoc.fileName} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>
                  </div>}
            </div>
            {viewDoc.learner && (
              <div style={{width:'300px',flexShrink:0,backgroundColor:'#0f172a',overflowY:'auto',padding:'14px'}}>
                <div style={{fontWeight:'bold',color:'#3b82f6',fontSize:'0.75rem',textTransform:'uppercase',marginBottom:'10px'}}>👤 Learner Profile</div>
                <div style={{backgroundColor:'#1e293b',borderRadius:'8px',overflow:'hidden',marginBottom:'10px'}}>
                  <div style={{backgroundColor:'#1e3a8a',padding:'7px 10px',fontWeight:'bold',fontSize:'0.75rem',color:'white'}}>Personal Info</div>
                  <div style={{padding:'10px',fontSize:'0.75rem'}}>
                    <div style={{fontWeight:'bold',color:'white',marginBottom:'6px'}}>{viewDoc.learner.firstName} {viewDoc.learner.lastName}</div>
                    {[['ID',viewDoc.learner.idNumber],['Gender',viewDoc.learner.gender||'N/A'],['Age',viewDoc.learner.age!=null?String(viewDoc.learner.age):'N/A']].map(([k,v])=>(
                      <div key={k} className="d-flex justify-content-between mb-1"><span style={{color:'#94a3b8'}}>{k}</span><span style={{color:'white'}}>{v}</span></div>
                    ))}
                  </div>
                </div>
                <div style={{backgroundColor:'#1e293b',borderRadius:'8px',overflow:'hidden'}}>
                  <div style={{backgroundColor:'#1e3a8a',padding:'7px 10px',fontWeight:'bold',fontSize:'0.75rem',color:'white'}}>Documents</div>
                  <div style={{padding:'6px'}}>
                    {viewDoc.learner.documents.map(d=>(
                      <div key={d.id} onClick={()=>openDoc(d,viewDoc.learner!.id)}
                        style={{padding:'7px',borderRadius:'5px',cursor:'pointer',marginBottom:'3px',backgroundColor:d.id===viewDoc.id?'#1e3a8a':'transparent',border:`1px solid ${d.id===viewDoc.id?'#3b82f6':'#334155'}`}}>
                        <div style={{fontSize:'0.73rem',color:'white'}}>{icon(d.documentType)} {d.documentType}</div>
                        <div style={{fontSize:'0.62rem',color:'#94a3b8'}}>{d.fileName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance calendar viewer - matches PDF layout */}
      {viewAtt && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1050,display:'flex',flexDirection:'column',backgroundColor:'#0f172a'}}>
          {/* Blue header */}
          <div style={{backgroundColor:'#1e3a8a',padding:'8px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <div>
              <div style={{fontWeight:'bold',color:'white',fontSize:'1rem'}}>Attendance Calendar</div>
              <div style={{color:'#93c5fd',fontSize:'0.7rem'}}>{MONTHS[viewAtt.month-1]} {viewAtt.year} &nbsp;·&nbsp; Period {viewAtt.year}.{String(viewAtt.month).padStart(2,'0')}.01 – {viewAtt.year}.{String(viewAtt.month).padStart(2,'0')}.{new Date(viewAtt.year,viewAtt.month,0).getDate()}</div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <select value={viewAtt.month} onChange={e=>{const m=+e.target.value;setViewAtt(p=>p?{...p,month:m}:null);loadAtt(viewAtt.learner.id,viewAtt.year,m);}} style={{backgroundColor:'#334155',color:'white',border:'1px solid #475569',borderRadius:'4px',padding:'2px 6px',fontSize:'0.78rem'}}>
                {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={viewAtt.year} onChange={e=>{const y=+e.target.value;setViewAtt(p=>p?{...p,year:y}:null);loadAtt(viewAtt.learner.id,y,viewAtt.month);}} style={{backgroundColor:'#334155',color:'white',border:'1px solid #475569',borderRadius:'4px',padding:'2px 6px',fontSize:'0.78rem'}}>
                {Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <span style={{color:'white',fontWeight:'bold',marginLeft:'12px',fontSize:'0.9rem'}}>NBSN Project</span>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm" style={{backgroundColor:'#10b981',color:'white',fontSize:'0.73rem'}} onClick={async()=>{
                const url=`${API}/api/AttendanceTracking/learner/${viewAtt.learner.id}/calendar/pdf?year=${viewAtt.year}&month=${viewAtt.month}`;
                const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
                if(res.ok){const a=document.createElement('a');a.href=URL.createObjectURL(await res.blob());a.download=`Attendance_${viewAtt.learner.firstName}_${viewAtt.year}_${String(viewAtt.month).padStart(2,'0')}.pdf`;a.click();}
              }}>⬇ Download PDF</button>
              <button className="btn btn-sm btn-outline-light" style={{fontSize:'0.73rem'}} onClick={()=>{setViewAtt(null);setAttData(null);}}>✕ Close</button>
            </div>
          </div>

          {/* Body: left=calendar, right=info panel */}
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            {/* LEFT: Calendar */}
            <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
              {attLoading
                ? <div className="text-center py-5 text-white"><div className="spinner-border text-primary"></div></div>
                : !attData
                ? <div className="text-center py-5" style={{color:'#94a3b8'}}>No attendance data</div>
                : (()=>{
                    const today=new Date(); today.setHours(0,0,0,0);
                    const firstDay=new Date(attData.year,attData.month-1,1);
                    let off=firstDay.getDay(); off=off===0?6:off-1;
                    const cells:(unknown)[]=[...Array(off).fill(null),...(attData as { calendarDays: unknown[] }).calendarDays];
                    while(cells.length%7!==0) cells.push(null);
                    const weeks:(unknown)[][]=[];
                    for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
                    return (
                      <div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'2px'}}>
                          {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d=>(
                            <div key={d} style={{backgroundColor:'#1e3a8a',color:'white',textAlign:'center',padding:'5px 2px',fontSize:'0.7rem',fontWeight:'bold'}}>{d}</div>
                          ))}
                        </div>
                        {weeks.map((wk,wi)=>(
                          <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'2px'}}>
                            {wk.map((day,di)=>{
                              if(!day) return <div key={`e${wi}${di}`} style={{minHeight:'65px',backgroundColor:'#070d17',border:'1px solid #1e293b'}}/>;
                              const dt=new Date(attData.year,attData.month-1,day.day);
                              const fut=dt>today;
                              const absent=day.status==='Absent'||(day.status==='No Record'&&!fut&&!day.isWeekend);
                              let bg='#1e293b',br='#334155',tc='#94a3b8',lbl='';
                              if(day.isWeekend){bg='#0a0f1a';br='#1e293b';tc='#475569';lbl='WKND';}
                              else if(day.status==='Present'){bg='#064e3b';br='#10b981';tc='#6ee7b7';lbl='PRESENT';}
                              else if(absent){bg='#7f1d1d';br='#ef4444';tc='#fca5a5';lbl='ABSENT';}
                              else if(day.status==='Late'){bg='#78350f';br='#f59e0b';tc='#fcd34d';lbl='LATE';}
                              else if(fut){tc='#64748b';lbl='PENDING';}
                              return (
                                <div key={day.date} style={{backgroundColor:bg,border:`1px solid ${br}`,minHeight:'65px',padding:'4px'}}>
                                  <div style={{color:'white',fontSize:'0.75rem',fontWeight:'bold'}}>{day.day}</div>
                                  <div style={{color:tc,fontSize:'0.6rem',textAlign:'center',marginTop:'2px',fontWeight:'bold'}}>{lbl}</div>
                                  {(day.status==='Present'||day.status==='Late')&&day.clockInTime&&day.clockOutTime&&(
                                    <div style={{color:tc,fontSize:'0.54rem',textAlign:'center',marginTop:'1px'}}>
                                      {new Date(day.clockInTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} – {new Date(day.clockOutTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                      {day.contactHours>0&&<div style={{color:'#93c5fd'}}>{Number(day.contactHours).toFixed(2)}h</div>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        {/* Legend */}
                        <div className="d-flex gap-3 mt-2 mb-3 flex-wrap" style={{fontSize:'0.68rem'}}>
                          <span style={{fontWeight:'bold',color:'white'}}>Legend:</span>
                          {[['#064e3b','#10b981','Present'],['#7f1d1d','#ef4444','Absent'],['#78350f','#f59e0b','Late'],['#1e293b','#475569','Pending'],['#0a0f1a','#1e293b','Weekend']].map(([bg,br,lb])=>(
                            <div key={lb} className="d-flex align-items-center gap-1">
                              <div style={{width:'14px',height:'10px',backgroundColor:bg,border:`1px solid ${br}`}}></div>
                              <span style={{color:'#94a3b8'}}>{lb}</span>
                            </div>
                          ))}
                        </div>
                        {/* Signatures */}
                        <div className="d-flex gap-4">
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.68rem',color:'#94a3b8',marginBottom:'3px'}}>Learner Signature:</div>
                            <div style={{backgroundColor:'white',height:'48px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'3px'}}>
                              {attData.signaturePath
                                ? <img
                                    src={attData.signaturePath.startsWith('data:') || attData.signaturePath.length > 200
                                      ? (attData.signaturePath.startsWith('data:') ? attData.signaturePath : `data:image/png;base64,${attData.signaturePath}`)
                                      : `${API}/${attData.signaturePath}`}
                                    style={{maxHeight:'44px',maxWidth:'100%',objectFit:'contain'}} alt="sig"
                                    onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }}/>
                                : <span style={{color:'#9ca3af',fontSize:'0.7rem'}}>No signature</span>}
                            </div>
                            <div style={{fontSize:'0.64rem',color:'white',marginTop:'2px',borderTop:'1px solid #334155',paddingTop:'2px'}}>{attData.firstName} {attData.lastName}</div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.68rem',color:'#94a3b8',marginBottom:'3px'}}>Facilitator Signature:</div>
                            <div style={{backgroundColor: attData.teacherSignaturePath ? 'white' : '#1e293b',border:'1px solid #334155',height:'48px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'3px'}}>
                              {attData.teacherSignaturePath
                                ? <img
                                    src={attData.teacherSignaturePath.startsWith('data:') || attData.teacherSignaturePath.startsWith('iVBOR') || attData.teacherSignaturePath.length > 200
                                      ? (attData.teacherSignaturePath.startsWith('data:') ? attData.teacherSignaturePath : `data:image/png;base64,${attData.teacherSignaturePath}`)
                                      : `${API}/${attData.teacherSignaturePath}`}
                                    style={{maxHeight:'44px',maxWidth:'100%',objectFit:'contain'}}
                                    alt="facilitator sig"
                                    onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }}/>
                                : <span style={{color:'#9ca3af',fontSize:'0.7rem'}}>No signature</span>}
                            </div>
                            <div style={{fontSize:'0.64rem',color:'white',marginTop:'2px',borderTop:'1px solid #334155',paddingTop:'2px'}}>{attData.teacherName||'Facilitator'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
              }
            </div>

            {/* RIGHT: Info panel */}
            {attData && (
              <div style={{width:'260px',flexShrink:0,backgroundColor:'#0f172a',overflowY:'auto',borderLeft:'1px solid #334155',padding:'10px'}}>
                {/* Name */}
                <div style={{backgroundColor:'#1e3a8a',padding:'7px',textAlign:'center',borderRadius:'5px',marginBottom:'8px'}}>
                  <div style={{fontWeight:'bold',color:'white',fontSize:'0.9rem'}}>{attData.firstName} {attData.lastName}</div>
                </div>
                {/* Project */}
                <div style={{fontSize:'0.6rem',color:'#3b82f6',fontWeight:'bold',textTransform:'uppercase',marginBottom:'3px'}}>Project Details</div>
                {[['Pathway',attData.pathway],['Province',attData.province],['Project',attData.projectName],['Site',attData.siteName]].map(([l,v])=>(
                  <div key={l} className="d-flex justify-content-between mb-1">
                    <span style={{color:'#94a3b8',fontSize:'0.68rem'}}>{l}:</span>
                    <span style={{color:'white',fontSize:'0.68rem',textAlign:'right',maxWidth:'58%'}}>{String(v)||'N/A'}</span>
                  </div>
                ))}
                {/* Class */}
                <div style={{fontSize:'0.6rem',color:'#3b82f6',fontWeight:'bold',textTransform:'uppercase',margin:'7px 0 3px'}}>Class &amp; Facilitator</div>
                {[['Class',attData.className],['Facilitator',attData.teacherName],['Email',attData.teacherEmail]].map(([l,v])=>(
                  <div key={l} className="d-flex justify-content-between mb-1">
                    <span style={{color:'#94a3b8',fontSize:'0.68rem'}}>{l}:</span>
                    <span style={{color:'white',fontSize:'0.66rem',textAlign:'right',maxWidth:'62%',wordBreak:'break-all'}}>{String(v)||'N/A'}</span>
                  </div>
                ))}
                {/* Learner */}
                <div style={{fontSize:'0.6rem',color:'#3b82f6',fontWeight:'bold',textTransform:'uppercase',margin:'7px 0 3px'}}>Learner</div>
                {[['ID',attData.idNumber],['Gender',attData.gender],['Phone',attData.telephone]].map(([l,v])=>(
                  <div key={l} className="d-flex justify-content-between mb-1">
                    <span style={{color:'#94a3b8',fontSize:'0.68rem'}}>{l}:</span>
                    <span style={{color:'white',fontSize:'0.68rem'}}>{String(v)||'N/A'}</span>
                  </div>
                ))}
                <div style={{fontSize:'0.66rem',color:'#94a3b8',marginBottom:'1px'}}>Address:</div>
                <div style={{fontSize:'0.66rem',color:'white',marginBottom:'8px'}}>{attData.address||'N/A'}</div>
                {/* Statistics */}
                <div style={{fontSize:'0.6rem',color:'#3b82f6',fontWeight:'bold',textTransform:'uppercase',marginBottom:'5px'}}>Attendance Statistics</div>
                <div className="row g-1">
                  {[['Expected',attData.expectedAttendance,'#06b6d4'],['Actual',attData.actualAttendance,'#10b981'],
                    ['Absent',attData.daysAbsent,'#ef4444'],['Rate',`${attData.attendanceRate?.toFixed(2)}%`,'#3b82f6'],
                    ['Holidays',attData.holidays,'#8b5cf6'],['Sick',attData.approvedSickDays,'#f59e0b']].map(([l,v,c])=>(
                    <div key={String(l)} className="col-6">
                      <div style={{backgroundColor:'#1e293b',borderRadius:'4px',padding:'5px',borderLeft:`3px solid ${c}`,textAlign:'center',marginBottom:'3px'}}>
                        <div style={{fontWeight:'bold',fontSize:'0.92rem',color:'white'}}>{String(v)}</div>
                        <div style={{fontSize:'0.56rem',color:'#94a3b8'}}>{l}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
