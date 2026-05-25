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

      case 'emailAddress':
        if (!value || typeof value !== 'string') {
          return 'Email address is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;

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
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
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
      };

      console.log('Sending client data:', clientData);
      const response = await registerClient(clientData);
      console.log('Registration response:', response);
      
      setSubmitMessage({
        type: 'success',
        text: `Client registered successfully! Admin credentials have been sent to ${clientData.email}`
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

    } catch (error: any) {
      console.error('Error submitting form:', error);
      setSubmitMessage({
        type: 'error',
        text: error.message || 'Failed to register client. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClassName = (fieldName: keyof ClientFormErrors, hasValue?: boolean) => {
    let baseClass = "form-control form-control-lg";
    
    if (errors[fieldName]) {
      return `${baseClass} is-invalid`;
    }
    
    if (hasValue && !errors[fieldName]) {
      return `${baseClass} is-valid`;
    }
    
    return baseClass;
  };

  return (
    <div className="card shadow-lg border-0">
      <div className="card-header bg-primary text-white">
        <div className="d-flex align-items-center">
          <div className="me-3 p-2 bg-white bg-opacity-10 rounded">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 className="card-title mb-0">Client Information</h3>
            <p className="card-text text-white text-opacity-75 mb-0">Enter comprehensive client details and information</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="card-body" noValidate>
        <div className="row g-3">
          {/* Client Name */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Client Name *
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className={getFieldClassName('clientName', !!formData.clientName)}
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
            <label className="form-label fw-semibold">
              VAT Registration No.
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                className={getFieldClassName('vatNumber', !!formData.vatNumber)}
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
            <label className="form-label fw-semibold">
              Business Description
              <span className="ms-2 text-muted small">({formData.businessDescription.length}/500)</span>
            </label>
            <textarea
              name="businessDescription"
              rows={4}
              className={getFieldClassName('businessDescription', !!formData.businessDescription)}
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
            <label className="form-label fw-semibold">
              Business Sector
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="businessSector"
                value={formData.businessSector}
                onChange={(e) => handleInputChange('businessSector', e.target.value)}
                className={getFieldClassName('businessSector', !!formData.businessSector)}
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
            <label className="form-label fw-semibold">
              Contract Number
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                className={getFieldClassName('contractNumber', !!formData.contractNumber)}
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
            <label className="form-label fw-semibold">
              Client Address
            </label>
            <textarea
              name="clientAddress"
              rows={3}
              className={getFieldClassName('clientAddress', !!formData.clientAddress)}
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
            <label className="form-label fw-semibold">
              Email Address *
            </label>
            <div className="position-relative">
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                className={getFieldClassName('emailAddress', !!formData.emailAddress)}
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
            <label className="form-label fw-semibold">
              Phone Number
            </label>
            <div className="position-relative">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={getFieldClassName('phoneNumber', !!formData.phoneNumber)}
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
            <label className="form-label fw-semibold">
              Contact Person
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                className={getFieldClassName('contactPerson', !!formData.contactPerson)}
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
            <label className="form-label fw-semibold">
              Client Website Link
            </label>
            <div className="position-relative">
              <input
                type="url"
                name="websiteLink"
                value={formData.websiteLink}
                onChange={(e) => handleInputChange('websiteLink', e.target.value)}
                className={getFieldClassName('websiteLink', !!formData.websiteLink)}
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
            <label className="form-label fw-semibold">
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
            <label className="form-label fw-semibold">
              Attendance Type
            </label>
            <div className="position-relative">
              <select
                name="attendanceType"
                className={getFieldClassName('attendanceType', !!formData.attendanceType)}
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
        <div className="d-flex justify-content-end gap-3 mt-4 pt-4 border-top">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline-secondary px-4 py-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={(e) => {
              console.log('Button clicked!', e);
              console.log('Form data at click:', formData);
              console.log('Is submitting:', isSubmitting);
            }}
            className={`btn px-4 py-2 d-flex align-items-center ${
              isSubmitting
                ? 'btn-secondary'
                : 'btn-primary'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
                Adding Client...
              </>
            ) : (
              <>
                <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Add Client
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;