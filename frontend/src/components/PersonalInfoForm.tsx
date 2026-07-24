import React, { useState } from 'react';

interface CompanyFormData {
  companyName: string;
  registrationNumber: string;
  email: string;
  phoneNumber: string;
  establishedDate: string;
  address: string;
  industry: string;
}

interface CompanyFormErrors {
  companyName?: string;
  registrationNumber?: string;
  email?: string;
  phoneNumber?: string;
  establishedDate?: string;
  address?: string;
  industry?: string;
}

interface PersonalInfoFormProps {
  initialData?: Partial<CompanyFormData>;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel?: () => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: initialData.companyName || '',
    registrationNumber: initialData.registrationNumber || '',
    email: initialData.email || '',
    phoneNumber: initialData.phoneNumber || '',
    establishedDate: initialData.establishedDate || '',
    address: initialData.address || '',
    industry: initialData.industry || ''
  });

  const [errors, setErrors] = useState<CompanyFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof CompanyFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: CompanyFormErrors = {};

    // Company Name validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    // Registration Number validation
    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    } else if (formData.registrationNumber.trim().length < 3) {
      newErrors.registrationNumber = 'Registration number must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone Number validation (optional but if provided, should be valid)
    if (formData.phoneNumber && !/^[\d\s()+-]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Established Date validation (optional but if provided, should not be in the future)
    if (formData.establishedDate) {
      const selectedDate = new Date(formData.establishedDate);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.establishedDate = 'Established date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing && onCancel) {
      onCancel();
    }
    setIsEditing(!isEditing);
    setErrors({});
  };

  return (
    <div className="card shadow-lg border-0">
      <div className="card-header bg-primary text-white">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="me-3 p-2 bg-white bg-opacity-10 rounded">
              <i className="bi bi-building-fill fs-4"></i>
            </div>
            <div>
              <h3 className="card-title mb-0">Company Information</h3>
              <p className="card-text text-white text-opacity-75 mb-0">Update your company details and contact information</p>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={toggleEdit}
              className={`btn ${isEditing ? 'btn-outline-light' : 'btn-light'} d-flex align-items-center`}
            >
              {isEditing ? (
                <>
                  <i className="bi bi-x-lg me-2"></i>
                  Cancel
                </>
              ) : (
                <>
                  <i className="bi bi-pencil-fill me-2"></i>
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-4">
        <form onSubmit={handleSubmit} className="row g-3">
          {/* Company Name */}
          <div className="col-md-6">
            <label htmlFor="companyName" className="form-label fw-semibold">
              <i className="bi bi-building-fill me-2 text-primary"></i>
              Company Name <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-building text-muted"></i>
              </span>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter company name"
                className={`form-control border-start-0 ${errors.companyName ? 'is-invalid' : ''} ${!isEditing ? 'bg-light' : ''}`}
                required
              />
              {errors.companyName && (
                <div className="invalid-feedback d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  {errors.companyName}
                </div>
              )}
            </div>
          </div>

          {/* Registration Number */}
          <div className="col-md-6">
            <label htmlFor="registrationNumber" className="form-label fw-semibold">
              <i className="bi bi-card-text me-2 text-primary"></i>
              Registration Number <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-card-text text-muted"></i>
              </span>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter registration number"
                className={`form-control border-start-0 ${errors.registrationNumber ? 'is-invalid' : ''} ${!isEditing ? 'bg-light' : ''}`}
                required
              />
              {errors.registrationNumber && (
                <div className="invalid-feedback d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  {errors.registrationNumber}
                </div>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div className="col-12">
            <label htmlFor="email" className="form-label fw-semibold">
              <i className="bi bi-envelope-fill me-2 text-primary"></i>
              Company Email Address <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-envelope text-muted"></i>
              </span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="company@example.com"
                className={`form-control border-start-0 ${errors.email ? 'is-invalid' : ''} ${!isEditing ? 'bg-light' : ''}`}
                required
              />
              {errors.email && (
                <div className="invalid-feedback d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  {errors.email}
                </div>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="col-md-6">
            <label htmlFor="phoneNumber" className="form-label fw-semibold">
              <i className="bi bi-telephone-fill me-2 text-primary"></i>
              Company Phone Number
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-telephone text-muted"></i>
              </span>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter company phone number"
                className={`form-control border-start-0 ${errors.phoneNumber ? 'is-invalid' : ''} ${!isEditing ? 'bg-light' : ''}`}
              />
              {errors.phoneNumber && (
                <div className="invalid-feedback d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  {errors.phoneNumber}
                </div>
              )}
            </div>
          </div>

          {/* Established Date */}
          <div className="col-md-6">
            <label htmlFor="establishedDate" className="form-label fw-semibold">
              <i className="bi bi-calendar-fill me-2 text-primary"></i>
              Established Date
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-calendar text-muted"></i>
              </span>
              <input
                type="date"
                id="establishedDate"
                name="establishedDate"
                value={formData.establishedDate}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="yyyy/mm/dd"
                className={`form-control border-start-0 ${errors.establishedDate ? 'is-invalid' : ''} ${!isEditing ? 'bg-light' : ''}`}
              />
              {errors.establishedDate && (
                <div className="invalid-feedback d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  {errors.establishedDate}
                </div>
              )}
            </div>
          </div>

          {/* Company Address */}
          <div className="col-12">
            <label htmlFor="address" className="form-label fw-semibold">
              <i className="bi bi-geo-alt-fill me-2 text-primary"></i>
              Company Address
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-geo-alt text-muted"></i>
              </span>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter company address"
                className={`form-control border-start-0 ${errors.address ? 'is-invalid' : ''} ${!isEditing ? 'bg-light' : ''}`}
              />
              {errors.address && (
                <div className="invalid-feedback d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  {errors.address}
                </div>
              )}
            </div>
          </div>

          {/* Industry */}
          <div className="col-12">
            <label htmlFor="industry" className="form-label fw-semibold">
              <i className="bi bi-briefcase-fill me-2 text-primary"></i>
              Industry
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-briefcase text-muted"></i>
              </span>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`form-select border-start-0 ${errors.industry ? 'is-invalid' : ''} ${!isEditing ? 'bg-light' : ''}`}
              >
                <option value="">Select Industry</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Construction">Construction</option>
                <option value="Transportation">Transportation</option>
                <option value="Energy">Energy</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Other">Other</option>
              </select>
              {errors.industry && (
                <div className="invalid-feedback d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>
                  {errors.industry}
                </div>
              )}
            </div>
          </div>

          {/* Save Button - Only visible when editing */}
          {isEditing && (
            <div className="col-12 d-flex justify-content-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary px-4 py-2 d-flex align-items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm;