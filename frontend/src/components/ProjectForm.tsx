import React, { useState, useEffect } from 'react';
import { southAfricaData, type District, type Municipality } from '../data/southAfricaData';
import type { 
  ProjectData, 
  ProjectLearningPathwayData, 
  ProjectQualificationData,
  LearningPathway,
  QualificationType,
  OccupationalQualification,
  LegacyQualification,
  SkillsDevelopmentProvider,
  OccupationalUnitStandard,
  LegacyUnitStandard
} from '../services/projectService';
import { 
  createProject,
  getLearningPathways,
  getQualificationTypes,
  getOccupationalQualifications,
  getLegacyQualifications,
  getClientSDPs,
  getOccupationalUnitStandards,
  getLegacyUnitStandards,
  createOccupationalQualification,
  createOccupationalUnitStandard,
  createLegacyQualification,
  createLegacyUnitStandard
} from '../services/projectService';

interface ProjectFormData {
  projectName: string;
  contractNumber: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  numberOfBeneficiaries: number;
  hasPPE: boolean;
  hasLearningMaterial: boolean;
  hasToolkit: boolean;
  hasConsumables: boolean;
  province: string;
  district: string;
  municipality: string;
  projectFunder: string;
  leadEmployerPartner: string;
  skillsDevelopmentProviderId: number;
  budgetAmount: number;
  clientId?: number;
  learningPathways: ProjectLearningPathwayData[];
}

interface ProjectFormErrors {
  projectName?: string;
  contractNumber?: string;
  financialYear?: string;
  startDate?: string;
  endDate?: string;
  numberOfBeneficiaries?: string;
  province?: string;
  district?: string;
  municipality?: string;
  projectFunder?: string;
  leadEmployerPartner?: string;
  skillsDevelopmentProviderId?: string;
  budgetAmount?: string;
  clientId?: string;
  learningPathways?: string;
  hasPPE?: string;
  hasLearningMaterial?: string;
  hasToolkit?: string;
  hasConsumables?: string;
}

interface ProjectFormProps {
  onCancel: () => void;
  onSubmit?: (data: ProjectFormData) => void;
  clientId?: number;
  skillsDevelopmentProviderId?: number; // Optional prop to pre-select SDP
}

type ProjectFormFieldValue = ProjectFormData[keyof ProjectFormData];
type ProjectQualificationFieldValue = ProjectQualificationData[keyof ProjectQualificationData];

