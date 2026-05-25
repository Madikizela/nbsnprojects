import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { southAfricaData, type District, type Municipality } from '../data/southAfricaData';
import { getClientSDPs, getClientProjects, type SkillsDevelopmentProvider, type Project } from '../services/projectService';
import nbsnLogo from '../assets/nbsn-logo.png';

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

const ClientDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data for overview lists
  const [sdps, setSdps] = useState<SkillsDevelopmentProvider[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
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
      // Patch: If clientId is missing or invalid, try to recover from token or force reload
      if (!parsedUser.clientId || parsedUser.clientId <= 0) {
        // Try to recover clientId from previous session or show a warning
        const backupUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (backupUser && backupUser.clientId && backupUser.clientId > 0) {
          parsedUser.clientId = backupUser.clientId;
        }
      }
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  // Fetch SDPs and projects when user data is available
  useEffect(() => {
    const fetchData = async () => {
      if (user?.clientId) {
        setDataLoading(true);
        try {
          const [sdpsData, projectsData] = await Promise.all([
            getClientSDPs(user.clientId),
            getClientProjects(user.clientId)
          ]);
          setSdps(sdpsData);
          setProjects(projectsData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setDataLoading(false);
        }
      }
    };

    fetchData();
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
    // Guard: ensure user has a valid clientId
    // Patch: Try to recover clientId if missing
    let effectiveClientId = user?.clientId;
    if (!effectiveClientId || effectiveClientId <= 0) {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && parsedUser.clientId && parsedUser.clientId > 0) {
          effectiveClientId = parsedUser.clientId;
        }
      }
    }
    if (!effectiveClientId || effectiveClientId <= 0) {
      alert('Your account is not linked to a client. Please log in with a client account or register a client before adding an SDP.');
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
        clientId: effectiveClientId
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
      let result: any;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received for SDP registration:', text);
        alert('Server returned a non-JSON response while registering the SDP. Please check server logs.\n\nPreview:\n' + text.substring(0, 200));
        return;
      }

      if (response.ok && result.success) {
        // Reset form
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
        
        alert(`SDP registered successfully! ${result.message}`);
        setActiveSection('overview');
      } else {
        const errorMessage = result.message || 'Failed to register SDP';
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error submitting SDP form:', error);
      alert('An error occurred while registering the SDP. Please try again.');
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
    <div className="container-fluid">
      <div className="card text-white mb-4 border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="card-body p-4">
          <h2 className="card-title h3 mb-2">Welcome to {user?.clientName} Dashboard 🏢</h2>
          <p className="card-text opacity-90">Manage your organization's skills development and projects</p>
        </div>
      </div>
      
      <div className="row g-4 mb-4">
        <div className="col-md-12">
          <div className="card border-0 shadow-lg h-100" style={{background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'}}>
            <div className="card-body text-white text-center">
              <div className="display-4 mb-3">🎓</div>
              <h5 className="card-title">Skills Development</h5>
              <p className="card-text opacity-90">Add and manage Skills Development Providers for your organization</p>
              <button 
                onClick={() => setActiveSection('add-sdp')}
                className="btn btn-light mt-3"
              >
                Add SDP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SDPs and Projects Lists */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Skills Development Providers ({sdps.length})</h5>
            </div>
            <div className="card-body">
              {dataLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : sdps.length > 0 ? (
                <div className="list-group list-group-flush">
                  {sdps.map((sdp) => (
                    <div key={sdp.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 text-success">{sdp.name}</h6>
                          {sdp.accreditationNumber && (
                            <small className="text-muted">Accreditation: {sdp.accreditationNumber}</small>
                          )}
                          {sdp.contactPerson && (
                            <div><small className="text-muted">Contact: {sdp.contactPerson}</small></div>
                          )}
                        </div>
                        <small className="text-muted">ID: {sdp.id}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <div className="display-6 mb-2">🎓</div>
                  <p>No Skills Development Providers found</p>
                  <button 
                    onClick={() => setActiveSection('add-sdp')}
                    className="btn btn-success btn-sm"
                  >
                    Add Your First SDP
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Projects ({projects.length})</h5>
            </div>
            <div className="card-body">
              {dataLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : projects.length > 0 ? (
                <div className="list-group list-group-flush">
                  {projects.map((project) => (
                    <div key={project.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 text-info">{project.projectName}</h6>
                          <small className="text-muted">Contract: {project.contractNumber}</small>
                          <div><small className="text-muted">Financial Year: {project.financialYear}</small></div>
                          {project.skillsDevelopmentProvider && (
                            <div><small className="text-muted">SDP: {project.skillsDevelopmentProvider.name}</small></div>
                          )}
                        </div>
                        <small className="text-muted">ID: {project.id}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <div className="display-6 mb-2">📋</div>
                  <p>No Projects found</p>
                  <button 
                    onClick={() => setActiveSection('add-project')}
                    className="btn btn-info btn-sm"
                  >
                    Add Your First Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="container-fluid">
      <div className="card text-white mb-4 border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="card-body p-4">
          <h2 className="card-title h3 mb-2">Profile Information 👤</h2>
          <p className="card-text opacity-90">Your account details and organization information</p>
        </div>
      </div>
      
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Personal Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Name</label>
                <p className="form-control-plaintext">{user?.name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Email</label>
                <p className="form-control-plaintext">{user?.email}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Role</label>
                <p className="form-control-plaintext">
                  <span className="badge bg-success">{user?.role}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Organization Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Organization</label>
                <p className="form-control-plaintext">{user?.clientName}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Status</label>
                <p className="form-control-plaintext">
                  <span className={`badge ${user?.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                    {user?.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddSDP = () => (
    <div className="container-fluid">
      <div className="card text-white mb-4 border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="card-body p-4">
          <h2 className="card-title h3 mb-2">Add Skills Development Provider 🎓</h2>
          <p className="card-text opacity-90">Register a new skills development provider for your organization</p>
        </div>
      </div>
      
      <div className="card border-0 shadow-lg">
        <div className="card-body">
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
    <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'}}>
      <nav className="navbar navbar-expand-lg navbar-dark shadow-lg" style={{background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)'}}>
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center fw-bold" href="#">
            <img 
              src={nbsnLogo} 
              alt="NBSN Logo" 
              width="40" 
              height="40" 
              className="me-2"
              style={{objectFit: 'contain', borderRadius: '4px'}}
            />
            NBSN - {user.clientName}
          </a>
          
          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              <span className="me-2">👤</span>
              {user.name}
            </span>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-light btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          <nav className="col-md-3 col-lg-2 sidebar" style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', minHeight: 'calc(100vh - 76px)'}}>
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                {menuItems.map((item) => (
                  <li key={item.id} className="nav-item">
                    <a
                      className={`nav-link text-white ${activeSection === item.id ? 'active bg-primary rounded' : ''}`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection(item.id);
                      }}
                      style={{
                        transition: 'all 0.3s ease',
                        margin: '2px 0',
                        padding: '12px 16px'
                      }}
                    >
                      <span className="me-2">{item.icon}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4" style={{maxHeight: 'calc(100vh - 76px)', overflowY: 'auto'}}>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;