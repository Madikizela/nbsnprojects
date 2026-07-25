import React, { useState } from 'react';
import type { ClientRegistrationData } from '../services/clientService';
import { registerClient } from '../services/clientService';

interface ClientFormData {
  clientName: string;
  vatNumber: string;
  businessDescription: string;
  businessSector: string;
  contractNumber: string;
  clientAddress: string;
  emailAddress: string;
  phoneNumber: string;
  contactPerson: string;
  websiteLink: string;
  attendanceType: string;
  logo?: File;
}

interface ClientFormErrors {
  clientName?: string;
  vatNumber?: string;
  businessDescription?: string;
  businessSector?: string;
  contractNumber?: string;
  clientAddress?: string;
  emailAddress?: string;
  phoneNumber?: string;
  contactPerson?: string;
  websiteLink?: string;
  attendanceType?: string;
  logo?: string;
}

interface ClientFormProps {
  onCancel: () => void;
  onSubmit?: (data: ClientFormData) => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    clientName: '',
    vatNumber: '',
    businessDescription: '',
    businessSector: '',
    contractNumber: '',
    clientAddress: '',
    emailAddress: '',
    phoneNumber: '',
    contactPerson: '',
    websiteLink: '',
    attendanceType: '',
  });

  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const validateField = (name: keyof ClientFormData, value: string | File | undefined): string => {
    switch (name) {
      case 'clientName':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          return 'Client name must be at least 2 characters long';
        }
        if (typeof value === 'string' && value.trim().length > 100) {
          return 'Client name cannot exceed 100 characters';
        }
        break;

      case 'emailAddress': {
        if (!value || typeof value !== 'string') {
          return 'Email address is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      }

      case 'vatNumber':
        if (value && typeof value === 'string' && value.trim()) {
          const vatRegex = /^[A-Z0-9]{8,15}$/;
          if (!vatRegex.test(value.replace(/\s/g, ''))) {
            return 'VAT number should be 8-15 alphanumeric characters';
          }
        }
        break;

      case 'websiteLink':
        if (value && typeof value === 'string' && value.trim()) {
          try {
            new URL(value);
          } catch {
            return 'Please enter a valid website URL';
          }
        }
        break;

      case 'businessDescription':
        if (value && typeof value === 'string' && value.trim().length > 500) {
          return 'Business description cannot exceed 500 characters';
        }
        break;

      case 'clientAddress':
        if (value && typeof value === 'string' && value.trim().length > 200) {
          return 'Address cannot exceed 200 characters';
        }
        break;

      case 'logo':
        if (value && value instanceof File) {
          if (value.size > 10 * 1024 * 1024) { // 10MB
            return 'Logo file size cannot exceed 10MB';
          }
          if (!value.type.startsWith('image/')) {
            return 'Logo must be an image file';
          }
        }
        break;

      case 'phoneNumber':
        if (value && typeof value === 'string' && value.trim()) {
          const phoneRegex = /^[+]?[1-9]\d{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-()]/g, ''))) {
            return 'Please enter a valid phone number';
          }
        }
        break;

      case 'contactPerson':
        if (value && typeof value === 'string' && value.trim().length > 100) {
          return 'Contact person name cannot exceed 100 characters';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (name: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Validate field on change
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      const error = validateField('logo', file);
      if (error) {
        setErrors(prev => ({ ...prev, logo: error }));
        return;
      }

      setFormData(prev => ({ ...prev, logo: file }));
      setErrors(prev => ({ ...prev, logo: undefined }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, logo: undefined }));
      setLogoPreview(null);
    }
  };

  const validateForm = (): boolean => {
    console.log('Validating form with data:', formData);
    console.log('Client name value:', `"${formData.clientName}"`);
    console.log('Email address value:', `"${formData.emailAddress}"`);
    
    // Simple validation - just check if required fields have values
    const hasClientName = formData.clientName && formData.clientName.trim().length > 0;
    const hasEmail = formData.emailAddress && formData.emailAddress.trim().length > 0;
    
    console.log('Has client name:', hasClientName);
    console.log('Has email:', hasEmail);
    
    if (!hasClientName) {
      console.log('Missing client name');
      setSubmitMessage({
        type: 'error',
        text: 'Please fill in Client Name'
      });
      return false;
    }
    
    if (!hasEmail) {
      console.log('Missing email address');
      setSubmitMessage({
        type: 'error',
        text: 'Please fill in Email Address'
      });
      return false;
    }
    
    console.log('Validation passed');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed', errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      // Prepare data for API call
      const clientData: ClientRegistrationData = {
        name: formData.clientName,
        email: formData.emailAddress,
        address: formData.clientAddress || '',
        description: formData.businessDescription || '',
        phoneNumber: formData.phoneNumber || '',
        contactPerson: formData.contactPerson || '',
        websiteLink: formData.websiteLink || '',
        attendanceType: formData.attendanceType || '',
        logoUrl: logoPreview || undefined,
      };

      console.log('Sending client data:', clientData);
      const response = await registerClient(clientData);
      console.log('Registration response:', response);

      let successText = `Client registered successfully!`;
      if (response.emailSent) {
        successText += ` Login credentials have been sent to ${clientData.email}.`;
      } else if (response.adminUsername && response.temporaryPassword) {
        successText += ` ⚠️ Email could not be sent. Save these credentials now:\n\nUsername: ${response.adminUsername}\nPassword: ${response.temporaryPassword}`;
      } else {
        successText += ` Note: Welcome email could not be sent — check SMTP settings.`;
      }

      setSubmitMessage({
        type: 'success',
        text: successText
      });

      // Call the optional onSubmit prop if provided
      if (onSubmit) {
        onSubmit(formData);
      }

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          clientName: '',
          vatNumber: '',
          businessDescription: '',
          businessSector: '',
          contractNumber: '',
          clientAddress: '',
          emailAddress: '',
          phoneNumber: '',
          contactPerson: '',
          websiteLink: '',
          attendanceType: '',
        });
        setLogoPreview(null);
        setSubmitMessage(null);
      }, 3000);

    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register client. Please try again.';
      setSubmitMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClassName = (fieldName: keyof ClientFormErrors, hasValue?: boolean) => {
    const baseClass = "form-control form-control-lg";
    
    if (errors[fieldName]) {
      return `${baseClass} is-invalid`;
    }
    
    if (hasValue && !errors[fieldName]) {
      return `${baseClass} is-valid`;
    }
    
    return baseClass;
  };

  return (
    <div className="card shadow-sm border-0" style={{ borderRadius:16, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', padding:'20px 24px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:42, height:42, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>
          🏢
        </div>
        <div>
          <h4 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:'1.1rem' }}>Client Information</h4>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:13 }}>Enter comprehensive client details and information</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ padding:28, background:'#fff' }} noValidate>
        <style>{`
          .cf-label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:6px; }
          .cf-input { width:100%; padding:11px 14px; border:1.5px solid #e2e8f0; border-radius:10px; font-size:14px; background:#f8fafc; color:#1e293b; transition:all 0.2s; outline:none; box-sizing:border-box; }
          .cf-input:focus { border-color:#667eea; background:#fff; box-shadow:0 0 0 3px rgba(102,126,234,0.12); }
          .cf-input.is-invalid { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,0.1); }
          .cf-input.is-valid { border-color:#10b981; }
          .cf-error { color:#ef4444; font-size:12px; margin-top:4px; }
          .cf-section { border-bottom:1px solid #f1f5f9; padding-bottom:20px; margin-bottom:20px; }
          .cf-section-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; margin-bottom:16px; }
        `}</style>
        <div className="row g-3">
          {/* Client Name */}
          <div className="col-md-6">
            <label className="cf-label">
              Client Name *
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className={`cf-input${errors.clientName ? " is-invalid" : (formData.clientName ? " is-valid" : "")}`}
                placeholder="Enter Client name"
                required
                aria-describedby={errors.clientName ? "clientName-error" : undefined}
              />
              {formData.clientName && !errors.clientName && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.clientName && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.clientName && (
              <div id="clientName-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.clientName}
              </div>
            )}
          </div>

          {/* VAT Registration No */}
          <div className="col-md-6">
            <label className="cf-label">
              VAT Registration No.
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                className={`cf-input${errors.vatNumber ? " is-invalid" : (formData.vatNumber ? " is-valid" : "")}`}
                placeholder="Enter VAT number"
                aria-describedby={errors.vatNumber ? "vatNumber-error" : undefined}
              />
              {formData.vatNumber && !errors.vatNumber && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.vatNumber && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.vatNumber && (
              <div id="vatNumber-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.vatNumber}
              </div>
            )}
          </div>

          {/* Business Description */}
          <div className="col-md-12">
            <label className="cf-label">
              Business Description
              <span className="ms-2 text-muted small">({formData.businessDescription.length}/500)</span>
            </label>
            <textarea
              name="businessDescription"
              rows={4}
              className={`cf-input${errors.businessDescription ? " is-invalid" : (formData.businessDescription ? " is-valid" : "")}`}
              placeholder="Enter Business Description"
              value={formData.businessDescription}
              onChange={(e) => handleInputChange('businessDescription', e.target.value)}
              maxLength={500}
              aria-describedby={errors.businessDescription ? "businessDescription-error" : undefined}
            />
            {errors.businessDescription && (
              <div id="businessDescription-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.businessDescription}
              </div>
            )}
          </div>

          {/* Business Sector */}
          <div className="col-md-6">
            <label className="cf-label">
              Business Sector
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="businessSector"
                value={formData.businessSector}
                onChange={(e) => handleInputChange('businessSector', e.target.value)}
                className={`cf-input${errors.businessSector ? " is-invalid" : (formData.businessSector ? " is-valid" : "")}`}
                placeholder="Enter Business Sector"
                aria-describedby={errors.businessSector ? "businessSector-error" : undefined}
              />
              {formData.businessSector && !errors.businessSector && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.businessSector && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.businessSector && (
              <div id="businessSector-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.businessSector}
              </div>
            )}
          </div>

          {/* Contract Number */}
          <div className="col-md-6">
            <label className="cf-label">
              Contract Number
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                className={`cf-input${errors.contractNumber ? " is-invalid" : (formData.contractNumber ? " is-valid" : "")}`}
                placeholder="Enter Contract No."
                aria-describedby={errors.contractNumber ? "contractNumber-error" : undefined}
              />
              {formData.contractNumber && !errors.contractNumber && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.contractNumber && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.contractNumber && (
              <div id="contractNumber-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.contractNumber}
              </div>
            )}
          </div>

          {/* Client Address */}
          <div className="col-md-12">
            <label className="cf-label">
              Client Address
            </label>
            <textarea
              name="clientAddress"
              rows={3}
              className={`cf-input${errors.clientAddress ? " is-invalid" : (formData.clientAddress ? " is-valid" : "")}`}
              placeholder="Enter Client Address"
              value={formData.clientAddress}
              onChange={(e) => handleInputChange('clientAddress', e.target.value)}
              aria-describedby={errors.clientAddress ? "clientAddress-error" : undefined}
            />
            {errors.clientAddress && (
              <div id="clientAddress-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.clientAddress}
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className="col-md-6">
            <label className="cf-label">
              Email Address *
            </label>
            <div className="position-relative">
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                className={`cf-input${errors.emailAddress ? " is-invalid" : (formData.emailAddress ? " is-valid" : "")}`}
                placeholder="Enter Email Address"
                required
                aria-describedby={errors.emailAddress ? "emailAddress-error" : undefined}
              />
              {formData.emailAddress && !errors.emailAddress && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.emailAddress && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.emailAddress && (
              <div id="emailAddress-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.emailAddress}
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div className="col-md-6">
            <label className="cf-label">
              Phone Number
            </label>
            <div className="position-relative">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={`cf-input${errors.phoneNumber ? " is-invalid" : (formData.phoneNumber ? " is-valid" : "")}`}
                placeholder="Enter Phone Number"
                aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
              />
              {formData.phoneNumber && !errors.phoneNumber && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.phoneNumber && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.phoneNumber && (
              <div id="phoneNumber-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.phoneNumber}
              </div>
            )}
          </div>

          {/* Contact Person */}
          <div className="col-md-6">
            <label className="cf-label">
              Contact Person
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                className={`cf-input${errors.contactPerson ? " is-invalid" : (formData.contactPerson ? " is-valid" : "")}`}
                placeholder="Enter Contact Person Name"
                aria-describedby={errors.contactPerson ? "contactPerson-error" : undefined}
              />
              {formData.contactPerson && !errors.contactPerson && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.contactPerson && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.contactPerson && (
              <div id="contactPerson-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.contactPerson}
              </div>
            )}
          </div>

          {/* Client Website Link */}
          <div className="col-md-6">
            <label className="cf-label">
              Client Website Link
            </label>
            <div className="position-relative">
              <input
                type="url"
                name="websiteLink"
                value={formData.websiteLink}
                onChange={(e) => handleInputChange('websiteLink', e.target.value)}
                className={`cf-input${errors.websiteLink ? " is-invalid" : (formData.websiteLink ? " is-valid" : "")}`}
                placeholder="Enter Website Link"
                aria-describedby={errors.websiteLink ? "websiteLink-error" : undefined}
              />
              {formData.websiteLink && !errors.websiteLink && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.websiteLink && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.websiteLink && (
              <div id="websiteLink-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.websiteLink}
              </div>
            )}
          </div>

          {/* Client Logo */}
          <div className="col-md-6">
            <label className="cf-label">
              Client Logo
            </label>
            <div className="border border-dashed rounded p-3 text-center">
              {logoPreview ? (
                <div className="mb-2">
                  <img src={logoPreview} alt="Logo preview" className="img-fluid mx-auto d-block" style={{maxHeight: '80px'}} />
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => handleFileChange(null)}
                      className="btn btn-outline-danger btn-sm me-2"
                    >
                      Remove
                    </button>
                    <label htmlFor="logo-upload" className="btn btn-outline-primary btn-sm cursor-pointer">
                      Change
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-muted mb-2">
                    <svg className="mx-auto" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                    </svg>
                  </div>
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="text-primary mb-1 small">No file chosen</div>
                    <div className="small text-muted">Click to upload</div>
                  </label>
                </div>
              )}
              <input 
                id="logo-upload" 
                name="logo-upload" 
                type="file" 
                className="d-none" 
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </div>
            {errors.logo && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.logo}
              </div>
            )}
          </div>

          {/* Attendance Type */}
          <div className="col-md-6">
            <label className="cf-label">
              Attendance Type
            </label>
            <div className="position-relative">
              <select
                name="attendanceType"
                className={`cf-input${errors.attendanceType ? " is-invalid" : (formData.attendanceType ? " is-valid" : "")}`}
                value={formData.attendanceType}
                onChange={(e) => handleInputChange('attendanceType', e.target.value)}
                aria-describedby={errors.attendanceType ? "attendanceType-error" : undefined}
              >
                <option value="">Select attendance type</option>
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {formData.attendanceType && !errors.attendanceType && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.attendanceType && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.attendanceType && (
              <div id="attendanceType-error" className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.attendanceType}
              </div>
            )}
          </div>
        </div>

        {/* Submit Message */}
        {submitMessage && (
          <div className={`alert ${submitMessage.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center mt-4`} role="alert">
            <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              {submitMessage.type === 'success' ? (
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              ) : (
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              )}
            </svg>
            <div>{submitMessage.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:28, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
          <button type="button" onClick={onCancel} disabled={isSubmitting}
            style={{ padding:'10px 24px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', color:'#374151', fontWeight:600, fontSize:14, cursor:'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            style={{ padding:'10px 28px', borderRadius:10, border:'none', background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', fontWeight:700, fontSize:14, cursor: isSubmitting ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:8 }}>
            {isSubmitting ? (
              <><span className="spinner-border spinner-border-sm" role="status"></span> Adding Client...</>
            ) : (
              <>+ Add Client</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
