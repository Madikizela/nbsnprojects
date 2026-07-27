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

  // Dark-theme inline style helpers
  const S = {
    label: { color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' } as React.CSSProperties,
    input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', padding: '10px 14px', width: '100%', fontSize: 14, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
    inputInvalid: { background: '#0f172a', border: '1px solid #ef4444', borderRadius: 8, color: '#fff', padding: '10px 14px', width: '100%', fontSize: 14, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
    inputValid: { background: '#0f172a', border: '1px solid #10b981', borderRadius: 8, color: '#fff', padding: '10px 14px', width: '100%', fontSize: 14, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
    errorText: { color: '#f87171', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 } as React.CSSProperties,
    section: { background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '20px', marginBottom: 0 } as React.CSSProperties,
    sectionTitle: { color: '#10b981', fontWeight: 700, fontSize: 15, marginBottom: 16, marginTop: 0 } as React.CSSProperties,
    card: { background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '16px', marginBottom: 12 } as React.CSSProperties,
    nestedCard: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '12px', marginBottom: 10 } as React.CSSProperties,
  };

  const getInputStyle = (fieldName: keyof ProjectFormErrors, hasValue?: boolean): React.CSSProperties => {
    if (errors[fieldName]) return S.inputInvalid;
    if (hasValue && !errors[fieldName]) return S.inputValid;
    return S.input;
  };

  if (isLoadingData) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', background: '#1e293b', borderRadius: 12 }}>
        <div className="spinner-border" role="status" style={{ color: '#10b981' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Loading form data...</p>
      </div>
    );
  }

  // ── Helper: render unit standards table ──
  const renderOccUnitStandards = (
    pathwayIndex: number,
    qualIndex: number,
    qualificationId: number,
    selectedUnitStandardIds: number[]
  ) => {
    const standards = unitStandards[qualificationId] || [];
    const sel = selectedUnitStandardIds;
    const thSt: React.CSSProperties = { padding: '6px 8px', color: '#94a3b8', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #334155' };
    const mkCell = (id: number) => ({ padding: '6px 8px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', background: sel.includes(id) ? 'rgba(16,185,129,0.06)' : 'transparent' });
    if (loadingUnitStandards[qualificationId]) return <div style={{ textAlign: 'center', padding: '12px 0' }}><div className="spinner-border" style={{ color: '#10b981' }} role="status"></div></div>;
    if (standards.length === 0) return <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>No unit standards found.</p>;
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: '#0f172a' }}>
            <th style={{ ...thSt, width: 36 }}>
              <input type="checkbox" style={{ accentColor: '#10b981' }}
                checked={sel.length === standards.length && standards.length > 0}
                onChange={(e) => { const allIds = standards.map(s => s.id); setFormData(prev => ({ ...prev, learningPathways: prev.learningPathways.map((pw, i) => i === pathwayIndex ? { ...pw, qualifications: pw.qualifications.map((q, j) => j === qualIndex ? { ...q, selectedUnitStandards: e.target.checked ? allIds : [] } : q) } : pw) })); }}
              />
            </th>
            {['Module Code', 'Unit Standard Name', 'Module Type', 'Level', 'Credits'].map(h => <th key={h} style={thSt}>{h}</th>)}
          </tr></thead>
          <tbody>{standards.map((s, idx) => (
            <tr key={idx}>
              <td style={mkCell(s.id)}><input type="checkbox" style={{ accentColor: '#10b981' }} checked={sel.includes(s.id)} onChange={() => toggleUnitStandardSelection(pathwayIndex, qualIndex, s.id)} /></td>
              <td style={mkCell(s.id)}>{s.moduleCode}</td><td style={mkCell(s.id)}>{s.unitStandardName}</td>
              <td style={mkCell(s.id)}>{s.moduleType}</td><td style={mkCell(s.id)}>{s.level}</td><td style={mkCell(s.id)}>{s.credits}</td>
            </tr>
          ))}</tbody>
        </table>
        <p style={{ color: '#64748b', fontSize: 11, margin: '6px 0 0' }}>Selected: {sel.length} of {standards.length}</p>
      </div>
    );
  };

  const renderLegacyUnitStandards = (
    pathwayIndex: number,
    qualIndex: number,
    actualQualificationId: number,
    selectedUnitStandardIds: number[]
  ) => {
    const standards = legacyUnitStandards[actualQualificationId] || [];
    const sel = selectedUnitStandardIds;
    const thSt: React.CSSProperties = { padding: '6px 8px', color: '#94a3b8', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #334155' };
    if (loadingLegacyUnitStandards[actualQualificationId]) return <div style={{ textAlign: 'center', padding: '12px 0' }}><div className="spinner-border" style={{ color: '#10b981' }} role="status"></div></div>;
    if (standards.length === 0) return <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>No legacy unit standards found.</p>;
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: '#0f172a' }}>
            <th style={{ ...thSt, width: 36 }}>
              <input type="checkbox" style={{ accentColor: '#10b981' }}
                checked={sel.length === standards.length && standards.length > 0}
                onChange={(e) => { const allIds = standards.map(s => s.id); setFormData(prev => ({ ...prev, learningPathways: prev.learningPathways.map((pw, i) => i === pathwayIndex ? { ...pw, qualifications: pw.qualifications.map((q, j) => j === qualIndex ? { ...q, selectedUnitStandards: e.target.checked ? allIds : [] } : q) } : pw) })); }}
              />
            </th>
            {['US ID', 'Unit Standard Name', 'Level', 'Credits', 'Synced'].map(h => <th key={h} style={thSt}>{h}</th>)}
          </tr></thead>
          <tbody>{standards.map((s, idx) => {
            const cellBg = sel.includes(s.id) ? 'rgba(16,185,129,0.06)' : 'transparent';
            const cell: React.CSSProperties = { padding: '6px 8px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', background: cellBg };
            return (
              <tr key={idx}>
                <td style={cell}><input type="checkbox" style={{ accentColor: '#10b981' }} checked={sel.includes(s.id)} onChange={() => toggleUnitStandardSelection(pathwayIndex, qualIndex, s.id)} /></td>
                <td style={cell}>{s.unitStandardId}</td><td style={cell}>{s.unitStandardName}</td>
                <td style={cell}>{s.level}</td><td style={cell}>{s.credits}</td>
                <td style={cell}><span style={{ background: s.synced ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: s.synced ? '#34d399' : '#94a3b8', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>{s.synced ? 'YES' : 'NO'}</span></td>
              </tr>
            );
          })}</tbody>
        </table>
        <p style={{ color: '#64748b', fontSize: 11, margin: '6px 0 0' }}>Selected: {sel.length} of {standards.length}</p>
      </div>
    );
  };

  const renderLegacyQualDetails = (qualId: number) => {
    const lq = legacyQualifications.find(q => q.id === qualId);
    if (!lq) return null;
    const th: React.CSSProperties = { padding: '6px 10px', color: '#94a3b8', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #334155' };
    const td: React.CSSProperties = { padding: '6px 10px', color: '#cbd5e1', borderBottom: '1px solid #1e293b' };
    return (
      <div style={{ marginTop: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: '#0f172a' }}>
            {['Qual ID','Name','Level','Credits','Type','Description'].map(h => <th key={h} style={th}>{h}</th>)}
          </tr></thead>
          <tbody><tr>
            <td style={td}>{lq.qualificationId}</td><td style={td}>{lq.name}</td>
            <td style={td}>{lq.level}</td><td style={td}>{lq.credits}</td>
            <td style={td}>{lq.qualificationType}</td><td style={td}>{lq.description}</td>
          </tr></tbody>
        </table>
      </div>
    );
  };

  const renderOccQualDetails = (qualId: number) => {
    const oq = occupationalQualifications.find(q => q.qualificationId === qualId);
    if (!oq) return null;
    const th: React.CSSProperties = { padding: '6px 10px', color: '#94a3b8', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #334155' };
    const td: React.CSSProperties = { padding: '6px 10px', color: '#cbd5e1', borderBottom: '1px solid #1e293b' };
    return (
      <div style={{ marginTop: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: '#0f172a' }}>
            {['Qual ID','Name','Level','Credits','Type','Quality Partner','Trade'].map(h => <th key={h} style={th}>{h}</th>)}
          </tr></thead>
          <tbody><tr>
            <td style={td}>{oq.qualificationId}</td><td style={td}>{oq.name}</td>
            <td style={td}>{oq.level}</td><td style={td}>{oq.credits}</td>
            <td style={td}>{oq.qualificationType}</td><td style={td}>{oq.qualityPartner}</td><td style={td}>{oq.trade}</td>
          </tr></tbody>
        </table>
      </div>
    );
  };

  const renderLegacyUnitStandardsSection = (
    pathwayIndex: number,
    qualIndex: number,
    legacyQualId: number
  ) => {
    const lq = legacyQualifications.find(q => q.id === legacyQualId);
    const actualQId = lq?.qualificationId;
    if (!actualQId) return null;
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>Legacy Unit Standards — select multiple</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {loadingLegacyUnitStandards[actualQId] && <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#10b981', width: 14, height: 14 }}></div>}
            <button type="button" onClick={() => { setCurrentQualificationIdForUnitStandard(actualQId); setShowLegacyUnitStandardModal(true); }} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid #10b981', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
              <i className="bi bi-plus"></i> Add New
            </button>
            {!loadingLegacyUnitStandards[actualQId] && (
              <button type="button" onClick={() => removeSyncedLegacyStandards(pathwayIndex, qualIndex)} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid #ef4444', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>Remove Synced</button>
            )}
          </div>
        </div>
        {renderLegacyUnitStandards(pathwayIndex, qualIndex, actualQId, formData.learningPathways[pathwayIndex]?.qualifications[qualIndex]?.selectedUnitStandards || [])}
      </div>
    );
  };

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)', borderRadius: '14px 14px 0 0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#fff' }}>
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
          </svg>
        </div>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Project Profile</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 13, marginTop: 2 }}>Create a new project with learning pathways and qualifications</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px', background: '#fff' }} noValidate>
        {submitMessage && (
          <div style={{
            background: submitMessage.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${submitMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            color: submitMessage.type === 'success' ? '#34d399' : '#f87171',
            fontSize: 14,
          }}>
            <i className={`bi ${submitMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
            {submitMessage.text}
          </div>
        )}

        {/* ── Project Details Section ── */}
        <div style={S.section}>
          <h4 style={S.sectionTitle}>📋 Project Details</h4>

          {/* Row 1: Project Name + Contract Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={S.label}>Project Name *</label>
              <input type="text" name="projectName" value={formData.projectName} onChange={(e) => handleInputChange('projectName', e.target.value)} style={getInputStyle('projectName', !!formData.projectName)} placeholder="Enter project name" required />
              {errors.projectName && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.projectName}</div>}
            </div>
            <div>
              <label style={S.label}>Contract Number *</label>
              <input type="text" name="contractNumber" value={formData.contractNumber} onChange={(e) => handleInputChange('contractNumber', e.target.value)} style={getInputStyle('contractNumber', !!formData.contractNumber)} placeholder="Enter contract number" required />
              {errors.contractNumber && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.contractNumber}</div>}
            </div>
          </div>

          {/* Row 2: Financial Year + Start Date + End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={S.label}>Financial Year *</label>
              <input type="number" name="financialYear" value={formData.financialYear} onChange={(e) => handleInputChange('financialYear', e.target.value)} style={getInputStyle('financialYear', !!formData.financialYear)} min={new Date().getFullYear() - 5} max={new Date().getFullYear() + 5} required />
              {errors.financialYear && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.financialYear}</div>}
            </div>
            <div>
              <label style={S.label}>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} style={getInputStyle('startDate', !!formData.startDate)} required />
              {errors.startDate && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.startDate}</div>}
            </div>
            <div>
              <label style={S.label}>End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} style={getInputStyle('endDate', !!formData.endDate)} min={formData.startDate} required />
              {errors.endDate && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.endDate}</div>}
            </div>
          </div>

          {/* Row 3: Beneficiaries + Province */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={S.label}>Number of Beneficiaries *</label>
              <input type="number" name="numberOfBeneficiaries" value={formData.numberOfBeneficiaries} onChange={(e) => handleInputChange('numberOfBeneficiaries', parseInt(e.target.value) || 0)} style={getInputStyle('numberOfBeneficiaries', formData.numberOfBeneficiaries > 0)} min="1" max="10000" required />
              {errors.numberOfBeneficiaries && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.numberOfBeneficiaries}</div>}
            </div>
            <div>
              <label style={S.label}>Province *</label>
              <select name="province" value={formData.province} onChange={(e) => handleInputChange('province', e.target.value)} style={getInputStyle('province', !!formData.province)} required>
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.province && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.province}</div>}
            </div>
          </div>

          {/* Row 4: District + Municipality + SDP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={S.label}>District *</label>
              <select name="district" value={formData.district} onChange={(e) => handleInputChange('district', e.target.value)} style={{ ...getInputStyle('district', !!formData.district), opacity: !formData.province ? 0.5 : 1 }} required disabled={!formData.province}>
                <option value="">Select District</option>
                {availableDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.district && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.district}</div>}
            </div>
            <div>
              <label style={S.label}>Municipality *</label>
              <select name="municipality" value={formData.municipality} onChange={(e) => handleInputChange('municipality', e.target.value)} style={{ ...getInputStyle('municipality', !!formData.municipality), opacity: !formData.district ? 0.5 : 1 }} required disabled={!formData.district}>
                <option value="">Select Municipality</option>
                {availableMunicipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {errors.municipality && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.municipality}</div>}
            </div>
            <div>
              <label style={S.label}>Skills Development Provider *</label>
              <select name="skillsDevelopmentProviderId" value={formData.skillsDevelopmentProviderId} onChange={(e) => handleInputChange('skillsDevelopmentProviderId', parseInt(e.target.value) || 0)} style={{ ...getInputStyle('skillsDevelopmentProviderId', formData.skillsDevelopmentProviderId > 0), opacity: !!skillsDevelopmentProviderId ? 0.6 : 1 }} required disabled={!!skillsDevelopmentProviderId}>
                <option value="0">Select Skills Development Provider</option>
                {clientSDPs.map(sdp => <option key={sdp.id} value={sdp.id}>{sdp.name}</option>)}
              </select>
              {errors.skillsDevelopmentProviderId && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.skillsDevelopmentProviderId}</div>}
            </div>
          </div>

          {/* Row 5: Funder + Lead Employer + Budget */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={S.label}>Project Funder *</label>
              <input type="text" name="projectFunder" value={formData.projectFunder} onChange={(e) => handleInputChange('projectFunder', e.target.value)} style={getInputStyle('projectFunder', !!formData.projectFunder)} placeholder="Enter project funder" required />
              {errors.projectFunder && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.projectFunder}</div>}
            </div>
            <div>
              <label style={S.label}>Lead Employer Partner *</label>
              <input type="text" name="leadEmployerPartner" value={formData.leadEmployerPartner} onChange={(e) => handleInputChange('leadEmployerPartner', e.target.value)} style={getInputStyle('leadEmployerPartner', !!formData.leadEmployerPartner)} placeholder="Enter lead employer partner" required />
              {errors.leadEmployerPartner && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.leadEmployerPartner}</div>}
            </div>
            <div>
              <label style={S.label}>Budget Amount (ZAR) *</label>
              <input type="number" name="budgetAmount" value={formData.budgetAmount} onChange={(e) => handleInputChange('budgetAmount', parseFloat(e.target.value) || 0)} style={getInputStyle('budgetAmount', formData.budgetAmount > 0)} min="0" step="0.01" placeholder="0.00" required />
              {errors.budgetAmount && <div style={S.errorText}><i className="bi bi-exclamation-triangle-fill"></i> {errors.budgetAmount}</div>}
            </div>
          </div>

        </div>

        {/* ── Resources Section ── */}
        <div style={{ ...S.section, marginTop: 20 }}>
          <h4 style={S.sectionTitle}>🛡️ Project Resources</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { id: 'hasPPE', label: 'PPE (Personal Protective Equipment)', checked: formData.hasPPE },
              { id: 'hasLearningMaterial', label: 'Learning Material', checked: formData.hasLearningMaterial },
              { id: 'hasToolkit', label: 'Toolkit', checked: formData.hasToolkit },
              { id: 'hasConsumables', label: 'Consumables', checked: formData.hasConsumables },
            ].map(({ id, label, checked }) => (
              <label key={id} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                background: checked ? 'rgba(16,185,129,0.12)' : '#0f172a',
                border: `1px solid ${checked ? '#10b981' : '#334155'}`,
                borderRadius: 8, padding: '8px 14px', color: checked ? '#34d399' : '#94a3b8',
                fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox"
                  id={id}
                  checked={checked}
                  onChange={(e) => handleInputChange(id as keyof ProjectFormData, e.target.checked)}
                  style={{ accentColor: '#10b981', width: 16, height: 16 }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* ── Learning Pathways Section ── */}
        <div style={{ ...S.section, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ ...S.sectionTitle, marginBottom: 0 }}>🎓 Learning Pathways & Qualifications *</h4>
            <button
              type="button"
              onClick={addLearningPathway}
              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="bi bi-plus-circle"></i> Add Learning Pathway
            </button>
          </div>

          {formData.learningPathways.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
              <p style={{ margin: 0, fontSize: 14 }}>No learning pathways added yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155' }}>Click "Add Learning Pathway" to get started.</p>
            </div>
          ) : (
            formData.learningPathways.map((pathway, pathwayIndex) => (
              <div key={pathwayIndex} style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>Pathway {pathwayIndex + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeLearningPathway(pathwayIndex)}
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid #ef4444', borderRadius: 6, padding: '4px 10px', fontSize: 13, cursor: 'pointer' }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Select Learning Pathway</label>
                  <select
                    style={S.input}
                    value={pathway.pathwayId}
                    onChange={(e) => updateLearningPathway(pathwayIndex, parseInt(e.target.value))}
                  >
                    <option value="0">Select a learning pathway</option>
                    {learningPathways.map(lp => (
                      <option key={lp.pathwayId} value={lp.pathwayId}>{lp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Qualifications */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Qualifications</span>
                    <button
                      type="button"
                      onClick={() => addQualification(pathwayIndex)}
                      disabled={pathway.pathwayId === 0}
                      style={{ background: pathway.pathwayId === 0 ? '#1e293b' : 'rgba(16,185,129,0.12)', color: pathway.pathwayId === 0 ? '#475569' : '#10b981', border: `1px solid ${pathway.pathwayId === 0 ? '#334155' : '#10b981'}`, borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: pathway.pathwayId === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      <i className="bi bi-plus"></i> Add Qualification
                    </button>
                  </div>

                  {pathway.qualifications.length === 0 ? (
                    <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>No qualifications added yet.</p>
                  ) : (
                    pathway.qualifications.map((qualification, qualIndex) => (
                      <div key={qualIndex} style={S.nestedCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>Qualification {qualIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeQualification(pathwayIndex, qualIndex)}
                            style={{ background: 'transparent', color: '#f87171', border: 'none', fontSize: 14, cursor: 'pointer', padding: '2px 6px' }}
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>

                        {/* Qualification fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                          {/* Qualification Type */}
                          <div>
                            <label style={{ ...S.label, fontSize: 12 }}>Qualification Type</label>
                            <select
                              style={{ ...S.input, padding: '8px 10px', fontSize: 13 }}
                              value={qualification.qualificationTypeId}
                              onChange={(e) => updateQualification(pathwayIndex, qualIndex, 'qualificationTypeId', parseInt(e.target.value))}
                            >
                              <option value="0">Select type</option>
                              {qualificationTypes.map(qt => (
                                <option key={qt.id} value={qt.id}>{qt.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Type of Employment */}
                          <div>
                            <label style={{ ...S.label, fontSize: 12 }}>Type of Employment</label>
                            <select
                              style={{ ...S.input, padding: '8px 10px', fontSize: 13 }}
                              value={qualification.employmentType || ''}
                              onChange={(e) => updateQualification(pathwayIndex, qualIndex, 'employmentType', e.target.value)}
                            >
                              <option value="">Select employment type</option>
                              <option value="18.1 Employed">18.1 Employed</option>
                              <option value="18.2 Unemployed">18.2 Unemployed</option>
                            </select>
                          </div>

                          {/* Beneficiaries */}
                          <div>
                            <label style={{ ...S.label, fontSize: 12 }}>Beneficiaries</label>
                            <input
                              type="number"
                              style={{ ...S.input, padding: '8px 10px', fontSize: 13 }}
                              value={qualification.numberOfBeneficiaries || 0}
                              onChange={(e) => updateQualification(pathwayIndex, qualIndex, 'numberOfBeneficiaries', parseInt(e.target.value) || 0)}
                              min="0"
                              max="10000"
                              placeholder="Number of beneficiaries"
                            />
                          </div>
                        </div>

                        {/* Occupational Qualification */}
                        {qualification.qualificationTypeId === 2 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <label style={{ ...S.label, fontSize: 12, marginBottom: 0 }}>Occupational Qualification</label>
                              <button
                                type="button"
                                onClick={() => setShowOccupationalQualificationModal(true)}
                                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid #10b981', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}
                              >
                                <i className="bi bi-plus"></i> Add New
                              </button>
                            </div>
                            <input
                              type="text"
                              style={{ ...S.input, padding: '8px 10px', fontSize: 13, marginBottom: 8 }}
                              placeholder="Search by name, ID, partner, or trade..."
                              value={occupationalQualificationSearch}
                              onChange={(e) => setOccupationalQualificationSearch(e.target.value)}
                            />
                            <select
                              style={{ ...S.input, padding: '8px 10px', fontSize: 13 }}
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
                              <small style={{ color: '#64748b', fontSize: 12 }}>No qualifications match your search.</small>
                            )}
                          </div>
                        )}

                        {/* Legacy Qualification */}
                        {qualification.qualificationTypeId === 1 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <label style={{ ...S.label, fontSize: 12, marginBottom: 0 }}>Legacy Qualification</label>
                              <button type="button" onClick={() => setShowLegacyQualificationModal(true)} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid #10b981', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
                                <i className="bi bi-plus"></i> Add New
                              </button>
                            </div>
                            <input type="text" style={{ ...S.input, padding: '8px 10px', fontSize: 13, marginBottom: 8 }} placeholder="Search by name, ID, field, or subfield..." value={legacyQualificationSearch} onChange={(e) => setLegacyQualificationSearch(e.target.value)} />
                            <select style={{ ...S.input, padding: '8px 10px', fontSize: 13 }} value={qualification.legacyQualificationId || ''}
                              onChange={(e) => {
                                const selectedId = e.target.value ? parseInt(e.target.value) : undefined;
                                updateQualification(pathwayIndex, qualIndex, 'legacyQualificationId', selectedId);
                                if (selectedId) {
                                  const selectedQual = filteredLegacyQualifications.find(lq => lq.id === selectedId);
                                  if (selectedQual?.qualificationId) fetchLegacyUnitStandards(selectedQual.qualificationId);
                                }
                              }}
                            >
                              <option value="">Select legacy qualification</option>
                              {filteredLegacyQualifications.map(lq => (<option key={lq.id} value={lq.id}>Qual ID: {lq.qualificationId} - {lq.name} (Level {lq.level})</option>))}
                            </select>
                            {filteredLegacyQualifications.length === 0 && legacyQualificationSearch && (<small style={{ color: '#64748b', fontSize: 12 }}>No qualifications match your search.</small>)}
                          </div>
                        )}

                        {/* Selected Legacy Qualification Details */}
                        {qualification.legacyQualificationId ? renderLegacyQualDetails(qualification.legacyQualificationId) : null}

                        {/* Selected Occupational Qualification Details */}
                        {qualification.occupationalQualificationId ? renderOccQualDetails(qualification.occupationalQualificationId) : null}

                        {/* Occupational Unit Standards */}
                        {qualification.occupationalQualificationId && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>Unit Standards — select multiple</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {loadingUnitStandards[qualification.occupationalQualificationId] && (<div className="spinner-border spinner-border-sm" style={{ color: '#10b981', width: 14, height: 14 }} role="status"></div>)}
                                <button type="button" onClick={() => { setCurrentQualificationIdForUnitStandard(qualification.occupationalQualificationId); setShowOccupationalUnitStandardModal(true); }} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid #10b981', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
                                  <i className="bi bi-plus"></i> Add New
                                </button>
                              </div>
                            </div>
                            {renderOccUnitStandards(pathwayIndex, qualIndex, qualification.occupationalQualificationId, qualification.selectedUnitStandards || [])}
                          </div>
                        )}

                        {/* Legacy Unit Standards */}
                        {qualification.legacyQualificationId ? renderLegacyUnitStandardsSection(pathwayIndex, qualIndex, qualification.legacyQualificationId) : null}

                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}

          {errors.learningPathways && (
            <div style={{ ...S.errorText, marginTop: 8 }}>
              <i className="bi bi-exclamation-triangle-fill"></i> {errors.learningPathways}
            </div>
          )}
        </div>

        {/* ── Form Actions ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #334155' }}>
          <button type="button" onClick={onCancel} disabled={isSubmitting}
            style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            <i className="bi bi-x-circle me-2"></i>Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting
              ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Project...</>
              : <><i className="bi bi-check-circle"></i> Create Project</>}
          </button>
        </div>
      </form>

      {/* ── Dark Modals ── */}
      {showOccupationalQualificationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <h5 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 700 }}>Add Occupational Qualification</h5>
              <button onClick={() => setShowOccupationalQualificationModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{l:'Name',k:'name',t:'text'},{l:'Level',k:'level',t:'number'},{l:'Credits',k:'credits',t:'number'},{l:'Qualification Type',k:'qualificationType',t:'text'},{l:'Description',k:'description',t:'text'},{l:'Quality Partner',k:'qualityPartner',t:'text'},{l:'Trade',k:'trade',t:'text'}].map(({l,k,t}) => (
                <div key={k}>
                  <label style={S.label}>{l}</label>
                  <input type={t} style={S.input} value={(newOccupationalQualification as Record<string,unknown>)[k] as string} onChange={(e) => setNewOccupationalQualification({...newOccupationalQualification, [k]: t==='number'?(parseInt(e.target.value)||0):e.target.value})} />
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowOccupationalQualificationModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateOccupationalQualification} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showLegacyQualificationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <h5 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 700 }}>Add Legacy Qualification</h5>
              <button onClick={() => setShowLegacyQualificationModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{l:'Qualification ID',k:'qualificationId',t:'number'},{l:'Name',k:'name',t:'text'},{l:'Description',k:'description',t:'text'},{l:'Level',k:'level',t:'number'},{l:'Credits',k:'credits',t:'number'},{l:'Qualification Type',k:'qualificationType',t:'text'}].map(({l,k,t}) => (
                <div key={k}><label style={S.label}>{l}</label><input type={t} style={S.input} value={(newLegacyQualification as Record<string,unknown>)[k] as string} onChange={(e) => setNewLegacyQualification({...newLegacyQualification,[k]:t==='number'?(parseInt(e.target.value)||0):e.target.value})} /></div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowLegacyQualificationModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateLegacyQualification} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showOccupationalUnitStandardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <h5 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 700 }}>Add Unit Standard</h5>
              <button onClick={() => setShowOccupationalUnitStandardModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{l:'Module Code',k:'moduleCode',t:'text'},{l:'Unit Standard Name',k:'unitStandardName',t:'text'},{l:'Module Type',k:'moduleType',t:'text'},{l:'Level',k:'level',t:'number'},{l:'Credits',k:'credits',t:'number'}].map(({l,k,t}) => (
                <div key={k}><label style={S.label}>{l}</label><input type={t} style={S.input} value={(newOccupationalUnitStandard as Record<string,unknown>)[k] as string} onChange={(e) => setNewOccupationalUnitStandard({...newOccupationalUnitStandard,[k]:t==='number'?(parseInt(e.target.value)||0):e.target.value})} /></div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowOccupationalUnitStandardModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateOccupationalUnitStandard} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showLegacyUnitStandardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <h5 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 700 }}>Add Legacy Unit Standard</h5>
              <button onClick={() => setShowLegacyUnitStandardModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{l:'Unit Standard ID',k:'unitStandardId',t:'number'},{l:'Unit Standard Name',k:'unitStandardName',t:'text'},{l:'Level',k:'level',t:'number'},{l:'Credits',k:'credits',t:'number'}].map(({l,k,t}) => (
                <div key={k}><label style={S.label}>{l}</label><input type={t} style={S.input} value={(newLegacyUnitStandard as Record<string,unknown>)[k] as string} onChange={(e) => setNewLegacyUnitStandard({...newLegacyUnitStandard,[k]:t==='number'?(parseInt(e.target.value)||0):e.target.value})} /></div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowLegacyUnitStandardModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateLegacyUnitStandard} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;