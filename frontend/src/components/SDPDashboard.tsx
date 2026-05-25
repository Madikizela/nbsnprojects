import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { southAfricaData, type District, type Municipality } from '../data/southAfricaData';
import ProjectForm from './ProjectForm';

interface Project {
  id: number;
  projectName: string;
  contractNumber: string;
  description?: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  numberOfBeneficiaries: number;
  province: string;
  projectFunder: string;
  leadEmployerPartner: string;
  skillsDevelopmentProviderId: number;
  budgetAmount: number;
  clientId: number;
  status?: string;
  // Project Resources
  hasPPE?: boolean;
  hasLearningMaterial?: boolean;
  hasToolkit?: boolean;
  hasConsumables?: boolean;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    name: string;
  };
  skillsDevelopmentProvider?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
  description?: string;
  type: number;
  managerFirstName: string;
  managerSurname: string;
  managerEmail: string;
  skillsDevelopmentProviderId: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string; // Some parts of the app use 'name'
  email: string;
  role: string | number;
  status: string | number;
  clientId: number | null;
  clientName: string | null;
  skillsDevelopmentProviderId: number | null;
  skillsDevelopmentProviderName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  department?: {
    id: number;
    name: string;
  };
  projectCount?: number;
  activeProjectCount?: number;
  departmentCount?: number;
  userType?: string;
}

interface SDPFormData {
  sdpName: string;
  registrationNumber: string;
  businessDescription: string;
  accreditationNumber: string;
  beneficiaries: string;
  physicalAddress: string;
  emailAddress: string;
  phoneNumber: string;
  contactPerson: string;
  website: string;
}

interface BudgetLineItem {
  id: string;
  category: string;
  description: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  isEditable: boolean;
}

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  allocatedBudget: number;
  spentBudget: number;
  remainingBudget: number;
  startDate: string;
  endDate: string;
  lineItems: BudgetLineItem[];
}

interface ProjectBudget {
  projectId: number;
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  remainingBudget: number;
  numberOfPhases: number;
  phases: ProjectPhase[];
}

const SDPDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sdps, setSdps] = useState<any[]>([]);
  const [filteredSdps, setFilteredSdps] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'departments' | 'add-department' | 'update-project' | 'budget-management' | 'add-project' | 'users'>('overview');
  const [selectedSdp, setSelectedSdp] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Side panel and project states
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Department form state
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    description: '',
    type: 1,
    managerFirstName: '',
    managerSurname: '',
    managerEmail: ''
  });

  // Project form state
  const [projectFormData, setProjectFormData] = useState({
    projectName: '',
    contractNumber: '',
    description: '',
    financialYear: '',
    startDate: '',
    endDate: '',
    numberOfBeneficiaries: 0,
    province: '',
    projectFunder: '',
    leadEmployerPartner: '',
    budgetAmount: 0,
    status: 'active',
    // New editable fields for SDP users
    qualificationStartDate: '',
    qualificationEndDate: '',
    stipendType: 'Dynamic',
    stipendAmount: 0,
    includeUIF: 'Yes',
    additionalDetails: ''
  });

  // Budget management state
  const [projectBudget, setProjectBudget] = useState<ProjectBudget | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [newLineItem, setNewLineItem] = useState({
    category: '',
    description: '',
    allocatedAmount: 0
  });

  // Phase management state
  const [numberOfPhases, setNumberOfPhases] = useState(1);
  const [activePhase, setActivePhase] = useState<string>('');
  const [phaseSetupComplete, setPhaseSetupComplete] = useState(false);
  const [newPhase, setNewPhase] = useState({
    name: '',
    description: '',
    allocatedBudget: 0,
    startDate: '',
    endDate: ''
  });

  // Per-learner cost settings (per phase)
  const [perLearnerCosts, setPerLearnerCosts] = useState({
    ppeCost: 0,
    learningMaterialCost: 0,
    toolkitCost: 0,
    consumablesCost: 0
  });

  // Form state
  const [sdpFormData, setSdpFormData] = useState<SDPFormData>({
    sdpName: '',
    registrationNumber: '',
    businessDescription: '',
    accreditationNumber: '',
    beneficiaries: '',
    physicalAddress: '',
    emailAddress: '',
    phoneNumber: '',
    contactPerson: '',
    website: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<Municipality[]>([]);

  // Initialize user data
  useEffect(() => {
    console.log('SDPDashboard: Initializing user data...');
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Robust check for sdpId with multiple possible property names
         const sdpId = parsedUser.skillsDevelopmentProviderId ?? 
                       parsedUser.SkillsDevelopmentProviderId ?? 
                       parsedUser.sdpId ?? 
                       parsedUser.SDPId ??
                       parsedUser.skillsDevelopmentProvider?.id ??
                       parsedUser.SkillsDevelopmentProvider?.Id;
        
        const normalizedUser = {
          ...parsedUser,
          skillsDevelopmentProviderId: sdpId
        };
        
        console.log('SDPDashboard: User data loaded and normalized:', normalizedUser);
        setUser(normalizedUser);
      } catch (error) {
        console.error('SDPDashboard: Error parsing user data:', error);
      }
    } else {
      console.log('SDPDashboard: No user data found in localStorage');
    }
    setLoading(false);
  }, []);

  // Fetch projects and departments for SDP users
  useEffect(() => {
    const fetchSDPData = async () => {
      const sdpId = user?.skillsDevelopmentProviderId;
      console.log('SDPDashboard: fetchSDPData check:', { sdpId, user });

      if (sdpId) {
        setDataLoading(true);
        setProjectsLoading(true);
        setDepartmentsLoading(true);
        
        try {
          const token = localStorage.getItem('token');
          
          // Fetch projects for this SDP
          const projectsResponse = await fetch(`/api/sdp/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData.projects || []);
          } else {
            console.error('Failed to fetch projects');
            setProjects([]);
          }
          
          // Fetch departments for this SDP
          const departmentsResponse = await fetch(`/api/SkillsDevelopmentProviders/${user.skillsDevelopmentProviderId}/Departments`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (departmentsResponse.ok) {
            const departmentsData = await departmentsResponse.json();
            setDepartments(departmentsData);
          } else {
            console.error('Failed to fetch departments');
            setDepartments([]);
          }

          // Fetch users for this SDP
          const usersResponse = await fetch(`/api/Users/BySDP/${user.skillsDevelopmentProviderId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData);
          } else {
            console.error('Failed to fetch users');
            setUsers([]);
          }
          
        } catch (error) {
          console.error('Error fetching SDP data:', error);
          setProjects([]);
          setDepartments([]);
          setUsers([]);
        } finally {
          setDataLoading(false);
          setProjectsLoading(false);
          setDepartmentsLoading(false);
          setUsersLoading(false);
        }
      }
    };

    fetchSDPData();
  }, [user?.skillsDevelopmentProviderId]);

  // Fetch projects when activeSection changes to projects
  useEffect(() => {
    if (activeSection === 'projects' && user?.skillsDevelopmentProviderId) {
      const fetchProjectsForActiveSection = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setProjectsLoading(true);
        try {
          const projectsResponse = await fetch(`/api/sdp/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData.projects || []);
          }
        } catch (error) {
          console.error('Error fetching projects for section:', error);
        } finally {
          setProjectsLoading(false);
        }
      };

      fetchProjectsForActiveSection();
    }
  }, [activeSection, user?.skillsDevelopmentProviderId]);

  // Fetch users when activeSection changes to users
  useEffect(() => {
    if (activeSection === 'users' && user?.skillsDevelopmentProviderId) {
      const fetchUsersForActiveSection = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setUsersLoading(true);
        try {
          const usersResponse = await fetch(`/api/Users/BySDP/${user.skillsDevelopmentProviderId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData);
          }
        } catch (error) {
          console.error('Error fetching users for section:', error);
        } finally {
          setUsersLoading(false);
        }
      };

      fetchUsersForActiveSection();
    }
  }, [activeSection, user?.skillsDevelopmentProviderId]);

  // Filter SDPs based on search and status
  useEffect(() => {
    let filtered = sdps;

    if (searchTerm) {
      filtered = filtered.filter((sdp: any) =>
        sdp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sdp.contactPerson && sdp.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sdp.description && sdp.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sdp => sdp.status.toString() === statusFilter);
    }

    setFilteredSdps(filtered);
  }, [sdps, searchTerm, statusFilter]);

  // Handle province selection
  useEffect(() => {
    if (selectedProvince) {
      const province = southAfricaData.find(p => p.id.toString() === selectedProvince);
      setAvailableDistricts(province?.districts || []);
      setSelectedDistrict('');
      setSelectedMunicipality('');
      setAvailableMunicipalities([]);
    }
  }, [selectedProvince]);

  // Handle district selection
  useEffect(() => {
    if (selectedDistrict) {
      const district = availableDistricts.find(d => d.id.toString() === selectedDistrict);
      setAvailableMunicipalities(district?.municipalities || []);
      setSelectedMunicipality('');
    }
  }, [selectedDistrict, availableDistricts]);

  // Fetch projects when SDP is selected
  useEffect(() => {
    const fetchProjects = async () => {
      if (selectedSdp?.id) {
        setProjectsLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/sdp/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setProjects(data.projects || []);
          } else {
            console.error('Failed to fetch projects');
            setProjects([]);
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
          setProjects([]);
        } finally {
          setProjectsLoading(false);
        }
      }
    };

    fetchProjects();
  }, [selectedSdp?.id]);

  // Fetch departments when SDP is selected
  useEffect(() => {
    const fetchDepartments = async () => {
      if (selectedSdp?.id) {
        setDepartmentsLoading(true);
        try {
          const token = localStorage.getItem('token');
          // Match backend route: GET api/Departments/BySDP/{sdpId}
          const response = await fetch(`/api/Departments/BySDP/${selectedSdp.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setDepartments(data);
          } else {
            console.error('Failed to fetch departments');
            setDepartments([]);
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
          setDepartments([]);
        } finally {
          setDepartmentsLoading(false);
        }
      }
    };

    fetchDepartments();
  }, [selectedSdp?.id]);

  // Handle adding new department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Try to get SDP ID from multiple sources
    const sdpId = selectedSdp?.id ?? 
                  user?.skillsDevelopmentProviderId ?? 
                  (user as any)?.SkillsDevelopmentProviderId ?? 
                  (user as any)?.sdpId ?? 
                  (user as any)?.SDPId ??
                  (projects.length > 0 ? projects[0].skillsDevelopmentProviderId : null);

    // Detailed validation
    const missingFields = [];
    if (!sdpId) {
      missingFields.push('SDP ID (Your session data is incomplete. Please try logging out and back in to refresh your account details)');
    }
    if (!departmentFormData.name.trim()) missingFields.push('Department Name');
    if (!departmentFormData.managerFirstName.trim()) missingFields.push('Manager First Name');
    if (!departmentFormData.managerSurname.trim()) missingFields.push('Manager Surname');
    if (!departmentFormData.managerEmail.trim()) missingFields.push('Manager Email');

    if (missingFields.length > 0) {
      const errorMsg = `Please fill in all required fields:\n- ${missingFields.join('\n- ')}`;
      alert(errorMsg);
      console.warn('Validation failed. Context:', {
        sdpId,
        user,
        selectedSdp,
        formData: departmentFormData
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/Departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: departmentFormData.name.trim(),
          description: departmentFormData.description.trim(),
          type: departmentFormData.type,
          managerFirstName: departmentFormData.managerFirstName.trim(),
          managerSurname: departmentFormData.managerSurname.trim(),
          managerEmail: departmentFormData.managerEmail.trim(),
          skillsDevelopmentProviderId: sdpId
        })
      });

      if (response.ok) {
        let newDepartment;
        const text = await response.text();
        try {
          newDepartment = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error('Failed to parse success response as JSON:', e);
          newDepartment = {};
        }
        
        setDepartments(prev => [...prev, newDepartment]);
        setDepartmentFormData({ 
          name: '', 
          description: '', 
          type: 1,
          managerFirstName: '',
          managerSurname: '',
          managerEmail: ''
        });
        setActiveSection('departments');
        alert('Department added successfully! The manager will receive login credentials via email.');
      } else {
        const text = await response.text();
        let errorMessage = 'Unknown error';
        try {
          const errorData = text ? JSON.parse(text) : {};
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
          errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}...`;
        }
        alert(`Failed to add department: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error adding department:', error);
      alert('An error occurred while adding the department. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating project
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject?.id) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // Only send the fields that SDP users are allowed to edit
      const sdpUpdateData = {
        id: selectedProject.id,
        status: projectFormData.status,
        qualificationStartDate: projectFormData.qualificationStartDate,
        qualificationEndDate: projectFormData.qualificationEndDate,
        stipendType: projectFormData.stipendType,
        stipendAmount: projectFormData.stipendAmount,
        includeUIF: projectFormData.includeUIF,
        additionalDetails: projectFormData.additionalDetails,
        // Keep original project data unchanged
        projectName: selectedProject.projectName,
        contractNumber: selectedProject.contractNumber,
        description: selectedProject.description,
        financialYear: selectedProject.financialYear,
        startDate: selectedProject.startDate,
        endDate: selectedProject.endDate,
        numberOfBeneficiaries: selectedProject.numberOfBeneficiaries,
        province: selectedProject.province,
        projectFunder: selectedProject.projectFunder,
        leadEmployerPartner: selectedProject.leadEmployerPartner,
        budgetAmount: selectedProject.budgetAmount,
        skillsDevelopmentProviderId: selectedProject.skillsDevelopmentProviderId,
        clientId: selectedProject.clientId
      };

      const response = await fetch(`/api/Projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sdpUpdateData)
      });

      if (response.ok) {
        let updatedProject;
        const text = await response.text();
        try {
          updatedProject = text ? JSON.parse(text) : null;
        } catch (e) {
          console.error('Failed to parse update response as JSON:', e);
          updatedProject = null;
        }

        if (updatedProject) {
          setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        } else {
          // If the server returned 204 NoContent or invalid JSON, we use our local data
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...sdpUpdateData } as Project : p));
        }
        
        setSelectedProject(null);
        setActiveSection('projects');
        alert('Project updated successfully! Your changes have been saved.');
      } else {
        const text = await response.text();
        let errorMessage = 'Unknown error';
        try {
          const errorData = text ? JSON.parse(text) : {};
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse update error response as JSON:', e);
          errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}...`;
        }
        alert(`Failed to update project: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('An error occurred while updating the project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open project update modal
  const openUpdateProjectModal = (project: Project) => {
    setSelectedProject(project);
    setProjectFormData({
      projectName: project.projectName || '',
      contractNumber: project.contractNumber || '',
      description: project.description || '',
      financialYear: project.financialYear || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '', // Format for date input
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      numberOfBeneficiaries: project.numberOfBeneficiaries || 0,
      province: project.province || '',
      projectFunder: project.projectFunder || '',
      leadEmployerPartner: project.leadEmployerPartner || '',
      budgetAmount: project.budgetAmount || 0,
      status: project.status || 'active',
      // Initialize new fields with defaults
      qualificationStartDate: project.startDate ? project.startDate.split('T')[0] : '',
      qualificationEndDate: project.endDate ? project.endDate.split('T')[0] : '',
      stipendType: 'Dynamic',
      stipendAmount: 0,
      includeUIF: 'Yes',
      additionalDetails: ''
    });
    setActiveSection('update-project');
  };

  const handleInputChange = (field: keyof SDPFormData, value: string) => {
    setSdpFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!sdpFormData.sdpName.trim()) {
      errors.sdpName = 'SDP name is required';
    }

    if (!sdpFormData.emailAddress.trim()) {
      errors.emailAddress = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(sdpFormData.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
    }

    if (!sdpFormData.contactPerson.trim()) {
      errors.contactPerson = 'Contact person is required';
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user?.clientId) {
      alert('Your account is not linked to a client. Please log in with a client account.');
      return;
    }

    setIsSubmitting(true);

    try {
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

      const result = await response.json();

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
          website: ''
        });
        setSelectedProvince('');
        setSelectedDistrict('');
        setSelectedMunicipality('');
        setFormErrors({});
        
        alert(`SDP registered successfully! ${result.message}`);
        setActiveSection('overview');
        
        // Refresh SDP list
        window.location.reload();
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

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <span className="badge bg-success">Active</span>;
      case 2:
        return <span className="badge bg-secondary">Inactive</span>;
      case 3:
        return <span className="badge bg-warning">Suspended</span>;
      case 4:
        return <span className="badge bg-info">Pending Approval</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="row g-4">
      <div className="col-12">
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <h2 className="mb-3">Welcome to Your SDP Dashboard</h2>
            <p className="mb-4 opacity-75">Manage your Skills Development Provider operations</p>
            
            {/* Super User Action Section */}
             {(user?.skillsDevelopmentProviderId && (!user?.departmentId || user?.departmentId === 0)) && (
               <div className="mt-4">
                 <h5 className="mb-3 text-white opacity-90">Select Manager Functional Area:</h5>
                 <div className="d-flex flex-wrap justify-content-center gap-3">
                   <button 
                     onClick={() => navigate('/sdp-manager-dashboard', { state: { section: 'projects' } })}
                     className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                     style={{ borderRadius: '12px', padding: '10px 20px', color: '#667eea' }}
                   >
                     <span>🏢</span> Logistics & Sites
                   </button>
                   <button 
                     onClick={() => navigate('/sdp-manager-dashboard', { state: { section: 'attendanceTracking' } })}
                     className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                     style={{ borderRadius: '12px', padding: '10px 20px', color: '#667eea' }}
                   >
                     <span>📊</span> Attendance Tracking
                   </button>
                   <button 
                     onClick={() => navigate('/sdp-manager-dashboard', { state: { section: 'marking' } })}
                     className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                     style={{ borderRadius: '12px', padding: '10px 20px', color: '#667eea' }}
                   >
                     <span>⚖️</span> Quality Assurance
                   </button>
                   <button 
                     onClick={() => navigate('/sdp-manager-dashboard', { state: { section: 'documentApprovals' } })}
                     className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                     style={{ borderRadius: '12px', padding: '10px 20px', color: '#667eea' }}
                   >
                     <span>📋</span> Document Approvals
                   </button>
                   <button 
                     onClick={() => navigate('/sdp-manager-dashboard', { state: { section: 'allUsers' } })}
                     className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                     style={{ borderRadius: '12px', padding: '10px 20px', color: '#667eea' }}
                   >
                     <span>💻</span> IT Management
                   </button>
                   <button 
                     onClick={() => navigate('/sdp-manager-dashboard', { state: { section: 'sickNotes' } })}
                     className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                     style={{ borderRadius: '12px', padding: '10px 20px', color: '#667eea' }}
                   >
                     <span>🤒</span> Finance
                   </button>
                 </div>
                 <p className="mt-3 small opacity-75">You have full access to all manager dashboards</p>

                 <div className="mt-4 pt-4 border-top border-light border-opacity-25">
                   <h5 className="mb-3 text-white opacity-90">Organization Management:</h5>
                   <div className="d-flex flex-wrap justify-content-center gap-3">
                     <button 
                       onClick={() => setActiveSection('add-department')}
                       className="btn btn-outline-light shadow-sm fw-bold d-flex align-items-center gap-2"
                       style={{ borderRadius: '12px', padding: '10px 20px' }}
                     >
                       <span>👤</span> Add Department Manager
                     </button>
                     <button 
                       onClick={() => setActiveSection('departments')}
                       className="btn btn-outline-light shadow-sm fw-bold d-flex align-items-center gap-2"
                       style={{ borderRadius: '12px', padding: '10px 20px' }}
                     >
                       <span>🏢</span> Manage Departments
                     </button>
                     <button 
                       onClick={() => setActiveSection('add-project')}
                       className="btn btn-outline-light shadow-sm fw-bold d-flex align-items-center gap-2"
                       style={{ borderRadius: '12px', padding: '10px 20px' }}
                     >
                       <span>➕</span> Create New Project
                     </button>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card border-0 shadow-lg h-100" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center">
            <div className="display-4 mb-3">📋</div>
            <h4 className="mb-2">{user?.activeProjectCount || user?.projectCount || projects.length}</h4>
            <p className="mb-0 opacity-75">Active Projects</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card border-0 shadow-lg h-100" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center">
            <div className="display-4 mb-3">🏢</div>
            <h4 className="mb-2">{user?.departmentCount || departments.length}</h4>
            <p className="mb-0 opacity-75">Departments</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card border-0 shadow-lg h-100" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center">
            <div className="display-4 mb-3">👤</div>
            <h4 className="mb-2">{users.length}</h4>
            <p className="mb-0 opacity-75">SDP Users</p>
          </div>
        </div>
      </div>
      
      <div className="col-12">
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <h5 className="mb-0">SDP Information</h5>
          </div>
          <div className="card-body text-white">
            <div className="row">
              <div className="col-md-6">
                <p><strong>SDP Name:</strong> {user?.skillsDevelopmentProviderName}</p>
                <p><strong>User Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>Status:</strong> <span className="badge bg-light text-dark">{user?.status}</span></p>
                <p><strong>Department:</strong> {user?.departmentName || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body d-flex justify-content-between align-items-center text-white py-4">
          <div>
            <h2 className="mb-2">Projects</h2>
            <p className="mb-0 opacity-75">Manage your SDP projects</p>
          </div>
          <button
            onClick={() => setActiveSection('add-project')}
            className="btn btn-light"
          >
            ➕ Add Project
          </button>
        </div>
      </div>
      
      {projectsLoading ? (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="spinner-border text-white" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0">Loading projects...</p>
          </div>
        </div>
      ) : projects.length > 0 ? (
        <div className="row g-4">
          {projects.map((project) => (
            <div key={project.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-lg" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="card-body text-white">
                  <h5 className="card-title mb-3">{project.projectName}</h5>
                  <p className="card-text">
                    <small className="opacity-75">Contract: {project.contractNumber}</small>
                  </p>
                  {project.description && (
                    <p className="card-text">{project.description}</p>
                  )}
                  <div className="mb-3">
                    <small className="opacity-75">
                      Start: {new Date(project.startDate).toLocaleDateString()}
                    </small><br />
                    <small className="opacity-75">
                      End: {new Date(project.endDate).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="mb-3">
                    <span className={`badge ${project.status === 'active' ? 'bg-light text-dark' : 'bg-secondary'}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={() => openUpdateProjectModal(project)}
                      className="btn btn-light btn-sm w-100"
                    >
                      ✏️ Update Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">📋</div>
            <h3 className="mb-3">No Projects Found</h3>
            <p className="mb-0 opacity-75">No projects are currently linked to your SDP.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderDepartments = () => (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body d-flex justify-content-between align-items-center text-white py-4">
          <div>
            <h2 className="mb-2">Departments</h2>
            <p className="mb-0 opacity-75">Manage your SDP departments</p>
          </div>
          <button
            onClick={() => setActiveSection('add-department')}
            className="btn btn-light"
          >
            ➕ Add Department
          </button>
        </div>
      </div>
      
      {departmentsLoading ? (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="spinner-border text-white" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0">Loading departments...</p>
          </div>
        </div>
      ) : departments.length > 0 ? (
        <div className="row g-4">
          {departments.map((department) => (
            <div key={department.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-lg" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="card-body text-white">
                  <h5 className="card-title mb-3">{department.name}</h5>
                  {department.description && (
                    <p className="card-text mb-2">{department.description}</p>
                  )}
                  <div className="mb-3">
                    <small className="opacity-75">
                      <strong>Manager:</strong> {department.managerFirstName} {department.managerSurname}
                    </small><br />
                    <small className="opacity-75">
                      <strong>Email:</strong> {department.managerEmail}
                    </small>
                  </div>
                  <div className="mt-auto">
                    <small className="opacity-75">
                      Created: {new Date(department.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">🏢</div>
            <h3 className="mb-3">No Departments Found</h3>
            <p className="mb-4 opacity-75">You haven't created any departments yet.</p>
            <button
              onClick={() => setActiveSection('add-department')}
              className="btn btn-light"
            >
              Add Your First Department
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderUpdateProject = () => (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <h3 className="mb-0">✏️ Update Project</h3>
            {selectedProject && (
              <small className="opacity-75">Project ID: {selectedProject.id}</small>
            )}
          </div>
          <div className="card-body text-white" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <form onSubmit={handleUpdateProject}>
              {/* Basic Project Information - READ ONLY */}
              <div className="mb-4">
                <h5 className="text-white mb-3 border-bottom border-light pb-2">📋 Project Information (Read Only)</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-white">Project Name</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.projectName}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Contract Number</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.contractNumber}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-12">
                    <label className="form-label text-white">Description</label>
                    <textarea
                      className="form-control text-dark"
                      rows={3}
                      value={projectFormData.description || 'No description provided'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Financial Year</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.financialYear || 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Current Status</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.status || 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                </div>
                <div className="alert alert-info mt-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <small className="text-white">
                    ℹ️ These fields contain the original project information and cannot be modified by SDP users.
                  </small>
                </div>
              </div>

              {/* Project Timeline */}
              <div className="mb-4">
                <h5 className="text-white mb-3 border-bottom border-light pb-2">📅 Project Timeline</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-white">Project Start Date (Read Only)</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.startDate ? new Date(projectFormData.startDate).toLocaleDateString() : 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Project End Date (Read Only)</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.endDate ? new Date(projectFormData.endDate).toLocaleDateString() : 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Qualification Start Date (Editable)</label>
                    <input
                      type="date"
                      className="form-control bg-light text-dark"
                      value={projectFormData.qualificationStartDate}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, qualificationStartDate: e.target.value }))}
                    />
                    <div className="form-text text-white opacity-75">
                      Set when qualifications/training will begin
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Qualification End Date (Editable)</label>
                    <input
                      type="date"
                      className="form-control bg-light text-dark"
                      value={projectFormData.qualificationEndDate}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, qualificationEndDate: e.target.value }))}
                    />
                    <div className="form-text text-white opacity-75">
                      Set when qualifications/training will end
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details - READ ONLY */}
              <div className="mb-4">
                <h5 className="text-white mb-3 border-bottom border-light pb-2">📊 Project Details (Read Only)</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-white">Planned Beneficiaries</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.numberOfBeneficiaries || 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Budget Amount</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.budgetAmount ? `R ${projectFormData.budgetAmount.toLocaleString()}` : 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Province</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.province || 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Project Funder</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.projectFunder || 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                  
                  <div className="col-12">
                    <label className="form-label text-white">Lead Employer Partner</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={projectFormData.leadEmployerPartner || 'Not specified'}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                  </div>
                </div>
              </div>

              {/* SDP Editable Fields */}
              <div className="mb-4">
                <h5 className="text-white mb-3 border-bottom border-success pb-2">💰 SDP Management Fields (Editable)</h5>
                <div className="alert alert-success" style={{ backgroundColor: 'rgba(40, 167, 69, 0.2)', border: '1px solid rgba(40, 167, 69, 0.3)' }}>
                  <small className="text-white">
                    ✏️ These fields can be updated by SDP users to manage project delivery details.
                  </small>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-white">Stipend Type *</label>
                    <select
                      className="form-select bg-light text-dark"
                      value={projectFormData.stipendType}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, stipendType: e.target.value }))}
                      required
                    >
                      <option value="Dynamic">Dynamic</option>
                      <option value="Fixed">Fixed</option>
                      <option value="Performance-based">Performance-based</option>
                    </select>
                    <div className="form-text text-white opacity-75">
                      Select the type of stipend structure for beneficiaries
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Stipend Amount *</label>
                    <input
                      type="number"
                      className="form-control bg-light text-dark"
                      value={projectFormData.stipendAmount}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, stipendAmount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                    <div className="form-text text-white opacity-75">
                      Enter the stipend amount per beneficiary (in Rands)
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white">Number of Learners (Auto-populated)</label>
                    <input
                      type="text"
                      className="form-control text-dark"
                      value={`${selectedProject?.numberOfBeneficiaries || 0} learners`}
                      readOnly
                      style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                    />
                    <div className="form-text text-white opacity-75">
                      📋 This value is automatically taken from the project's planned beneficiaries
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="alert alert-info" style={{ backgroundColor: 'rgba(23, 162, 184, 0.2)', border: '1px solid rgba(23, 162, 184, 0.3)' }}>
                      <small className="text-white">
                        💡 <strong>Budget Calculation:</strong> All per-learner costs (stipends, PPE, learning materials, toolkits, consumables) will be calculated based on the project's planned number of beneficiaries ({selectedProject?.numberOfBeneficiaries || 0} learners).
                      </small>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Include UIF *</label>
                    <select
                      className="form-select bg-light text-dark"
                      value={projectFormData.includeUIF}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, includeUIF: e.target.value }))}
                      required
                    >
                      <option value="Yes">Yes - Include UIF contributions</option>
                      <option value="No">No - Exclude UIF contributions</option>
                    </select>
                    <div className="form-text text-white opacity-75">
                      Specify whether UIF contributions should be included
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white">Project Status *</label>
                    <select
                      className="form-select bg-light text-dark"
                      value={projectFormData.status}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="form-text text-white opacity-75">
                      Update the current project status
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-4">
                <h5 className="text-white mb-3 border-bottom border-success pb-2">📝 Progress Notes & Additional Details (Editable)</h5>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-white">Progress Notes & Additional Details</label>
                    <textarea
                      className="form-control bg-light text-dark"
                      rows={4}
                      value={projectFormData.additionalDetails}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, additionalDetails: e.target.value }))}
                      placeholder="Enter project progress updates, notes, challenges, achievements, or any additional details relevant to project delivery..."
                    />
                    <div className="form-text text-white opacity-75">
                      Use this field to document project progress, challenges, achievements, and any other relevant information for project management.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="d-flex gap-2 mt-4 pt-3 border-top border-light">
                <button
                  type="submit"
                  className="btn btn-light px-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      💾 Update Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('budget-management');
                    loadBudgetData();
                  }}
                  className="btn btn-warning px-4"
                >
                  💰 Manage Budget
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('projects')}
                  className="btn btn-outline-light px-4"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body d-flex justify-content-between align-items-center text-white py-4">
          <div>
            <h2 className="mb-2">Users</h2>
            <p className="mb-0 opacity-75">View all users under your SDP</p>
          </div>
        </div>
      </div>
      
      {usersLoading ? (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="spinner-border text-white" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0">Loading users...</p>
          </div>
        </div>
      ) : users.length > 0 ? (
        <div className="card border-0 shadow-lg overflow-hidden" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 text-white">
              <thead style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <tr>
                  <th className="border-0 py-3">Name</th>
                  <th className="border-0 py-3">Email</th>
                  <th className="border-0 py-3">Role</th>
                  <th className="border-0 py-3">Department</th>
                  <th className="border-0 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ backgroundColor: 'transparent' }}>
                    <td className="border-0 py-3 text-white">
                      {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.name || 'Unknown')}
                    </td>
                    <td className="border-0 py-3 text-white">{u.email}</td>
                    <td className="border-0 py-3 text-white">
                      <span className="badge bg-light text-dark">
                        {u.role === 3 || u.role === '3' ? 'SDP Administrator' : 
                         u.role === 4 || u.role === '4' ? 'SDP Finance' : 
                         u.role === 5 || u.role === '5' ? 'SDP Logistics' : 
                         u.role === 7 || u.role === '7' ? 'SDP Moderator' : 
                         u.role === 8 || u.role === '8' ? 'SDP Assessor' : 
                         u.role === 9 || u.role === '9' ? 'SDP Facilitator' : 
                         u.role === 10 || u.role === '10' ? 'Learner' : 
                         u.role === 16 || u.role === '16' ? 'Teacher' : u.role}
                      </span>
                    </td>
                    <td className="border-0 py-3 text-white">
                      {u.departmentName || u.department?.name || 'Not assigned'}
                    </td>
                    <td className="border-0 py-3 text-white">
                      <span className={`badge ${u.status === 1 || u.status === '1' || u.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {u.status === 1 || u.status === '1' || u.status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">👤</div>
            <h3 className="mb-3">No Users Found</h3>
            <p className="mb-0 opacity-75">No users are currently linked to your SDP.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAddProject = () => (
    <div className="container-fluid">
      <div className="card text-white mb-4 border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="card-body p-4">
          <h2 className="card-title h3 mb-2">Add New Project ➕</h2>
          <p className="card-text opacity-90">Create a new project for your SDP</p>
        </div>
      </div>
      
      <div className="card border-0 shadow-lg p-4">
        <ProjectForm
          onCancel={() => setActiveSection('projects')}
          onSubmit={() => {
            setActiveSection('projects');
            // Refresh projects list
            window.location.reload();
          }}
          skillsDevelopmentProviderId={selectedSdp?.id || user?.skillsDevelopmentProviderId || 0}
          clientId={selectedSdp?.clientId || user?.clientId || 0}
        />
      </div>
    </div>
  );

  const renderAddDepartment = () => (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <h3 className="mb-0">➕ Add Department</h3>
            <p className="text-white-50 mb-0 small">* Required fields</p>
          </div>
          <div className="card-body text-white" style={{ maxHeight: '75vh', overflowY: 'auto', paddingBottom: '2rem' }}>
            <form onSubmit={handleAddDepartment}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-white">Department Type *</label>
                  <select
                    className="form-select bg-light text-dark"
                    value={departmentFormData.type}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, type: parseInt(e.target.value) }))}
                    required
                  >
                    <option key="type-1" value={1}>Administrator Manager</option>
                    <option key="type-2" value={2}>Logistic Manager</option>
                    <option key="type-3" value={3}>Financial Manager</option>
                    <option key="type-4" value={4}>Quality Assurance Manager</option>
                    <option key="type-5" value={5}>IT Manager</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label text-white">Department Name *</label>
                  <select
                    className="form-select bg-light text-dark"
                    value={departmentFormData.name}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  >
                    <option key="name-default" value="">Select Department Name</option>
                    <option key="name-logistic" value="Logistic">Logistic</option>
                    <option key="name-finance" value="Finance">Finance</option>
                    <option key="name-qa" value="Quality Assurance">Quality Assurance</option>
                    <option key="name-admin" value="Administration">Administration</option>
                    <option key="name-it" value="IT">IT</option>
                  </select>
                </div>
                
                <div className="col-12">
                  <label className="form-label text-white">Description</label>
                  <textarea
                    className="form-control bg-light text-dark"
                    rows={3}
                    value={departmentFormData.description}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="col-12">
                  <hr className="border-light opacity-50" />
                  <h5 className="text-white mb-3">Department Manager Information</h5>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-white">Manager First Name *</label>
                  <input
                    type="text"
                    className="form-control bg-light text-dark"
                    value={departmentFormData.managerFirstName}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, managerFirstName: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-white">Manager Surname *</label>
                  <input
                    type="text"
                    className="form-control bg-light text-dark"
                    value={departmentFormData.managerSurname}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, managerSurname: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-white">Manager Email *</label>
                  <input
                    type="email"
                    className="form-control bg-light text-dark"
                    placeholder="Enter manager's email address"
                    value={departmentFormData.managerEmail}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                    required
                  />
                  <div className="form-text text-white opacity-75">
                    The manager will receive login credentials at this email address. This email will be used as their username.
                  </div>
                </div>
              </div>
              
              <div className="d-flex gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-light"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Department'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('departments')}
                  className="btn btn-outline-light"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Initialize budget data for a project with phases
  const initializeBudget = (project: Project): ProjectBudget => {
    if (!phaseSetupComplete) {
      // Return empty budget structure until phases are set up
      return {
        projectId: project.id,
        totalBudget: project.budgetAmount,
        totalAllocated: 0,
        totalSpent: 0,
        remainingBudget: project.budgetAmount,
        numberOfPhases: numberOfPhases,
        phases: []
      };
    }

    // If phases are set up, use existing phase data
    const phases = projectBudget?.phases || [];
    const totalAllocated = phases.reduce((sum, phase) => sum + phase.allocatedBudget, 0);
    
    return {
      projectId: project.id,
      totalBudget: project.budgetAmount,
      totalAllocated,
      totalSpent: phases.reduce((sum, phase) => sum + phase.spentBudget, 0),
      remainingBudget: project.budgetAmount - totalAllocated,
      numberOfPhases: numberOfPhases,
      phases: phases
    };
  };

  // Create line items for a phase
  const createPhaseLineItems = (project: Project, phaseBudget: number): BudgetLineItem[] => {
    const actualLearners = project.numberOfBeneficiaries || 0;
    const lineItems: BudgetLineItem[] = [];

    // Calculate proportional amounts based on phase budget
    const totalProjectCost = (projectFormData.stipendAmount || 0) * actualLearners * 4 +
      (project.hasPPE ? perLearnerCosts.ppeCost * actualLearners : 0) +
      (project.hasLearningMaterial ? perLearnerCosts.learningMaterialCost * actualLearners : 0) +
      (project.hasToolkit ? perLearnerCosts.toolkitCost * actualLearners : 0) +
      (project.hasConsumables ? perLearnerCosts.consumablesCost * actualLearners : 0);

    const budgetRatio = totalProjectCost > 0 ? phaseBudget / totalProjectCost : 0;

    // Always include stipends
    const stipendTotal = (projectFormData.stipendAmount || 0) * actualLearners * (4 / numberOfPhases); // Divide by phases
    lineItems.push({
      id: 'stipend',
      category: 'Stipends',
      description: `Learner stipends for this phase (${actualLearners} learners × R${projectFormData.stipendAmount || 0} × ${4 / numberOfPhases} months)`,
      allocatedAmount: stipendTotal * budgetRatio,
      spentAmount: 0,
      remainingAmount: stipendTotal * budgetRatio,
      isEditable: false
    });

    // Add resource line items if enabled
    if (project.hasPPE) {
      const ppeTotal = (perLearnerCosts.ppeCost * actualLearners) / numberOfPhases;
      lineItems.push({
        id: 'ppe',
        category: 'PPE',
        description: `Personal Protective Equipment for this phase`,
        allocatedAmount: ppeTotal * budgetRatio,
        spentAmount: 0,
        remainingAmount: ppeTotal * budgetRatio,
        isEditable: true
      });
    }

    if (project.hasLearningMaterial) {
      const learningMaterialTotal = (perLearnerCosts.learningMaterialCost * actualLearners) / numberOfPhases;
      lineItems.push({
        id: 'learning-materials',
        category: 'Learning Materials',
        description: `Training materials for this phase`,
        allocatedAmount: learningMaterialTotal * budgetRatio,
        spentAmount: 0,
        remainingAmount: learningMaterialTotal * budgetRatio,
        isEditable: true
      });
    }

    if (project.hasToolkit) {
      const toolkitTotal = (perLearnerCosts.toolkitCost * actualLearners) / numberOfPhases;
      lineItems.push({
        id: 'toolkit',
        category: 'Toolkit',
        description: `Training toolkit for this phase`,
        allocatedAmount: toolkitTotal * budgetRatio,
        spentAmount: 0,
        remainingAmount: toolkitTotal * budgetRatio,
        isEditable: true
      });
    }

    if (project.hasConsumables) {
      const consumablesTotal = (perLearnerCosts.consumablesCost * actualLearners) / numberOfPhases;
      lineItems.push({
        id: 'consumables',
        category: 'Consumables',
        description: `Consumable materials for this phase`,
        allocatedAmount: consumablesTotal * budgetRatio,
        spentAmount: 0,
        remainingAmount: consumablesTotal * budgetRatio,
        isEditable: true
      });
    }

    return lineItems;
  };

  // Load budget data for selected project
  const loadBudgetData = () => {
    if (!selectedProject) return;
    
    setBudgetLoading(true);
    // In a real app, this would fetch from API
    // For now, we'll initialize with default data
    const budget = initializeBudget(selectedProject);
    setProjectBudget(budget);
    setBudgetLoading(false);
  };

  // Set up project phases
  const setupProjectPhases = () => {
    if (!selectedProject || numberOfPhases < 1) return;

    const budgetPerPhase = selectedProject.budgetAmount / numberOfPhases;
    const phases: ProjectPhase[] = [];

    for (let i = 1; i <= numberOfPhases; i++) {
      phases.push({
        id: `phase-${i}`,
        name: `Phase ${i}`,
        description: `Project phase ${i} of ${numberOfPhases}`,
        allocatedBudget: budgetPerPhase,
        spentBudget: 0,
        remainingBudget: budgetPerPhase,
        startDate: '',
        endDate: '',
        lineItems: createPhaseLineItems(selectedProject, budgetPerPhase)
      });
    }

    const budget: ProjectBudget = {
      projectId: selectedProject.id,
      totalBudget: selectedProject.budgetAmount,
      totalAllocated: selectedProject.budgetAmount,
      totalSpent: 0,
      remainingBudget: 0,
      numberOfPhases: numberOfPhases,
      phases: phases
    };

    setProjectBudget(budget);
    setPhaseSetupComplete(true);
    setActivePhase(phases[0].id);
  };

  // Add a new phase
  const addNewPhase = () => {
    if (!projectBudget || !selectedProject) return;

    const newPhaseId = `phase-${projectBudget.phases.length + 1}`;
    const phase: ProjectPhase = {
      id: newPhaseId,
      name: newPhase.name || `Phase ${projectBudget.phases.length + 1}`,
      description: newPhase.description || `Project phase ${projectBudget.phases.length + 1}`,
      allocatedBudget: newPhase.allocatedBudget,
      spentBudget: 0,
      remainingBudget: newPhase.allocatedBudget,
      startDate: newPhase.startDate,
      endDate: newPhase.endDate,
      lineItems: createPhaseLineItems(selectedProject, newPhase.allocatedBudget)
    };

    const updatedPhases = [...projectBudget.phases, phase];
    const totalAllocated = updatedPhases.reduce((sum, p) => sum + p.allocatedBudget, 0);

    setProjectBudget({
      ...projectBudget,
      phases: updatedPhases,
      numberOfPhases: updatedPhases.length,
      totalAllocated,
      remainingBudget: projectBudget.totalBudget - totalAllocated
    });

    // Reset new phase form
    setNewPhase({
      name: '',
      description: '',
      allocatedBudget: 0,
      startDate: '',
      endDate: ''
    });
  };

  // Update phase budget allocation
  const updatePhaseBudget = (phaseId: string, newBudget: number) => {
    if (!projectBudget) return;

    // Check if new budget would exceed total budget
    const otherPhasesTotal = projectBudget.phases
      .filter(p => p.id !== phaseId)
      .reduce((sum, p) => sum + p.allocatedBudget, 0);

    if (otherPhasesTotal + newBudget > projectBudget.totalBudget) {
      const maxAllowed = projectBudget.totalBudget - otherPhasesTotal;
      alert(`⚠️ Phase Budget Limit Exceeded!\n\nTotal budget: R${projectBudget.totalBudget.toLocaleString()}\nOther phases total: R${otherPhasesTotal.toLocaleString()}\nMaximum allowed for this phase: R${maxAllowed.toLocaleString()}`);
      return;
    }

    const updatedPhases = projectBudget.phases.map(phase => {
      if (phase.id === phaseId) {
        const newLineItems = selectedProject ? createPhaseLineItems(selectedProject, newBudget) : phase.lineItems;
        return {
          ...phase,
          allocatedBudget: newBudget,
          remainingBudget: newBudget - phase.spentBudget,
          lineItems: newLineItems
        };
      }
      return phase;
    });

    const totalAllocated = updatedPhases.reduce((sum, p) => sum + p.allocatedBudget, 0);

    setProjectBudget({
      ...projectBudget,
      phases: updatedPhases,
      totalAllocated,
      remainingBudget: projectBudget.totalBudget - totalAllocated
    });
  };

  // Update stipend calculation manually when needed
  const updateStipendCalculation = () => {
    if (projectBudget && selectedProject && projectFormData.stipendAmount > 0) {
      const stipendTotal = projectFormData.stipendAmount * selectedProject.numberOfBeneficiaries * 4; // 4 months
      
      const updatedLineItems = projectBudget.lineItems.map(item => {
        if (item.id === 'stipend') {
          return {
            ...item,
            allocatedAmount: stipendTotal,
            remainingAmount: stipendTotal - item.spentAmount,
            description: `Learner stipends for 4 months (${selectedProject.numberOfBeneficiaries} learners × R${projectFormData.stipendAmount} × 4 months)`
          };
        }
        return item;
      });

      const totalAllocated = updatedLineItems.reduce((sum, item) => sum + item.allocatedAmount, 0);
      const remainingBudget = projectBudget.totalBudget - totalAllocated;

      setProjectBudget({
        ...projectBudget,
        lineItems: updatedLineItems,
        totalAllocated,
        remainingBudget
      });
    }
  };

  // Validate per-learner cost changes (for phase-based budgets)
  const validatePerLearnerCostUpdate = (costType: keyof typeof perLearnerCosts, newCostPerLearner: number): boolean => {
    if (!selectedProject || !projectBudget || !phaseSetupComplete) return true; // Allow if phases not set up yet

    const learnerCount = selectedProject.numberOfBeneficiaries;
    const newTotalForThisCategory = newCostPerLearner * learnerCount;

    // For phase-based budgets, validate against total project budget
    const currentTotalAllocated = projectBudget.phases.reduce((sum, phase) => 
      sum + phase.lineItems.reduce((phaseSum, item) => phaseSum + item.allocatedAmount, 0), 0);

    // Calculate what the new total would be across all phases
    const estimatedNewTotal = (projectFormData.stipendAmount || 0) * learnerCount * 4 + newTotalForThisCategory;

    if (estimatedNewTotal > projectBudget.totalBudget) {
      const maxAllowedTotal = projectBudget.totalBudget;
      const maxAllowedPerLearner = maxAllowedTotal / (learnerCount * numberOfPhases);
      
      alert(`⚠️ Budget Limit Exceeded!\n\nTotal project budget: R${projectBudget.totalBudget.toLocaleString()}\nEstimated total with new cost: R${estimatedNewTotal.toLocaleString()}\nMaximum per learner across all phases: R${maxAllowedPerLearner.toFixed(2)}\n\nPlease adjust the per-learner cost to fit within the project budget.`);
      return false;
    }

    return true;
  };

  // Handle budget line item update with validation (for phases)
  const handleLineItemUpdate = (phaseId: string, itemId: string, newAmount: number) => {
    if (!projectBudget) return;

    const phase = projectBudget.phases.find(p => p.id === phaseId);
    if (!phase) return;

    // Calculate what the total would be with this new amount for this phase
    const otherItemsTotal = phase.lineItems
      .filter(item => item.id !== itemId)
      .reduce((sum, item) => sum + item.allocatedAmount, 0);
    
    const proposedTotal = otherItemsTotal + newAmount;
    
    // Check if the new total would exceed the phase budget
    if (proposedTotal > phase.allocatedBudget) {
      const maxAllowedForThisItem = phase.allocatedBudget - otherItemsTotal;
      alert(`⚠️ Phase Budget Limit Exceeded!\n\nPhase budget: R${phase.allocatedBudget.toLocaleString()}\nAlready allocated: R${otherItemsTotal.toLocaleString()}\nMaximum allowed for this item: R${maxAllowedForThisItem.toLocaleString()}\n\nYour entry of R${newAmount.toLocaleString()} would exceed the phase budget by R${(proposedTotal - phase.allocatedBudget).toLocaleString()}.`);
      return; // Don't update if it exceeds phase budget
    }

    const updatedPhases = projectBudget.phases.map(p => {
      if (p.id === phaseId) {
        const updatedLineItems = p.lineItems.map(item => {
          if (item.id === itemId && item.isEditable) {
            return {
              ...item,
              allocatedAmount: newAmount,
              remainingAmount: newAmount - item.spentAmount
            };
          }
          return item;
        });

        const phaseAllocated = updatedLineItems.reduce((sum, item) => sum + item.allocatedAmount, 0);
        
        return {
          ...p,
          lineItems: updatedLineItems,
          remainingBudget: p.allocatedBudget - phaseAllocated
        };
      }
      return p;
    });

    const totalAllocated = updatedPhases.reduce((sum, phase) => 
      sum + phase.lineItems.reduce((phaseSum, item) => phaseSum + item.allocatedAmount, 0), 0);

    setProjectBudget({
      ...projectBudget,
      phases: updatedPhases,
      totalAllocated,
      remainingBudget: projectBudget.totalBudget - totalAllocated
    });
  };

  // Add new budget line item to active phase
  const handleAddLineItem = () => {
    if (!projectBudget || !activePhase || !newLineItem.category || !newLineItem.description) return;

    const newItem: BudgetLineItem = {
      id: `custom-${Date.now()}`,
      category: newLineItem.category,
      description: newLineItem.description,
      allocatedAmount: newLineItem.allocatedAmount,
      spentAmount: 0,
      remainingAmount: newLineItem.allocatedAmount,
      isEditable: true
    };

    const updatedPhases = projectBudget.phases.map(phase => {
      if (phase.id === activePhase) {
        const updatedLineItems = [...phase.lineItems, newItem];
        const phaseAllocated = updatedLineItems.reduce((sum, item) => sum + item.allocatedAmount, 0);
        
        return {
          ...phase,
          lineItems: updatedLineItems,
          remainingBudget: phase.allocatedBudget - phaseAllocated
        };
      }
      return phase;
    });

    const totalAllocated = updatedPhases.reduce((sum, phase) => 
      sum + phase.lineItems.reduce((phaseSum, item) => phaseSum + item.allocatedAmount, 0), 0);

    setProjectBudget({
      ...projectBudget,
      phases: updatedPhases,
      totalAllocated,
      remainingBudget: projectBudget.totalBudget - totalAllocated
    });

    // Reset form
    setNewLineItem({
      category: '',
      description: '',
      allocatedAmount: 0
    });
  };

  // Remove budget line item from active phase
  const handleRemoveLineItem = (itemId: string) => {
    if (!projectBudget || !activePhase) return;

    const updatedPhases = projectBudget.phases.map(phase => {
      if (phase.id === activePhase) {
        const updatedLineItems = phase.lineItems.filter(item => item.id !== itemId);
        const phaseAllocated = updatedLineItems.reduce((sum, item) => sum + item.allocatedAmount, 0);
        
        return {
          ...phase,
          lineItems: updatedLineItems,
          remainingBudget: phase.allocatedBudget - phaseAllocated
        };
      }
      return phase;
    });

    const totalAllocated = updatedPhases.reduce((sum, phase) => 
      sum + phase.lineItems.reduce((phaseSum, item) => phaseSum + item.allocatedAmount, 0), 0);

    setProjectBudget({
      ...projectBudget,
      phases: updatedPhases,
      totalAllocated,
      remainingBudget: projectBudget.totalBudget - totalAllocated
    });
  };

  // Render budget management section
  const renderBudgetManagement = () => (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body text-center text-white py-4">
          <h2 className="mb-2">💰 Budget Management</h2>
          <p className="mb-0 opacity-75">Manage project budget allocations and track spending</p>
        </div>
      </div>

      {/* Project Selection */}
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body text-white">
          <h5 className="mb-3">Select Project</h5>
          <div className="row g-3">
            <div className="col-md-8">
              <select
                className="form-select bg-light text-dark"
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === parseInt(e.target.value));
                  setSelectedProject(project || null);
                  if (project) {
                    loadBudgetData();
                  }
                }}
              >
                <option value="">Select a project to manage budget</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.projectName} - {project.contractNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              {selectedProject && (
                <button
                  onClick={loadBudgetData}
                  className="btn btn-light w-100"
                  disabled={budgetLoading}
                >
                  {budgetLoading ? 'Loading...' : '🔄 Refresh Budget'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phase Setup */}
      {selectedProject && !phaseSetupComplete && (
        <div className="card border-0 shadow-lg mb-4" style={{
          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <h5 className="mb-0">🎯 Project Phase Setup</h5>
          </div>
          <div className="card-body text-white">
            <div className="alert alert-info" style={{ backgroundColor: 'rgba(23, 162, 184, 0.2)', border: '1px solid rgba(23, 162, 184, 0.3)' }}>
              <small className="text-white">
                📋 <strong>Phase-Based Budget Management:</strong> Divide your project into phases to better manage budget allocation and track progress over time.
              </small>
            </div>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-white">Number of Phases *</label>
                <select
                  className="form-select bg-light text-dark"
                  value={numberOfPhases}
                  onChange={(e) => setNumberOfPhases(parseInt(e.target.value))}
                >
                  <option value={1}>1 Phase (Single phase project)</option>
                  <option value={2}>2 Phases</option>
                  <option value={3}>3 Phases</option>
                  <option value={4}>4 Phases</option>
                  <option value={5}>5 Phases</option>
                  <option value={6}>6 Phases</option>
                </select>
                <div className="form-text text-white opacity-75">
                  Each phase will get an equal budget allocation initially: R{(selectedProject.budgetAmount / numberOfPhases).toLocaleString()} per phase
                </div>
              </div>
              
              <div className="col-md-6 d-flex align-items-end">
                <button
                  onClick={setupProjectPhases}
                  className="btn btn-success w-100"
                  disabled={numberOfPhases < 1}
                >
                  🚀 Setup {numberOfPhases} Phase{numberOfPhases > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Management */}
      {selectedProject && phaseSetupComplete && projectBudget && (
        <div className="card border-0 shadow-lg mb-4" style={{
          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <h5 className="mb-0">🎯 Project Phases ({projectBudget.numberOfPhases} phases)</h5>
          </div>
          <div className="card-body text-white">
            <div className="row g-3">
              {projectBudget.phases.map((phase, index) => (
                <div key={phase.id} className="col-md-6 col-lg-4">
                  <div className={`card h-100 ${activePhase === phase.id ? 'border-warning' : 'border-light'}`} style={{
                    backgroundColor: activePhase === phase.id ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActivePhase(phase.id)}>
                    <div className="card-body text-white">
                      <h6 className="card-title">{phase.name}</h6>
                      <p className="card-text small">{phase.description}</p>
                      <div className="mb-2">
                        <small>Budget: R{phase.allocatedBudget.toLocaleString()}</small><br />
                        <small>Remaining: R{phase.remainingBudget.toLocaleString()}</small>
                      </div>
                      {activePhase === phase.id && (
                        <span className="badge bg-warning text-dark">Active</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3">
              <button
                onClick={() => setPhaseSetupComplete(false)}
                className="btn btn-outline-light btn-sm"
              >
                🔄 Reconfigure Phases
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Resources Info */}
      {selectedProject && (
        <div className="card border-0 shadow-lg mb-4" style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-white">
            <h6 className="mb-3">📦 Project Resources (Set by Client)</h6>
            <div className="row">
              <div className="col-md-3">
                <span className={`badge ${selectedProject.hasPPE ? 'bg-light text-dark' : 'bg-secondary'}`}>
                  {selectedProject.hasPPE ? '✅' : '❌'} PPE
                </span>
              </div>
              <div className="col-md-3">
                <span className={`badge ${selectedProject.hasLearningMaterial ? 'bg-light text-dark' : 'bg-secondary'}`}>
                  {selectedProject.hasLearningMaterial ? '✅' : '❌'} Learning Materials
                </span>
              </div>
              <div className="col-md-3">
                <span className={`badge ${selectedProject.hasToolkit ? 'bg-light text-dark' : 'bg-secondary'}`}>
                  {selectedProject.hasToolkit ? '✅' : '❌'} Toolkit
                </span>
              </div>
              <div className="col-md-3">
                <span className={`badge ${selectedProject.hasConsumables ? 'bg-light text-dark' : 'bg-secondary'}`}>
                  {selectedProject.hasConsumables ? '✅' : '❌'} Consumables
                </span>
              </div>
            </div>
            <small className="text-white opacity-75 mt-2 d-block">
              Only enabled resources will appear as budget line items. Contact your client to modify resource requirements.
            </small>
          </div>
        </div>
      )}

      {/* Per-Learner Cost Settings */}
      {selectedProject && (
        <div className="card border-0 shadow-lg mb-4" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <h5 className="mb-0">👥 Per-Learner Cost Settings</h5>
          </div>
          <div className="card-body text-white">
            <div className="alert alert-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
              <small className="text-white">
                💡 Set the cost per learner for each resource. Budget will be calculated as: Cost per learner × Number of beneficiaries ({selectedProject.numberOfBeneficiaries} learners)
              </small>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-white">Number of Learners (Auto-populated)</label>
                <input
                  type="text"
                  className="form-control text-dark"
                  value={`${selectedProject.numberOfBeneficiaries} learners`}
                  readOnly
                  style={{ backgroundColor: '#e9ecef', opacity: 0.8 }}
                />
                <div className="form-text text-white opacity-75">
                  📋 This value is automatically taken from the project's planned beneficiaries
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="form-label text-white">Monthly Stipend per Learner</label>
                <input
                  type="number"
                  className="form-control bg-light text-dark"
                  value={projectFormData.stipendAmount}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    
                    // Validate stipend amount
                    if (selectedProject && projectBudget) {
                      const learnerCount = selectedProject.numberOfBeneficiaries;
                      const newStipendTotal = newValue * learnerCount * 4;
                      
                      // Calculate total of all per-learner costs
                      const perLearnerTotal = Object.values(perLearnerCosts).reduce((sum, cost) => {
                        return sum + (cost * learnerCount);
                      }, 0);
                      
                      const totalWithNewStipend = newStipendTotal + perLearnerTotal;
                      
                      if (totalWithNewStipend > projectBudget.totalBudget) {
                        const maxAllowedStipendTotal = projectBudget.totalBudget - perLearnerTotal;
                        const maxAllowedPerLearnerPerMonth = maxAllowedStipendTotal / (learnerCount * 4);
                        
                        alert(`⚠️ Budget Limit Exceeded!\n\nTotal budget: R${projectBudget.totalBudget.toLocaleString()}\nOther costs: R${perLearnerTotal.toLocaleString()}\nMaximum for stipends: R${maxAllowedStipendTotal.toLocaleString()}\nMaximum per learner per month: R${maxAllowedPerLearnerPerMonth.toFixed(2)}\n\nYour entry would exceed the budget by R${(totalWithNewStipend - projectBudget.totalBudget).toLocaleString()}.`);
                        return;
                      }
                    }
                    
                    setProjectFormData(prev => ({ ...prev, stipendAmount: newValue }));
                    if (projectBudget) {
                      loadBudgetData(); // Recalculate budget
                    }
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <div className="form-text text-white opacity-75">
                  Total stipend: R{((projectFormData.stipendAmount || 0) * (selectedProject.numberOfBeneficiaries || 0) * 4).toLocaleString()} (4 months)
                </div>
              </div>

              {selectedProject.hasPPE && (
                <div className="col-md-6">
                  <label className="form-label text-white">PPE Cost per Learner</label>
                  <input
                    type="number"
                    className="form-control bg-light text-dark"
                    value={perLearnerCosts.ppeCost}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 0;
                      if (validatePerLearnerCostUpdate('ppeCost', newValue)) {
                        setPerLearnerCosts(prev => ({ ...prev, ppeCost: newValue }));
                        if (projectBudget) {
                          loadBudgetData(); // Recalculate budget
                        }
                      }
                    }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <div className="form-text text-white opacity-75">
                    Total PPE: R{(perLearnerCosts.ppeCost * (selectedProject.numberOfBeneficiaries || 0)).toLocaleString()}
                  </div>
                </div>
              )}

              {selectedProject.hasLearningMaterial && (
                <div className="col-md-6">
                  <label className="form-label text-white">Learning Materials Cost per Learner</label>
                  <input
                    type="number"
                    className="form-control bg-light text-dark"
                    value={perLearnerCosts.learningMaterialCost}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 0;
                      if (validatePerLearnerCostUpdate('learningMaterialCost', newValue)) {
                        setPerLearnerCosts(prev => ({ ...prev, learningMaterialCost: newValue }));
                        if (projectBudget) {
                          loadBudgetData(); // Recalculate budget
                        }
                      }
                    }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <div className="form-text text-white opacity-75">
                    Total Learning Materials: R{(perLearnerCosts.learningMaterialCost * (selectedProject.numberOfBeneficiaries || 0)).toLocaleString()}
                  </div>
                </div>
              )}

              {selectedProject.hasToolkit && (
                <div className="col-md-6">
                  <label className="form-label text-white">Toolkit Cost per Learner</label>
                  <input
                    type="number"
                    className="form-control bg-light text-dark"
                    value={perLearnerCosts.toolkitCost}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 0;
                      if (validatePerLearnerCostUpdate('toolkitCost', newValue)) {
                        setPerLearnerCosts(prev => ({ ...prev, toolkitCost: newValue }));
                        if (projectBudget) {
                          loadBudgetData(); // Recalculate budget
                        }
                      }
                    }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <div className="form-text text-white opacity-75">
                    Total Toolkit: R{(perLearnerCosts.toolkitCost * (selectedProject.numberOfBeneficiaries || 0)).toLocaleString()}
                  </div>
                </div>
              )}

              {selectedProject.hasConsumables && (
                <div className="col-md-6">
                  <label className="form-label text-white">Consumables Cost per Learner</label>
                  <input
                    type="number"
                    className="form-control bg-light text-dark"
                    value={perLearnerCosts.consumablesCost}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 0;
                      if (validatePerLearnerCostUpdate('consumablesCost', newValue)) {
                        setPerLearnerCosts(prev => ({ ...prev, consumablesCost: newValue }));
                        if (projectBudget) {
                          loadBudgetData(); // Recalculate budget
                        }
                      }
                    }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <div className="form-text text-white opacity-75">
                    Total Consumables: R{(perLearnerCosts.consumablesCost * (selectedProject.numberOfBeneficiaries || 0)).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <button
                onClick={loadBudgetData}
                className="btn btn-success"
                disabled={!selectedProject?.numberOfBeneficiaries}
              >
                🔄 Recalculate Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Overview */}
      {projectBudget && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-lg h-100" style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="card-body text-center text-white">
                  <h6 className="mb-2">Total Budget</h6>
                  <h4 className="mb-0">R {projectBudget.totalBudget.toLocaleString()}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-lg h-100" style={{
                background: projectBudget.totalAllocated > projectBudget.totalBudget * 0.9
                  ? 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' // Warning when > 90%
                  : 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="card-body text-center text-white">
                  <h6 className="mb-2">Total Allocated</h6>
                  <h4 className="mb-0">R {projectBudget.totalAllocated.toLocaleString()}</h4>
                  <small className="opacity-75">
                    {((projectBudget.totalAllocated / projectBudget.totalBudget) * 100).toFixed(1)}% of budget
                  </small>
                  {projectBudget.totalAllocated > projectBudget.totalBudget * 0.9 && projectBudget.remainingBudget >= 0 && (
                    <div><small className="text-warning">⚠️ Near Limit</small></div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-lg h-100" style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="card-body text-center text-white">
                  <h6 className="mb-2">Total Spent</h6>
                  <h4 className="mb-0">R {projectBudget.totalSpent.toLocaleString()}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-lg h-100" style={{
                background: projectBudget.remainingBudget >= 0 
                  ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                  : 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="card-body text-center text-white">
                  <h6 className="mb-2">Remaining Budget</h6>
                  <h4 className="mb-0">R {projectBudget.remainingBudget.toLocaleString()}</h4>
                  {projectBudget.remainingBudget < 0 && (
                    <small className="text-warning">⚠️ Over Budget</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Status Alert */}
          {projectBudget.remainingBudget < projectBudget.totalBudget * 0.1 && projectBudget.remainingBudget >= 0 && (
            <div className="alert alert-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', border: '1px solid rgba(255, 193, 7, 0.5)' }}>
              <div className="d-flex align-items-center">
                <span className="me-2">⚠️</span>
                <div>
                  <strong className="text-warning">Budget Alert:</strong>
                  <span className="text-white ms-2">
                    You have only R{projectBudget.remainingBudget.toLocaleString()} remaining ({((projectBudget.remainingBudget / projectBudget.totalBudget) * 100).toFixed(1)}% of total budget).
                    Please allocate carefully to avoid exceeding the budget limit.
                  </span>
                </div>
              </div>
            </div>
          )}

          {projectBudget.remainingBudget < 0 && (
            <div className="alert alert-danger" style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.5)' }}>
              <div className="d-flex align-items-center">
                <span className="me-2">🚫</span>
                <div>
                  <strong className="text-danger">Budget Exceeded:</strong>
                  <span className="text-white ms-2">
                    You have exceeded the budget by R{Math.abs(projectBudget.remainingBudget).toLocaleString()}. 
                    Please reduce allocations to stay within the approved budget.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Phase Budget Line Items */}
          {activePhase && projectBudget.phases.length > 0 && (
            <div className="card border-0 shadow-lg mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    📋 {projectBudget.phases.find(p => p.id === activePhase)?.name} - Budget Line Items
                  </h5>
                  <span className="badge bg-light text-dark">
                    Budget: R{projectBudget.phases.find(p => p.id === activePhase)?.allocatedBudget.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="card-body text-white">
                {(() => {
                  const currentPhase = projectBudget.phases.find(p => p.id === activePhase);
                  if (!currentPhase) return null;
                  
                  return (
                    <div className="table-responsive">
                      <table className="table table-dark table-hover">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Allocated Amount</th>
                            <th>Spent Amount</th>
                            <th>Remaining</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPhase.lineItems.map(item => (
                            <tr key={item.id}>
                              <td>
                                <span className={`badge ${item.isEditable ? 'bg-success' : 'bg-info'}`}>
                                  {item.category}
                                </span>
                              </td>
                              <td>{item.description}</td>
                              <td>
                                {item.isEditable ? (
                                  <input
                                    type="number"
                                    className={`form-control form-control-sm ${currentPhase.remainingBudget < 0 ? 'border-danger' : 'bg-light'} text-dark`}
                                    value={item.allocatedAmount}
                                    onChange={(e) => handleLineItemUpdate(activePhase, item.id, parseFloat(e.target.value) || 0)}
                                    min="0"
                                    max={currentPhase.allocatedBudget}
                                    step="0.01"
                                    title={`Maximum phase budget: R${currentPhase.allocatedBudget.toLocaleString()}`}
                                  />
                                ) : (
                                  <span>R {item.allocatedAmount.toLocaleString()}</span>
                                )}
                              </td>
                              <td>R {item.spentAmount.toLocaleString()}</td>
                              <td>
                                <span className={item.remainingAmount >= 0 ? 'text-success' : 'text-danger'}>
                                  R {item.remainingAmount.toLocaleString()}
                                </span>
                              </td>
                              <td>
                                {item.isEditable && item.id.startsWith('custom-') && (
                                  <button
                                    onClick={() => handleRemoveLineItem(item.id)}
                                    className="btn btn-outline-danger btn-sm"
                                  >
                                    🗑️
                                  </button>
                                )}
                                {!item.isEditable && (
                                  <small className="text-muted">Auto-calculated</small>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Add New Line Item */}
          <div className="card border-0 shadow-lg" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <h5 className="mb-0">➕ Add New Budget Line Item</h5>
            </div>
            <div className="card-body text-white">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label text-white">Category</label>
                  <select
                    className="form-select bg-light text-dark"
                    value={newLineItem.category}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select Category</option>
                    <option value="Transport">Transport</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Administration">Administration</option>
                    <option value="Training Venue">Training Venue</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Certification">Certification</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-white">Description</label>
                  <input
                    type="text"
                    className="form-control bg-light text-dark"
                    value={newLineItem.description}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-white">Allocated Amount</label>
                  <input
                    type="number"
                    className="form-control bg-light text-dark"
                    value={newLineItem.allocatedAmount}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, allocatedAmount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-white">&nbsp;</label>
                  <button
                    onClick={handleAddLineItem}
                    className="btn btn-success w-100"
                    disabled={!newLineItem.category || !newLineItem.description || projectBudget.remainingBudget < newLineItem.allocatedAmount}
                  >
                    ➕ Add
                  </button>
                </div>
              </div>
              {projectBudget.remainingBudget < newLineItem.allocatedAmount && newLineItem.allocatedAmount > 0 && (
                <div className="alert alert-warning mt-3">
                  ⚠️ This allocation would exceed the remaining budget of R {projectBudget.remainingBudget.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedProject && (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">💰</div>
            <h3 className="mb-3">Select a Project</h3>
            <p className="mb-0 opacity-75">Choose a project from the dropdown above to manage its budget allocations.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">🎓 SDP Dashboard</span>
          <div className="d-flex align-items-center">
            <span className="text-white me-3">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid flex-grow-1 d-flex">
        <div className="row flex-grow-1 g-0">
          {/* Side Panel */}
          <div className="col-md-3 col-lg-2 bg-white shadow-sm d-flex flex-column">
            <div className="p-3 flex-grow-1">
              <h6 className="text-muted text-uppercase mb-3">Navigation</h6>
              <div className="nav flex-column">
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'overview' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('overview')}
                >
                  📊 Overview
                </button>
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'projects' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('projects')}
                >
                  📋 Projects
                </button>
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'departments' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('departments')}
                >
                  🏢 Departments
                </button>
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'users' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('users')}
                >
                  👤 Users
                </button>
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'budget-management' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('budget-management')}
                  disabled={projects.length === 0}
                >
                  💰 Budget Management
                </button>
                <hr className="my-3" />
                <h6 className="text-muted text-uppercase mb-2">Actions</h6>
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'update-project' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('update-project')}
                  disabled={projects.length === 0}
                >
                  ✏️ Update Project
                </button>
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'add-project' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('add-project')}
                >
                  ➕ Add Project
                </button>
                <button
                  className={`nav-link text-start border-0 bg-transparent ${activeSection === 'add-department' ? 'active text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => setActiveSection('add-department')}
                >
                  ➕ Add Department
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9 col-lg-10 d-flex flex-column">
            <div className="p-4 flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 76px)' }}>
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'projects' && renderProjects()}
              {activeSection === 'departments' && renderDepartments()}
              {activeSection === 'users' && renderUsers()}
              {activeSection === 'update-project' && renderUpdateProject()}
              {activeSection === 'add-project' && renderAddProject()}
              {activeSection === 'add-department' && renderAddDepartment()}
              {activeSection === 'budget-management' && renderBudgetManagement()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDPDashboard;