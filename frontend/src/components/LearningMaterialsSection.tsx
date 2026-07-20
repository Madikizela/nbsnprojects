import React, { useState, useEffect, useRef } from 'react';

interface Qualification {
  id: number; // project_qualification_id
  projectId: number;
  projectName: string;
  qualificationName: string;
  pathwayName?: string;
  qualificationLevel?: string;
  qualificationType?: string;
}

interface LearningMaterial {
  id: number;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  materialType: string;
  uploadedByName: string;
  createdAt: string;
  displayOrder: number;
}

interface Props {
  filteredProjects: any[];
  projectDetails: Record<number, any>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  baseApiUrl: string;
}

const LearningMaterialsSection: React.FC<Props> = ({
  filteredProjects,
  projectDetails,
  fetchWithAuth,
  baseApiUrl,
}) => {
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  // Local copy of project details — pre-fetched on mount for all projects
  const [localDetails, setLocalDetails] = useState<Record<number, any>>({ ...projectDetails });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const fetchedIds = useRef<Set<number>>(new Set(Object.keys(projectDetails).map(Number)));

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadType, setUploadType] = useState('StudyGuide');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge parent projectDetails into localDetails whenever parent updates
  useEffect(() => {
    setLocalDetails(prev => {
      const merged = { ...prev };
      let changed = false;
      Object.entries(projectDetails).forEach(([k, v]) => {
        const id = Number(k);
        if (!merged[id]) { merged[id] = v; fetchedIds.current.add(id); changed = true; }
      });
      return changed ? merged : prev;
    });
  }, [projectDetails]);

  // Fetch project details for any project that hasn't been loaded yet
  useEffect(() => {
    const missing = filteredProjects.filter(p => !fetchedIds.current.has(p.id));
    if (missing.length === 0) return;

    // Mark as fetching immediately to prevent duplicate calls
    missing.forEach(p => fetchedIds.current.add(p.id));
    setLoadingDetails(true);

    Promise.all(
      missing.map(async p => {
        try {
          const res = await fetchWithAuth(`/api/projects/${p.id}/details`);
          if (res.ok) {
            const data = await res.json();
            return { id: p.id, data };
          }
        } catch {
          // ignore
        }
        return null;
      })
    ).then(results => {
      setLocalDetails(prev => {
        const merged = { ...prev };
        results.forEach(r => { if (r) merged[r.id] = r.data; });
        return merged;
      });
      setLoadingDetails(false);
    });
  }, [filteredProjects]);

  // Collect all qualifications from all projects using localDetails
  const allQualifications: Qualification[] = [];
  filteredProjects.forEach(project => {
    const details = localDetails[project.id];
    if (details?.learningPathways) {
      details.learningPathways.forEach((lp: any) => {
        if (lp.qualifications) {
          lp.qualifications.forEach((q: any) => {
            const qualName =
              q.legacyQualification?.name ||
              q.occupationalQualification?.name ||
              'Unknown Qualification';
            const qualLevel =
              q.legacyQualification?.level ||
              q.occupationalQualification?.level ||
              '';
            const qualType =
              q.legacyQualification?.qualificationType ||
              q.occupationalQualification?.qualificationType ||
              '';
            
            allQualifications.push({
              id: q.id, // project_qualification_id
              projectId: project.id,
              projectName: project.projectName,
              qualificationName: qualName,
              pathwayName: lp.pathway?.name || lp.learningPathway?.name || 'Unknown Pathway',
              qualificationLevel: qualLevel,
              qualificationType: qualType,
            });
          });
        }
      });
    }
  });

  // Group qualifications by project
  const grouped: Record<string, Qualification[]> = {};
  allQualifications.forEach(qual => {
    const projKey = `${qual.projectId}::${qual.projectName}`;
    if (!grouped[projKey]) grouped[projKey] = [];
    grouped[projKey].push(qual);
  });

  useEffect(() => {
    if (selectedQualification) {
      fetchMaterials(selectedQualification.id);
    }
  }, [selectedQualification]);

  const fetchMaterials = async (projectQualificationId: number) => {
    setLoadingMaterials(true);
    setErrorMsg('');
    try {
      const res = await fetchWithAuth(`/api/LearningMaterials/qualification/${projectQualificationId}`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      } else {
        setMaterials([]);
      }
    } catch {
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim() || !selectedQualification) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('ProjectQualificationId', selectedQualification.id.toString());
      formData.append('Title', uploadTitle.trim());
      formData.append('Description', uploadDescription.trim());
      formData.append('MaterialType', uploadType);
      formData.append('File', uploadFile);

      const res = await fetchWithAuth('/api/LearningMaterials/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg('✅ Learning material uploaded successfully! Learners can now access it.');
        setUploadTitle('');
        setUploadDescription('');
        setUploadType('StudyGuide');
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowUploadForm(false);
        await fetchMaterials(selectedQualification.id);
      } else {
        const err = await res.text();
        setErrorMsg(`Upload failed: ${err}`);
      }
    } catch (err: any) {
      setErrorMsg(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: number, title: string) => {
    if (!confirm(`Delete "${title}"? Learners will no longer see this material.`)) return;
    setDeleting(materialId);
    try {
      const res = await fetchWithAuth(`/api/LearningMaterials/${materialId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Material deleted.');
        setMaterials(prev => prev.filter(m => m.id !== materialId));
      } else {
        setErrorMsg('Failed to delete material.');
      }
    } catch {
      setErrorMsg('Error deleting material.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (materialId: number, fileName: string) => {
    try {
      const res = await fetchWithAuth(`/api/LearningMaterials/${materialId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setErrorMsg('Failed to download file.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const materialTypeIcon = (type: string) => {
    switch (type) {
      case 'StudyGuide': return '📖';
      case 'LearningMaterial': return '📚';
      case 'Video': return '🎬';
      case 'Presentation': return '📊';
      case 'Worksheet': return '📝';
      default: return '📄';
    }
  };

  const mimeIcon = (mime: string) => {
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('word') || mime.includes('document')) return '📘';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
    if (mime.includes('video')) return '🎬';
    if (mime.includes('image')) return '🖼️';
    return '📄';
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="card border-0 shadow-lg mb-4" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#fff' }}>
        <div className="card-body text-center py-4">
          <h2 className="mb-1 fw-bold">📚 Learning Materials</h2>
          <p className="mb-0 opacity-75">
            Upload study guides and learning materials — learners in your projects will see them automatically
          </p>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2 shadow-sm" role="alert">
          <span>{successMsg}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMsg('')} />
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2 shadow-sm" role="alert">
          <span>{errorMsg}</span>
          <button type="button" className="btn-close ms-auto" onClick={() => setErrorMsg('')} />
        </div>
      )}

      <div className="row g-4">
        {/* Left panel — Qualification selector */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
              <h6 className="fw-bold text-muted text-uppercase mb-0" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                Select Qualification
              </h6>
              <p className="text-muted small mb-3">Choose which qualification to upload materials for</p>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
              {loadingDetails ? (
                <div className="text-center p-4">
                  <span className="spinner-border text-primary" style={{ width: '1.5rem', height: '1.5rem' }} />
                  <p className="text-muted small mt-2 mb-0">Loading projects & qualifications...</p>
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center text-muted p-4">
                  <div style={{ fontSize: '2.5rem' }}>📂</div>
                  <p className="mt-2 small">No qualifications found in your projects.</p>
                </div>
              ) : (
                Object.entries(grouped).map(([projKey, qualifications]) => {
                  const [, projectName] = projKey.split('::');
                  return (
                    <div key={projKey} className="px-3 pb-2">
                      {/* Project header */}
                      <div className="py-2 px-1 mt-2">
                        <span className="badge rounded-pill px-3 py-2"
                          style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', fontSize: '0.75rem' }}>
                          📁 {projectName}
                        </span>
                      </div>

                      {/* Qualifications */}
                      {qualifications.map(qual => (
                        <button
                          key={qual.id}
                          onClick={() => {
                            setSelectedQualification(qual);
                            setShowUploadForm(false);
                            setSuccessMsg('');
                            setErrorMsg('');
                          }}
                          className="w-100 text-start border-0 rounded-3 px-3 py-3 mb-2 d-flex align-items-start gap-2"
                          style={{
                            background: selectedQualification?.id === qual.id
                              ? 'linear-gradient(135deg,#4facfe20,#00f2fe20)'
                              : 'transparent',
                            outline: selectedQualification?.id === qual.id
                              ? '1px solid #4facfe44' : 'none',
                            transition: 'all 0.15s ease',
                            cursor: 'pointer',
                            borderLeft: selectedQualification?.id === qual.id
                              ? '3px solid #4facfe' : '3px solid transparent',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem', marginTop: '2px', flexShrink: 0 }}>🎓</span>
                          <div className="flex-grow-1">
                            <div className="fw-semibold" style={{ fontSize: '0.88rem', color: '#333', lineHeight: 1.3 }}>
                              {qual.qualificationName}
                            </div>
                            {qual.pathwayName && qual.pathwayName !== 'Unknown Pathway' && (
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                🛤️ {qual.pathwayName}
                              </div>
                            )}
                            {qual.qualificationLevel && (
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {qual.qualificationType} · Level {qual.qualificationLevel}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right panel — Materials list + upload */}
        <div className="col-md-8">
          {!selectedQualification ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div style={{ fontSize: '4rem' }}>👈</div>
                <h5 className="mt-3 text-muted">Select a Qualification</h5>
                <p className="text-muted small">Choose a qualification from the left to view and upload learning materials for it.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Qualification header */}
              <div className="card border-0 shadow-sm mb-3"
                style={{ background: 'linear-gradient(135deg,#4facfe15,#00f2fe10)', borderLeft: '4px solid #4facfe' }}>
                <div className="card-body d-flex justify-content-between align-items-center py-3 px-4">
                  <div>
                    <h6 className="fw-bold mb-0">{selectedQualification.qualificationName}</h6>
                    <div className="text-muted small">
                      <span className="fw-semibold text-primary">{selectedQualification.projectName}</span>
                      {selectedQualification.pathwayName && selectedQualification.pathwayName !== 'Unknown Pathway' && (
                        <> · 🛤️ {selectedQualification.pathwayName}</>
                      )}
                    </div>
                    {selectedQualification.qualificationLevel && (
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {selectedQualification.qualificationType} · Level {selectedQualification.qualificationLevel}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-primary d-flex align-items-center gap-2 shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', border: 'none' }}
                    onClick={() => { setShowUploadForm(v => !v); setSuccessMsg(''); setErrorMsg(''); }}
                  >
                    <span>{showUploadForm ? '✕' : '⬆️'}</span>
                    {showUploadForm ? 'Cancel' : 'Upload Material'}
                  </button>
                </div>
              </div>

              {/* Upload Form */}
              {showUploadForm && (
                <div className="card border-0 shadow-sm mb-3" style={{ borderTop: '3px solid #4facfe' }}>
                  <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
                    <h6 className="fw-bold mb-0">⬆️ Upload Learning Material</h6>
                    <p className="text-muted small mb-2">
                      This will be visible to all learners enrolled in <strong>{selectedQualification.projectName}</strong> doing this qualification.
                    </p>
                  </div>
                  <div className="card-body px-4 pb-4">
                    <form onSubmit={handleUpload}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="lm-title" className="form-label fw-semibold small">Title <span className="text-danger">*</span></label>
                          <input
                            id="lm-title"
                            type="text"
                            className="form-control border-0 bg-light"
                            placeholder="e.g. Chapter 1 - Introduction to Plumbing"
                            value={uploadTitle}
                            onChange={e => setUploadTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="lm-type" className="form-label fw-semibold small">Material Type</label>
                          <select
                            id="lm-type"
                            className="form-select border-0 bg-light"
                            value={uploadType}
                            onChange={e => setUploadType(e.target.value)}
                          >
                            <option value="StudyGuide">📖 Study Guide</option>
                            <option value="LearningMaterial">📚 Learning Material</option>
                            <option value="Presentation">📊 Presentation / Slides</option>
                            <option value="Worksheet">📝 Worksheet / Exercise</option>
                            <option value="Video">🎬 Video</option>
                            <option value="Other">📄 Other</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <label htmlFor="lm-desc" className="form-label fw-semibold small">Description (optional)</label>
                          <textarea
                            id="lm-desc"
                            className="form-control border-0 bg-light"
                            rows={2}
                            placeholder="Brief description of what this material covers..."
                            value={uploadDescription}
                            onChange={e => setUploadDescription(e.target.value)}
                          />
                        </div>
                        <div className="col-12">
                          <label htmlFor="lm-file" className="form-label fw-semibold small">File <span className="text-danger">*</span></label>
                          <div
                            role="button"
                            tabIndex={0}
                            className="border-2 border-dashed rounded-3 p-4 text-center"
                            style={{
                              border: '2px dashed #4facfe',
                              cursor: 'pointer',
                              background: uploadFile ? '#f0fff4' : '#f8fdff',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                              e.preventDefault();
                              const file = e.dataTransfer.files[0];
                              if (file) setUploadFile(file);
                            }}
                          >
                            <input
                              ref={fileInputRef}
                              id="lm-file"
                              type="file"
                              className="d-none"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov,.avi,.png,.jpg,.jpeg"
                              onChange={e => setUploadFile(e.target.files?.[0] || null)}
                              required={!uploadFile}
                            />
                            {uploadFile ? (
                              <div>
                                <div style={{ fontSize: '2rem' }}>{mimeIcon(uploadFile.type)}</div>
                                <p className="fw-semibold mb-0 mt-1 text-success">{uploadFile.name}</p>
                                <p className="text-muted small mb-0">{formatFileSize(uploadFile.size)}</p>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary mt-2"
                                  onClick={e => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                >
                                  Change File
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: '2.5rem' }}>📂</div>
                                <p className="text-muted mb-0 mt-1">Drag & drop or click to select file</p>
                                <p className="text-muted small mb-0">PDF, Word, PowerPoint, Excel, Video, Images</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-12">
                          <button
                            type="submit"
                            className="btn btn-primary w-100 fw-bold py-2"
                            style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', border: 'none' }}
                            disabled={uploading || !uploadFile || !uploadTitle.trim()}
                          >
                            {uploading ? (
                              <><span className="spinner-border spinner-border-sm me-2" />Uploading...</>
                            ) : (
                              '⬆️ Upload & Publish to Learners'
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Materials List */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-3 pb-0 px-4 d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-0">Published Materials</h6>
                    <p className="text-muted small mb-2">
                      {materials.length} material{materials.length !== 1 ? 's' : ''} published for this qualification
                    </p>
                  </div>
                  {materials.length > 0 && (
                    <span className="badge rounded-pill"
                      style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', fontSize: '0.8rem' }}>
                      Visible to learners ✓
                    </span>
                  )}
                </div>
                <div className="card-body p-0">
                  {loadingMaterials ? (
                    <div className="text-center py-4">
                      <span className="spinner-border text-primary" />
                      <p className="text-muted small mt-2 mb-0">Loading materials...</p>
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="text-center py-5">
                      <div style={{ fontSize: '3rem' }}>📭</div>
                      <p className="text-muted mt-2">No materials uploaded yet for this qualification.</p>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowUploadForm(true)}
                      >
                        ⬆️ Upload First Material
                      </button>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {materials.map((mat, index) => (
                        <div
                          key={mat.id}
                          className="list-group-item list-group-item-action border-0 px-4 py-3"
                          style={{ borderBottom: index < materials.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="flex-shrink-0" style={{ fontSize: '2rem' }}>
                              {materialTypeIcon(mat.materialType)}
                            </div>
                            <div className="flex-grow-1 min-w-0">
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <h6 className="mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>{mat.title}</h6>
                                <span className="badge rounded-pill bg-light text-secondary" style={{ fontSize: '0.7rem' }}>
                                  {mat.materialType}
                                </span>
                              </div>
                              {mat.description && (
                                <p className="text-muted small mb-1 mt-1">{mat.description}</p>
                              )}
                              <div className="text-muted d-flex gap-3 flex-wrap" style={{ fontSize: '0.75rem' }}>
                                <span>{mimeIcon(mat.mimeType)} {mat.fileName}</span>
                                <span>📦 {formatFileSize(mat.fileSize)}</span>
                                <span>👤 {mat.uploadedByName}</span>
                                <span>📅 {new Date(mat.createdAt).toLocaleDateString('en-ZA')}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleDownload(mat.id, mat.fileName)}
                                title="Download"
                              >
                                ⬇️
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(mat.id, mat.title)}
                                disabled={deleting === mat.id}
                                title="Delete"
                              >
                                {deleting === mat.id
                                  ? <span className="spinner-border spinner-border-sm" />
                                  : '🗑️'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningMaterialsSection;
