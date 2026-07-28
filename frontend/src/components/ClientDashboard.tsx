import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { southAfricaData, type District, type Municipality } from '../data/southAfricaData';
import { getClientSDPs, getClientProjects, type SkillsDevelopmentProvider, type Project } from '../services/projectService';
import productIcon from '../assets/mobile_icon.png';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  clientId: number | null;
  clientName: string | null;
  skillsDevelopmentProviderId: number | null;
  skillsDevelopmentProviderName: string | null;
  departmentId: number | null;
  departmentName: string | null;
}

type Toast = { id:number; type:'success'|'error'|'info'; text:string };

const ClientDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data for overview lists
  const [sdps, setSdps] = useState<SkillsDevelopmentProvider[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // SDP credential resend state
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendMsg, setResendMsg] = useState<{ id: number; text: string; ok: boolean } | null>(null);

  // Inline toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = (type:Toast['type'], text:string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  };
  const dismissToast = (id:number) => setToasts(t => t.filter(x => x.id !== id));

  const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');

  const resendSdpCredentials = async (sdpId: number) => {
    setResendingId(sdpId);
    setResendMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/SkillsDevelopmentProviders/${sdpId}/resend-credentials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      let text = data.message || (res.ok ? 'Credentials sent!' : 'Failed to send');
      if (!data.emailSent && data.adminUsername) {
        text += `\nUsername: ${data.adminUsername}\nPassword: ${data.temporaryPassword}`;
      }
      setResendMsg({ id: sdpId, text, ok: res.ok });
    } catch {
      setResendMsg({ id: sdpId, text: 'Network error — please try again', ok: false });
    } finally {
      setResendingId(null);
    }
  };
  
  // SDP Form State
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<Municipality[]>([]);
  
  // SDP Form Data State
  const [sdpFormData, setSdpFormData] = useState({
    sdpName: '',
    registrationNumber: '',
    businessDescription: '',
    accreditationNumber: '',
    beneficiaries: '',
    physicalAddress: '',
    emailAddress: '',
    phoneNumber: '',
    contactPerson: '',
    website: '',
    logo: null as File | null
  });
  
  // Form Validation State
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const fetchClientData = async () => {
    if (!user?.clientId) return;
    setDataLoading(true);
    setDataError('');
    try {
      const [sdpsData, projectsData] = await Promise.all([
        getClientSDPs(user.clientId),
        getClientProjects(user.clientId)
      ]);
      setSdps(Array.isArray(sdpsData) ? sdpsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error: unknown) {
      setDataError(error instanceof Error ? error.message : 'Could not load your SDPs and projects. Please check your connection and retry.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.clientId]);

  // Cascading dropdown handlers
  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvince(provinceId);
    setSelectedDistrict('');
    setSelectedMunicipality('');
    setAvailableMunicipalities([]);
    
    const province = southAfricaData.find(p => p.id.toString() === provinceId);
    if (province) {
      setAvailableDistricts(province.districts);
    } else {
      setAvailableDistricts([]);
    }
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedMunicipality('');
    
    const district = availableDistricts.find(d => d.id.toString() === districtId);
    if (district) {
      setAvailableMunicipalities(district.municipalities);
    } else {
      setAvailableMunicipalities([]);
    }
  };

  const handleMunicipalityChange = (municipalityId: string) => {
    setSelectedMunicipality(municipalityId);
  };

  // Form validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Required field validations
    if (!sdpFormData.sdpName.trim()) {
      errors.sdpName = 'SDP Name is required';
    }

    if (!sdpFormData.registrationNumber.trim()) {
      errors.registrationNumber = 'Registration Number is required';
    }

    if (!sdpFormData.businessDescription.trim()) {
      errors.businessDescription = 'Business Description is required';
    }

    if (!sdpFormData.accreditationNumber.trim()) {
      errors.accreditationNumber = 'Accreditation Number is required';
    }

    if (!sdpFormData.emailAddress.trim()) {
      errors.emailAddress = 'Email Address is required';
    } else if (!validateEmail(sdpFormData.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
    }

    if (!selectedProvince) {
      errors.province = 'Province is required';
    }

    if (!selectedDistrict) {
      errors.district = 'District is required';
    }

    if (!selectedMunicipality) {
      errors.municipality = 'Municipality is required';
    }

    // Optional field validations
    if (sdpFormData.phoneNumber && !validatePhoneNumber(sdpFormData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid South African phone number';
    }

    if (sdpFormData.website && !validateURL(sdpFormData.website)) {
      errors.website = 'Please enter a valid URL';
    }

    if (sdpFormData.beneficiaries && parseInt(sdpFormData.beneficiaries) < 0) {
      errors.beneficiaries = 'Number of beneficiaries must be a positive number';
    }

    // Logo file validation
    if (sdpFormData.logo) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
      
      if (sdpFormData.logo.size > maxSize) {
        errors.logo = 'Logo file size must be less than 2MB';
      }
      
      if (!allowedTypes.includes(sdpFormData.logo.type)) {
        errors.logo = 'Logo must be a JPG, PNG, or SVG file';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string | File | null) => {
    setSdpFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle form submission
  const handleSdpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    if (!user?.clientId || user.clientId <= 0) {
      pushToast('error', 'Your account is not linked to a client. Please log in with a client account or register a client before adding an SDP.');
      return;
    }
    setIsSubmitting(true);

    try {
      // Get province, district, and municipality names
      const province = southAfricaData.find(p => p.id.toString() === selectedProvince);
      const district = availableDistricts.find(d => d.id.toString() === selectedDistrict);
      const municipality = availableMunicipalities.find(m => m.id.toString() === selectedMunicipality);

      const registrationData = {
        sdpName: sdpFormData.sdpName.trim(),
        registrationNumber: sdpFormData.registrationNumber,
        businessDescription: sdpFormData.businessDescription,
        accreditationNumber: sdpFormData.accreditationNumber,
        beneficiaries: sdpFormData.beneficiaries ? parseInt(sdpFormData.beneficiaries) : null,
        province: province?.name || '',
        district: district?.name || '',
        municipality: municipality?.name || '',
        physicalAddress: sdpFormData.physicalAddress,
        emailAddress: sdpFormData.emailAddress.trim(),
        phoneNumber: sdpFormData.phoneNumber,
        contactPerson: sdpFormData.contactPerson,
        website: sdpFormData.website,
        clientId: user.clientId
      };

      const token = localStorage.getItem('token');
      const response = await fetch('/api/SkillsDevelopmentProviders/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(registrationData)
      });
  
      const contentType = response.headers.get('content-type') || '';
      let result: unknown;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received for SDP registration:', text);
        pushToast('error', 'Server returned a non-JSON response while registering the SDP. Please check server logs. Preview: ' + text.substring(0, 150));
        return;
      }

      if (response.ok && (result as {success?:boolean}).success) {
        setSdpFormData({
          sdpName: '',
          registrationNumber: '',
          businessDescription: '',
          accreditationNumber: '',
          beneficiaries: '',
          physicalAddress: '',
          emailAddress: '',
          phoneNumber: '',
          contactPerson: '',
          website: '',
          logo: null
        });
        setSelectedProvince('');
        setSelectedDistrict('');
        setSelectedMunicipality('');
        setAvailableDistricts([]);
        setAvailableMunicipalities([]);
        setFormErrors({});
        
        pushToast('success', `SDP registered successfully! ${(result as {message?:string}).message || ''}`);
        setActiveSection('overview');
        fetchClientData();
      } else {
        const errorMessage = (result as {message?:string}).message || 'Failed to register SDP';
        pushToast('error', `Error: ${errorMessage}`);
      }
    } catch {
      pushToast('error', 'An error occurred while registering the SDP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'add-sdp', label: 'Add SDP', icon: '🎓' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const renderOverview = () => (
    <div>
      {/* Welcome header */}
      <div className="cd-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'24px 28px' }}>
        <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>Welcome to {user?.clientName} Dashboard 🏢</h2>
        <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>Manage your organisation's skills development and projects</p>
      </div>

      {/* Data fetch error banner */}
      {dataError && (
        <div className="alert alert-danger d-flex justify-content-between align-items-start gap-3 mb-4" style={{borderRadius:14,border:'1.5px solid #dc2626',backgroundColor:'#fef2f2',color:'#991b1b'}}>
          <div>
            <div style={{fontWeight:700,marginBottom:4}}>❌ Failed to load SDPs and projects</div>
            <div style={{fontSize:14}}>{dataError}</div>
          </div>
          <button onClick={fetchClientData} className="btn btn-sm" style={{backgroundColor:'#dc2626',color:'#fff',fontWeight:600,whiteSpace:'nowrap'}}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="cd-card p-4" style={{ background:'linear-gradient(135deg,#667eea,#764ba2)' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>🏫</div>
            <div style={{ color:'#fff', fontSize:'1.8rem', fontWeight:800 }}>{sdps.length}</div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13 }}>Skills Development Providers</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="cd-card p-4" style={{ background:'linear-gradient(135deg,#10b981,#059669)' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>📋</div>
            <div style={{ color:'#fff', fontSize:'1.8rem', fontWeight:800 }}>{projects.length}</div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13 }}>Projects</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="cd-card p-4 d-flex align-items-center justify-content-center" style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', cursor:'pointer' }} onClick={() => setActiveSection('add-sdp')}>
            <div className="text-center">
              <div style={{ fontSize:'2rem', marginBottom:8 }}>➕</div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Add New SDP</div>
            </div>
          </div>
        </div>
      </div>

      {/* SDPs and Projects */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="cd-card" style={{ overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', background:'linear-gradient(135deg,#667eea,#764ba2)' }}>
              <span style={{ fontWeight:700, color:'#fff', fontSize:15 }}>Skills Development Providers ({sdps.length})</span>
            </div>
            <div style={{ padding:'8px 0' }}>
              {dataLoading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
              ) : sdps.length > 0 ? sdps.map(sdp => (
                <div key={sdp.id} style={{ padding:'12px 20px', borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div>
                      <div style={{ fontWeight:600, color:'#1e293b', fontSize:14 }}>{sdp.name}</div>
                      {sdp.contactPerson && <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>Contact: {sdp.contactPerson}</div>}
                      <div style={{ color:'#94a3b8', fontSize:11 }}>ID: {sdp.id}</div>
                    </div>
                    <button onClick={() => resendSdpCredentials(sdp.id)} disabled={resendingId === sdp.id}
                      style={{ padding:'5px 10px', borderRadius:8, border:'1.5px solid #667eea', background:'#fff', color:'#667eea', fontWeight:600, fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                      {resendingId === sdp.id ? 'Sending...' : '📧 Resend'}
                    </button>
                  </div>
                  {resendMsg?.id === sdp.id && (
                    <div className={`alert ${resendMsg.ok ? 'alert-success' : 'alert-danger'} mt-2 mb-0 py-2 small`} style={{ whiteSpace:'pre-line' }}>{resendMsg.text}</div>
                  )}
                </div>
              )) : (
                <div className="text-center py-4 text-muted">
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>🎓</div>
                  <p style={{ fontSize:14 }}>No SDPs yet</p>
                  <button onClick={() => setActiveSection('add-sdp')} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>Add Your First SDP</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="cd-card" style={{ overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', background:'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              <span style={{ fontWeight:700, color:'#fff', fontSize:15 }}>Projects ({projects.length})</span>
            </div>
            <div style={{ padding:'8px 0' }}>
              {dataLoading ? (
                <div className="text-center py-4"><div className="spinner-border text-info" role="status"><span className="visually-hidden">Loading...</span></div></div>
              ) : projects.length > 0 ? projects.map(project => (
                <div key={project.id} style={{ padding:'12px 20px', borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:600, color:'#1e293b', fontSize:14 }}>{project.projectName}</div>
                      <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>Contract: {project.contractNumber}</div>
                      <div style={{ color:'#64748b', fontSize:12 }}>Financial Year: {project.financialYear}</div>
                      {project.skillsDevelopmentProvider && <div style={{ color:'#94a3b8', fontSize:11 }}>SDP: {project.skillsDevelopmentProvider.name}</div>}
                    </div>
                    <div style={{ color:'#94a3b8', fontSize:11 }}>ID: {project.id}</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-muted">
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>📋</div>
                  <p style={{ fontSize:14 }}>No projects yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
      
  const renderProfile = () => (
    <div>
      <div className="cd-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'24px 28px' }}>
        <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>Profile Information 👤</h2>
        <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>Your account details and organisation information</p>
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="cd-card p-4">
            <h6 style={{ fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'1px', marginBottom:16 }}>Personal Information</h6>
            {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role]].map(([label, val]) => (
              <div key={label} style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{label}</div>
                <div style={{ fontWeight:600, color:'#1e293b' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <div className="cd-card p-4">
            <h6 style={{ fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'1px', marginBottom:16 }}>Organisation Information</h6>
            {[['Organisation', user?.clientName], ['Status', user?.status]].map(([label, val]) => (
              <div key={label} style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{label}</div>
                <div style={{ fontWeight:600, color:'#1e293b' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddSDP = () => (
    <div>
      <div className="cd-card mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', margin:0 }}>Add Skills Development Provider 🎓</h2>
          <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:14 }}>Register a new SDP for your organisation</p>
        </div>
        <button onClick={() => setActiveSection('overview')} style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 18px', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          ← Back
        </button>
      </div>

      <div className="cd-card p-4">
        <form onSubmit={handleSdpSubmit}>
            <div className="row g-3">
              {/* SDP Information Section */}
              <div className="col-12">
                <h4 className="text-primary mb-3">SDP Information</h4>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="sdpName" className="form-label">SDP Name *</label>
                <input 
                  type="text" 
                  className={`form-control ${formErrors.sdpName ? 'is-invalid' : ''}`}
                  id="sdpName" 
                  placeholder="Enter SDP name" 
                  value={sdpFormData.sdpName}
                  onChange={(e) => handleInputChange('sdpName', e.target.value)}
                  required 
                />
                {formErrors.sdpName && <div className="invalid-feedback">{formErrors.sdpName}</div>}
              </div>
              
              <div className="col-md-6">
                <label htmlFor="registrationNumber" className="form-label">Registration Number *</label>
                <input 
                  type="text" 
                  className={`form-control ${formErrors.registrationNumber ? 'is-invalid' : ''}`}
                  id="registrationNumber" 
                  placeholder="Enter Registration number" 
                  value={sdpFormData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  required 
                />
                {formErrors.registrationNumber && <div className="invalid-feedback">{formErrors.registrationNumber}</div>}
              </div>
              
              <div className="col-12">
                <label htmlFor="businessDescription" className="form-label">Business Description *</label>
                <textarea 
                  className={`form-control ${formErrors.businessDescription ? 'is-invalid' : ''}`}
                  id="businessDescription" 
                  rows={3} 
                  placeholder="Enter Business Description" 
                  value={sdpFormData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  required
                ></textarea>
                {formErrors.businessDescription && <div className="invalid-feedback">{formErrors.businessDescription}</div>}
              </div>
              
              <div className="col-md-6">
                <label htmlFor="accreditationNumber" className="form-label">Accreditation Number *</label>
                <input 
                  type="text" 
                  className={`form-control ${formErrors.accreditationNumber ? 'is-invalid' : ''}`}
                  id="accreditationNumber" 
                  placeholder="Enter Accreditation Number" 
                  value={sdpFormData.accreditationNumber}
                  onChange={(e) => handleInputChange('accreditationNumber', e.target.value)}
                  required 
                />
                {formErrors.accreditationNumber && <div className="invalid-feedback">{formErrors.accreditationNumber}</div>}
              </div>
              
              <div className="col-md-6">
                <label htmlFor="beneficiaries" className="form-label">Number of Beneficiaries</label>
                <input 
                  type="number" 
                  className={`form-control ${formErrors.beneficiaries ? 'is-invalid' : ''}`}
                  id="beneficiaries" 
                  placeholder="Enter number of beneficiaries" 
                  value={sdpFormData.beneficiaries}
                  onChange={(e) => handleInputChange('beneficiaries', e.target.value)}
                />
                {formErrors.beneficiaries && <div className="invalid-feedback">{formErrors.beneficiaries}</div>}
              </div>
              
              {/* Physical Address Section */}
              <div className="col-12 mt-4">
                <h4 className="text-primary mb-3">Physical Address</h4>
              </div>
              
              <div className="col-md-4">
                <label htmlFor="province" className="form-label">Province *</label>
                <select 
                  className={`form-select ${formErrors.province ? 'is-invalid' : ''}`}
                  id="province" 
                  value={selectedProvince}
                  onChange={(e) => {
                    handleProvinceChange(e.target.value);
                    if (formErrors.province) {
                      setFormErrors(prev => ({ ...prev, province: '' }));
                    }
                  }}
                  required
                >
                  <option value="">Select Province</option>
                  {southAfricaData.map(province => (
                    <option key={province.id} value={province.id.toString()}>
                      {province.name}
                    </option>
                  ))}
                </select>
                {formErrors.province && <div className="invalid-feedback">{formErrors.province}</div>}
              </div>
              
              <div className="col-md-4">
                <label htmlFor="district" className="form-label">District *</label>
                <select 
                  className={`form-select ${formErrors.district ? 'is-invalid' : ''}`}
                  id="district"
                  value={selectedDistrict}
                  onChange={(e) => {
                    handleDistrictChange(e.target.value);
                    if (formErrors.district) {
                      setFormErrors(prev => ({ ...prev, district: '' }));
                    }
                  }}
                  disabled={!selectedProvince}
                  required
                >
                  <option value="">Select District</option>
                  {availableDistricts.map(district => (
                    <option key={district.id} value={district.id.toString()}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {formErrors.district && <div className="invalid-feedback">{formErrors.district}</div>}
              </div>
              
              <div className="col-md-4">
                <label htmlFor="municipality" className="form-label">Municipality *</label>
                <select 
                  className={`form-select ${formErrors.municipality ? 'is-invalid' : ''}`}
                  id="municipality"
                  value={selectedMunicipality}
                  onChange={(e) => {
                    handleMunicipalityChange(e.target.value);
                    if (formErrors.municipality) {
                      setFormErrors(prev => ({ ...prev, municipality: '' }));
                    }
                  }}
                  disabled={!selectedDistrict}
                  required
                >
                  <option value="">Select Municipality</option>
                  {availableMunicipalities.map(municipality => (
                    <option key={municipality.id} value={municipality.id.toString()}>
                      {municipality.name}
                    </option>
                  ))}
                </select>
                {formErrors.municipality && <div className="invalid-feedback">{formErrors.municipality}</div>}
              </div>
              
              <div className="col-12">
                <label htmlFor="physicalAddress" className="form-label">Street Address</label>
                <textarea 
                  className="form-control" 
                  id="physicalAddress" 
                  rows={2} 
                  placeholder="Enter street address, building name, etc."
                  value={sdpFormData.physicalAddress}
                  onChange={(e) => handleInputChange('physicalAddress', e.target.value)}
                ></textarea>
              </div>
              
              {/* Contact Information Section */}
              <div className="col-12 mt-4">
                <h4 className="text-primary mb-3">Contact Information</h4>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="emailAddress" className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className={`form-control ${formErrors.emailAddress ? 'is-invalid' : ''}`}
                  id="emailAddress" 
                  placeholder="Enter Email Address" 
                  value={sdpFormData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  required 
                />
                {formErrors.emailAddress && <div className="invalid-feedback">{formErrors.emailAddress}</div>}
              </div>
              
              <div className="col-md-6">
                <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className={`form-control ${formErrors.phoneNumber ? 'is-invalid' : ''}`}
                  id="phoneNumber" 
                  placeholder="Enter Phone Number (e.g., +27123456789)" 
                  value={sdpFormData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
                {formErrors.phoneNumber && <div className="invalid-feedback">{formErrors.phoneNumber}</div>}
              </div>
              
              <div className="col-md-6">
                <label htmlFor="contactPerson" className="form-label">Contact Person</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="contactPerson" 
                  placeholder="Enter Contact Person Name" 
                  value={sdpFormData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                />
              </div>
              
              <div className="col-md-6">
                <label htmlFor="website" className="form-label">Website</label>
                <input 
                  type="url" 
                  className={`form-control ${formErrors.website ? 'is-invalid' : ''}`}
                  id="website" 
                  placeholder="Enter Website URL (e.g., https://example.com)" 
                  value={sdpFormData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
                {formErrors.website && <div className="invalid-feedback">{formErrors.website}</div>}
              </div>
              
              {/* Logo Upload Section */}
              <div className="col-12 mt-4">
                <h4 className="text-primary mb-3">Logo</h4>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="logo" className="form-label">Upload Logo</label>
                <input 
                  type="file" 
                  className={`form-control ${formErrors.logo ? 'is-invalid' : ''}`}
                  id="logo" 
                  accept="image/jpeg,image/png,image/svg+xml" 
                  onChange={(e) => handleInputChange('logo', e.target.files?.[0] || null)}
                />
                <div className="form-text">Supported formats: JPG, PNG, SVG. Max size: 2MB</div>
                {formErrors.logo && <div className="invalid-feedback">{formErrors.logo}</div>}
              </div>
              
              <div className="col-12 mt-4">
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="me-2">💾</span>
                        Save SDP
                      </>
                    )}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveSection('overview')} disabled={isSubmitting}>
                    <span className="me-2">❌</span>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'add-sdp':
        return renderAddSDP();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Segoe UI', system-ui, sans-serif", position:'relative' }}>
      <style>{`
        .cd-nav-btn { color:rgba(255,255,255,0.65); background:transparent; border:none; border-radius:10px; padding:11px 16px; display:flex; align-items:center; gap:10px; font-size:0.92rem; font-weight:500; transition:all 0.18s; width:100%; text-align:left; cursor:pointer; }
        .cd-nav-btn:hover { background:rgba(255,255,255,0.08); color:#fff; }
        .cd-nav-btn.active { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:700; box-shadow:0 4px 14px rgba(102,126,234,0.35); }
        .cd-card { background:#fff; border-radius:14px; border:none; box-shadow:0 2px 8px rgba(0,0,0,0.07); }
        @media (max-width:768px) { .cd-sidebar { display:none !important; } .cd-main { width:100% !important; } }
      `}</style>

      {/* Inline Toast Stack */}
      <div style={{position:'fixed',top:'16px',right:'16px',zIndex:9999,display:'flex',flexDirection:'column',gap:'8px',maxWidth:'400px'}}>
        {toasts.map(t => (
          <div key={t.id} onClick={()=>dismissToast(t.id)}
            style={{
              cursor:'pointer',
              padding:'10px 14px',
              borderRadius:'10px',
              border:`1px solid ${t.type==='error'?'#dc2626':t.type==='success'?'#16a34a':'#2563eb'}`,
              backgroundColor:t.type==='error'?'#fef2f2':t.type==='success'?'#f0fdf4':'#eff6ff',
              color:t.type==='error'?'#991b1b':t.type==='success'?'#166534':'#1e40af',
              fontSize:14,
              fontWeight:500,
              boxShadow:'0 4px 14px rgba(0,0,0,0.12)',
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center',
              gap:'12px'
            }}>
            <span>{t.type==='error'?'⚠️ ':t.type==='success'?'✅ ':'ℹ️ '}{t.text}</span>
            <span style={{opacity:0.5,fontSize:12}}>✕</span>
          </div>
        ))}
      </div>

      {/* Navbar */}
      <nav style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src={productIcon} alt="NBSN" style={{ width:32, height:32, borderRadius:8, objectFit:'contain' }} />
          <span style={{ color:'#fff', fontWeight:800, fontSize:'0.95rem' }}>NBSN</span>
          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>— {user.clientName}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.88rem' }}>{user.name}</span>
          </div>
          <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 56px)' }}>
        {/* Sidebar */}
        <div className="cd-sidebar" style={{ width:200, background:'#1e293b', display:'flex', flexDirection:'column', padding:'20px 12px', flexShrink:0 }}>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.68rem', letterSpacing:'1.5px', fontWeight:700, textTransform:'uppercase', margin:'0 0 12px 4px' }}>Navigation</p>
          {menuItems.map(item => (
            <button key={item.id} className={`cd-nav-btn${activeSection === item.id ? ' active' : ''}`} onClick={() => setActiveSection(item.id)}>
              <span style={{ fontSize:'1.1rem' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="cd-main" style={{ flex:1, overflowY:'auto', padding:28, height:'calc(100vh - 56px)' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;