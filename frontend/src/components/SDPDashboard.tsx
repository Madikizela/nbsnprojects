import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { southAfricaData, type District, type Municipality } from '../data/southAfricaData';
import ProjectForm from './ProjectForm';
import nbsnLogo from '../assets/nbsn-logo.png';

interface SkillsDevelopmentProvider {
  id: number;
  name: string;
  description?: string;
  address?: string;
  contactPerson?: string;
  logoPath?: string;
  status: number;
  clientId: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    name: string;
  };
  users?: any[];
  departments?: any[];
}

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
  const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sdps, setSdps] = useState<SkillsDevelopmentProvider[]>([]);
  const [filteredSdps, setFilteredSdps] = useState<SkillsDevelopmentProvider[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'departments' | 'add-department' | 'update-project' | 'budget-management' | 'add-project' | 'users'>('overview');
  const [selectedSdp, setSelectedSdp] = useState<SkillsDevelopmentProvider | null>(null);
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
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showUpdateProjectModal, setShowUpdateProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Tip / transient banner states
  const [sidebarTip, setSidebarTip] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);

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

  // Retry entry-points — re-run the corresponding fetch.
  const retryFetchProjects = () => {
    setProjectsError(null);
    const sdpId = user?.skillsDevelopmentProviderId;
    if (!sdpId) return;
    setProjectsLoading(true);
    const token = localStorage.getItem('token');
    fetch(`/api/sdp/projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setProjects(d.projects || []); setProjectsError(null); })
      .catch(e => setProjectsError(`Projects failed to load. ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setProjectsLoading(false));
  };

  const retryFetchDepartments = () => {
    setDepartmentsError(null);
    const sdpId = user?.skillsDevelopmentProviderId;
    if (!sdpId) return;
    setDepartmentsLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API}/api/Departments/BySDP/${sdpId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setDepartments(d); setDepartmentsError(null); })
      .catch(e => setDepartmentsError(`Departments failed to load. ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setDepartmentsLoading(false));
  };

  const retryFetchUsers = () => {
    setUsersError(null);
    const sdpId = user?.skillsDevelopmentProviderId;
    if (!sdpId) return;
    setUsersLoading(true);
    const token = localStorage.getItem('token');
    fetch(`/api/Users/BySDP/${sdpId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setUsers(d); setUsersError(null); })
      .catch(e => setUsersError(`Users failed to load. ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setUsersLoading(false));
  };

  // Fetch projects and departments for SDP users
  useEffect(() => {
    const fetchSDPData = async () => {
      const sdpId = user?.skillsDevelopmentProviderId;
      console.log('SDPDashboard: fetchSDPData check:', { sdpId, user });

      if (sdpId) {
        setDataLoading(true);
        setProjectsLoading(true);
        setDepartmentsLoading(true);
        setUsersLoading(true);
        
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
            setProjectsError(null);
          } else {
            console.error('Failed to fetch projects');
            setProjects([]);
            setProjectsError(`Projects failed to load (HTTP ${projectsResponse.status}). Please retry.`);
          }
          
          // Fetch departments for this SDP
          const departmentsResponse = await fetch(`${API}/api/Departments/BySDP/${user.skillsDevelopmentProviderId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (departmentsResponse.ok) {
            const departmentsData = await departmentsResponse.json();
            setDepartments(departmentsData);
            setDepartmentsError(null);
          } else {
            console.error('Failed to fetch departments');
            setDepartments([]);
            setDepartmentsError(`Departments failed to load (HTTP ${departmentsResponse.status}). Please retry.`);
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
            setUsersError(null);
          } else {
            console.error('Failed to fetch users');
            setUsers([]);
            setUsersError(`Users failed to load (HTTP ${usersResponse.status}). Please retry.`);
          }
          
        } catch (error) {
          console.error('Error fetching SDP data:', error);
          const msg = error instanceof Error ? error.message : String(error);
          setProjects([]);
          setDepartments([]);
          setUsers([]);
          setProjectsError(`Projects failed to load: ${msg}`);
          setDepartmentsError(`Departments failed to load: ${msg}`);
          setUsersError(`Users failed to load: ${msg}`);
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
    if (activeSection === 'projects' && user?.skillsDevelopmentProviderId && projects.length === 0 && !projectsError) {
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
            setProjectsError(null);
          } else {
            setProjectsError(`Projects failed to load (HTTP ${projectsResponse.status}). Please retry.`);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          setProjectsError(`Projects failed to load: ${msg}`);
        } finally {
          setProjectsLoading(false);
        }
      };

      fetchProjectsForActiveSection();
    }
  }, [activeSection, user?.skillsDevelopmentProviderId]);

  // Fetch users when activeSection changes to users
  useEffect(() => {
    if (activeSection === 'users' && user?.skillsDevelopmentProviderId && users.length === 0 && !usersError) {
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
            setUsersError(null);
          } else {
            setUsersError(`Users failed to load (HTTP ${usersResponse.status}). Please retry.`);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          setUsersError(`Users failed to load: ${msg}`);
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
      filtered = filtered.filter(sdp =>
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
          const response = await fetch(`${API}/api/Departments/BySDP/${selectedSdp.id}`, {
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
      const response = await fetch(`${API}/api/Departments`, {
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

  // Handle deleting a department and its associated user
  const handleDeleteDepartment = async (departmentId: number, departmentName: string) => {
    if (!confirm(`Delete the "${departmentName}" department?\n\nThis will also delete the associated manager user account.`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/Departments/${departmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDepartments(prev => prev.filter(d => d.id !== departmentId));
        alert(`✅ "${departmentName}" department deleted successfully.`);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(`Failed to delete: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('An error occurred while deleting the department.');
      console.error(error);
    }
  };

  // Handle resending credentials to department manager
  const handleResendCredentials = async (departmentId: number, departmentName: string) => {
    if (!confirm(`Resend login credentials to the manager of "${departmentName}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/Departments/${departmentId}/resend-credentials`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        if (data.emailSent) {
          alert(`✅ Credentials sent to ${data.message?.replace('Credentials resent to ', '') || 'the manager'}`);
        } else {
          alert(`⚠️ Email could not be sent.\n\nUsername: ${data.adminUsername}\nPassword: ${data.temporaryPassword}\n\nPlease share these manually.`);
        }
      } else {
        alert(`Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('An error occurred while resending credentials.');
      console.error(error);
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
        <div className="card border-0 shadow-sm" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16 }}>
          <div className="card-body text-center text-white py-4 px-4">
            <h2 className="mb-2 fw-bold">Welcome to Your SDP Dashboard 🎓</h2>
            <p className="mb-4" style={{ opacity:0.65, fontSize:15 }}>Manage your Skills Development Provider operations</p>
            
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
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background:'linear-gradient(135deg,#667eea,#764ba2)' }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
            <div style={{ fontSize:'2.2rem', marginBottom:8 }}>📋</div>
            <h3 className="mb-1 fw-bold">{user?.activeProjectCount || user?.projectCount || projects.length}</h3>
            <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>Active Projects</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background:'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
            <div style={{ fontSize:'2.2rem', marginBottom:8 }}>🏢</div>
            <h3 className="mb-1 fw-bold">{user?.departmentCount || departments.length}</h3>
            <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>Departments</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background:'linear-gradient(135deg,#10b981,#059669)' }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
            <div style={{ fontSize:'2.2rem', marginBottom:8 }}>👤</div>
            <h3 className="mb-1 fw-bold">{users.length}</h3>
            <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>SDP Users</p>
          </div>
        </div>
      </div>
      
      <div className="col-12">
        <div className="card border-0 shadow-sm" style={{ borderRadius:14 }}>
          <div className="card-header border-0 fw-bold" style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', borderRadius:'14px 14px 0 0' }}>
            SDP Information
          </div>
          <div className="card-body">
            <div className="row g-4 align-items-start">
              {/* Logo upload column */}
              <div className="col-md-3 text-center">
                <div style={{ marginBottom: 12 }}>
                  {selectedSdp?.logoPath ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || ''}/${selectedSdp.logoPath}`}
                      alt="SDP Logo"
                      style={{ maxWidth: 140, maxHeight: 100, objectFit: 'contain', borderRadius: 10, border: '1px solid #e2e8f0' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: 120, height: 80, background: '#f1f5f9', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', color: '#94a3b8', fontSize: 13 }}>
                      No Logo
                    </div>
                  )}
                </div>
                <label
                  htmlFor="sdp-logo-upload"
                  style={{ display: 'inline-block', padding: '7px 16px', background: 'linear-gradient(135deg,#0d9488,#06b6d4)', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  📷 {selectedSdp?.logoPath ? 'Change Logo' : 'Upload Logo'}
                </label>
                <input
                  id="sdp-logo-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const sdpId = selectedSdp?.id ?? user?.skillsDevelopmentProviderId;
                    if (!sdpId) return;
                    const formData = new FormData();
                    formData.append('logo', file);
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/SkillsDevelopmentProviders/${sdpId}/logo`, {
                      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
                    });
                    if (res.ok) { window.location.reload(); }
                    else { alert('Logo upload failed. Max 2MB, JPG/PNG/SVG only.'); }
                  }}
                />
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>
                  JPG, PNG, SVG · Max 2MB
                </p>
              </div>

              {/* Info columns */}
              <div className="col-md-9">
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-2"><strong>SDP Name:</strong> {user?.skillsDevelopmentProviderName}</p>
                    <p className="mb-2"><strong>User Name:</strong> {user?.name}</p>
                    <p className="mb-0"><strong>Email:</strong> {user?.email}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2"><strong>Role:</strong> <span className="badge bg-primary">{user?.role}</span></p>
                    <p className="mb-2"><strong>Status:</strong> <span className={`badge ${user?.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>{user?.status}</span></p>
                    <p className="mb-0"><strong>Department:</strong> {user?.departmentName || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div>
      <div className="card border-0 shadow-sm mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'20px 24px', display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 className="mb-1 text-white fw-bold" style={{ fontSize:'1.4rem' }}>Projects</h2>
          <p className="mb-0" style={{ color:'rgba(255,255,255,0.6)', fontSize:14 }}>Manage your SDP projects</p>
        </div>
        <button onClick={() => setActiveSection('add-project')} style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
          ➕ Add Project
        </button>
      </div>

      {projectsLoading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
      ) : projects.length > 0 ? (
        <div className="row g-3">
          {projects.map((project) => (
            <div key={project.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius:14, background:'#fff' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title fw-bold" style={{ color:'#1e293b', margin:0 }}>{project.projectName}</h5>
                    <span className={`badge ${project.status === 'active' || project.status === 'Active' ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize:11 }}>{project.status}</span>
                  </div>
                  <p style={{ color:'#64748b', fontSize:13, marginBottom:4 }}>Contract: {project.contractNumber}</p>
                  {project.description && <p style={{ color:'#64748b', fontSize:13, marginBottom:8 }}>{project.description}</p>}
                  <div style={{ color:'#94a3b8', fontSize:12, marginBottom:16 }}>
                    <div>Start: {new Date(project.startDate).toLocaleDateString()}</div>
                    <div>End: {new Date(project.endDate).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => openUpdateProjectModal(project)}
                    style={{ width:'100%', padding:'8px', borderRadius:8, border:'1.5px solid #667eea', background:'#fff', color:'#667eea', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    ✏️ Update Project
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize:'3rem', marginBottom:12 }}>📋</div>
          <h5>No Projects Found</h5>
          <p style={{ fontSize:14 }}>No projects are currently linked to your SDP.</p>
        </div>
      )}
    </div>
  );

  const renderDepartments = () => (
    <div>
      <div className="card border-0 shadow-sm mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'20px 24px', display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 className="mb-1 text-white fw-bold" style={{ fontSize:'1.4rem' }}>Departments</h2>
          <p className="mb-0" style={{ color:'rgba(255,255,255,0.6)', fontSize:14 }}>Manage your SDP departments</p>
        </div>
        <button onClick={() => setActiveSection('add-department')} style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
          ➕ Add Department
        </button>
      </div>

      {departmentsLoading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
      ) : departments.length > 0 ? (
        <div className="row g-3">
          {departments.map((department) => (
            <div key={department.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius:14, background:'#fff' }}>
                <div className="card-body">
                  <h5 className="fw-bold mb-2" style={{ color:'#1e293b' }}>{department.name}</h5>
                  {department.description && <p style={{ color:'#64748b', fontSize:13, marginBottom:8 }}>{department.description}</p>}
                  <div style={{ color:'#64748b', fontSize:13, marginBottom:4 }}>
                    <strong>Manager:</strong> {department.managerFirstName} {department.managerSurname}
                  </div>
                  <div style={{ color:'#64748b', fontSize:13, marginBottom:16 }}>
                    <strong>Email:</strong> {department.managerEmail}
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color:'#94a3b8', fontSize:12 }}>Created: {new Date(department.createdAt).toLocaleDateString()}</span>
                    <div className="d-flex gap-2">
                      {department.managerEmail && (
                        <button style={{ padding:'5px 10px', borderRadius:8, border:'1.5px solid #667eea', background:'#fff', color:'#667eea', fontWeight:600, fontSize:11, cursor:'pointer' }}
                          onClick={() => handleResendCredentials(department.id, department.name)}>
                          📧 Resend
                        </button>
                      )}
                      <button style={{ padding:'5px 10px', borderRadius:8, border:'none', background:'#fee2e2', color:'#dc2626', fontWeight:600, fontSize:11, cursor:'pointer' }}
                        onClick={() => handleDeleteDepartment(department.id, department.name)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🏢</div>
          <h5>No Departments Found</h5>
          <p style={{ fontSize:14 }}>You haven't created any departments yet.</p>
          <button onClick={() => setActiveSection('add-department')} style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:600, fontSize:14, cursor:'pointer' }}>
            Add Your First Department
          </button>
        </div>
      )}
    </div>
  );

  const renderUpdateProject = () => {
    // Defensive empty state: no project has been loaded into the form context.
    // The user should NOT reach this through the normal flow, but if they do
    // (bookmark, stale state, direct code path) give an actionable CTA.
    if (!selectedProject) {
      return (
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div className="card border-0 shadow-lg text-center" style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
              borderRadius: 16,
            }}>
              <div className="card-body text-white py-5 px-4">
                <div style={{ fontSize: '3rem', lineHeight: 1 }} className="mb-3">🧭</div>
                <h3 className="mb-2" style={{ fontWeight: 700 }}>No project selected</h3>
                <p className="mb-4 opacity-90" style={{ maxWidth: 480, margin: '0 auto' }}>
                  The Update Project form needs a specific project to edit. Open the projects
                  list, find the card you want, and click its <strong>Update Project</strong> button.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection('projects')}
                  className="btn btn-light px-5"
                  style={{ fontWeight: 700, borderRadius: 999 }}
                >
                  📁 Go to Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '16px 16px 0 0', padding: '20px 24px' }}>
            <div>
              <h3 className="mb-1" style={{ fontWeight: 700, fontSize: '1.4rem' }}>✏️ Update Project</h3>
              <small className="opacity-75" style={{ fontSize: '0.85rem' }}>Project ID: {selectedProject.id} · {selectedProject.projectName}</small>
            </div>
          </div>
          <div className="card-body text-white" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <form onSubmit={handleUpdateProject}>
              {/* Basic Project Information - READ ONLY */}
              <div className="mb-4">
                <h5 className="text-white mb-3 pb-2" style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>📋 Project Information (Read Only)</h5>
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
                <h5 className="text-white mb-3 pb-2" style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>📅 Project Timeline</h5>
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
                <h5 className="text-white mb-3 pb-2" style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>📊 Project Details (Read Only)</h5>
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
              
              <div className="d-flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <button
                  type="submit"
                  className="btn btn-light px-4"
                  disabled={isSubmitting}
                  style={{ fontWeight: 600, borderRadius: 10 }}
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
  };

  const renderUsers = () => (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
        borderRadius: 16,
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body d-flex justify-content-between align-items-center text-white py-4">
          <div>
            <h2 className="mb-2" style={{ fontWeight: 700, fontSize: '1.8rem' }}>Users</h2>
            <p className="mb-0 opacity-75" style={{ fontSize: '1rem' }}>View all users under your SDP</p>
          </div>
        </div>
      </div>
      
      {usersLoading ? (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          borderRadius: 16,
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
          borderRadius: 16,
        }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' }}>
                <tr>
                  <th className="border-0 py-3" style={{ color: '#fff', fontWeight: 600 }}>Name</th>
                  <th className="border-0 py-3" style={{ color: '#fff', fontWeight: 600 }}>Email</th>
                  <th className="border-0 py-3" style={{ color: '#fff', fontWeight: 600 }}>Role</th>
                  <th className="border-0 py-3" style={{ color: '#fff', fontWeight: 600 }}>Department</th>
                  <th className="border-0 py-3" style={{ color: '#fff', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <td className="border-0 py-3" style={{ color: '#1e293b', fontWeight: 500 }}>
                      {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.name || 'Unknown')}
                    </td>
                    <td className="border-0 py-3" style={{ color: '#475569' }}>{u.email}</td>
                    <td className="border-0 py-3">
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)', color: '#fff', fontWeight: 500 }}>
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
                    <td className="border-0 py-3" style={{ color: '#475569' }}>
                      {u.departmentName || u.department?.name || 'Not assigned'}
                    </td>
                    <td className="border-0 py-3">
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
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">👤</div>
            <h3 className="mb-3" style={{ fontWeight: 600 }}>No Users Found</h3>
            <p className="mb-0 opacity-75">No users are currently linked to your SDP.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAddProject = () => (
    <div>
      {/* Header */}
      <div className="card border-0 shadow-sm mb-4" style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'20px 24px', display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 className="mb-1 text-white fw-bold" style={{ fontSize:'1.4rem' }}>Add New Project ➕</h2>
          <p className="mb-0" style={{ color:'rgba(255,255,255,0.6)', fontSize:14 }}>Create a new project for your SDP</p>
        </div>
        <button onClick={() => setActiveSection('projects')} style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 18px', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          ← Back to Projects
        </button>
      </div>

      {/* Form */}
      <div className="card border-0 shadow-sm" style={{ borderRadius:14 }}>
        <ProjectForm
          onCancel={() => setActiveSection('projects')}
          onSubmit={() => {
            setActiveSection('projects');
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
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '16px 16px 0 0', padding: '20px 24px' }}>
            <h3 className="mb-1" style={{ fontWeight: 700, fontSize: '1.4rem' }}>➕ Add Department</h3>
            <p className="mb-0 small" style={{ color: 'rgba(255,255,255,0.7)' }}>* Required fields</p>
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
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '1rem 0' }} />
                  <h5 className="text-white mb-3" style={{ fontWeight: 600, fontSize: '1.1rem' }}>Department Manager Information</h5>
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
              
              <div className="d-flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <button
                  type="submit"
                  className="btn btn-light"
                  disabled={isSubmitting}
                  style={{ fontWeight: 600, borderRadius: 10, padding: '8px 20px' }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Department'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('departments')}
                  className="btn btn-outline-light"
                  style={{ fontWeight: 600, borderRadius: 10, padding: '8px 20px' }}
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

  // Update stipend calculation manually when needed — lineItems live inside phases[]
  const updateStipendCalculation = () => {
    if (projectBudget && selectedProject && projectFormData.stipendAmount > 0) {
      const stipendTotal = projectFormData.stipendAmount * selectedProject.numberOfBeneficiaries * 4; // 4 months
      const stipendDesc = `Learner stipends for 4 months (${selectedProject.numberOfBeneficiaries} learners × R${projectFormData.stipendAmount} × 4 months)`;

      // Distribute the stipend across every phase — if the phase already has a
      // 'stipend' line item we update it in place; otherwise it's skipped.
      const updatedPhases = projectBudget.phases.map(phase => {
        let phaseChanged = false;
        const phaseItems = phase.lineItems.map(item => {
          if (item.id === 'stipend') {
            phaseChanged = true;
            return {
              ...item,
              allocatedAmount: stipendTotal,
              remainingAmount: stipendTotal - item.spentAmount,
              description: stipendDesc
            };
          }
          return item;
        });
        if (!phaseChanged) return phase;
        const phaseAllocated = phaseItems.reduce((s, i) => s + i.allocatedAmount, 0);
        return {
          ...phase,
          lineItems: phaseItems,
          remainingBudget: phase.allocatedBudget - phaseAllocated
        };
      });

      const totalAllocated = updatedPhases.reduce((sum, phase) =>
        sum + phase.lineItems.reduce((ps, item) => ps + item.allocatedAmount, 0), 0);

      setProjectBudget({
        ...projectBudget,
        phases: updatedPhases,
        totalAllocated,
        remainingBudget: projectBudget.totalBudget - totalAllocated
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
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
        borderRadius: 16,
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body text-center text-white py-4">
          <h2 className="mb-2" style={{ fontWeight: 700, fontSize: '1.8rem' }}>💰 Budget Management</h2>
          <p className="mb-0 opacity-75" style={{ fontSize: '1rem' }}>Manage project budget allocations and track spending</p>
        </div>
      </div>

      {/* Project Selection */}
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
        borderRadius: 16,
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body text-white">
          <h5 className="mb-3" style={{ fontWeight: 600 }}>Select Project</h5>
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
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          borderRadius: 16,
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
              background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
              borderRadius: 16,
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
            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
            borderRadius: 16,
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
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          borderRadius: 16,
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
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize:'1.2rem' }}>🎓</span>
            <span className="navbar-brand mb-0 h1 text-white fw-bold" style={{ fontSize:'1rem' }}>SDP Dashboard</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-white" style={{ fontSize:'0.9rem', opacity:0.85 }}>{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-sm" style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:600 }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid flex-grow-1 d-flex">
        <div className="row flex-grow-1 g-0">
          {/* Side Panel */}
          <div className="col-md-3 col-lg-2 d-flex flex-column" style={{ background: '#1e293b', minHeight:'calc(100vh - 56px)' }}>
            <div className="p-3 flex-grow-1">
              <h6 className="text-uppercase mb-3 mt-2" style={{ fontSize:'0.7rem', letterSpacing:'1.5px', fontWeight:700, color:'rgba(255,255,255,0.35)' }}>Navigation</h6>
              <div className="nav flex-column gap-1">
                <button
                  className={`nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2 ${activeSection === 'overview' ? '' : ''}`}
                  style={{ color: activeSection === 'overview' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'overview' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'overview' ? 700 : 400, transition:'all 0.15s' }}
                  onClick={() => setActiveSection('overview')}
                >
                  <span>📊</span> Overview
                </button>
                <button
                  style={{ color: activeSection === 'projects' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'projects' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'projects' ? 700 : 400, transition:'all 0.15s' }}
                  className="nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => setActiveSection('projects')}
                >
                  <span>📋</span> Projects
                </button>
                <button
                  style={{ color: activeSection === 'departments' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'departments' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'departments' ? 700 : 400, transition:'all 0.15s' }}
                  className="nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => setActiveSection('departments')}
                >
                  <span>🏢</span> Departments
                </button>
                <button
                  style={{ color: activeSection === 'users' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'users' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'users' ? 700 : 400, transition:'all 0.15s' }}
                  className="nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => setActiveSection('users')}
                >
                  <span>👤</span> Users
                </button>
                <button
                  style={{ color: activeSection === 'budget-management' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'budget-management' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'budget-management' ? 700 : 400, transition:'all 0.15s', opacity: projects.length === 0 ? 0.4 : 1 }}
                  className="nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => setActiveSection('budget-management')}
                  disabled={projects.length === 0}
                >
                  <span>💰</span> Budget Management
                </button>
                <hr style={{ borderColor:'rgba(255,255,255,0.1)', margin:'12px 0' }} />
                <h6 style={{ fontSize:'0.7rem', letterSpacing:'1.5px', fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', margin:'0 0 8px 4px' }}>Actions</h6>
                <button
                  title={
                    projects.length === 0
                      ? 'Create a project first'
                      : selectedProject
                      ? `Currently editing: ${selectedProject.projectName || 'Selected project'}`
                      : 'Select a project from the Projects list first — no project currently loaded'
                  }
                  style={{ color: activeSection === 'update-project' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'update-project' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'update-project' ? 700 : 400, transition:'all 0.15s', opacity: projects.length === 0 ? 0.4 : 1 }}
                  className="nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => {
                    // If no project is selected, drop the user on the projects list so they
                    // can pick one via the card's "Update Project" button (the only valid way
                    // to enter this flow with a preloaded selectedProject).
                    if (!selectedProject) {
                      setActiveSection('projects');
                      setSidebarTip('💡 Select a project below by clicking its ✏️ Update Project button, then return here.');
                      setTimeout(() => setSidebarTip(prev => prev?.startsWith('💡') ? null : prev), 6000);
                      return;
                    }
                    setSidebarTip(null);
                    setActiveSection('update-project');
                  }}
                  disabled={projects.length === 0}
                >
                  <span>✏️</span> Update Project
                </button>
                <button
                  style={{ color: activeSection === 'add-project' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'add-project' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'add-project' ? 700 : 400, transition:'all 0.15s' }}
                  className="nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => setActiveSection('add-project')}
                >
                  <span>➕</span> Add Project
                </button>
                <button
                  style={{ color: activeSection === 'add-department' ? '#fff' : 'rgba(255,255,255,0.6)', background: activeSection === 'add-department' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', fontWeight: activeSection === 'add-department' ? 700 : 400, transition:'all 0.15s' }}
                  className="nav-link text-start border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2"
                  onClick={() => setActiveSection('add-department')}
                >
                  <span>➕</span> Add Department
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9 col-lg-10 d-flex flex-column" style={{ background:'#f1f5f9' }}>
            <div className="p-4 flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 56px)', backgroundColor: '#f1f5f9' }}>
              {/* ── Tip banner (sidebar-nav hints) ── */}
              {sidebarTip && (
                <div className="mb-3 alert alert-info alert-dismissible d-flex align-items-center gap-2 shadow-sm"
                  style={{ borderRadius: 12, border: '1px solid #7dd3fc', background: '#f0f9ff' }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <span style={{ color: '#0c4a6e', fontSize: 14, fontWeight: 500, flex: 1 }}>{sidebarTip}</span>
                  <button type="button" className="btn-close" onClick={() => setSidebarTip(null)} aria-label="Close"></button>
                </div>
              )}

              {/* ── Global API error banners ── */}
              {(projectsError || departmentsError || usersError) && (
                <div className="mb-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {projectsError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-0 shadow-sm"
                      style={{ borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2' }}>
                      <span style={{ fontSize: 18 }}>⛔</span>
                      <span style={{ color: '#991b1b', fontSize: 14, flex: 1 }}>{projectsError}</span>
                      <button type="button" className="btn btn-sm btn-danger"
                        style={{ borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 13 }}
                        onClick={retryFetchProjects}>↻ Retry</button>
                    </div>
                  )}
                  {departmentsError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-0 shadow-sm"
                      style={{ borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2' }}>
                      <span style={{ fontSize: 18 }}>⛔</span>
                      <span style={{ color: '#991b1b', fontSize: 14, flex: 1 }}>{departmentsError}</span>
                      <button type="button" className="btn btn-sm btn-danger"
                        style={{ borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 13 }}
                        onClick={retryFetchDepartments}>↻ Retry</button>
                    </div>
                  )}
                  {usersError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-0 shadow-sm"
                      style={{ borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2' }}>
                      <span style={{ fontSize: 18 }}>⛔</span>
                      <span style={{ color: '#991b1b', fontSize: 14, flex: 1 }}>{usersError}</span>
                      <button type="button" className="btn btn-sm btn-danger"
                        style={{ borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 13 }}
                        onClick={retryFetchUsers}>↻ Retry</button>
                    </div>
                  )}
                </div>
              )}

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