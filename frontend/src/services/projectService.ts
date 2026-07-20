// API base URL - using relative URL to go through Vite proxy
const API_BASE_URL = '/api';

export interface Project {
  id: number;
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
  projectFunder: string;
  leadEmployerPartner: string;
  skillsDevelopmentProviderId: number;
  budgetAmount: number;
  clientId: number;
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
  projectLearningPathways?: ProjectLearningPathwayData[];
}

export interface ProjectData {
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
  projectFunder: string;
  leadEmployerPartner: string;
  skillsDevelopmentProviderId: number;
  budgetAmount: number;
  clientId?: number;
  learningPathways: ProjectLearningPathwayData[];
}

export interface ProjectLearningPathwayData {
  pathwayId: number;
  qualifications: ProjectQualificationData[];
}

export interface ProjectQualificationData {
  qualificationTypeId: number;
  occupationalQualificationId?: number;
  legacyQualificationId?: number;
  employmentType?: string;
  numberOfBeneficiaries?: number;
  selectedUnitStandards?: number[]; // Array of unit standard IDs for multiple selection
}

export interface LearningPathway {
  pathwayId: number;
  name: string;
  synced: boolean;
}

export interface QualificationType {
  id: number;
  name: string;
  description: string;
}

export interface OccupationalQualification {
  qualificationId: number;
  name: string;
  level: number;
  credits: number;
  qualificationType: string;
  description?: string;
  qualityPartner?: string;
  trade?: string;
}

export interface LegacyQualification {
  id: number;
  qualificationId: number;
  name: string;
  description?: string;
  level: number;
  credits: number;
  qualificationType: string;
  hasCat?: string;
}

export interface OccupationalUnitStandard {
  id: number;
  qualificationId: number;
  moduleCode: string;
  unitStandardName: string;
  moduleType: string;
  level: number;
  credits: number;
}

export interface LegacyUnitStandard {
  id: number;
  unitStandardId: number;
  qualificationId: number;
  unitStandardName: string;
  level: number;
  credits: number;
  synced: boolean;
}

export interface SkillsDevelopmentProvider {
  id: number;
  name: string;
  accreditationNumber?: string; // Optional due to database schema issues
  contactPerson?: string;
  emailAddress?: string; // Optional due to database schema issues
  phoneNumber?: string; // Optional due to database schema issues
  address?: string;
  clientId: number;
  description?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectResponse {
  id: number;
  projectName: string;
  contractNumber: string;
  message: string;
  createdAt: string;
}

/**
 * Creates a new project
 */
export const createProject = async (projectData: ProjectData): Promise<ProjectResponse> => {
  try {
    console.log('Project data being sent:', projectData);
    
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    const result = await response.json();
    console.log('Project creation response:', result);
    return result;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Gets learning pathways
 */
export const getLearningPathways = async (): Promise<LearningPathway[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/learning-pathways`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching learning pathways:', error);
    throw error;
  }
};

/**
 * Gets qualification types
 */
export const getQualificationTypes = async (): Promise<QualificationType[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/qualification-types`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching qualification types:', error);
    throw error;
  }
};

/**
 * Gets occupational qualifications
 */
export const getOccupationalQualifications = async (): Promise<OccupationalQualification[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/qualifications/occupational`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching occupational qualifications:', error);
    throw error;
  }
};

/**
 * Gets legacy qualifications
 */
export const getLegacyQualifications = async (): Promise<LegacyQualification[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/qualifications/legacy`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching legacy qualifications:', error);
    throw error;
  }
};

/**
 * Gets occupational unit standards for a qualification
 */
export const getOccupationalUnitStandards = async (qualificationId: number): Promise<OccupationalUnitStandard[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/unit-standards/occupational/${qualificationId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching occupational unit standards:', error);
    throw error;
  }
};

/**
 * Gets legacy unit standards for a qualification
 */
export const getLegacyUnitStandards = async (qualificationId: number): Promise<LegacyUnitStandard[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/unit-standards/legacy/${qualificationId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching legacy unit standards:', error);
    throw error;
  }
};

/**
 * Gets skills development providers for a client
 */
export const getClientSDPs = async (clientId: number): Promise<SkillsDevelopmentProvider[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/client/${clientId}/sdps`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching client SDPs:', error);
    throw error;
  }
};

/**
 * Gets projects for a client
 */
export const getClientProjects = async (clientId: number): Promise<Project[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/client/${clientId}/projects`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching client projects:', error);
    throw error;
  }
};

/**
 * Gets all skills development providers
 */
export const getAllSDPs = async (): Promise<SkillsDevelopmentProvider[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/SkillsDevelopmentProviders`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all SDPs:', error);
    throw error;
  }
};

/**
 * Gets a specific SDP by ID
 */
export const getSDPById = async (id: number): Promise<SkillsDevelopmentProvider> => {
  try {
    const response = await fetch(`${API_BASE_URL}/SkillsDevelopmentProviders/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching SDP by ID:', error);
    throw error;
  }
};

/**
 * Creates a new SDP
 */
export const createSDP = async (sdpData: Omit<SkillsDevelopmentProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<SkillsDevelopmentProvider> => {
  try {
    const response = await fetch(`${API_BASE_URL}/SkillsDevelopmentProviders/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sdpData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating SDP:', error);
    throw error;
  }
};

/**
 * Updates an existing SDP
 */
export const updateSDP = async (id: number, sdpData: Partial<SkillsDevelopmentProvider>): Promise<SkillsDevelopmentProvider> => {
  try {
    const response = await fetch(`${API_BASE_URL}/SkillsDevelopmentProviders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sdpData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating SDP:', error);
    throw error;
  }
};

/**
 * Deletes an SDP
 */
export const deleteSDP = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/SkillsDevelopmentProviders/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting SDP:', error);
    throw error;
  }
};

/**
 * Creates a new occupational qualification
 */
export const createOccupationalQualification = async (oq: Omit<OccupationalQualification, 'qualificationId'>): Promise<OccupationalQualification> => {
  try {
    const response = await fetch(`${API_BASE_URL}/qualifications/occupational`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(oq),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating occupational qualification:', error);
    throw error;
  }
};

/**
 * Creates a new occupational unit standard
 */
export const createOccupationalUnitStandard = async (qualificationId: number, ous: Omit<OccupationalUnitStandard, 'id' | 'qualificationId'>): Promise<OccupationalUnitStandard> => {
  try {
    const response = await fetch(`${API_BASE_URL}/qualifications/occupational/${qualificationId}/unit-standards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ous),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating occupational unit standard:', error);
    throw error;
  }
};

/**
 * Creates a new legacy qualification
 */
export const createLegacyQualification = async (lq: Omit<LegacyQualification, 'id'>): Promise<LegacyQualification> => {
  try {
    const response = await fetch(`${API_BASE_URL}/qualifications/legacy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lq),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating legacy qualification:', error);
    throw error;
  }
};

/**
 * Creates a new legacy unit standard
 */
export const createLegacyUnitStandard = async (qualificationId: number, lus: Omit<LegacyUnitStandard, 'id' | 'qualificationId'>): Promise<LegacyUnitStandard> => {
  try {
    const response = await fetch(`${API_BASE_URL}/qualifications/legacy/${qualificationId}/unit-standards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lus),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating legacy unit standard:', error);
    throw error;
  }
};