const ProjectForm: React.FC<ProjectFormProps> = ({ onCancel, onSubmit, clientId, skillsDevelopmentProviderId }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    contractNumber: '',
    financialYear: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    numberOfBeneficiaries: 0,
    hasPPE: false,
    hasLearningMaterial: false,
    hasToolkit: false,
    hasConsumables: false,
    province: '',
    district: '',
    municipality: '',
    projectFunder: '',
    leadEmployerPartner: '',
    skillsDevelopmentProviderId: skillsDevelopmentProviderId || 0,
    budgetAmount: 0,
    clientId: clientId || 0,
    learningPathways: [],
  });

  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Data for dropdowns
  const [learningPathways, setLearningPathways] = useState<LearningPathway[]>([]);
  const [qualificationTypes, setQualificationTypes] = useState<QualificationType[]>([]);
  const [occupationalQualifications, setOccupationalQualifications] = useState<OccupationalQualification[]>([]);
  const [legacyQualifications, setLegacyQualifications] = useState<LegacyQualification[]>([]);
  const [clientSDPs, setClientSDPs] = useState<SkillsDevelopmentProvider[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Unit standards data
  const [unitStandards, setUnitStandards] = useState<{[key: number]: OccupationalUnitStandard[]}>({});
  const [loadingUnitStandards, setLoadingUnitStandards] = useState<{[key: number]: boolean}>({});
  
  // Legacy unit standards data
  const [legacyUnitStandards, setLegacyUnitStandards] = useState<{[key: number]: LegacyUnitStandard[]}>({});
  const [loadingLegacyUnitStandards, setLoadingLegacyUnitStandards] = useState<{[key: number]: boolean}>({});
  
  // Search states for qualifications
  const [occupationalQualificationSearch, setOccupationalQualificationSearch] = useState('');
  const [legacyQualificationSearch, setLegacyQualificationSearch] = useState('');

  // Modal states
  const [showOccupationalQualificationModal, setShowOccupationalQualificationModal] = useState(false);
  const [showLegacyQualificationModal, setShowLegacyQualificationModal] = useState(false);
  const [showOccupationalUnitStandardModal, setShowOccupationalUnitStandardModal] = useState(false);
  const [showLegacyUnitStandardModal, setShowLegacyUnitStandardModal] = useState(false);

  // New qualification data
  const [newOccupationalQualification, setNewOccupationalQualification] = useState({
    name: '',
    level: 0,
    credits: 0,
    qualificationType: '',
    description: '',
    qualityPartner: '',
    trade: ''
  });
  const [newLegacyQualification, setNewLegacyQualification] = useState({
    qualificationId: 0,
    name: '',
    description: '',
    level: 0,
    credits: 0,
    qualificationType: '',
    hasCat: 'NO'
  });

  // New unit standard data
  const [newOccupationalUnitStandard, setNewOccupationalUnitStandard] = useState({
    moduleCode: '',
    unitStandardName: '',
    moduleType: '',
    level: 0,
    credits: 0
  });
  const [newLegacyUnitStandard, setNewLegacyUnitStandard] = useState({
    unitStandardId: 0,
    unitStandardName: '',
    level: 0,
    credits: 0,
    synced: false
  });

  // Current qualification for adding unit standards
  const [currentQualificationIdForUnitStandard, setCurrentQualificationIdForUnitStandard] = useState<number | null>(null);

  // Location state management
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<Municipality[]>([]);

  // South African provinces - use data from southAfricaData
  const provinces = southAfricaData;

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingData(true);
        setSubmitMessage(null); // Clear any previous messages
        
        const [pathways, qualTypes, occQuals, legQuals, sdps] = await Promise.all([
          getLearningPathways(),
          getQualificationTypes(),
          getOccupationalQualifications(),
          getLegacyQualifications(),
          clientId ? getClientSDPs(clientId) : Promise.resolve([])
        ]);

        setLearningPathways(pathways);
        setQualificationTypes(qualTypes);
        setOccupationalQualifications(occQuals);
        setLegacyQualifications(legQuals);
        setClientSDPs(sdps);
        
        // Show success message briefly
        setSubmitMessage({
          type: 'success',
          text: 'Form data loaded successfully!'
        });
        
        // Clear success message after 2 seconds
        setTimeout(() => {
          setSubmitMessage(null);
        }, 2000);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
        setSubmitMessage({
          type: 'error',
          text: 'Failed to load form data. Please check your connection and try refreshing the page.'
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadInitialData();
  }, [clientId]);

  const validateField = (name: keyof ProjectFormData, value: ProjectFormFieldValue): string => {
    const stringValue = typeof value === 'string' ? value : '';
    const numericValue = typeof value === 'number' ? value : 0;
    const arrayValue = Array.isArray(value) ? value : [];

    switch (name) {
      case 'projectName':
        if (!stringValue || stringValue.trim().length < 2) {
          return 'Project name must be at least 2 characters long';
        }
        if (stringValue.trim().length > 200) {
          return 'Project name cannot exceed 200 characters';
        }
        break;

      case 'contractNumber':
        if (!stringValue || stringValue.trim().length < 1) {
          return 'Contract number is required';
        }
        if (stringValue.trim().length > 50) {
          return 'Contract number cannot exceed 50 characters';
        }
        break;

      case 'financialYear': {
        if (!stringValue) {
          return 'Financial year is required';
        }
        const year = parseInt(stringValue, 10);
        const currentYear = new Date().getFullYear();
        if (year < currentYear - 5 || year > currentYear + 5) {
          return 'Financial year must be within 5 years of current year';
        }
        break;
      }

      case 'startDate':
        if (!stringValue) {
          return 'Start date is required';
        }
        break;

      case 'endDate':
        if (!stringValue) {
          return 'End date is required';
        }
        if (formData.startDate && new Date(stringValue) <= new Date(formData.startDate)) {
          return 'End date must be after start date';
        }
        break;

      case 'numberOfBeneficiaries':
        if (!numericValue || numericValue < 1) {
          return 'Number of beneficiaries must be at least 1';
        }
        if (numericValue > 10000) {
          return 'Number of beneficiaries cannot exceed 10,000';
        }
        break;

      case 'province':
        if (!stringValue) {
          return 'Province is required';
        }
        break;

      case 'district':
        if (!stringValue) {
          return 'District is required';
        }
        break;

      case 'municipality':
        if (!stringValue) {
          return 'Municipality is required';
        }
        break;

      case 'projectFunder':
        if (!stringValue || stringValue.trim().length < 2) {
          return 'Project funder is required';
        }
        break;

      case 'leadEmployerPartner':
        if (!stringValue || stringValue.trim().length < 2) {
          return 'Lead employer partner is required';
        }
        break;

      case 'skillsDevelopmentProviderId':
        if (!numericValue || numericValue === 0) {
          return 'Skills development provider is required';
        }
        break;

      case 'budgetAmount':
        if (!numericValue || numericValue < 0) {
          return 'Budget amount must be a positive number';
        }
        break;

      case 'learningPathways':
        if (!arrayValue || arrayValue.length === 0) {
          return 'At least one learning pathway is required';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (name: keyof ProjectFormData, value: ProjectFormFieldValue) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Handle cascading dropdowns for location
    if (name === 'province') {
      // Reset district and municipality when province changes
      setFormData(prev => ({ ...prev, district: '', municipality: '' }));
      setAvailableMunicipalities([]);
      
      // Find the selected province and set available districts
      const selectedProvince = provinces.find(p => p.id.toString() === value);
      if (selectedProvince) {
        setAvailableDistricts(selectedProvince.districts);
      } else {
        setAvailableDistricts([]);
      }
    } else if (name === 'district') {
      // Reset municipality when district changes
      setFormData(prev => ({ ...prev, municipality: '' }));
      
      // Find the selected district and set available municipalities
      const selectedDistrict = availableDistricts.find(d => d.id.toString() === value);
      if (selectedDistrict) {
        setAvailableMunicipalities(selectedDistrict.municipalities);
      } else {
        setAvailableMunicipalities([]);
      }
    }
    
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

  const addLearningPathway = () => {
    const newPathway: ProjectLearningPathwayData = {
      pathwayId: 0,
      qualifications: []
    };
    setFormData(prev => ({
      ...prev,
      learningPathways: [...prev.learningPathways, newPathway]
    }));
  };

  const removeLearningPathway = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learningPathways: prev.learningPathways.filter((_, i) => i !== index)
    }));
  };

  const updateLearningPathway = (index: number, pathwayId: number) => {
    setFormData(prev => ({
      ...prev,
      learningPathways: prev.learningPathways.map((pathway, i) => 
        i === index ? { ...pathway, pathwayId, qualifications: [] } : pathway
      )
    }));
  };

  const addQualification = (pathwayIndex: number) => {
    const newQualification: ProjectQualificationData = {
      qualificationTypeId: 0,
      occupationalQualificationId: undefined,
      legacyQualificationId: undefined,
      employmentType: '',
      numberOfBeneficiaries: 0
    };
    
    setFormData(prev => ({
      ...prev,
      learningPathways: prev.learningPathways.map((pathway, i) => 
        i === pathwayIndex 
          ? { ...pathway, qualifications: [...pathway.qualifications, newQualification] }
          : pathway
      )
    }));
  };

  const removeQualification = (pathwayIndex: number, qualificationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      learningPathways: prev.learningPathways.map((pathway, i) => 
        i === pathwayIndex 
          ? { ...pathway, qualifications: pathway.qualifications.filter((_, j) => j !== qualificationIndex) }
          : pathway
      )
    }));
  };

  const fetchUnitStandards = async (qualificationId: number) => {
    if (unitStandards[qualificationId] || loadingUnitStandards[qualificationId]) {
      return; // Already loaded or loading
    }

    setLoadingUnitStandards(prev => ({ ...prev, [qualificationId]: true }));
    
    try {
      const standards = await getOccupationalUnitStandards(qualificationId);
      setUnitStandards(prev => ({ ...prev, [qualificationId]: standards }));
    } catch (error) {
      console.error('Error fetching unit standards:', error);
      setUnitStandards(prev => ({ ...prev, [qualificationId]: [] }));
    } finally {
      setLoadingUnitStandards(prev => ({ ...prev, [qualificationId]: false }));
    }
  };

  const fetchLegacyUnitStandards = async (qualificationId: number) => {
    if (legacyUnitStandards[qualificationId] || loadingLegacyUnitStandards[qualificationId]) {
      return; // Already loaded or loading
    }

    setLoadingLegacyUnitStandards(prev => ({ ...prev, [qualificationId]: true }));
    
    try {
      const standards = await getLegacyUnitStandards(qualificationId);
      setLegacyUnitStandards(prev => ({ ...prev, [qualificationId]: standards }));
    } catch (error) {
      console.error('Error fetching legacy unit standards:', error);
      setLegacyUnitStandards(prev => ({ ...prev, [qualificationId]: [] }));
    } finally {
      setLoadingLegacyUnitStandards(prev => ({ ...prev, [qualificationId]: false }));
    }
  };

  // Toggle unit standard selection
  const toggleUnitStandardSelection = (pathwayIndex: number, qualificationIndex: number, unitStandardId: number) => {
    setFormData(prev => ({
      ...prev,
      learningPathways: prev.learningPathways.map((pathway, i) => 
        i === pathwayIndex 
          ? {
              ...pathway,
              qualifications: pathway.qualifications.map((qual, j) => 
                j === qualificationIndex 
                  ? {
                      ...qual,
                      selectedUnitStandards: qual.selectedUnitStandards
                        ? qual.selectedUnitStandards.includes(unitStandardId)
                          ? qual.selectedUnitStandards.filter(id => id !== unitStandardId) // Remove if already selected
                          : [...qual.selectedUnitStandards, unitStandardId] // Add if not selected
                        : [unitStandardId] // Initialize if empty
                    }
                  : qual
              )
            }
          : pathway
      )
    }));
  };

  // Remove all synced legacy unit standards from selection for a qualification
  const removeSyncedLegacyStandards = (pathwayIndex: number, qualificationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      learningPathways: prev.learningPathways.map((pathway, i) => {
        if (i !== pathwayIndex) return pathway;
        return {
          ...pathway,
          qualifications: pathway.qualifications.map((qual, j) => {
            if (j !== qualificationIndex) return qual;

            const legacyId = qual.legacyQualificationId;
            if (!legacyId) return qual;

            // Get the actual qualification_id for looking up unit standards
            const selectedLq = legacyQualifications.find(lq => lq.id === legacyId);
            const actualQualificationId = selectedLq?.qualificationId;
            if (!actualQualificationId) return qual;

            const standards = legacyUnitStandards[actualQualificationId] || [];
            const syncedIds = standards.filter(s => s.synced).map(s => s.id);
            const currentSelected = qual.selectedUnitStandards || [];
            const updatedSelected = currentSelected.filter(id => !syncedIds.includes(id));

            return {
              ...qual,
              selectedUnitStandards: updatedSelected
            };
          })
        };
      })
    }));
  };

  // Handle creating new occupational qualification
  const handleCreateOccupationalQualification = async () => {
    try {
      const newOq = await createOccupationalQualification(newOccupationalQualification);
      setOccupationalQualifications(prev => [...prev, newOq]);
      setShowOccupationalQualificationModal(false);
      setNewOccupationalQualification({
        name: '',
        level: 0,
        credits: 0,
        qualificationType: '',
        description: '',
        qualityPartner: '',
        trade: ''
      });
    } catch (error) {
      console.error('Error creating occupational qualification:', error);
    }
  };

  // Handle creating new legacy qualification
  const handleCreateLegacyQualification = async () => {
    try {
      const newLq = await createLegacyQualification(newLegacyQualification);
      setLegacyQualifications(prev => [...prev, newLq]);
      setShowLegacyQualificationModal(false);
      setNewLegacyQualification({
        qualificationId: 0,
        name: '',
        description: '',
        level: 0,
        credits: 0,
        qualificationType: '',
        hasCat: 'NO'
      });
    } catch (error) {
      console.error('Error creating legacy qualification:', error);
    }
  };

  // Handle creating new occupational unit standard
  const handleCreateOccupationalUnitStandard = async () => {
    if (!currentQualificationIdForUnitStandard) return;
    try {
      const newOus = await createOccupationalUnitStandard(
        currentQualificationIdForUnitStandard,
        newOccupationalUnitStandard
      );
      setUnitStandards(prev => ({
        ...prev,
        [currentQualificationIdForUnitStandard]: [
          ...(prev[currentQualificationIdForUnitStandard] || []),
          newOus
        ]
      }));
      setShowOccupationalUnitStandardModal(false);
      setNewOccupationalUnitStandard({
        moduleCode: '',
        unitStandardName: '',
        moduleType: '',
        level: 0,
        credits: 0
      });
    } catch (error) {
      console.error('Error creating occupational unit standard:', error);
    }
  };

  // Handle creating new legacy unit standard
  const handleCreateLegacyUnitStandard = async () => {
    if (!currentQualificationIdForUnitStandard) return;
    try {
      const newLus = await createLegacyUnitStandard(
        currentQualificationIdForUnitStandard,
        newLegacyUnitStandard
      );
      setLegacyUnitStandards(prev => ({
        ...prev,
        [currentQualificationIdForUnitStandard]: [
          ...(prev[currentQualificationIdForUnitStandard] || []),
          newLus
        ]
      }));
      setShowLegacyUnitStandardModal(false);
      setNewLegacyUnitStandard({
        unitStandardId: 0,
        unitStandardName: '',
        level: 0,
        credits: 0,
        synced: false
      });
    } catch (error) {
      console.error('Error creating legacy unit standard:', error);
    }
  };

  // Filter qualifications based on search
  const filteredOccupationalQualifications = occupationalQualificationSearch
    ? occupationalQualifications.filter(q => 
        q.name.toLowerCase().includes(occupationalQualificationSearch.toLowerCase()) ||
        q.qualificationId.toString().includes(occupationalQualificationSearch) ||
        q.qualityPartner?.toLowerCase().includes(occupationalQualificationSearch.toLowerCase()) ||
        q.trade?.toLowerCase().includes(occupationalQualificationSearch.toLowerCase())
      )
    : occupationalQualifications;

  const filteredLegacyQualifications = legacyQualificationSearch
    ? legacyQualifications.filter(q => 
        q.name.toLowerCase().includes(legacyQualificationSearch.toLowerCase()) ||
        q.qualificationId.toString().includes(legacyQualificationSearch) ||
        (q.description && q.description.toLowerCase().includes(legacyQualificationSearch.toLowerCase())) ||
        (q.qualificationType && q.qualificationType.toLowerCase().includes(legacyQualificationSearch.toLowerCase()))
      )
    : legacyQualifications;

  const updateQualification = (pathwayIndex: number, qualificationIndex: number, field: keyof ProjectQualificationData, value: ProjectQualificationFieldValue) => {
    setFormData(prev => ({
      ...prev,
      learningPathways: prev.learningPathways.map((pathway, i) => 
        i === pathwayIndex 
          ? {
              ...pathway,
              qualifications: pathway.qualifications.map((qual, j) => 
                j === qualificationIndex 
                  ? { 
                      ...qual, 
                      [field]: value,
                      // Reset other qualification IDs when type changes
                      ...(field === 'qualificationTypeId' ? {
                        occupationalQualificationId: undefined,
                        legacyQualificationId: undefined
                      } : {})
                    }
                  : qual
              )
            }
          : pathway
      )
    }));

    // Fetch unit standards if occupational qualification is selected
    if (field === 'occupationalQualificationId' && value) {
      fetchUnitStandards(value);
    }
    
    // Note: Legacy unit standards are fetched in the dropdown onChange handler
    // because we need to use qualification_id, not the id
  };

  const validateForm = (): boolean => {
    const newErrors: ProjectFormErrors = {};
    
    // Validate all required fields
    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof ProjectFormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    // Validate learning pathways
    if (formData.learningPathways.length === 0) {
      newErrors.learningPathways = 'At least one learning pathway is required';
    } else {
      // Check if all pathways have at least one qualification
      const hasInvalidPathways = formData.learningPathways.some(pathway => 
        pathway.pathwayId === 0 || pathway.qualifications.length === 0
      );
      if (hasInvalidPathways) {
        newErrors.learningPathways = 'All learning pathways must have a selected pathway and at least one qualification';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      const projectData: ProjectData = {
        ...formData
      };

      console.log('Sending project data:', projectData);
      const response = await createProject(projectData);
      console.log('Project creation response:', response);
      
      setSubmitMessage({
        type: 'success',
        text: `Project "${response.projectName}" created successfully!`
      });

      // Call the optional onSubmit prop if provided
      if (onSubmit) {
        onSubmit(formData);
      }

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          projectName: '',
          contractNumber: '',
          financialYear: new Date().getFullYear().toString(),
          startDate: '',
          endDate: '',
          numberOfBeneficiaries: 0,
          hasPPE: false,
          hasLearningMaterial: false,
          hasToolkit: false,
          hasConsumables: false,
          province: '',
          district: '',
          municipality: '',
          projectFunder: '',
          leadEmployerPartner: '',
          skillsDevelopmentProviderId: 0,
          budgetAmount: 0,
          clientId: clientId,
          learningPathways: [],
        });
        setSubmitMessage(null);
      }, 3000);

    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const message = error instanceof Error ? error.message : 'Failed to create project. Please try again.';
      setSubmitMessage({
        type: 'error',
        text: message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClassName = (fieldName: keyof ProjectFormErrors, hasValue?: boolean) => {
    const baseClass = "form-control form-control-lg";
    
    if (errors[fieldName]) {
      return `${baseClass} is-invalid`;
    }
    
    if (hasValue && !errors[fieldName]) {
      return `${baseClass} is-valid`;
    }
    
    return baseClass;
  };

  if (isLoadingData) {
    return (
      <div className="card shadow-lg border-0">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-lg border-0">
      <div className="card-header bg-success text-white">
        <div className="d-flex align-items-center">
          <div className="me-3 p-2 bg-white bg-opacity-10 rounded">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 className="card-title mb-0">Project Profile</h3>
            <p className="card-text text-white text-opacity-75 mb-0">Create a new project with learning pathways and qualifications</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="card-body" noValidate>
        {submitMessage && (
          <div className={`alert ${submitMessage.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center`} role="alert">
            <i className={`bi ${submitMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {submitMessage.text}
          </div>
        )}

        <div className="row g-3">
          {/* Project Name */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Project Name *
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className={getFieldClassName('projectName', !!formData.projectName)}
                placeholder="Enter project name"
                required
              />
              {formData.projectName && !errors.projectName && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
              {errors.projectName && (
                <i className="bi bi-exclamation-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-danger"></i>
              )}
            </div>
            {errors.projectName && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.projectName}
              </div>
            )}
          </div>

          {/* Contract Number */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Contract Number *
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                className={getFieldClassName('contractNumber', !!formData.contractNumber)}
                placeholder="Enter contract number"
                required
              />
              {formData.contractNumber && !errors.contractNumber && (
                <i className="bi bi-check-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-success"></i>
              )}
            </div>
            {errors.contractNumber && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.contractNumber}
              </div>
            )}
          </div>

          {/* Financial Year */}
          <div className="col-md-4">
            <label className="form-label fw-semibold">
              Financial Year *
            </label>
            <div className="position-relative">
              <input
                type="number"
                name="financialYear"
                value={formData.financialYear}
                onChange={(e) => handleInputChange('financialYear', e.target.value)}
                className={getFieldClassName('financialYear', !!formData.financialYear)}
                min={new Date().getFullYear() - 5}
                max={new Date().getFullYear() + 5}
                required
              />
            </div>
            {errors.financialYear && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.financialYear}
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="col-md-4">
            <label className="form-label fw-semibold">
              Start Date *
            </label>
            <div className="position-relative">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={getFieldClassName('startDate', !!formData.startDate)}
                required
              />
            </div>
            {errors.startDate && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.startDate}
              </div>
            )}
          </div>

          {/* End Date */}
          <div className="col-md-4">
            <label className="form-label fw-semibold">
              End Date *
            </label>
            <div className="position-relative">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={getFieldClassName('endDate', !!formData.endDate)}
                min={formData.startDate}
                required
              />
            </div>
            {errors.endDate && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.endDate}
              </div>
            )}
          </div>

          {/* Number of Beneficiaries */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Number of Beneficiaries *
            </label>
            <div className="position-relative">
              <input
                type="number"
                name="numberOfBeneficiaries"
                value={formData.numberOfBeneficiaries}
                onChange={(e) => handleInputChange('numberOfBeneficiaries', parseInt(e.target.value) || 0)}
                className={getFieldClassName('numberOfBeneficiaries', formData.numberOfBeneficiaries > 0)}
                min="1"
                max="10000"
                required
              />
            </div>
            {errors.numberOfBeneficiaries && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.numberOfBeneficiaries}
              </div>
            )}
          </div>

          {/* Province */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Province *
            </label>
            <div className="position-relative">
              <select
                name="province"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className={getFieldClassName('province', !!formData.province)}
                required
              >
                <option value="">Select Province</option>
                {provinces.map(province => (
                  <option key={province.id} value={province.id}>{province.name}</option>
                ))}
              </select>
            </div>
            {errors.province && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.province}
              </div>
            )}
          </div>

          {/* District */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              District *
            </label>
            <div className="position-relative">
              <select
                name="district"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className={getFieldClassName('district', !!formData.district)}
                required
                disabled={!formData.province}
              >
                <option value="">Select District</option>
                {availableDistricts.map(district => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
            {errors.district && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.district}
              </div>
            )}
          </div>

          {/* Municipality */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Municipality *
            </label>
            <div className="position-relative">
              <select
                name="municipality"
                value={formData.municipality}
                onChange={(e) => handleInputChange('municipality', e.target.value)}
                className={getFieldClassName('municipality', !!formData.municipality)}
                required
                disabled={!formData.district}
              >
                <option value="">Select Municipality</option>
                {availableMunicipalities.map(municipality => (
                  <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
                ))}
              </select>
            </div>
            {errors.municipality && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.municipality}
              </div>
            )}
          </div>

          {/* Project Funder */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Project Funder *
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="projectFunder"
                value={formData.projectFunder}
                onChange={(e) => handleInputChange('projectFunder', e.target.value)}
                className={getFieldClassName('projectFunder', !!formData.projectFunder)}
                placeholder="Enter project funder"
                required
              />
            </div>
            {errors.projectFunder && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.projectFunder}
              </div>
            )}
          </div>

          {/* Lead Employer Partner */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Lead Employer Partner *
            </label>
            <div className="position-relative">
              <input
                type="text"
                name="leadEmployerPartner"
                value={formData.leadEmployerPartner}
                onChange={(e) => handleInputChange('leadEmployerPartner', e.target.value)}
                className={getFieldClassName('leadEmployerPartner', !!formData.leadEmployerPartner)}
                placeholder="Enter lead employer partner"
                required
              />
            </div>
            {errors.leadEmployerPartner && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.leadEmployerPartner}
              </div>
            )}
          </div>

          {/* Skills Development Provider */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Skills Development Provider *
            </label>
            <div className="position-relative">
              <select
                name="skillsDevelopmentProviderId"
                value={formData.skillsDevelopmentProviderId}
                onChange={(e) => handleInputChange('skillsDevelopmentProviderId', parseInt(e.target.value) || 0)}
                className={getFieldClassName('skillsDevelopmentProviderId', formData.skillsDevelopmentProviderId > 0)}
                required
                disabled={!!skillsDevelopmentProviderId}
              >
                <option value="0">Select Skills Development Provider</option>
                {clientSDPs.map(sdp => (
                  <option key={sdp.id} value={sdp.id}>
                    {sdp.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.skillsDevelopmentProviderId && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.skillsDevelopmentProviderId}
              </div>
            )}
          </div>

          {/* Budget Amount */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">
              Budget Amount (ZAR) *
            </label>
            <div className="position-relative">
              <input
                type="number"
                name="budgetAmount"
                value={formData.budgetAmount}
                onChange={(e) => handleInputChange('budgetAmount', parseFloat(e.target.value) || 0)}
                className={getFieldClassName('budgetAmount', formData.budgetAmount > 0)}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            {errors.budgetAmount && (
              <div className="invalid-feedback d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                {errors.budgetAmount}
              </div>
            )}
          </div>

          {/* Project Resources */}
          <div className="col-12">
            <label className="form-label fw-semibold">Project Resources</label>
            <div className="row g-2">
              <div className="col-md-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="hasPPE"
                    checked={formData.hasPPE}
                    onChange={(e) => handleInputChange('hasPPE', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="hasPPE">
                    PPE (Personal Protective Equipment)
                  </label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="hasLearningMaterial"
                    checked={formData.hasLearningMaterial}
                    onChange={(e) => handleInputChange('hasLearningMaterial', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="hasLearningMaterial">
                    Learning Material
                  </label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="hasToolkit"
                    checked={formData.hasToolkit}
                    onChange={(e) => handleInputChange('hasToolkit', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="hasToolkit">
                    Toolkit
                  </label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="hasConsumables"
                    checked={formData.hasConsumables}
                    onChange={(e) => handleInputChange('hasConsumables', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="hasConsumables">
                    Consumables
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Pathways Section */}
          <div className="col-12">
            <div className="card border-secondary">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Learning Pathways & Qualifications *</h5>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={addLearningPathway}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Add Learning Pathway
                  </button>
                </div>
              </div>
              <div className="card-body">
                {formData.learningPathways.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    No learning pathways added yet. Click "Add Learning Pathway" to get started.
                  </p>
                ) : (
                  formData.learningPathways.map((pathway, pathwayIndex) => (
                    <div key={pathwayIndex} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="text-primary">Learning Pathway {pathwayIndex + 1}</h6>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeLearningPathway(pathwayIndex)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>

                      {/* Pathway Selection */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Select Learning Pathway</label>
                        <select
                          className="form-select"
                          value={pathway.pathwayId}
                          onChange={(e) => updateLearningPathway(pathwayIndex, parseInt(e.target.value))}
                        >
                          <option value="0">Select a learning pathway</option>
                          {learningPathways.map(lp => (
                            <option key={lp.pathwayId} value={lp.pathwayId}>
                              {lp.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Qualifications */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-semibold mb-0">Qualifications</label>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => addQualification(pathwayIndex)}
                            disabled={pathway.pathwayId === 0}
                          >
                            <i className="bi bi-plus me-1"></i>
                            Add Qualification
                          </button>
                        </div>

                        {pathway.qualifications.length === 0 ? (
                          <p className="text-muted small">No qualifications added yet.</p>
                        ) : (
                          pathway.qualifications.map((qualification, qualIndex) => (
                            <div key={qualIndex} className="border rounded p-2 mb-2 bg-light">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <small className="text-muted">Qualification {qualIndex + 1}</small>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeQualification(pathwayIndex, qualIndex)}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </div>

                              <div className="row g-2">
                                {/* Qualification Type */}
                                <div className="col-md-4">
                                  <label className="form-label small">Qualification Type</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={qualification.qualificationTypeId}
                                    onChange={(e) => updateQualification(pathwayIndex, qualIndex, 'qualificationTypeId', parseInt(e.target.value))}
                                  >
                                    <option value="0">Select type</option>
                                    {qualificationTypes.map(qt => (
                                      <option key={qt.id} value={qt.id}>
                                        {qt.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Type of Employment */}
                                <div className="col-md-3">
                                  <label className="form-label small">Type of Employment</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={qualification.employmentType || ''}
                                    onChange={(e) => updateQualification(pathwayIndex, qualIndex, 'employmentType', e.target.value)}
                                  >
                                    <option value="">Select employment type</option>
                                    <option value="18.1 Employed">18.1 Employed</option>
                                    <option value="18.2 Unemployed">18.2 Unemployed</option>
                                  </select>
                                </div>

                                {/* Number of Beneficiaries for this Qualification */}
                                <div className="col-md-3">
                                  <label className="form-label small">Beneficiaries</label>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={qualification.numberOfBeneficiaries || 0}
                                    onChange={(e) => updateQualification(pathwayIndex, qualIndex, 'numberOfBeneficiaries', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="10000"
                                    placeholder="Number of beneficiaries"
                                  />
                                </div>

                                {/* Occupational Qualification */}
                                {qualification.qualificationTypeId === 2 && (
                                  <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <label className="form-label small mb-0">Occupational Qualification</label>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => setShowOccupationalQualificationModal(true)}
                                      >
                                        <i className="bi bi-plus"></i> Add New
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm mb-2"
                                      placeholder="Search by name, ID, partner, or trade..."
                                      value={occupationalQualificationSearch}
                                      onChange={(e) => setOccupationalQualificationSearch(e.target.value)}
                                    />
                                    <select
                                      className="form-select form-select-sm"
                                      value={qualification.occupationalQualificationId || ''}
                                      onChange={(e) => updateQualification(pathwayIndex, qualIndex, 'occupationalQualificationId', e.target.value ? parseInt(e.target.value) : undefined)}
                                    >
                                      <option value="">Select occupational qualification</option>
                                      {filteredOccupationalQualifications.map(oq => (
                                        <option key={oq.qualificationId} value={oq.qualificationId}>
                                          ID: {oq.qualificationId} - {oq.name} (Level {oq.level})
                                        </option>
                                      ))}
                                    </select>
                                    {filteredOccupationalQualifications.length === 0 && occupationalQualificationSearch && (
                                      <small className="text-muted">No qualifications match your search.</small>
                                    )}
                                  </div>
                                )}

                                {/* Legacy Qualification */}
                                {qualification.qualificationTypeId === 1 && (
                                  <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <label className="form-label small mb-0">Legacy Qualification</label>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => setShowLegacyQualificationModal(true)}
                                      >
                                        <i className="bi bi-plus"></i> Add New
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm mb-2"
                                      placeholder="Search by name, ID, field, or subfield..."
                                      value={legacyQualificationSearch}
                                      onChange={(e) => setLegacyQualificationSearch(e.target.value)}
                                    />
                                    <select
                                      className="form-select form-select-sm"
                                      value={qualification.legacyQualificationId || ''}
                                      onChange={(e) => {
                                        const selectedId = e.target.value ? parseInt(e.target.value) : undefined;
                                        updateQualification(pathwayIndex, qualIndex, 'legacyQualificationId', selectedId);
                                        // Fetch unit standards using the qualification_id, not the id
                                        if (selectedId) {
                                          const selectedQual = filteredLegacyQualifications.find(lq => lq.id === selectedId);
                                          if (selectedQual?.qualificationId) {
                                            fetchLegacyUnitStandards(selectedQual.qualificationId);
                                          }
                                        }
                                      }}
                                    >
                                      <option value="">Select legacy qualification</option>
                                      {filteredLegacyQualifications.map(lq => (
                                        <option key={lq.id} value={lq.id}>
                                          Qual ID: {lq.qualificationId} - {lq.name} (Level {lq.level})
                                        </option>
                                      ))}
                                    </select>
                                    {filteredLegacyQualifications.length === 0 && legacyQualificationSearch && (
                                      <small className="text-muted">No qualifications match your search.</small>
                                    )}
                                  </div>
                                )}

                              {/* Selected Legacy Qualification Details Table */}
                              {qualification.legacyQualificationId && (
                                <div className="mt-2">
                                  {(() => {
                                    const selectedLq = legacyQualifications.find(lq => lq.id === qualification.legacyQualificationId);
                                    if (!selectedLq) return null;
                                    return (
                                      <div className="table-responsive">
                                        <table className="table table-sm table-striped table-bordered mb-0">
                                          <thead className="table-light">
                                            <tr>
                                              <th>Qualification ID</th>
                                              <th>Name</th>
                                              <th>Level</th>
                                              <th>Credits</th>
                                              <th>Qualification Type</th>
                                              <th>Description</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr>
                                              <td>{selectedLq.qualificationId}</td>
                                              <td>{selectedLq.name}</td>
                                              <td>{selectedLq.level}</td>
                                              <td>{selectedLq.credits}</td>
                                              <td>{selectedLq.qualificationType}</td>
                                              <td>{selectedLq.description}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                              </div>

                              {/* Selected Occupational Qualification Details Table */}
                              {qualification.occupationalQualificationId && (
                                <div className="mt-2">
                                  {(() => {
                                    const selectedOq = occupationalQualifications.find(oq => oq.qualificationId === qualification.occupationalQualificationId);
                                    if (!selectedOq) return null;
                                    return (
                                      <div className="table-responsive">
                                        <table className="table table-sm table-striped table-bordered mb-0">
                                          <thead className="table-light">
                                            <tr>
                                              <th>Qualification ID</th>
                                              <th>Name</th>
                                              <th>Level</th>
                                              <th>Credits</th>
                                              <th>Type</th>
                                              <th>Quality Partner</th>
                                              <th>Trade</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr>
                                              <td>{selectedOq.qualificationId}</td>
                                              <td>{selectedOq.name}</td>
                                              <td>{selectedOq.level}</td>
                                              <td>{selectedOq.credits}</td>
                                              <td>{selectedOq.qualificationType}</td>
                                              <td>{selectedOq.qualityPartner}</td>
                                              <td>{selectedOq.trade}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Unit Standards Table with Multiple Selection */}
                              {qualification.occupationalQualificationId && (
                                <div className="mt-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0 text-muted">Unit Standards - Select Multiple</h6>
                                    <div className="d-flex align-items-center gap-2">
                                      {loadingUnitStandards[qualification.occupationalQualificationId] && (
                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => {
                                          setCurrentQualificationIdForUnitStandard(qualification.occupationalQualificationId);
                                          setShowOccupationalUnitStandardModal(true);
                                        }}
                                      >
                                        <i className="bi bi-plus"></i> Add New
                                      </button>
                                    </div>
                                  </div>
                                  {(() => {
                                    const standards = unitStandards[qualification.occupationalQualificationId] || [];
                                    const selectedStandards = qualification.selectedUnitStandards || [];
                                    
                                    if (loadingUnitStandards[qualification.occupationalQualificationId]) {
                                      return <div className="text-center py-3"><div className="spinner-border text-primary" role="status"></div></div>;
                                    }
                                    if (standards.length === 0) {
                                      return <p className="text-muted small mb-0">No unit standards found for this qualification.</p>;
                                    }
                                    return (
                                      <div className="table-responsive">
                                        <table className="table table-sm table-hover table-bordered mb-0">
                                          <thead className="table-light">
                                            <tr>
                                              <th style={{width: '40px'}}>
                                                <input
                                                  type="checkbox"
                                                  className="form-check-input"
                                                  checked={selectedStandards.length === standards.length && standards.length > 0}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      // Select all
                                                      const allIds = standards.map(s => s.id);
                                                      setFormData(prev => ({
                                                        ...prev,
                                                        learningPathways: prev.learningPathways.map((pathway, i) => 
                                                          i === pathwayIndex 
                                                            ? {
                                                                ...pathway,
                                                                qualifications: pathway.qualifications.map((qual, j) => 
                                                                  j === qualIndex 
                                                                    ? { ...qual, selectedUnitStandards: allIds }
                                                                    : qual
                                                                )
                                                              }
                                                            : pathway
                                                        )
                                                      }));
                                                    } else {
                                                      // Deselect all
                                                      setFormData(prev => ({
                                                        ...prev,
                                                        learningPathways: prev.learningPathways.map((pathway, i) => 
                                                          i === pathwayIndex 
                                                            ? {
                                                                ...pathway,
                                                                qualifications: pathway.qualifications.map((qual, j) => 
                                                                  j === qualIndex 
                                                                    ? { ...qual, selectedUnitStandards: [] }
                                                                    : qual
                                                                )
                                                              }
                                                            : pathway
                                                        )
                                                      }));
                                                    }
                                                  }}
                                                />
                                              </th>
                                              <th>Module Code</th>
                                              <th>Unit Standard Name</th>
                                              <th>Module Type</th>
                                              <th>Level</th>
                                              <th>Credits</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {standards.map((standard, index) => (
                                              <tr key={index}>
                                                <td>
                                                  <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedStandards.includes(standard.id)}
                                                    onChange={() => toggleUnitStandardSelection(pathwayIndex, qualIndex, standard.id)}
                                                  />
                                                </td>
                                                <td>{standard.moduleCode}</td>
                                                <td>{standard.unitStandardName}</td>
                                                <td>{standard.moduleType}</td>
                                                <td>{standard.level}</td>
                                                <td>{standard.credits}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                        <div className="mt-2">
                                          <small className="text-muted">
                                            Selected: {selectedStandards.length} of {standards.length} unit standards
                                          </small>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Legacy Unit Standards Table with Multiple Selection */}
                              {qualification.legacyQualificationId && (
                                <div className="mt-3">
                                  {(() => {
                                    // Get the actual qualification_id for looking up unit standards
                                    const selectedLq = legacyQualifications.find(lq => lq.id === qualification.legacyQualificationId);
                                    const actualQualificationId = selectedLq?.qualificationId;
                                    
                                    if (!actualQualificationId) return null;
                                    
                                    return (
                                      <>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <h6 className="mb-0 text-muted">Legacy Unit Standards - Select Multiple</h6>
                                          <div className="d-flex align-items-center gap-2">
                                            {loadingLegacyUnitStandards[actualQualificationId] && (
                                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                              </div>
                                            )}
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-outline-success"
                                              onClick={() => {
                                                setCurrentQualificationIdForUnitStandard(actualQualificationId);
                                                setShowLegacyUnitStandardModal(true);
                                              }}
                                            >
                                              <i className="bi bi-plus"></i> Add New
                                            </button>
                                            {!loadingLegacyUnitStandards[actualQualificationId] && (
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeSyncedLegacyStandards(pathwayIndex, qualIndex)}
                                                title="Remove all synced unit standards from selection"
                                              >
                                                Remove Synced
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        {(() => {
                                          const standards = legacyUnitStandards[actualQualificationId] || [];
                                          const selectedStandards = qualification.selectedUnitStandards || [];
                                          
                                          if (loadingLegacyUnitStandards[actualQualificationId]) {
                                      return <div className="text-center py-3"><div className="spinner-border text-primary" role="status"></div></div>;
                                    }
                                    if (standards.length === 0) {
                                      return <p className="text-muted small mb-0">No legacy unit standards found for this qualification.</p>;
                                    }
                                    return (
                                      <div className="table-responsive">
                                        <table className="table table-sm table-hover table-bordered mb-0">
                                          <thead className="table-light">
                                            <tr>
                                              <th style={{width: '40px'}}>
                                                <input
                                                  type="checkbox"
                                                  className="form-check-input"
                                                  checked={selectedStandards.length === standards.length && standards.length > 0}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      // Select all
                                                      const allIds = standards.map(s => s.id);
                                                      setFormData(prev => ({
                                                        ...prev,
                                                        learningPathways: prev.learningPathways.map((pathway, i) => 
                                                          i === pathwayIndex 
                                                            ? {
                                                                ...pathway,
                                                                qualifications: pathway.qualifications.map((qual, j) => 
                                                                  j === qualIndex 
                                                                    ? { ...qual, selectedUnitStandards: allIds }
                                                                    : qual
                                                                )
                                                              }
                                                            : pathway
                                                        )
                                                      }));
                                                    } else {
                                                      // Deselect all
                                                      setFormData(prev => ({
                                                        ...prev,
                                                        learningPathways: prev.learningPathways.map((pathway, i) => 
                                                          i === pathwayIndex 
                                                            ? {
                                                                ...pathway,
                                                                qualifications: pathway.qualifications.map((qual, j) => 
                                                                  j === qualIndex 
                                                                    ? { ...qual, selectedUnitStandards: [] }
                                                                    : qual
                                                                )
                                                              }
                                                            : pathway
                                                        )
                                                      }));
                                                    }
                                                  }}
                                                />
                                              </th>
                                              <th>Unit Standard ID</th>
                                              <th>Unit Standard Name</th>
                                              <th>Level</th>
                                              <th>Credits</th>
                                              <th>Synced</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {standards.map((standard, index) => (
                                              <tr key={index}>
                                                <td>
                                                  <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedStandards.includes(standard.id)}
                                                    onChange={() => toggleUnitStandardSelection(pathwayIndex, qualIndex, standard.id)}
                                                  />
                                                </td>
                                                <td>{standard.unitStandardId}</td>
                                                <td>{standard.unitStandardName}</td>
                                                <td>{standard.level}</td>
                                                <td>{standard.credits}</td>
                                                <td>{standard.synced ? 'YES' : 'NO'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                        <div className="mt-2">
                                          <small className="text-muted">
                                            Selected: {selectedStandards.length} of {standards.length} legacy unit standards
                                          </small>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}

                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
                {errors.learningPathways && (
                  <div className="text-danger small">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    {errors.learningPathways}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button
            type="button"
            className="btn btn-outline-secondary btn-lg px-4"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-success btn-lg px-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating Project...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Create Project
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal: Add Occupational Qualification */}
      {showOccupationalQualificationModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Occupational Qualification</h5>
                <button type="button" className="btn-close" onClick={() => setShowOccupationalQualificationModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" value={newOccupationalQualification.name} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, name: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Level</label>
                  <input type="number" className="form-control" value={newOccupationalQualification.level} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, level: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Credits</label>
                  <input type="number" className="form-control" value={newOccupationalQualification.credits} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, credits: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Qualification Type</label>
                  <input type="text" className="form-control" value={newOccupationalQualification.qualificationType} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, qualificationType: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-control" value={newOccupationalQualification.description} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, description: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Quality Partner</label>
                  <input type="text" className="form-control" value={newOccupationalQualification.qualityPartner} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, qualityPartner: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Trade</label>
                  <input type="text" className="form-control" value={newOccupationalQualification.trade} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, trade: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOccupationalQualificationModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleCreateOccupationalQualification}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Legacy Qualification */}
      {showLegacyQualificationModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Legacy Qualification</h5>
                <button type="button" className="btn-close" onClick={() => setShowLegacyQualificationModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Qualification ID</label>
                  <input type="number" className="form-control" value={newLegacyQualification.qualificationId} onChange={(e) => setNewLegacyQualification({...newLegacyQualification, qualificationId: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" value={newLegacyQualification.name} onChange={(e) => setNewLegacyQualification({...newLegacyQualification, name: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-control" value={newLegacyQualification.description} onChange={(e) => setNewLegacyQualification({...newLegacyQualification, description: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Level</label>
                  <input type="number" className="form-control" value={newLegacyQualification.level} onChange={(e) => setNewLegacyQualification({...newLegacyQualification, level: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Credits</label>
                  <input type="number" className="form-control" value={newLegacyQualification.credits} onChange={(e) => setNewLegacyQualification({...newLegacyQualification, credits: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Qualification Type</label>
                  <input type="text" className="form-control" value={newLegacyQualification.qualificationType} onChange={(e) => setNewLegacyQualification({...newLegacyQualification, qualificationType: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLegacyQualificationModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleCreateLegacyQualification}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Occupational Unit Standard */}
      {showOccupationalUnitStandardModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Unit Standard</h5>
                <button type="button" className="btn-close" onClick={() => setShowOccupationalUnitStandardModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Module Code</label>
                  <input type="text" className="form-control" value={newOccupationalUnitStandard.moduleCode} onChange={(e) => setNewOccupationalUnitStandard({...newOccupationalUnitStandard, moduleCode: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Unit Standard Name</label>
                  <input type="text" className="form-control" value={newOccupationalUnitStandard.unitStandardName} onChange={(e) => setNewOccupationalUnitStandard({...newOccupationalUnitStandard, unitStandardName: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Module Type</label>
                  <input type="text" className="form-control" value={newOccupationalUnitStandard.moduleType} onChange={(e) => setNewOccupationalUnitStandard({...newOccupationalUnitStandard, moduleType: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Level</label>
                  <input type="number" className="form-control" value={newOccupationalUnitStandard.level} onChange={(e) => setNewOccupationalUnitStandard({...newOccupationalUnitStandard, level: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Credits</label>
                  <input type="number" className="form-control" value={newOccupationalUnitStandard.credits} onChange={(e) => setNewOccupationalUnitStandard({...newOccupationalUnitStandard, credits: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOccupationalUnitStandardModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleCreateOccupationalUnitStandard}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Legacy Unit Standard */}
      {showLegacyUnitStandardModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Legacy Unit Standard</h5>
                <button type="button" className="btn-close" onClick={() => setShowLegacyUnitStandardModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Unit Standard ID</label>
                  <input type="number" className="form-control" value={newLegacyUnitStandard.unitStandardId} onChange={(e) => setNewLegacyUnitStandard({...newLegacyUnitStandard, unitStandardId: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Unit Standard Name</label>
                  <input type="text" className="form-control" value={newLegacyUnitStandard.unitStandardName} onChange={(e) => setNewLegacyUnitStandard({...newLegacyUnitStandard, unitStandardName: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Level</label>
                  <input type="number" className="form-control" value={newLegacyUnitStandard.level} onChange={(e) => setNewLegacyUnitStandard({...newLegacyUnitStandard, level: parseInt(e.target.value) || 0})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Credits</label>
                  <input type="number" className="form-control" value={newLegacyUnitStandard.credits} onChange={(e) => setNewLegacyUnitStandard({...newLegacyUnitStandard, credits: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLegacyUnitStandardModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleCreateLegacyUnitStandard}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;