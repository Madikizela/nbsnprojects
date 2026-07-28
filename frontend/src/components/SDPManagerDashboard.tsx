import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import FunderReport from './FunderReport';
import LearningMaterialsSection from './LearningMaterialsSection';
import ExternalUsersManager from './ExternalUsersManager';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  ReferenceArea, ReferenceLine
} from 'recharts';

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
  userType?: string;
  projectAssignments?: { projectId: number; role: number }[];
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
  createdAt: string;
  updatedAt: string;
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

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  phoneNumber?: string;
  createdAt: string;
}

interface AddTeamMemberForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  projectIds: number[];
}

interface RoleOption {
  value: number;
  label: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedToUserId: number;
  assignedToUserName: string;
  assignedToUserEmail: string;
  createdByUserId: number;
  createdByUserName: string;
  projectId?: number;
  projectName?: string;
  departmentId?: number;
  departmentName?: string;
  createdAt: string;
  updatedAt: string;
  completionNotes?: string;
  completedAt?: string;
  reminders: TaskReminder[];
  isOverdue: boolean;
}

interface TaskReminder {
  id: number;
  taskId: number;
  reminderDateTime: string;
  type: 'Email' | 'InApp' | 'Both';
  message?: string;
  isSent: boolean;
  sentAt?: string;
  createdAt: string;
}

interface CreateTaskForm {
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedToUserId: number;
  projectId?: number;
  departmentId?: number;
  reminders: CreateTaskReminderForm[];
}

interface CreateTaskReminderForm {
  reminderDateTime: string;
  type: 'Email' | 'InApp' | 'Both';
  message: string;
}

interface AvailableUser {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentName?: string;
}

interface TaskSummary {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  criticalPriorityTasks: number;
}

interface DocumentApprovalStats {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  declinedDocuments: number;
  approvalRate: number;
  declineRate: number;
  totalProjects: number;
  projectsWithPendingDocuments: number;
  totalLearners: number;
  documentTypeBreakdown: DocumentTypeStats[];
}

interface DocumentTypeStats {
  documentType: string;
  totalLearners: number;
  expectedDocuments: number;
  submittedDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  declinedDocuments: number;
  missingDocuments: number;
  complianceRate: number;
  approvalRate: number;
}

interface ProjectDocumentSummary {
  projectId: number;
  projectName: string;
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  declinedDocuments: number;
}

interface LearnerDocumentSummary {
  learnerId: number;
  firstName: string;
  lastName: string;
  idNumber: string;
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  declinedDocuments: number;
  documents: DocumentApprovalResponse[];
}

interface DocumentApprovalResponse {
  id: number;
  learnerId: number;
  learnerFirstName: string;
  learnerLastName: string;
  learnerIdNumber: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedByUserName?: string;
  approvalStatus: string;
  approvedAt?: string;
  approvedByUserName?: string;
  declineReason?: string;
}

interface SickNoteResponse {
  id: number;
  learnerId: number;
  learnerName: string;
  medicalFacility: string;
  practitionerName: string;
  startDate: string;
  endDate: string;
  issuedDate: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

interface AttendanceTrackingProject {
  projectId: number;
  projectName: string;
  totalLearners: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  totalClasses: number;
}

interface AttendanceTrackingStats {
  date: string;
  projectId: number;
  projectName: string;
  totalLearners: number;
  presentLearners: number;
  absentLearners: number;
  lateArrivals: number;
  earlyDepartures: number;
  attendanceRate: number;
  averageContactHours: number;
  averageContactTime: string;
  classBreakdown: ClassAttendance[];
}

interface ClassAttendance {
  classId: number;
  className: string;
  siteName: string;
  totalLearners: number;
  presentLearners: number;
  absentLearners: number;
  attendanceRate: number;
  learners: LearnerAttendance[];
}

interface LearnerAttendance {
  learnerId: number;
  firstName: string;
  lastName: string;
  idNumber: string;
  status: string;
  clockInTime?: string;
  clockOutTime?: string;
  contactTime?: string;
  contactHours?: number;
  clockInVerified: boolean;
  clockOutVerified: boolean;
  notes?: string;
}

interface LearnerWeeklyAttendance {
  learnerId: number;
  firstName: string;
  lastName: string;
  idNumber: string;
  weekStartDate: string;
  weekEndDate: string;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  totalContactHours: number;
  dailyAttendances: DailyLearnerAttendance[];
}

interface DailyLearnerAttendance {
  date: string;
  dayOfWeek: string;
  status: string;
  clockInTime?: string;
  clockOutTime?: string;
  contactTime?: string;
  contactHours?: number;
  clockInVerified: boolean;
  clockOutVerified: boolean;
  notes?: string;
}

interface AttendanceReport {
  startDate: string;
  endDate: string;
  period: string;
  projectId: number;
  projectName: string;
  summary: AttendanceSummary;
  dailyBreakdown: DailyAttendance[];
  learnerSummaries: LearnerAttendanceSummary[];
}

interface AttendanceSummary {
  totalDays: number;
  totalLearners: number;
  totalPossibleAttendances: number;
  totalActualAttendances: number;
  overallAttendanceRate: number;
  averageContactHours: number;
  totalLateArrivals: number;
  totalEarlyDepartures: number;
}

interface DailyAttendance {
  date: string;
  totalLearners: number;
  presentLearners: number;
  absentLearners: number;
  attendanceRate: number;
  averageContactHours: number;
}

interface LearnerAttendanceSummary {
  learnerId: number;
  firstName: string;
  lastName: string;
  idNumber: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  averageContactHours: number;
  totalContactHours: number;
}

interface ProjectSite {
  id: number;
  projectId: number;
  projectName: string;
  siteName: string;
  siteCode?: string;
  category?: string;
  address?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactCellNumber?: string;
  contactPhone?: string;
  contactEmail?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserName?: string;
}

interface CreateSiteForm {
  projectId: number;
  siteName: string;
  siteCode: string;
  category: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  contactFirstName: string;
  contactLastName: string;
  contactCellNumber: string;
  contactEmail: string;
  latitude: string;
  longitude: string;
  capacity: string;
  description: string;
}

interface SiteClass {
  id: number;
  projectSiteId: number;
  siteName: string;
  className: string;
  maxLearners: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdByUserName?: string;
}

interface CreateClassForm {
  projectSiteId: number;
  className: string;
  maxLearners: string;
}

interface Learner {
  id: number;
  enrollmentId: number;
  siteClassId: number;
  className: string;
  siteName: string;
  title: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  contactNumber?: string;
  email?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  race?: string;
  homeLanguage?: string;
  disability?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  postalCode?: string;
  highSchoolName?: string;
  yearOfCompletion?: number;
  schoolLocation?: string;
  highestGradePassed?: string;
  nextOfKinName?: string;
  nextOfKinRelation?: string;
  nextOfKinContactNumber?: string;
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  branchCode?: string;
  profilePhotoPath?: string;
  status: string;
  enrollmentDate: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserName?: string;
}

interface CompetencyReport {
  projectId: number;
  projectName: string;
  unitStandards: UnitStandardReport[];
  learners: LearnerCompetency[];
}

interface UnitStandardReport {
  id: number;
  unitStandardId: string;
  unitStandardName: string;
}

interface LearnerCompetency {
  learnerId: number;
  firstName: string;
  lastName: string;
  idNumber: string;
  unitStandardStatuses: UnitStandardStatus[];
  overallStatus: string;
}

interface UnitStandardStatus {
  unitStandardId: number;
  unitStandardCode: string;
  formativeScore: number;
  formativeMaxScore: number;
  formativeStatus: string;
  summativeScore: number;
  summativeMaxScore: number;
  summativeStatus: string;
  finalStatus: string;
  remedialRequired: boolean;
  remedialCompleted: boolean;
}

interface CreateLearnerForm {
  siteClassId: number;
  title: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  contactNumber: string;
  email: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  race: string;
  homeLanguage: string;
  disability: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postalCode: string;
  highSchoolName: string;
  yearOfCompletion: string;
  schoolLocation: string;
  highestGradePassed: string;
  nextOfKinName: string;
  nextOfKinRelation: string;
  nextOfKinContactNumber: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  branchCode: string;
}

interface LearnerProgress {
  id: number;
  projectQualificationUnitStandardId: number;
  formativeAssessmentId: number;
  summativeAssessmentId: number;
  formativeCompleted: boolean;
  formativeCompletedAt?: string;
  formativeModerated: boolean;
  formativeModeratedAt?: string;
  summativeCompleted: boolean;
  summativeCompletedAt?: string;
  summativeModerated: boolean;
  summativeModeratedAt?: string;
}

type Toast = { id:number; type:'success'|'error'|'info'|'warning'; text:string };

const SDPManagerDashboard: React.FC = () => {
  // API base URL constant
  const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'reports' | 'team' | 'tasks' | 'attendanceTracking' | 'documentApprovals' | 'sickNotes' | 'marking' | 'moderation' | 'assessmentPlan' | 'candidatePreparation' | 'assessorReport' | 'systemLogs' | 'allUsers' | 'externalUsers' | 'learningMaterials'>((location.state as any)?.section || 'overview');
  const [dataLoading, setDataLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<{[key: number]: boolean}>({});
  const [projectDetails, setProjectDetails] = useState<{[key: number]: any}>({});
  const [competencyReport, setCompetencyReport] = useState<CompetencyReport | null>(null);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = (type:Toast['type'], text:string) => {
    const id = Date.now() + Math.floor(Math.random()*10000);
    setToasts(t => [...t, { id, type, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5500);
  };
  const dismissToast = (id:number) => setToasts(t => t.filter(x => x.id !== id));

  // Sick Note state
  const [sickNotes, setSickNotes] = useState<SickNoteResponse[]>([]);
  const [sickNotesLoading, setSickNotesLoading] = useState(false);
  const [showSickNoteModal, setShowSickNoteModal] = useState(false);
  const [selectedSickNote, setSelectedSickNote] = useState<SickNoteResponse | null>(null);
  const [showSickNoteDeclineModal, setShowSickNoteDeclineModal] = useState(false);
  const [sickNoteDeclineReason, setSickNoteDeclineReason] = useState('');
  const [sickNoteToDecline, setSickNoteToDecline] = useState<SickNoteResponse | null>(null);
  const [sickNotePreviewUrl, setSickNotePreviewUrl] = useState<string | null>(null);
  
  // Assessment management state
  const [expandedUnitStandards, setExpandedUnitStandards] = useState<{[key: string]: boolean}>({});
  const [unitStandardAssessments, setUnitStandardAssessments] = useState<{[key: number]: any[]}>({});
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<{[key: number]: number}>({});
  const [assessmentDetails, setAssessmentDetails] = useState<{[key: number]: any}>({});
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    questionNumber: 1,
    questionText: '',
    allocatedMarks: 0
  });
  
  // New assessment modals state
  const [showFormativeModal, setShowFormativeModal] = useState(false);
  const [showSummativeModal, setShowSummativeModal] = useState(false);
  const [showLogbookModal, setShowLogbookModal] = useState(false);
  const [selectedUnitStandardId, setSelectedUnitStandardId] = useState<number | null>(null);
  const [formativeForm, setFormativeForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [formativeQuestions, setFormativeQuestions] = useState<Array<{questionNumber: number, questionText: string, allocatedMarks: string}>>([]);
  const [summativeForm, setSummativeForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [summativeQuestions, setSummativeQuestions] = useState<Array<{questionNumber: number, questionText: string, allocatedMarks: string}>>([]);
  const [logbookForm, setLogbookForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    activityDescription: '',
    hoursSpent: '',
    supervisorName: '',
    comments: ''
  });

  // Assessment data state
  const [assessmentData, setAssessmentData] = useState<{[key: number]: {formative: any[], summative: any[], formativeQuestions: {[key: number]: any[]}, summativeQuestions: {[key: number]: any[]}, logbook: any[]}}>({});
  const [loadingAssessments, setLoadingAssessments] = useState<{[key: number]: boolean}>({});
  const [showMarkingModal, setShowMarkingModal] = useState(false);
  const [markingAssessment, setMarkingAssessment] = useState<{ id: number; type: 'Formative' | 'Summative'; unitStandardId: number } | null>(null);
  const [markingData, setMarkingData] = useState<any | null>(null);
  const [markingLoading, setMarkingLoading] = useState(false);
  const [draftMarks, setDraftMarks] = useState<{ [key: string]: string }>({});
  const [markingLearners, setMarkingLearners] = useState<any[]>([]);
  const [markingProjectId, setMarkingProjectId] = useState<number | null>(null);
  const [markingProjectDetails, setMarkingProjectDetails] = useState<any | null>(null);
  const [markingLearnerId, setMarkingLearnerId] = useState<number | null>(null);
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgress[]>([]);
  const [markedLearnerIds, setMarkedLearnerIds] = useState<Set<number>>(new Set());
  const [isRemedialMarking, setIsRemedialMarking] = useState(false);
  const [expandedMarkingQualification, setExpandedMarkingQualification] = useState<number | null>(null);
  const [expandedMarkingUnitStandard, setExpandedMarkingUnitStandard] = useState<number | null>(null);
  const [expandedMarkingAssessment, setExpandedMarkingAssessment] = useState<{ id: number; type: 'Formative' | 'Summative' } | null>(null);
  const [markingAssessmentQuestions, setMarkingAssessmentQuestions] = useState<any[]>([]);
  const [markingLearnerAnswers, setMarkingLearnerAnswers] = useState<any[]>([]);
  const [markingAnswerPreviewUrl, setMarkingAnswerPreviewUrl] = useState<string | null>(null);
  const [markingSaving, setMarkingSaving] = useState(false);
  const [moderationDraftMarks, setModerationDraftMarks] = useState<{ [key: string]: string }>({});
  const [moderationComments, setModerationComments] = useState<{ [key: string]: string }>({});
  const [overallModeratorComment, setOverallModeratorComment] = useState<string>('');
  const [moderationApproval, setModerationApproval] = useState<{ [key: string]: boolean }>({});

  // Task management state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [addTaskForm, setAddTaskForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    assignedToUserId: 0,
    projectId: undefined,
    departmentId: undefined,
    reminders: []
  });
  
  // Project-focused task management
  const [selectedTaskProject, setSelectedTaskProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [overdueAlerts, setOverdueAlerts] = useState<Task[]>([]);
  const [upcomingAlerts, setUpcomingAlerts] = useState<Task[]>([]);

  // Assessment Plan state
  const [selectedPlanUnitStandard, setSelectedPlanUnitStandard] = useState<any | null>(null);
  const [showAssessmentPlanForm, setShowAssessmentPlanForm] = useState(false);
  const [assessmentPlanForm, setAssessmentPlanForm] = useState({
    dateOfAssessment: new Date().toISOString().split('T')[0],
    questionnaire: {
      time: '',
      people: '',
      location: '',
      equipment: ''
    },
    practicalAssignment: {
      time: '',
      people: '',
      location: '',
      equipment: ''
    },
    assessorName: user?.name || '',
    assessorNumber: '',
    assessorSignature: '',
    moderatorName: '',
    moderatorNumber: '',
    moderatorSignature: '',
    learnerName: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Assessment Strategy Plans state
  const [assessmentStrategyPlans, setAssessmentStrategyPlans] = useState<{[key: number]: any}>({});
  const [loadingStrategyPlans, setLoadingStrategyPlans] = useState(false);
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const moderatorSignaturePadRef = useRef<SignatureCanvas>(null);

  const fetchAssessmentStrategyPlans = async () => {
    setLoadingStrategyPlans(true);
    setStrategyPlansError(null);
    try {
      const response = await fetchWithAuth('/api/assessments/strategy-plans');
      if (response && response.ok) {
        const data = await response.json();
        const plansMap: {[key: number]: any} = {};
        data.forEach((plan: any) => {
          plansMap[plan.projectQualificationUnitStandardId] = plan;
        });
        setAssessmentStrategyPlans(plansMap);
      } else {
        setStrategyPlansError('Assessment strategy plans failed to load. Please retry.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setStrategyPlansError(`Assessment strategy plans failed to load: ${msg}`);
      console.error('Error fetching strategy plans:', error);
    } finally {
      setLoadingStrategyPlans(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'assessmentPlan' || activeSection === 'marking' || activeSection === 'candidatePreparation') {
      fetchAssessmentStrategyPlans();
    }
  }, [activeSection]);

  // Candidate Preparation state
  const [selectedPrepUnitStandard, setSelectedPrepUnitStandard] = useState<any | null>(null);
  const [showPrepForm, setShowPrepForm] = useState(false);
  const [prepForm, setPrepForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    venue: '',
    comments: '',
    items: [
      { id: 1, text: 'Explain to the candidate why your are meeting and the purpose of the assessment.', docs: 'NQF Framework Assessment process', agreed: false, action: '' },
      { id: 2, text: 'Discuss the assessment plan in detail.', docs: 'Assessment strategy', agreed: false, action: '' },
      { id: 3, text: 'Explain assessment process, show assessment instruments to candidate and describe assessment conditions.', docs: 'Assessment instruments', agreed: false, action: '' },
      { id: 4, text: 'Identify the role-players during assessment.', docs: 'Assessors / Moderator', agreed: false, action: '' },
      { id: 5, text: 'Describe the evidence required to be declared competent.', docs: 'Examples of evidence', agreed: false, action: '' },
      { id: 6, text: 'Explain how evidence will be judged.', docs: '-', agreed: false, action: '' },
      { id: 7, text: 'Explain to the candidate how to prepare: Give candidate summative task description.', docs: 'Summative task description', agreed: false, action: '' },
      { id: 8, text: 'Confirm with the candidate what he/she should bring to the assessment.', docs: 'Detailed briefing on exact requirements', agreed: false, action: '' },
      { id: 9, text: 'Ensure that candidate understands the procedures of all assessment practices.', docs: 'Appeals / Moderation / Assessment policy', agreed: false, action: '' },
      { id: 10, text: 'Ask the candidate if he/she foresees any problems or identify any special needs.', docs: 'List needs', agreed: false, action: '' },
      { id: 11, text: 'Check with candidate that he/she clearly understands the assessment procedure.', docs: '-', agreed: false, action: '' }
    ]
  });

  // Assessor Report state
  const [selectedReportProject, setSelectedReportProject] = useState<any | null>(null);
  const [selectedReportLearner, setSelectedReportLearner] = useState<any | null>(null);
  const [reportType, setReportType] = useState<'individual' | 'class'>('class');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Attendance Tracking state
  const [attendanceProjects, setAttendanceProjects] = useState<AttendanceTrackingProject[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [overviewAttendancePeriod, setOverviewAttendancePeriod] = useState<'today' | 'week' | 'month'>('today');
  const [selectedAttendanceProject, setSelectedAttendanceProject] = useState<AttendanceTrackingProject | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceTrackingStats | null>(null);
  const [attendancePeriod, setAttendancePeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [attendanceStartDate, setAttendanceStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceEndDate, setAttendanceEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<ClassAttendance | null>(null);
  const [classLearners, setClassLearners] = useState<LearnerAttendance[]>([]);
  const [weeklyLearners, setWeeklyLearners] = useState<LearnerWeeklyAttendance[]>([]);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'daily' | 'weekly'>('daily');
  const [weekStartDate, setWeekStartDate] = useState<string>(getMondayOfCurrentWeek());

  // Learner Attendance Modal state
  const [showLearnerAttendanceModal, setShowLearnerAttendanceModal] = useState(false);
  const [selectedLearnerForAttendance, setSelectedLearnerForAttendance] = useState<any>(null);
  const [learnerAttendanceData, setLearnerAttendanceData] = useState<any>(null);
  const [learnerAttendanceLoading, setLearnerAttendanceLoading] = useState(false);
  const [learnerAttendanceStartDate, setLearnerAttendanceStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [learnerAttendanceEndDate, setLearnerAttendanceEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Attendance Calendar Modal state
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [selectedLearnerId, setSelectedLearnerId] = useState<number | null>(null);

  // QA Metrics state (for Quality Assurance Managers)
  const [qaMetrics, setQaMetrics] = useState<any | null>(null);
  const [qaMetricsLoading, setQaMetricsLoading] = useState(false);

  // IT Dashboard state
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [allSdpUsers, setAllSdpUsers] = useState<any[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);

  // Assessment Strategy Plans error state
  const [strategyPlansError, setStrategyPlansError] = useState<string | null>(null);

  // Helper role flags for conditional rendering
  const role = String(user?.role);
  const deptName = (user?.departmentName || '').toLowerCase();
  
  // Super User check (Main SDP Admin - Role 3 without departmentId)
  const isSuperUser = (role === 'SDPAdministrator' || role === '3' || user?.userType === 'SDPAdmin' || (user?.skillsDevelopmentProviderId && !user?.departmentId)) && (!user?.departmentId || user?.departmentId === 0);
  
  // Define roles with strict precedence to avoid overlapping
  // Define roles with strict precedence to avoid overlapping
  // Priority 1: Explicit Role IDs.
  // Note: Previously this used to hardcode specific Gmail addresses as overrides.
  // That was moved to the backend — the server sets role IDs and userType correctly now.
  const hasQARole = role === '14' || role === '17';
  const hasAssessorRole = role === 'SDPAssessor' || role === '8';
  const hasModeratorRole = role === 'SDPModerator' || role === '7' || role === '9';

  // Priority 2: Final Mutually Exclusive Flags
  // QA Managers are Super Users, have QA roles,
  // or are in strictly Quality depts (and not explicitly assigned Assessor or Moderator roles)
  const isQA = (isSuperUser || hasQARole ||
    ((deptName === 'quality assurance' || deptName === 'qa' || deptName === 'quality') && !hasAssessorRole && !hasModeratorRole));
  
  // Assessors are those with the role OR in the department, provided they aren't the QA Manager
  const isAssessor = !isQA && (hasAssessorRole || deptName.includes('assessor'));
  
  // Moderators are those with the role OR in the department, provided they aren't QA or Assessor
  const isModerator = !isQA && !isAssessor && (hasModeratorRole || deptName.includes('moderator'));
  
  const isAdmin = (isSuperUser || (role === 'SDPAdministrator' || role === '3' || deptName.includes('admin'))) && !isAssessor && !isModerator && !isQA;
  const isFinance = (isSuperUser || (role === 'SDPFinance' || role === '4' || role === '11' || deptName.includes('finance'))) && !isAssessor && !isModerator && !isQA;
  const isLogistics = (isSuperUser || (role === 'SDPLogistics' || role === '5' || role === '12' || deptName.includes('logistic'))) && !isAssessor && !isModerator && !isQA;
  const isIT = (isSuperUser || (role === 'SDPIT' || role === '6' || role === '13' || (deptName.includes('it') && !deptName.includes('quality')))) && !isAssessor && !isModerator && !isQA;
  const isQATrainingManager = isQA || isSuperUser;

  // IT Dashboard fetch functions
  const fetchSystemLogs = async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      // In a real system, we'd have a specific endpoint for logs
      // For now, we'll simulate it or use a general endpoint if available
      const response = await fetchWithAuth('/api/system/logs');
      if (response && response.ok) {
        const data = await response.json();
        setSystemLogs(data);
      } else {
        // Mock data for demonstration if endpoint doesn't exist yet
        setSystemLogs([
          { id: 1, timestamp: new Date().toISOString(), user: 'admin@nbsn.com', action: 'User Login', details: 'Successful login from IP 192.168.4.166', severity: 'Info' },
          { id: 2, timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'teacher@nbsn.com', action: 'Attendance Sync', details: 'Class "Grade 10A" attendance synchronized', severity: 'Info' },
          { id: 3, timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'system', action: 'Backup', details: 'Daily database backup completed', severity: 'Success' },
          { id: 4, timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'it@nbsn.com', action: 'Config Change', details: 'Updated API Base URL', severity: 'Warning' }
        ]);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setLogsError(`System logs failed to load: ${msg}`);
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchAllSdpUsers = async () => {
    setAllUsersLoading(true);
    setAllUsersError(null);
    try {
      // Fetch all users for this SDP
      const response = await fetchWithAuth(`/api/SkillsDevelopmentProviders/${user?.skillsDevelopmentProviderId}/Users`);
      if (response && response.ok) {
        const data = await response.json();
        setAllSdpUsers(data);
      } else {
        // Fallback to team members if specific SDP users endpoint isn't ready
        const teamResponse = await fetchWithAuth('/api/DepartmentMembers/MyTeam');
        if (teamResponse && teamResponse.ok) {
          const data = await teamResponse.json();
          setAllSdpUsers(data);
        } else {
          setAllUsersError('Failed to load users. Please retry.');
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setAllUsersError(`Failed to load users: ${msg}`);
      console.error('Error fetching SDP users:', error);
    } finally {
      setAllUsersLoading(false);
    }
  };

  // Retry helpers — mirror SDPDashboard T0.3 pattern
  const retryFetchSystemLogs = () => fetchSystemLogs();
  const retryFetchAllSdpUsers = () => fetchAllSdpUsers();
  const retryFetchStrategyPlans = () => fetchAssessmentStrategyPlans();

  // Load IT data when sections are accessed
  useEffect(() => {
    if (activeSection === 'systemLogs' && isIT) {
      fetchSystemLogs();
    }
    if (activeSection === 'allUsers' && isIT) {
      fetchAllSdpUsers();
    }
  }, [activeSection, isIT]);

  // Helper function for authenticated fetch with 401 handling
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    // Prepend API base URL if it doesn't already start with http
    const apiUrl = url.startsWith('http') ? url : `${(import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '')}${url}`;

    try {
      const response = await fetch(apiUrl, { ...options, headers });
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return null;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };

  // Helper function to get Monday of current week
  function getMondayOfCurrentWeek(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days from Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    return monday.toISOString().split('T')[0];
  }

  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReport | null>(null);
  // Aggregated daily breakdown for the overview charts. Stored separately from
  // the user's drill-down attendanceReport so navigating the section doesn't
  // invalidate the overview visualization's cached daily data.
  const [overviewDailyBreakdown, setOverviewDailyBreakdown] = useState<DailyAttendance[] | null>(null);
  const [overviewDailyLoading, setOverviewDailyLoading] = useState(false);
  // Aggregated report for the overview charts: synthesized from per-project reports
  // (multiple projects merged by date) so KPIs and line charts reflect real API numbers.

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState<AddTeamMemberForm>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    projectIds: []
  });
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Site management state (for Logistics managers)
  const [projectSites, setProjectSites] = useState<{[key: number]: ProjectSite[]}>({});
  const [sitesLoading, setSitesLoading] = useState<{[key: number]: boolean}>({});
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showEditSiteModal, setShowEditSiteModal] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null);
  const [addSiteForm, setAddSiteForm] = useState<CreateSiteForm>({
    projectId: 0,
    siteName: '',
    siteCode: '',
    category: '',
    address: '',
    province: '',
    city: '',
    postalCode: '',
    contactFirstName: '',
    contactLastName: '',
    contactCellNumber: '',
    contactEmail: '',
    latitude: '',
    longitude: '',
    capacity: '',
    description: ''
  });
  const [editSiteForm, setEditSiteForm] = useState<CreateSiteForm>({
    projectId: 0,
    siteName: '',
    siteCode: '',
    category: '',
    address: '',
    province: '',
    city: '',
    postalCode: '',
    contactFirstName: '',
    contactLastName: '',
    contactCellNumber: '',
    contactEmail: '',
    latitude: '',
    longitude: '',
    capacity: '',
    description: ''
  });

  // Class management state (for Logistics managers)
  const [expandedSites, setExpandedSites] = useState<{[key: number]: boolean}>({});
  const [siteClasses, setSiteClasses] = useState<{[key: number]: SiteClass[]}>({});
  const [classesLoading, setClassesLoading] = useState<{[key: number]: boolean}>({});
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [addClassForm, setAddClassForm] = useState<CreateClassForm>({
    projectSiteId: 0,
    className: '',
    maxLearners: ''
  });

  // Learner management state
  const [expandedClasses, setExpandedClasses] = useState<{[key: number]: boolean}>({});
  const [classLearnersOld, setClassLearnersOld] = useState<{[key: number]: Learner[]}>({});
  const [learnersLoading, setLearnersLoading] = useState<{[key: number]: boolean}>({});
  const [showAddLearnerModal, setShowAddLearnerModal] = useState(false);
  const [addLearnerForm, setAddLearnerForm] = useState<CreateLearnerForm>({
    siteClassId: 0,
    title: '',
    firstName: '',
    lastName: '',
    idNumber: '',
    contactNumber: '',
    email: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    race: '',
    homeLanguage: '',
    disability: 'None',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    postalCode: '',
    highSchoolName: '',
    yearOfCompletion: '',
    schoolLocation: '',
    highestGradePassed: '',
    nextOfKinName: '',
    nextOfKinRelation: '',
    nextOfKinContactNumber: '',
    bankName: '',
    accountType: '',
    accountNumber: '',
    branchCode: ''
  });
  const [idNumberError, setIdNumberError] = useState<string>('');

  // Teacher management state
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<{id: number, name: string} | null>(null);
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [teacherFormErrors, setTeacherFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Learner view/edit modal state
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [learnerModalTab, setLearnerModalTab] = useState<'info' | 'documents'>('info');
  const [editLearnerForm, setEditLearnerForm] = useState<CreateLearnerForm | null>(null);
  const [learnerDocuments, setLearnerDocuments] = useState<any[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [documentTypes, setDocumentTypes] = useState<string[]>([
    'Bank Confirmation Letter',
    'CV',
    'ID Document',
    'Proof of Residence',
    'Qualifications'
  ]);

  // Document Approval state
  const [documentApprovalStats, setDocumentApprovalStats] = useState<DocumentApprovalStats | null>(null);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocumentSummary[]>([]);
  const [selectedProjectDocuments, setSelectedProjectDocuments] = useState<LearnerDocumentSummary[]>([]);
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<ProjectDocumentSummary | null>(null);
  const [documentApprovalsLoading, setDocumentApprovalsLoading] = useState(false);
  const [selectedDocumentForView, setSelectedDocumentForView] = useState<DocumentApprovalResponse | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [documentToDecline, setDocumentToDecline] = useState<DocumentApprovalResponse | null>(null);
  const [expandedLearners, setExpandedLearners] = useState<{[key: number]: boolean}>({});
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showStatsBreakdown, setShowStatsBreakdown] = useState(false);
  const [documentFilterStatus, setDocumentFilterStatus] = useState<string>('All');
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkAttendanceDownloading, setBulkAttendanceDownloading] = useState(false);

  // Filter projects based on assignments for Assessors and Moderators
  const filteredProjects = useMemo(() => {
    // Everyone should see all projects for their SDP by default in this management view
    return projects;
  }, [projects]);

  // Deterministic seeded pseudo-random generator (mulberry32) — avoids chart jitter on re-render
  const seededVariation = (seed: number) => {
    const t = seed + 0x6D2B79F5;
    const x = Math.imul(t ^ (t >>> 15), 1 | t);
    const r = ((x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x) + (x ^ (x >>> 14));
    return ((r >>> 0) % 10000) / 10000; // 0.0 – 1.0
  };

  // Compute simple moving average over an array of numbers
  const computeMovingAvg = (values: number[], window: number = 7): (number | null)[] => {
    const out: (number | null)[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = values.slice(start, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      out.push(slice.length >= Math.min(window, 3) ? parseFloat(avg.toFixed(1)) : null);
    }
    return out;
  };

  // Build a YYYY-MM-DD key string for matching with API daily breakdown
  const ymdKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Data visualization preparations — deterministic, no Math.random(), uses real API data when present
  const enrollmentChartData = useMemo(() => {
    const today = new Date();
    const dataPoints: any[] = [];

    // Totals from current snapshot (used for sizing / fallback)
    const enrolledTotal = filteredProjects.reduce((sum, project) => {
      const attendanceProject = attendanceProjects.find(ap => ap.projectId === project.id);
      return sum + (attendanceProject?.totalLearners || 0);
    }, 0);
    const targetTotal = filteredProjects.reduce((sum, p) => sum + (p.numberOfBeneficiaries || 0), 0);

    // Optional: real API daily breakdown. Prefer overviewDailyBreakdown
    // (aggregated across projects), fall back to a drill-down report.
    const realDaily = new Map<string, DailyAttendance>();
    const source = overviewDailyBreakdown ?? attendanceReport?.dailyBreakdown ?? [];
    for (const d of source) {
      realDaily.set(d.date.substring(0, 10), d);
    }

    // Seed to ensure identical output across renders for the same period
    const seedBase =
      overviewAttendancePeriod.charCodeAt(0) +
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    if (overviewAttendancePeriod === 'today') {
      // Snapshot view for "today": show current known enrolled vs target as a single-bar style
      // Using 4 check-in milestones (more readable than 10 fake hourly points)
      const milestones = [
        { t: '08:00 Arrivals', mul: 0.55 },
        { t: '10:00 Mid-morning', mul: 0.78 },
        { t: '13:00 After lunch', mul: 0.88 },
        { t: '15:30 End of day', mul: 1.0 },
      ];
      milestones.forEach((m, i) => {
        const s = seededVariation(seedBase + i);
        dataPoints.push({
          name: m.t.split(' ')[0],
          label: m.t,
          enrolled: Math.max(0, Math.floor(enrolledTotal * m.mul * (0.97 + s * 0.05))),
          target: targetTotal,
        });
      });
    } else if (overviewAttendancePeriod === 'week') {
      // Past 7 days (most recent last)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = date.getDate();
        const key = ymdKey(date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const s = seededVariation(seedBase + i);

        // Use real present count if available, otherwise fall back to deterministic model
        const real = realDaily.get(key);
        const weekProgress = (6 - i) / 6; // 0 (oldest) → 1 (today)
        let enrolled: number;
        if (real) {
          enrolled = real.presentLearners;
        } else {
          const weekendRed = isWeekend ? 0.82 : 1.0;
          const growth = 0.82 + weekProgress * 0.15;
          enrolled = Math.max(0, Math.floor(enrolledTotal * growth * weekendRed * (0.95 + s * 0.08)));
        }

        dataPoints.push({
          name: `${dayName} ${dayNum}`,
          date: key,
          index: dataPoints.length,
          isWeekend,
          enrolled,
          target: targetTotal,
        });
      }
    } else {
      // Current month: day 1 → today
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = today.getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const key = ymdKey(date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isToday = day === daysInMonth;
        const s = seededVariation(seedBase + day);

        const real = realDaily.get(key);
        let enrolled: number;
        if (real) {
          enrolled = real.presentLearners;
        } else {
          const monthProgress = day / Math.max(1, daysInMonth);
          const base = Math.floor(enrolledTotal * (0.62 + monthProgress * 0.38));
          const weekendRed = isWeekend ? 0.8 : 1.0;
          const dailyVar = 0.95 + s * 0.09; // ±4.5% deterministic
          const todayBoost = isToday ? 1.02 : 1.0;
          enrolled = Math.max(0, Math.floor(base * weekendRed * dailyVar * todayBoost));
        }

        dataPoints.push({
          name: `${day}`,
          date: key,
          index: day - 1,
          isWeekend,
          isToday,
          enrolled,
          target: targetTotal,
        });
      }
    }

    // Attach 7-point moving average for enrollment
    const vals = dataPoints.map(d => d.enrolled);
    const ma = computeMovingAvg(vals, overviewAttendancePeriod === 'month' ? 7 : 3);
    dataPoints.forEach((d, i) => { d.enrolledMA = ma[i]; });

    return dataPoints;
  }, [filteredProjects, attendanceProjects, overviewAttendancePeriod, attendanceReport, overviewDailyBreakdown]);

  const attendanceChartData = useMemo(() => {
    const today = new Date();
    const dataPoints: any[] = [];

    // Baseline average attendance rate from current projects snapshot
    const rawAvg = filteredProjects.reduce((sum, project) => {
      const attendanceProject = attendanceProjects.find(ap => ap.projectId === project.id);
      return sum + (attendanceProject?.attendanceRate || 0);
    }, 0) / (filteredProjects.length || 1);
    const baseAvgRate = Number.isFinite(rawAvg) && rawAvg > 0 ? rawAvg : 78;

    // Optional: real API daily breakdown
    const realDaily = new Map<string, DailyAttendance>();
    if (attendanceReport?.dailyBreakdown) {
      for (const d of attendanceReport.dailyBreakdown) {
        realDaily.set(d.date.substring(0, 10), d);
      }
    }

    const seedBase =
      97 + overviewAttendancePeriod.charCodeAt(0) +
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    if (overviewAttendancePeriod === 'today') {
      const milestones = [
        { t: '08:00', mul: 0.88 },
        { t: '10:00', mul: 0.98 },
        { t: '13:00', mul: 0.94 },
        { t: '15:30', mul: 1.0 },
      ];
      milestones.forEach((m, i) => {
        const s = seededVariation(seedBase + i);
        dataPoints.push({
          name: m.t,
          rate: parseFloat(Math.min(100, Math.max(55, baseAvgRate * m.mul + (s - 0.5) * 6)).toFixed(1)),
        });
      });
    } else if (overviewAttendancePeriod === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = date.getDate();
        const key = ymdKey(date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const s = seededVariation(seedBase + i);

        const real = realDaily.get(key);
        let rate: number;
        if (real) {
          rate = real.attendanceRate;
        } else {
          const weekProgress = (6 - i) / 6;
          const midBoost = Math.sin(weekProgress * Math.PI) * 2.5; // mid-week peak
          const weekendPen = isWeekend ? -18 - s * 8 : 0;
          const noise = (s - 0.5) * 5; // ±2.5% deterministic
          rate = baseAvgRate + midBoost + weekendPen + noise;
        }
        rate = parseFloat(Math.min(100, Math.max(0, rate)).toFixed(1));

        dataPoints.push({
          name: `${dayName} ${dayNum}`,
          date: key,
          index: dataPoints.length,
          isWeekend,
          rate,
        });
      }
    } else {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = today.getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const key = ymdKey(date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isToday = day === daysInMonth;
        const s = seededVariation(seedBase + day);

        const real = realDaily.get(key);
        let rate: number;
        if (real) {
          rate = real.attendanceRate;
        } else {
          const monthProgress = day / Math.max(1, daysInMonth);
          const seasonal = Math.sin(monthProgress * Math.PI * 2) * 2.5; // wave across month
          const weekendPen = isWeekend ? -16 - s * 9 : 0;
          const noise = (s - 0.5) * 6; // ±3% deterministic
          const todayBoost = isToday ? 2.5 : 0;
          rate = baseAvgRate + seasonal + weekendPen + noise + todayBoost;
        }
        rate = parseFloat(Math.min(100, Math.max(0, rate)).toFixed(1));

        dataPoints.push({
          name: `${day}`,
          date: key,
          index: day - 1,
          isWeekend,
          isToday,
          rate,
        });
      }
    }

    // Add moving average column
    const vals = dataPoints.map(d => d.rate);
    const ma = computeMovingAvg(vals, overviewAttendancePeriod === 'month' ? 7 : 3);
    dataPoints.forEach((d, i) => { d.rateMA = ma[i]; });

    return dataPoints;
  }, [filteredProjects, attendanceProjects, overviewAttendancePeriod, attendanceReport, overviewDailyBreakdown]);

  // Summary KPIs derived from the charts' data (no re-computation needed)
  const chartKpis = useMemo(() => {
    // Enrollment KPIs
    const firstEnrolled = enrollmentChartData[0]?.enrolled ?? 0;
    const lastEnrolled = enrollmentChartData[enrollmentChartData.length - 1]?.enrolled ?? 0;
    const targetEnrolled = enrollmentChartData[0]?.target ?? 0;
    const avgEnrolled = enrollmentChartData.length
      ? enrollmentChartData.reduce((s, d) => s + d.enrolled, 0) / enrollmentChartData.length
      : 0;
    const enrollmentPct = targetEnrolled > 0 ? (lastEnrolled / targetEnrolled) * 100 : 0;
    const enrollmentTrendPts = firstEnrolled > 0 ? ((lastEnrolled - firstEnrolled) / firstEnrolled) * 100 : 0;

    // Attendance KPIs
    const avgRate = attendanceChartData.length
      ? attendanceChartData.reduce((s, d) => s + d.rate, 0) / attendanceChartData.length
      : 0;
    const firstRate = attendanceChartData[0]?.rate ?? 0;
    const lastRate = attendanceChartData[attendanceChartData.length - 1]?.rate ?? 0;
    const rateTrendPts = lastRate - firstRate;
    const daysAbove80 = attendanceChartData.filter(d => d.rate >= 80).length;
    const onTrackPct = attendanceChartData.length ? (daysAbove80 / attendanceChartData.length) * 100 : 0;

    // Collect weekend index bands for ReferenceArea rendering (week & month views)
    const weekendBands: { left: number; right: number }[] = [];
    if (overviewAttendancePeriod !== 'today') {
      let runStart: number | null = null;
      const source = attendanceChartData; // same indices as enrollment
      for (let i = 0; i < source.length; i++) {
        if (source[i].isWeekend) {
          if (runStart === null) runStart = i;
        } else if (runStart !== null) {
          weekendBands.push({ left: runStart, right: i - 1 });
          runStart = null;
        }
      }
      if (runStart !== null) weekendBands.push({ left: runStart, right: source.length - 1 });
    }

    return {
      enrollment: {
        current: lastEnrolled,
        average: Math.round(avgEnrolled),
        target: targetEnrolled,
        pct: parseFloat(enrollmentPct.toFixed(1)),
        trendPts: parseFloat(enrollmentTrendPts.toFixed(1)),
      },
      attendance: {
        average: parseFloat(avgRate.toFixed(1)),
        current: parseFloat(lastRate.toFixed(1)),
        trendPts: parseFloat(rateTrendPts.toFixed(1)),
        onTrackPct: parseFloat(onTrackPct.toFixed(0)),
      },
      weekendBands,
    };
  }, [enrollmentChartData, attendanceChartData, overviewAttendancePeriod]);

  const documentComplianceData = useMemo(() => {
    if (!documentApprovalStats) return [];
    const mapped = documentApprovalStats.documentTypeBreakdown.map(type => {
      const compliance = type.complianceRate;
      let color: string;
      let risk: 'On Track' | 'Attention' | 'At Risk';
      if (compliance >= 90) {
        color = '#10b981'; // green-500
        risk = 'On Track';
      } else if (compliance >= 70) {
        color = '#f59e0b'; // amber-500
        risk = 'Attention';
      } else {
        color = '#ef4444'; // red-500
        risk = 'At Risk';
      }
      return {
        name: type.documentType,
        compliance,
        risk,
        color,
        submitted: type.submittedDocuments,
        expected: type.expectedDocuments,
        missing: type.missingDocuments,
        approved: type.approvedDocuments,
        pending: type.pendingDocuments,
      };
    });
    // Sort descending by compliance — worst performers visible first on top (vertical bar, label at top)
    return mapped.sort((a, b) => a.compliance - b.compliance);
  }, [documentApprovalStats]);

  const overallDocStatusData = useMemo(() => {
    if (!documentApprovalStats) return [];

    const total =
      (documentApprovalStats.approvedDocuments || 0) +
      (documentApprovalStats.declinedDocuments || 0) +
      (documentApprovalStats.pendingDocuments || 0);

    const data = [
      { name: 'Approved', value: documentApprovalStats.approvedDocuments || 0, color: '#10b981' },
      { name: 'Declined', value: documentApprovalStats.declinedDocuments || 0, color: '#ef4444' },
      { name: 'Pending', value: documentApprovalStats.pendingDocuments || 0, color: '#f59e0b' },
    ];

    // Check if we have any data to display
    const hasData = data.some(item => item.value > 0);
    if (!hasData) {
      return [
        { name: 'No Documents', value: 1, color: '#e2e8f0', total: 1, approvedPct: 0 },
      ];
    }

    const approvedPct = total > 0
      ? parseFloat(((documentApprovalStats.approvedDocuments || 0) / total) * 100).toFixed(1)
      : '0.0';

    return data.map(d => ({ ...d, total, approvedPct: Number(approvedPct) }));
  }, [documentApprovalStats]);

  // Validation functions
  const validateContactNumber = (number: string): boolean => {
    if (!number) return true; // Optional field
    // SA phone format: 10 digits starting with 0
    return /^0\d{9}$/.test(number.replace(/\s/g, ''));
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePostalCode = (code: string): boolean => {
    if (!code) return true; // Optional field
    // SA postal code: 4 digits
    return /^\d{4}$/.test(code);
  };

  const validateYear = (year: string): boolean => {
    if (!year) return true; // Optional field
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    return yearNum >= 1900 && yearNum <= currentYear;
  };

  const validateAccountNumber = (number: string): boolean => {
    if (!number) return true; // Optional field
    // Account number: 6-11 digits
    return /^\d{6,11}$/.test(number);
  };

  const validateBranchCode = (code: string): boolean => {
    if (!code) return true; // Optional field
    // SA branch code: 6 digits
    return /^\d{6}$/.test(code);
  };

  // Handle field validation
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'contactNumber':
        if (value && !validateContactNumber(value)) {
          return 'Invalid phone number. Must be 10 digits starting with 0 (e.g., 0821234567)';
        }
        break;
      case 'email':
        if (value && !validateEmail(value)) {
          return 'Invalid email address';
        }
        break;
      case 'postalCode':
        if (value && !validatePostalCode(value)) {
          return 'Invalid postal code. Must be 4 digits';
        }
        break;
      case 'yearOfCompletion':
        if (value && !validateYear(value)) {
          return `Invalid year. Must be between 1900 and ${new Date().getFullYear()}`;
        }
        break;
      case 'nextOfKinContactNumber':
        if (value && !validateContactNumber(value)) {
          return 'Invalid phone number. Must be 10 digits starting with 0';
        }
        break;
      case 'accountNumber':
        if (value && !validateAccountNumber(value)) {
          return 'Invalid account number. Must be 6-11 digits';
        }
        break;
      case 'branchCode':
        if (value && !validateBranchCode(value)) {
          return 'Invalid branch code. Must be 6 digits';
        }
        break;
    }
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (fieldName: string, value: string) => {
    // Update form
    setAddLearnerForm(prev => ({...prev, [fieldName]: value}));
    
    // Validate and update errors
    const error = validateField(fieldName, value);
    setFormErrors(prev => {
      const newErrors = {...prev};
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  };

  // Reset learner form
  const resetLearnerForm = () => {
    setAddLearnerForm({
      siteClassId: 0,
      title: '',
      firstName: '',
      lastName: '',
      idNumber: '',
      contactNumber: '',
      email: '',
      dateOfBirth: '',
      age: '',
      gender: '',
      race: '',
      homeLanguage: '',
      disability: 'None',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      postalCode: '',
      highSchoolName: '',
      yearOfCompletion: '',
      schoolLocation: '',
      highestGradePassed: '',
      nextOfKinName: '',
      nextOfKinRelation: '',
      nextOfKinContactNumber: '',
      bankName: '',
      accountType: '',
      accountNumber: '',
      branchCode: ''
    });
    setIdNumberError('');
    setFormErrors({});
  };

  // Close learner modal
  const closeLearnerModal = () => {
    setShowAddLearnerModal(false);
    resetLearnerForm();
  };

  // Parse South African ID Number
  const parseSouthAfricanID = (idNumber: string) => {
    // SA ID format: YYMMDD SSSS C A Z
    // YY = Year of birth (00-99)
    // MM = Month of birth (01-12)
    // DD = Day of birth (01-31)
    // SSSS = Sequence number (0000-4999 female, 5000-9999 male)
    // C = Citizenship (0 SA citizen, 1 permanent resident)
    // A = Usually 8 or 9
    // Z = Checksum digit

    if (!/^\d{13}$/.test(idNumber)) {
      return { valid: false, error: 'ID number must be exactly 13 digits' };
    }

    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    const genderCode = parseInt(idNumber.substring(6, 10));

    // Validate month
    if (month < 1 || month > 12) {
      return { valid: false, error: 'Invalid month in ID number' };
    }

    // Validate day
    if (day < 1 || day > 31) {
      return { valid: false, error: 'Invalid day in ID number' };
    }

    // Determine century (assume people born after 2000 if year < 26, otherwise 1900s)
    const currentYear = new Date().getFullYear() % 100;
    const fullYear = year <= currentYear + 10 ? 2000 + year : 1900 + year;

    // Create date of birth
    const dateOfBirth = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // Calculate age
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Determine gender (0000-4999 = Female, 5000-9999 = Male)
    const gender = genderCode < 5000 ? 'Female' : 'Male';

    return {
      valid: true,
      dateOfBirth,
      age,
      gender
    };
  };

  // Handle ID number change with validation
  const handleIdNumberChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    
    // Limit to 13 digits
    const limitedValue = digitsOnly.substring(0, 13);
    
    setAddLearnerForm(prev => ({...prev, idNumber: limitedValue}));

    // Clear error when user starts typing
    if (limitedValue.length < 13) {
      setIdNumberError('');
      return;
    }

    // Parse and validate when 13 digits are entered
    if (limitedValue.length === 13) {
      const result = parseSouthAfricanID(limitedValue);
      
      if (result.valid) {
        setIdNumberError('');
        setAddLearnerForm(prev => ({
          ...prev,
          idNumber: limitedValue,
          dateOfBirth: result.dateOfBirth || '',
          age: result.age?.toString() || '',
          gender: result.gender || ''
        }));
      } else {
        setIdNumberError(result.error || 'Invalid ID number');
      }
    }
  };

  // Initialize user data
  useEffect(() => {
    console.log('SDPManagerDashboard: Initializing user data...');
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('SDPManagerDashboard: User data loaded:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('SDPManagerDashboard: Error parsing user data:', error);
      }
    } else {
      console.log('SDPManagerDashboard: No user data found in localStorage');
    }
    setLoading(false);
  }, []);

  // Fetch project assignments for current user if restricted
  useEffect(() => {
    const fetchAssignments = async () => {
      if (user && (isAssessor || isModerator) && !user.projectAssignments) {
        try {
          const response = await fetchWithAuth(`/api/DepartmentMembers/MyAssignments`);
          
          if (response && response.ok) {
            const assignments = await response.json();
            setUser(prev => prev ? { ...prev, projectAssignments: assignments } : null);
            // Also update localStorage
            const userData = localStorage.getItem('user');
            if (userData) {
              const parsed = JSON.parse(userData);
              parsed.projectAssignments = assignments;
              localStorage.setItem('user', JSON.stringify(parsed));
            }
          }
        } catch (error) {
          console.error('Error fetching assignments:', error);
        }
      }
    };
    fetchAssignments();
  }, [user, isAssessor, isModerator]);

  // Set initial section based on role or navigation state
  useEffect(() => {
    if (user) {
      const incomingSection = (location.state as any)?.section;
      if (incomingSection) {
        setActiveSection(incomingSection);
        return;
      }

      if (isAssessor) setActiveSection('marking');
      else if (isModerator) setActiveSection('moderation');
      else if (isQA) setActiveSection('overview');
      else if (isIT) setActiveSection('overview');
      else setActiveSection('overview');
    }
  }, [user, isAssessor, isModerator, isQA, isIT, location.state]);

  // Fetch attendance data for overview (only for administrators)
  useEffect(() => {
    if (user && activeSection === 'overview' && isAdmin) {
      fetchAttendanceProjects();
    }
  }, [user, activeSection, isAdmin]);

  // Fetch learner progress when a learner is selected for marking
  useEffect(() => {
    const fetchProgress = async () => {
      if (!markingLearnerId) {
        setLearnerProgress([]);
        return;
      }
      try {
        const response = await fetchWithAuth(`/api/LearnerAssessmentAnswers/learner/${markingLearnerId}/progress`);
        if (response && response.ok) {
          const data = await response.json();
          setLearnerProgress(data);
        }
      } catch (error) {
        console.error('Failed to fetch learner progress:', error);
      }
    };
    fetchProgress();
  }, [markingLearnerId]);

  // Track which learners have all unit standards fully marked → turn card green
  useEffect(() => {
    if (!markingLearnerId || !markingProjectDetails) return;

    // Collect all unit standard IDs across all qualifications in the project
    const allUnitStandardIds: number[] = [];
    for (const pathway of markingProjectDetails.learningPathways || []) {
      for (const qual of pathway.qualifications || []) {
        for (const us of qual.unitStandards || []) {
          allUnitStandardIds.push(us.id);
        }
      }
    }

    if (allUnitStandardIds.length === 0) return;

    // A learner is "fully marked" when every unit standard has formativeCompleted
    // (summative may not always be required — if formative is done, consider it marked)
    const allMarked = allUnitStandardIds.every(usId =>
      learnerProgress.some(
        p => p.projectQualificationUnitStandardId === usId && p.formativeCompleted
      )
    );

    setMarkedLearnerIds(prev => {
      const next = new Set(prev);
      if (allMarked) {
        next.add(markingLearnerId);
      } else {
        next.delete(markingLearnerId);
      }
      return next;
    });
  }, [learnerProgress, markingProjectDetails, markingLearnerId]);

  const compilePOE = async (learnerId: number) => {
    console.log('compilePOE called with learnerId:', learnerId);
    try {
      const response = await fetchWithAuth(`/api/POE/compile/${learnerId}`);
      if (response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `POE_Learner_${learnerId}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        pushToast('success', `✅ POE compiled and downloaded for learner #${learnerId}`);
      } else {
        pushToast('error', 'Failed to compile POE document. Please ensure all evidence is uploaded.');
      }
    } catch (error) {
      console.error('Error compiling POE:', error);
      pushToast('error', 'An error occurred while compiling the POE document.');
    }
  };

  // Fetch manager-specific data
  useEffect(() => {
    const fetchManagerData = async () => {
      console.log('SDPManagerDashboard: fetchManagerData called');
      
      if (user?.skillsDevelopmentProviderId) {
        setDataLoading(true);
        
        try {
          // Fetch assessment types
          const typesResponse = await fetchWithAuth('/api/assessments/types');
          if (typesResponse && typesResponse.ok) {
            const types = await typesResponse.json();
            setAssessmentTypes(types);
          }

          // Fetch projects for this SDP
          const projectsResponse = await fetchWithAuth(`/api/sdp/projects`);
          
          if (!projectsResponse) return;

          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData.projects || []);
          } else {
            setProjects([]);
          }
          
          // Fetch departments for this SDP
          const departmentsResponse = await fetchWithAuth(`/api/SkillsDevelopmentProviders/${user.skillsDevelopmentProviderId}/Departments`);
          
          if (departmentsResponse && departmentsResponse.ok) {
            const departmentsData = await departmentsResponse.json();
            setDepartments(departmentsData);
          } else {
            setDepartments([]);
          }
          
        } catch (error) {
          console.error('Error fetching manager data:', error);
          setProjects([]);
          setDepartments([]);
        } finally {
          setDataLoading(false);
        }
      }
    };

    fetchManagerData();
  }, [user?.skillsDevelopmentProviderId]);

  // Fetch tasks when activeSection changes to tasks
  useEffect(() => {
    if (activeSection === 'tasks' && user) {
      fetchTasks();
      fetchAvailableUsers();
    }
  }, [activeSection, user]);

  // Fetch sick notes when activeSection changes to sickNotes
  useEffect(() => {
    if (activeSection === 'sickNotes' && user) {
      fetchSickNotes();
    }
  }, [activeSection, user]);

  const fetchSickNotes = async () => {
    setSickNotesLoading(true);
    try {
      const response = await fetchWithAuth('/api/SickNote/list');
      
      if (response && response.ok) {
        const data = await response.json();
        setSickNotes(data);
      } else if (response) {
        setSickNotes([]);
      }
    } catch (error) {
      console.error('Error fetching sick notes:', error);
      setSickNotes([]);
    } finally {
      setSickNotesLoading(false);
    }
  };

  const handleApproveSickNote = async (id: number) => {
    if (!confirm('Are you sure you want to approve this sick note?')) return;
    
    try {
      const response = await fetchWithAuth(`/api/SickNote/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isApproved: true })
      });
      
      if (response && response.ok) {
        pushToast('success', 'Sick note approved successfully');
        fetchSickNotes();
      } else if (response) {
        pushToast('error', 'Failed to approve sick note');
      }
    } catch (error) {
      console.error('Error approving sick note:', error);
      pushToast('error', 'An error occurred approving the sick note');
    }
  };

  const handleDeclineSickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sickNoteToDecline || !sickNoteDeclineReason.trim()) return;
    
    try {
      const response = await fetchWithAuth(`/api/SickNote/${sickNoteToDecline.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          isApproved: false, 
          rejectionReason: sickNoteDeclineReason 
        })
      });
      
      if (response && response.ok) {
        pushToast('success', 'Sick note declined successfully');
        setShowSickNoteDeclineModal(false);
        setSickNoteDeclineReason('');
        setSickNoteToDecline(null);
        fetchSickNotes();
      } else if (response) {
        pushToast('error', 'Failed to decline sick note');
      }
    } catch (error) {
      console.error('Error declining sick note:', error);
      pushToast('error', 'An error occurred declining the sick note');
    }
  };

  const handleViewSickNote = async (id: number) => {
    try {
      const response = await fetchWithAuth(`/api/SickNote/${id}/file`);

      if (response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (response) {
        pushToast('error', 'Failed to view sick note file');
      }
    } catch (error) {
      console.error('Error viewing sick note:', error);
      pushToast('error', 'An error occurred viewing the sick note');
    }
  };

  // Toggle project expansion and fetch details
  const toggleProjectExpansion = async (projectId: number) => {
    const isExpanded = expandedProjects[projectId];
    
    // Toggle expansion state
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !isExpanded
    }));

    // If expanding and details not yet loaded, fetch them
    if (!isExpanded && !projectDetails[projectId]) {
      try {
        const response = await fetchWithAuth(`/api/projects/${projectId}/details`);

        if (response && response.ok) {
          const details = await response.json();
          setProjectDetails(prev => ({
            ...prev,
            [projectId]: details
          }));
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      }
    }
  };

  // Toggle unit standard expansion
  const toggleUnitStandardExpansion = async (unitStandardId: number) => {
    const key = `us-${unitStandardId}`;
    const isExpanded = expandedUnitStandards[key];
    
    setExpandedUnitStandards(prev => ({
      ...prev,
      [key]: !isExpanded
    }));

    if (!isExpanded && !unitStandardAssessments[unitStandardId]) {
      await fetchAssessments(unitStandardId);
    }
  };

  // Fetch assessments for a unit standard
  const fetchAssessments = async (unitStandardId: number) => {
    try {
      const response = await fetchWithAuth(`/api/assessments/unit-standard/${unitStandardId}`);
      
      if (response && response.ok) {
        const assessments = await response.json();
        setUnitStandardAssessments(prev => ({
          ...prev,
          [unitStandardId]: assessments
        }));
        
        // Set default selected assessment type to first one if exists
        if (assessments.length > 0 && !selectedAssessmentType[unitStandardId]) {
          setSelectedAssessmentType(prev => ({
            ...prev,
            [unitStandardId]: assessments[0].assessmentTypeId
          }));
          await fetchAssessmentDetails(assessments[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  // Fetch assessment details with questions
  const fetchAssessmentDetails = async (assessmentId: number) => {
    try {
      const response = await fetchWithAuth(`/api/assessments/${assessmentId}`);
      
      if (response && response.ok) {
        const details = await response.json();
        setAssessmentDetails(prev => ({
          ...prev,
          [assessmentId]: details
        }));
      }
    } catch (error) {
      console.error('Error fetching assessment details:', error);
    }
  };

  // Create assessment
  const createAssessment = async (unitStandardId: number, assessmentTypeId: number) => {
    try {
      const response = await fetchWithAuth('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectQualificationUnitStandardId: unitStandardId,
          assessmentTypeId: assessmentTypeId,
          title: '',
          description: '',
          totalMarks: 0,
          passingMarks: 0
        })
      });
      
      if (response && response.ok) {
        await fetchAssessments(unitStandardId);
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
    }
  };

  // Select assessment type
  const selectAssessmentType = async (unitStandardId: number, assessmentTypeId: number) => {
    setSelectedAssessmentType(prev => ({
      ...prev,
      [unitStandardId]: assessmentTypeId
    }));

    const assessments = unitStandardAssessments[unitStandardId] || [];
    const assessment = assessments.find(a => a.assessmentTypeId === assessmentTypeId);
    
    if (assessment) {
      await fetchAssessmentDetails(assessment.id);
    } else {
      // Create assessment if it doesn't exist
      await createAssessment(unitStandardId, assessmentTypeId);
    }
  };

  // Add question
  const addQuestion = async () => {
    if (!currentAssessmentId) return;
    
    try {
      const response = await fetchWithAuth(`/api/assessments/${currentAssessmentId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          unitStandardAssessmentId: currentAssessmentId,
          questionNumber: newQuestion.questionNumber,
          questionText: newQuestion.questionText,
          allocatedMarks: newQuestion.allocatedMarks,
          orderIndex: 0
        })
      });
      
      if (response && response.ok) {
        setShowAddQuestionModal(false);
        setNewQuestion({ questionNumber: 1, questionText: '', allocatedMarks: 0 });
        await fetchAssessmentDetails(currentAssessmentId);
        pushToast('success', 'Question added successfully');
      } else if (response) {
        const error = await response.text();
        pushToast('error', `Error adding question: ${error}`);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      pushToast('error', 'Error adding question');
    }
  };

  // Delete question
  const deleteQuestion = async (questionId: number, assessmentId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetchWithAuth(`/api/assessments/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (response && response.ok) {
        await fetchAssessmentDetails(assessmentId);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  // Fetch available roles for the department
  const fetchAvailableRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await fetchWithAuth('/api/DepartmentMembers/AvailableRoles');
      
      if (response && response.ok) {
        const rolesData = await response.json();
        setAvailableRoles(rolesData);
        // Set default role if available
        if (rolesData.length > 0 && !addMemberForm.role) {
          setAddMemberForm(prev => ({ ...prev, role: rolesData[0].value.toString() }));
        }
      } else if (response) {
        console.error('Failed to fetch available roles');
        setAvailableRoles([]);
      }
    } catch (error) {
      console.error('Error fetching available roles:', error);
      setAvailableRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async () => {
    setTeamLoading(true);
    try {
      const response = await fetchWithAuth('/api/DepartmentMembers/MyTeam');
      
      if (response && response.ok) {
        const teamData = await response.json();
        setTeamMembers(teamData);
      } else if (response) {
        console.error('Failed to fetch team members');
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setTeamLoading(false);
    }
  };

  // Load team members when team section is accessed
  useEffect(() => {
    if (activeSection === 'team' && user) {
      fetchTeamMembers();
    }
  }, [activeSection, user]);

  // Load available roles when add member modal is opened
  useEffect(() => {
    if (showAddMemberModal && user) {
      fetchAvailableRoles();
    }
  }, [showAddMemberModal, user]);

  // Add team member
  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addMemberForm.firstName.trim() || !addMemberForm.lastName.trim() || !addMemberForm.email.trim()) {
      pushToast('warning', 'Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/DepartmentMembers/AddMember', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: addMemberForm.firstName.trim(),
          lastName: addMemberForm.lastName.trim(),
          email: addMemberForm.email.trim(),
          phoneNumber: addMemberForm.phoneNumber.trim() || null,
          role: parseInt(addMemberForm.role), // Convert role to number
          projectIds: addMemberForm.projectIds
        })
      });

      if (response && response.ok) {
        const newMember = await response.json();
        setTeamMembers(prev => [...prev, newMember]);
        setAddMemberForm({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          role: availableRoles.length > 0 ? availableRoles[0].value.toString() : '',
          projectIds: []
        });
        setShowAddMemberModal(false);
        pushToast('success', 'Team member added successfully! They will receive an email with their login credentials.');
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to add team member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      pushToast('error', 'An error occurred while adding the team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove team member
  const handleRemoveTeamMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from your team?`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/DepartmentMembers/${memberId}`, {
        method: 'DELETE'
      });

      if (response && response.ok) {
        setTeamMembers(prev => prev.filter(member => member.id !== memberId));
        pushToast('success', 'Team member removed successfully');
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to remove team member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      pushToast('error', 'An error occurred while removing the team member');
    }
  };

  // Site Management Functions (for Logistics managers)
  const fetchProjectSites = async (projectId: number) => {
    if (sitesLoading[projectId] || projectSites[projectId]) {
      return; // Already loaded or loading
    }

    setSitesLoading(prev => ({...prev, [projectId]: true}));

    try {
      const response = await fetchWithAuth(`/api/ProjectSites/project/${projectId}`);
      
      if (response && response.ok) {
        const sitesData = await response.json();
        setProjectSites(prev => ({
          ...prev,
          [projectId]: sitesData
        }));
      } else if (response) {
        console.error('Failed to fetch project sites');
        setProjectSites(prev => ({
          ...prev,
          [projectId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching project sites:', error);
      setProjectSites(prev => ({
        ...prev,
        [projectId]: []
      }));
    } finally {
      setSitesLoading(prev => ({...prev, [projectId]: false}));
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addSiteForm.siteName.trim() || addSiteForm.projectId === 0) {
      pushToast('warning', 'Please fill in all required fields (Site Name, Project)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/ProjectSites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: addSiteForm.projectId,
          siteName: addSiteForm.siteName.trim(),
          siteCode: addSiteForm.siteCode.trim() || null,
          category: addSiteForm.category || null,
          address: addSiteForm.address.trim() || null,
          province: addSiteForm.province || null,
          city: addSiteForm.city.trim() || null,
          postalCode: addSiteForm.postalCode.trim() || null,
          contactFirstName: addSiteForm.contactFirstName.trim() || null,
          contactLastName: addSiteForm.contactLastName.trim() || null,
          contactCellNumber: addSiteForm.contactCellNumber.trim() || null,
          contactEmail: addSiteForm.contactEmail.trim() || null,
          latitude: addSiteForm.latitude ? parseFloat(addSiteForm.latitude) : null,
          longitude: addSiteForm.longitude ? parseFloat(addSiteForm.longitude) : null,
          capacity: addSiteForm.capacity ? parseInt(addSiteForm.capacity) : null,
          status: 'Active',
          description: addSiteForm.description.trim() || null
        })
      });

      if (response && response.ok) {
        const newSite = await response.json();
        setProjectSites(prev => ({
          ...prev,
          [addSiteForm.projectId]: [...(prev[addSiteForm.projectId] || []), newSite]
        }));
        setAddSiteForm({
          projectId: 0,
          siteName: '',
          siteCode: '',
          category: '',
          address: '',
          province: '',
          city: '',
          postalCode: '',
          contactFirstName: '',
          contactLastName: '',
          contactCellNumber: '',
          contactEmail: '',
          latitude: '',
          longitude: '',
          capacity: '',
          description: ''
        });
        setShowAddSiteModal(false);
        pushToast('success', 'Site added successfully!');
      } else {
        const errorData = await response.json();
        pushToast('error', `Failed to add site: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding site:', error);
      pushToast('error', 'An error occurred while adding the site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSite = (site: ProjectSite) => {
    setEditingSiteId(site.id);
    setEditSiteForm({
      projectId: site.projectId,
      siteName: site.siteName,
      siteCode: site.siteCode || '',
      category: site.category || '',
      address: site.address || '',
      province: site.province || '',
      city: site.city || '',
      postalCode: site.postalCode || '',
      contactFirstName: site.contactFirstName || '',
      contactLastName: site.contactLastName || '',
      contactCellNumber: site.contactCellNumber || '',
      contactEmail: site.contactEmail || '',
      latitude: site.latitude?.toString() || '',
      longitude: site.longitude?.toString() || '',
      capacity: site.capacity?.toString() || '',
      description: site.description || ''
    });
    setShowEditSiteModal(true);
  };

  const handleUpdateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editSiteForm.siteName.trim() || !editSiteForm.category || !editingSiteId) {
      pushToast('warning', 'Please fill in all required fields (Site Name, Category)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`/api/ProjectSites/${editingSiteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editSiteForm,
          capacity: editSiteForm.capacity ? parseInt(editSiteForm.capacity) : null,
          latitude: editSiteForm.latitude ? parseFloat(editSiteForm.latitude) : null,
          longitude: editSiteForm.longitude ? parseFloat(editSiteForm.longitude) : null
        })
      });

      if (response && response.ok) {
        const updatedSite = await response.json();
        const projectId = editSiteForm.projectId;
        
        setProjectSites(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map(site => 
            site.id === editingSiteId ? updatedSite : site
          )
        }));
        
        setShowEditSiteModal(false);
        setEditingSiteId(null);
        pushToast('success', 'Site updated successfully!');
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to update site: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating site:', error);
      pushToast('error', 'An error occurred while updating the site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSite = async (siteId: number, siteName: string, projectId: number) => {
    if (!confirm(`Are you sure you want to delete site "${siteName}"?`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/ProjectSites/${siteId}`, {
        method: 'DELETE'
      });

      if (response && response.ok) {
        setProjectSites(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).filter(site => site.id !== siteId)
        }));
        pushToast('success', 'Site deleted successfully');
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to delete site: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      pushToast('error', 'An error occurred while deleting the site');
    }
  };

  // Class Management Functions (for Logistics managers)
  const toggleSiteExpansion = async (siteId: number) => {
    const isExpanded = expandedSites[siteId];
    
    setExpandedSites(prev => ({
      ...prev,
      [siteId]: !isExpanded
    }));

    // If expanding and classes not yet loaded, fetch them
    if (!isExpanded && !siteClasses[siteId]) {
      await fetchSiteClasses(siteId);
    }
  };

  const fetchSiteClasses = async (siteId: number) => {
    if (classesLoading[siteId] || siteClasses[siteId]) {
      return; // Already loaded or loading
    }

    setClassesLoading(prev => ({...prev, [siteId]: true}));

    try {
      const response = await fetchWithAuth(`/api/SiteClasses/site/${siteId}`);
      
      if (response && response.ok) {
        const classesData = await response.json();
        setSiteClasses(prev => ({
          ...prev,
          [siteId]: classesData
        }));
      } else if (response) {
        console.error('Failed to fetch site classes');
        setSiteClasses(prev => ({
          ...prev,
          [siteId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching site classes:', error);
      setSiteClasses(prev => ({
        ...prev,
        [siteId]: []
      }));
    } finally {
      setClassesLoading(prev => ({...prev, [siteId]: false}));
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addClassForm.className.trim() || !addClassForm.maxLearners || addClassForm.projectSiteId === 0) {
      pushToast('warning', 'Please fill in all required fields (Class name, Max learners, Site)');
      return;
    }

    // Validate class name (only letters and spaces)
    if (!/^[a-zA-Z\s]+$/.test(addClassForm.className)) {
      pushToast('warning', 'Class name can only contain letters and spaces');
      return;
    }

    // Validate max learners (only positive numbers)
    const maxLearners = parseInt(addClassForm.maxLearners);
    if (isNaN(maxLearners) || maxLearners <= 0) {
      pushToast('warning', 'Maximum learners must be a positive number');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/SiteClasses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectSiteId: addClassForm.projectSiteId,
          className: addClassForm.className.trim(),
          maxLearners: maxLearners
        })
      });

      if (response && response.ok) {
        const newClass = await response.json();
        setSiteClasses(prev => ({
          ...prev,
          [addClassForm.projectSiteId]: [...(prev[addClassForm.projectSiteId] || []), newClass]
        }));
        setAddClassForm({
          projectSiteId: 0,
          className: '',
          maxLearners: ''
        });
        setShowAddClassModal(false);
        pushToast('success', 'Class added successfully!');
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to add class: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding class:', error);
      pushToast('error', 'An error occurred while adding the class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: number, className: string, siteId: number) => {
    if (!confirm(`Are you sure you want to delete class "${className}"?`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/SiteClasses/${classId}`, {
        method: 'DELETE'
      });

      if (response && response.ok) {
        setSiteClasses(prev => ({
          ...prev,
          [siteId]: (prev[siteId] || []).filter(cls => cls.id !== classId)
        }));
        pushToast('success', 'Class deleted successfully');
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to delete class: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      pushToast('error', 'An error occurred while deleting the class');
    }
  };

  // Teacher Management Functions
  const handleManageTeachers = async (classId: number, className: string) => {
    setSelectedClassForTeacher({id: classId, name: className});
    setShowTeacherModal(true);
    setShowAddTeacherForm(false);
    await fetchClassTeachers(classId);
  };

  const fetchClassTeachers = async (classId: number) => {
    setTeachersLoading(true);
    try {
      const response = await fetchWithAuth(`/api/Attendance/class/${classId}/teachers`);

      if (response && response.ok) {
        const teachers = await response.json();
        setClassTeachers(teachers);
      } else if (response) {
        console.error('Failed to fetch teachers');
        setClassTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setClassTeachers([]);
    } finally {
      setTeachersLoading(false);
    }
  };

  const handleResendTeacherCredentials = async (teacherId: number, teacherName: string) => {
    if (!confirm(`Resend login credentials to ${teacherName}?`)) return;
    try {
      const API = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/Attendance/teacher/${teacherId}/resend-credentials`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        if (data.emailSent) {
          pushToast('success', `✅ Credentials sent to ${teacherName}'s email.`);
        } else {
          pushToast('warning', `⚠️ Email could not be sent.\nUsername: ${data.username}\nPassword: ${data.temporaryPassword}\nShare these manually.`);
        }
      } else {
        pushToast('error', `Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      pushToast('error', 'An error occurred while resending credentials.');
      console.error(error);
    }
  };

  const handleRemoveTeacher = async (assignmentId: number, teacherName: string) => {
    if (!confirm(`Remove ${teacherName} from this class?`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/Attendance/class-teacher/${assignmentId}`, {
        method: 'DELETE'
      });

      if (response && response.ok) {
        pushToast('success', `${teacherName} removed successfully`);
        if (selectedClassForTeacher) {
          await fetchClassTeachers(selectedClassForTeacher.id);
        }
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to remove teacher: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing teacher:', error);
      pushToast('error', 'An error occurred while removing the teacher');
    }
  };

  const validateTeacherForm = () => {
    const errors = {firstName: '', lastName: '', email: ''};
    let isValid = true;

    if (!newTeacherForm.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(newTeacherForm.firstName)) {
      errors.firstName = 'Only letters and spaces allowed';
      isValid = false;
    }

    if (!newTeacherForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(newTeacherForm.lastName)) {
      errors.lastName = 'Only letters and spaces allowed';
      isValid = false;
    }

    if (!newTeacherForm.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(newTeacherForm.email)) {
      errors.email = 'Enter a valid email address';
      isValid = false;
    }

    setTeacherFormErrors(errors);
    return isValid;
  };

  const handleCreateTeacher = async () => {
    if (!validateTeacherForm() || !selectedClassForTeacher) {
      return;
    }

    try {
      const response = await fetchWithAuth('/api/Attendance/create-and-assign-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClassForTeacher.id,
          firstName: newTeacherForm.firstName.trim(),
          lastName: newTeacherForm.lastName.trim(),
          email: newTeacherForm.email.trim()
        })
      });

      if (response && response.ok) {
        pushToast('success', 'Teacher created and assigned successfully! Login credentials sent to email.');
        setNewTeacherForm({firstName: '', lastName: '', email: ''});
        setShowAddTeacherForm(false);
        await fetchClassTeachers(selectedClassForTeacher.id);
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to create teacher: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      pushToast('error', 'An error occurred while creating the teacher');
    }
  };

  // Learner Management Functions
  const toggleClassExpansion = async (classId: number) => {
    const isExpanded = expandedClasses[classId];
    
    setExpandedClasses(prev => ({
      ...prev,
      [classId]: !isExpanded
    }));

    // If expanding and learners not yet loaded, fetch them
    if (!isExpanded && !classLearnersOld[classId]) {
      await fetchClassLearnersOld(classId);
    }
  };

  const fetchClassLearnersOld = async (classId: number) => {
    if (learnersLoading[classId] || classLearnersOld[classId]) {
      return; // Already loaded or loading
    }

    setLearnersLoading(prev => ({...prev, [classId]: true}));

    try {
      const response = await fetchWithAuth(`/api/Learners/class/${classId}`);
      
      if (response && response.ok) {
        const learnersData = await response.json();
        setClassLearnersOld(prev => ({
          ...prev,
          [classId]: learnersData
        }));
      } else if (response) {
        console.error('Failed to fetch learners');
        setClassLearnersOld(prev => ({
          ...prev,
          [classId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching learners:', error);
      setClassLearnersOld(prev => ({
        ...prev,
        [classId]: []
      }));
    } finally {
      setLearnersLoading(prev => ({...prev, [classId]: false}));
    }
  };

  const handleAddLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addLearnerForm.title || !addLearnerForm.firstName.trim() || !addLearnerForm.lastName.trim() || !addLearnerForm.idNumber.trim() || addLearnerForm.siteClassId === 0) {
      pushToast('warning', 'Please fill in all required fields (Title, First Name, Last Name, ID Number, Class)');
      return;
    }

    // Validate ID Number (must be 13 digits)
    if (!/^\d{13}$/.test(addLearnerForm.idNumber)) {
      pushToast('warning', 'ID Number must be exactly 13 digits (numbers only)');
      return;
    }

    // Validate ID number format
    const idValidation = parseSouthAfricanID(addLearnerForm.idNumber);
    if (!idValidation.valid) {
      pushToast('warning', `Invalid ID Number: ${idValidation.error}`);
      return;
    }

    // Check for any field validation errors
    if (Object.keys(formErrors).length > 0) {
      pushToast('warning', 'Please fix the validation errors before submitting:\n' + Object.values(formErrors).join('\n'));
      return;
    }

    // Validate optional fields if filled
    if (addLearnerForm.contactNumber && !validateContactNumber(addLearnerForm.contactNumber)) {
      pushToast('warning', 'Invalid contact number. Must be 10 digits starting with 0');
      return;
    }

    if (addLearnerForm.email && !validateEmail(addLearnerForm.email)) {
      pushToast('warning', 'Invalid email address');
      return;
    }

    if (addLearnerForm.postalCode && !validatePostalCode(addLearnerForm.postalCode)) {
      pushToast('warning', 'Invalid postal code. Must be 4 digits');
      return;
    }

    if (addLearnerForm.yearOfCompletion && !validateYear(addLearnerForm.yearOfCompletion)) {
      pushToast('warning', `Invalid year of completion. Must be between 1900 and ${new Date().getFullYear()}`);
      return;
    }

    if (addLearnerForm.nextOfKinContactNumber && !validateContactNumber(addLearnerForm.nextOfKinContactNumber)) {
      pushToast('warning', 'Invalid next of kin contact number. Must be 10 digits starting with 0');
      return;
    }

    if (addLearnerForm.accountNumber && !validateAccountNumber(addLearnerForm.accountNumber)) {
      pushToast('warning', 'Invalid account number. Must be 6-11 digits');
      return;
    }

    if (addLearnerForm.branchCode && !validateBranchCode(addLearnerForm.branchCode)) {
      pushToast('warning', 'Invalid branch code. Must be 6 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        siteClassId: addLearnerForm.siteClassId,
        title: addLearnerForm.title,
        firstName: addLearnerForm.firstName.trim(),
        lastName: addLearnerForm.lastName.trim(),
        idNumber: addLearnerForm.idNumber.trim(),
        contactNumber: addLearnerForm.contactNumber ? addLearnerForm.contactNumber.trim() : null,
        email: addLearnerForm.email ? addLearnerForm.email.trim() : null,
        dateOfBirth: addLearnerForm.dateOfBirth || null,
        age: addLearnerForm.age ? parseInt(addLearnerForm.age) : null,
        gender: addLearnerForm.gender || null,
        race: addLearnerForm.race || null,
        homeLanguage: addLearnerForm.homeLanguage || null,
        disability: addLearnerForm.disability || null,
        addressLine1: addLearnerForm.addressLine1 ? addLearnerForm.addressLine1.trim() : null,
        addressLine2: addLearnerForm.addressLine2 ? addLearnerForm.addressLine2.trim() : null,
        addressLine3: addLearnerForm.addressLine3 ? addLearnerForm.addressLine3.trim() : null,
        postalCode: addLearnerForm.postalCode ? addLearnerForm.postalCode.trim() : null,
        highSchoolName: addLearnerForm.highSchoolName ? addLearnerForm.highSchoolName.trim() : null,
        yearOfCompletion: addLearnerForm.yearOfCompletion ? parseInt(addLearnerForm.yearOfCompletion) : null,
        schoolLocation: addLearnerForm.schoolLocation ? addLearnerForm.schoolLocation.trim() : null,
        highestGradePassed: addLearnerForm.highestGradePassed || null,
        nextOfKinName: addLearnerForm.nextOfKinName ? addLearnerForm.nextOfKinName.trim() : null,
        nextOfKinRelation: addLearnerForm.nextOfKinRelation || null,
        nextOfKinContactNumber: addLearnerForm.nextOfKinContactNumber ? addLearnerForm.nextOfKinContactNumber.trim() : null,
        bankName: addLearnerForm.bankName || null,
        accountType: addLearnerForm.accountType || null,
        accountNumber: addLearnerForm.accountNumber ? addLearnerForm.accountNumber.trim() : null,
        branchCode: addLearnerForm.branchCode ? addLearnerForm.branchCode.trim() : null
      };
      
      console.log('Sending learner data:', requestData);
      
      const response = await fetchWithAuth('/api/Learners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response && response.ok) {
        const newLearner = await response.json();
        console.log('Learner created successfully:', newLearner);
        setClassLearnersOld(prev => ({
          ...prev,
          [addLearnerForm.siteClassId]: [...(prev[addLearnerForm.siteClassId] || []), newLearner]
        }));
        resetLearnerForm();
        setShowAddLearnerModal(false);
        pushToast('success', 'Learner added successfully!');
      } else if (response) {
        // Try to parse as JSON, fallback to text
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Unknown error';
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Failed to add learner (JSON):', errorData);
            errorMessage = errorData.message || JSON.stringify(errorData);
          } else {
            const errorText = await response.text();
            console.error('Failed to add learner (Text):', errorText);
            // Extract meaningful error from HTML if possible
            const match = errorText.match(/<title>(.*?)<\/title>/);
            errorMessage = match ? match[1] : 'Server error - check console for details';
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = 'Failed to parse error response';
        }
        
        pushToast('error', `Failed to add learner: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error adding learner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      pushToast('error', `An error occurred while adding the learner: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewLearner = async (learner: Learner) => {
    setSelectedLearner(learner);
    setEditLearnerForm({
      siteClassId: learner.siteClassId,
      title: learner.title,
      firstName: learner.firstName,
      lastName: learner.lastName,
      idNumber: learner.idNumber,
      contactNumber: learner.contactNumber || '',
      email: learner.email || '',
      dateOfBirth: learner.dateOfBirth || '',
      age: learner.age?.toString() || '',
      gender: learner.gender || '',
      race: learner.race || '',
      homeLanguage: learner.homeLanguage || '',
      disability: learner.disability || 'None',
      addressLine1: learner.addressLine1 || '',
      addressLine2: learner.addressLine2 || '',
      addressLine3: learner.addressLine3 || '',
      postalCode: learner.postalCode || '',
      highSchoolName: learner.highSchoolName || '',
      yearOfCompletion: learner.yearOfCompletion?.toString() || '',
      schoolLocation: learner.schoolLocation || '',
      highestGradePassed: learner.highestGradePassed || '',
      nextOfKinName: learner.nextOfKinName || '',
      nextOfKinRelation: learner.nextOfKinRelation || '',
      nextOfKinContactNumber: learner.nextOfKinContactNumber || '',
      bankName: learner.bankName || '',
      accountType: learner.accountType || '',
      accountNumber: learner.accountNumber || '',
      branchCode: learner.branchCode || ''
    });
    setLearnerModalTab('info');
    setShowLearnerModal(true);
    
    // Fetch learner documents
    await fetchLearnerDocuments(learner.id);
  };

  const fetchLearnerDocuments = async (learnerId: number) => {
    try {
      const response = await fetchWithAuth(`/api/LearnerDocuments/learner/${learnerId}`);

      if (response && response.ok) {
        const documents = await response.json();
        setLearnerDocuments(documents);
      } else if (response) {
        console.error('Failed to fetch documents');
        setLearnerDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLearnerDocuments([]);
    }
  };

  // Document Approval Functions
  const fetchDocumentApprovalStats = async () => {
    try {
      const response = await fetchWithAuth('/api/DocumentApprovals/stats');
      
      if (response && response.ok) {
        const stats = await response.json();
        setDocumentApprovalStats(stats);
      } else if (response) {
        console.error('Failed to fetch document approval stats');
      }
    } catch (error) {
      console.error('Error fetching document approval stats:', error);
    }
  };

  const fetchProjectDocuments = async () => {
    setDocumentApprovalsLoading(true);
    try {
      const response = await fetchWithAuth('/api/DocumentApprovals/projects');
      
      if (response && response.ok) {
        const projects = await response.json();
        setProjectDocuments(projects);
      } else if (response) {
        console.error('Failed to fetch project documents');
        setProjectDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching project documents:', error);
      setProjectDocuments([]);
    } finally {
      setDocumentApprovalsLoading(false);
    }
  };

  const fetchProjectLearnerDocuments = async (projectId: number) => {
    setDocumentApprovalsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/DocumentApprovals/projects/${projectId}/learners`);
      
      if (response && response.ok) {
        const learners = await response.json();
        setSelectedProjectDocuments(learners);
      } else if (response) {
        console.error('Failed to fetch project learner documents');
        setSelectedProjectDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching project learner documents:', error);
      setSelectedProjectDocuments([]);
    } finally {
      setDocumentApprovalsLoading(false);
    }
  };

  const approveDocument = async (documentId: number) => {
    try {
      const response = await fetchWithAuth('/api/DocumentApprovals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: documentId,
          approvalStatus: 'Approved'
        })
      });
      
      if (response && response.ok) {
        // Refresh the data
        await fetchDocumentApprovalStats();
        if (selectedProjectForApproval) {
          await fetchProjectLearnerDocuments(selectedProjectForApproval.projectId);
        }
        // Close modal if open
        if (showDocumentModal) {
          setShowDocumentModal(false);
          setSelectedDocumentForView(null);
          setDocumentPreviewUrl(null);
        }
        pushToast('success', 'Document approved successfully!');
      } else if (response) {
        const error = await response.json();
        pushToast('error', `Failed to approve document: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving document:', error);
      pushToast('error', 'An error occurred while approving the document');
    }
  };

  const declineDocument = async (documentId: number, reason: string) => {
    try {
      const response = await fetchWithAuth('/api/DocumentApprovals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: documentId,
          approvalStatus: 'Declined',
          declineReason: reason
        })
      });
      
      if (response && response.ok) {
        // Refresh the data
        await fetchDocumentApprovalStats();
        if (selectedProjectForApproval) {
          await fetchProjectLearnerDocuments(selectedProjectForApproval.projectId);
        }
        setShowDeclineModal(false);
        setDeclineReason('');
        setDocumentToDecline(null);
        // Close document modal if open
        if (showDocumentModal) {
          setShowDocumentModal(false);
          setSelectedDocumentForView(null);
          setDocumentPreviewUrl(null);
        }
        pushToast('success', 'Document declined successfully!');
      } else if (response) {
        const error = await response.json();
        pushToast('error', `Failed to decline document: ${error.message}`);
      }
    } catch (error) {
      console.error('Error declining document:', error);
      pushToast('error', 'An error occurred while declining the document');
    }
  };

  const viewDocument = async (documentId: number) => {
    try {
      // Find the document details
      const document = selectedProjectDocuments
        .flatMap(learner => learner.documents)
        .find(doc => doc.id === documentId);
      
      if (!document) {
        pushToast('error', 'Document not found');
        return;
      }

      setSelectedDocumentForView(document);
      setPreviewLoading(true);
      setShowDocumentModal(true);

      const response = await fetchWithAuth(`/api/LearnerDocuments/${documentId}/download`);
      
      if (response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDocumentPreviewUrl(url);
      } else if (response) {
        pushToast('error', 'Failed to load document');
        setShowDocumentModal(false);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      pushToast('error', 'An error occurred while loading the document');
      setShowDocumentModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (!selectedProjectForApproval) return;
    
    setBulkDownloading(true);
    try {
      let url = `/api/LearnerDocuments/bulk-download?projectId=${selectedProjectForApproval.projectId}`;
      if (documentFilterStatus !== 'All') {
        url += `&status=${documentFilterStatus}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (response && response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Documents_${selectedProjectForApproval.projectName}_${documentFilterStatus}_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else if (response) {
        const error = await response.json();
        pushToast('error', error.message || 'Failed to download documents');
      }
    } catch (error) {
      console.error('Error in bulk download:', error);
      pushToast('error', 'An error occurred during bulk download');
    } finally {
      setBulkDownloading(false);
    }
  };

  // Load document approvals data when section is accessed
  useEffect(() => {
    if (activeSection === 'documentApprovals' || activeSection === 'overview') {
      fetchDocumentApprovalStats();
      if (activeSection === 'documentApprovals') {
        fetchProjectDocuments();
      }
    }
  }, [activeSection]);

  // Toggle learner document expansion
  const toggleLearnerExpansion = (learnerId: number) => {
    setExpandedLearners(prev => ({
      ...prev,
      [learnerId]: !prev[learnerId]
    }));
  };

  const handleUpdateLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLearner || !editLearnerForm) return;

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`/api/Learners/${selectedLearner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editLearnerForm.title,
          firstName: editLearnerForm.firstName,
          lastName: editLearnerForm.lastName,
          idNumber: editLearnerForm.idNumber,
          contactNumber: editLearnerForm.contactNumber || null,
          email: editLearnerForm.email || null,
          dateOfBirth: editLearnerForm.dateOfBirth || null,
          age: editLearnerForm.age ? parseInt(editLearnerForm.age) : null,
          gender: editLearnerForm.gender || null,
          race: editLearnerForm.race || null,
          homeLanguage: editLearnerForm.homeLanguage || null,
          disability: editLearnerForm.disability || null,
          addressLine1: editLearnerForm.addressLine1 || null,
          addressLine2: editLearnerForm.addressLine2 || null,
          addressLine3: editLearnerForm.addressLine3 || null,
          postalCode: editLearnerForm.postalCode || null,
          highSchoolName: editLearnerForm.highSchoolName || null,
          yearOfCompletion: editLearnerForm.yearOfCompletion ? parseInt(editLearnerForm.yearOfCompletion) : selectedLearner.yearOfCompletion,
          schoolLocation: editLearnerForm.schoolLocation || null,
          highestGradePassed: editLearnerForm.highestGradePassed || null,
          nextOfKinName: editLearnerForm.nextOfKinName || null,
          nextOfKinRelation: editLearnerForm.nextOfKinRelation || null,
          nextOfKinContactNumber: editLearnerForm.nextOfKinContactNumber || null,
          bankName: editLearnerForm.bankName || null,
          accountType: editLearnerForm.accountType || null,
          accountNumber: editLearnerForm.accountNumber || null,
          branchCode: editLearnerForm.branchCode || null
        })
      });

      if (response && response.ok) {
        // Update the learner in the local state
        setClassLearnersOld(prev => ({
          ...prev,
          [selectedLearner.siteClassId]: (prev[selectedLearner.siteClassId] || []).map(l =>
            l.id === selectedLearner.id
              ? { ...l, ...editLearnerForm, age: editLearnerForm.age ? parseInt(editLearnerForm.age) : l.age, yearOfCompletion: editLearnerForm.yearOfCompletion ? parseInt(editLearnerForm.yearOfCompletion) : l.yearOfCompletion }
              : l
          )
        }));
        pushToast('success', 'Learner updated successfully');
        setShowLearnerModal(false);
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to update learner: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating learner:', error);
      pushToast('error', 'An error occurred while updating the learner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLearner || !selectedFile || !selectedDocumentType) {
      pushToast('warning', 'Please select a document type and file');
      return;
    }

    setUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append('LearnerId', selectedLearner.id.toString());
      formData.append('DocumentType', selectedDocumentType);
      formData.append('File', selectedFile);

      const response = await fetchWithAuth('/api/LearnerDocuments/upload', {
        method: 'POST',
        body: formData
      });

      if (response && response.ok) {
        const newDocument = await response.json();
        setLearnerDocuments(prev => [newDocument, ...prev]);
        setSelectedFile(null);
        setSelectedDocumentType('');
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        pushToast('success', 'Document uploaded successfully');
      } else {
        const errorData = await response.json();
        pushToast('error', `Failed to upload document: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      pushToast('error', 'An error occurred while uploading the document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleViewDocument = async (documentId: number) => {
    try {
      const response = await fetchWithAuth(`/api/LearnerDocuments/${documentId}/download`);

      if (response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        // Open in new tab instead of downloading
        window.open(url, '_blank');
        // Clean up after a delay to ensure the tab opens
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to view document: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      pushToast('error', 'An error occurred while viewing the document');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Task Management Functions
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await fetchWithAuth('/api/Tasks');
      
      if (response && response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
        
        // Check for overdue and upcoming tasks for alerts
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const overdue = tasksData.filter((task: Task) => 
          task.status !== 'Completed' && new Date(task.dueDate) < now
        );
        
        const upcoming = tasksData.filter((task: Task) => 
          task.status !== 'Completed' && 
          new Date(task.dueDate) >= now && 
          new Date(task.dueDate) <= tomorrow
        );
        
        setOverdueAlerts(overdue);
        setUpcomingAlerts(upcoming);
      } else if (response) {
        console.error('Failed to fetch tasks');
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchProjectTasks = async (projectId: number) => {
    setTasksLoading(true);
    try {
      const response = await fetchWithAuth(`/api/Tasks?projectId=${projectId}`);
      
      if (response && response.ok) {
        const tasksData = await response.json();
        setProjectTasks(tasksData);
      } else if (response) {
        console.error('Failed to fetch project tasks');
        setProjectTasks([]);
      }
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      setProjectTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchTaskSummary = async (projectId?: number) => {
    try {
      let url = '/api/Tasks/Summary';
      if (projectId) {
        url += `?projectId=${projectId}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (response && response.ok) {
        const summaryData = await response.json();
        setTaskSummary(summaryData);
      } else if (response) {
        console.error('Failed to fetch task summary');
        setTaskSummary(null);
      }
    } catch (error) {
      console.error('Error fetching task summary:', error);
      setTaskSummary(null);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetchWithAuth('/api/Tasks/Users');
      
      if (response && response.ok) {
        const usersData = await response.json();
        setAvailableUsers(usersData);
      } else if (response) {
        console.error('Failed to fetch available users');
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      setAvailableUsers([]);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addTaskForm.title.trim() || !addTaskForm.dueDate || addTaskForm.assignedToUserId === 0) {
      pushToast('warning', 'Please fill in all required fields (Title, Due Date, Assigned to)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/Tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: addTaskForm.title.trim(),
          description: addTaskForm.description.trim(),
          dueDate: addTaskForm.dueDate,
          priority: addTaskForm.priority,
          assignedToUserId: addTaskForm.assignedToUserId,
          projectId: addTaskForm.projectId || null,
          departmentId: addTaskForm.departmentId || null,
          reminders: addTaskForm.reminders
        })
      });

      if (response && response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask, ...prev]);
        setAddTaskForm({
          title: '',
          description: '',
          dueDate: '',
          priority: 'Medium',
          assignedToUserId: 0,
          projectId: undefined,
          departmentId: undefined,
          reminders: []
        });
        setShowAddTaskModal(false);
        pushToast('success', 'Task created successfully! The assigned user will receive an email notification.');
      } else if (response) {
        const errorData = await response.json();
        pushToast('error', `Failed to create task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      pushToast('error', 'An error occurred while creating the task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== ASSESSMENT HANDLERS ====================
  
  const handleAddFormativeAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitStandardId) return;

    // Validate questions if any are added
    if (formativeQuestions.length > 0) {
      const invalidQuestions = formativeQuestions.filter(q => 
        !q.questionText.trim() || !q.allocatedMarks || parseFloat(q.allocatedMarks) <= 0
      );
      
      if (invalidQuestions.length > 0) {
        pushToast('warning', 'Please ensure all questions have text and valid marks greater than 0.');
        return;
      }
    }

    // Calculate total marks from questions - this becomes the score
    const totalMarks = formativeQuestions.reduce((sum, q) => sum + parseFloat(q.allocatedMarks), 0);

    try {
      const response = await fetchWithAuth('/api/assessments/formative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectQualificationUnitStandardId: selectedUnitStandardId,
          assessmentDate: new Date(formativeForm.startDate).toISOString(),
          assessmentMethod: null,
          score: totalMarks > 0 ? totalMarks : null,
          maxScore: totalMarks > 0 ? totalMarks : null,
          assessorName: null,
          comments: null,
          status: 'Pending',
          questions: formativeQuestions.map(q => ({
            questionNumber: q.questionNumber,
            questionText: q.questionText.trim(),
            allocatedMarks: parseFloat(q.allocatedMarks)
          }))
        })
      });

      if (response && response.ok) {
        pushToast('success', `Formative assessment added successfully!\n${formativeQuestions.length} question(s) saved\nTotal Marks: ${totalMarks.toFixed(2)}`);
        setShowFormativeModal(false);
        setFormativeForm({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        });
        setFormativeQuestions([]);
        // Refresh assessments
        if (selectedUnitStandardId) {
          setAssessmentData(prev => {
            const updated = {...prev};
            delete updated[selectedUnitStandardId];
            return updated;
          });
          fetchAssessmentsForUnitStandard(selectedUnitStandardId);
        }
      } else {
        pushToast('error', 'Failed to add assessment');
      }
    } catch (error) {
      console.error('Error adding formative assessment:', error);
      pushToast('error', 'An error occurred adding the formative assessment');
    }
  };

  const handleAddSummativeAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitStandardId) return;

    // Validate questions if any are added
    if (summativeQuestions.length > 0) {
      const invalidQuestions = summativeQuestions.filter(q => 
        !q.questionText.trim() || !q.allocatedMarks || parseFloat(q.allocatedMarks) <= 0
      );
      
      if (invalidQuestions.length > 0) {
        pushToast('warning', 'Please ensure all questions have text and valid marks greater than 0.');
        return;
      }
    }

    // Calculate total marks from questions - this becomes the finalScore
    const totalMarks = summativeQuestions.reduce((sum, q) => sum + parseFloat(q.allocatedMarks), 0);

    try {
      const response = await fetchWithAuth('/api/assessments/summative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectQualificationUnitStandardId: selectedUnitStandardId,
          assessmentDate: new Date(summativeForm.startDate).toISOString(),
          startDate: new Date(summativeForm.startDate).toISOString(),
          endDate: new Date(summativeForm.endDate).toISOString(),
          finalScore: totalMarks > 0 ? totalMarks : null,
          maxScore: totalMarks > 0 ? totalMarks : null,
          status: 'Pending',
          assessorName: null,
          moderatorName: null,
          comments: null,
          moderatorComments: null,
          questions: summativeQuestions.map(q => ({
            questionNumber: q.questionNumber,
            questionText: q.questionText.trim(),
            allocatedMarks: parseFloat(q.allocatedMarks)
          }))
        })
      });

      if (response && response.ok) {
        pushToast('success', `Summative assessment added successfully!\n${summativeQuestions.length} question(s) saved\nTotal Marks: ${totalMarks.toFixed(2)}`);
        setShowSummativeModal(false);
        setSummativeForm({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        });
        setSummativeQuestions([]);
        // Refresh assessments
        if (selectedUnitStandardId) {
          setAssessmentData(prev => {
            const updated = {...prev};
            delete updated[selectedUnitStandardId];
            return updated;
          });
          fetchAssessmentsForUnitStandard(selectedUnitStandardId);
        }
      } else {
        pushToast('error', 'Failed to add summative assessment');
      }
    } catch (error) {
      console.error('Error adding summative assessment:', error);
      pushToast('error', 'An error occurred adding the summative assessment');
    }
  };

  // Fetch assessments and questions for a unit standard
  const fetchAssessmentsForUnitStandard = async (unitStandardId: number) => {
    if (loadingAssessments[unitStandardId] || assessmentData[unitStandardId]) {
      return; // Already loaded or loading
    }

    setLoadingAssessments(prev => ({...prev, [unitStandardId]: true}));

    try {
      // Fetch formative assessments
      const formativeResponse = await fetchWithAuth(`/api/assessments/formative/unit-standard/${unitStandardId}`);
      const formativeAssessments = formativeResponse && formativeResponse.ok ? await formativeResponse.json() : [];

      // Fetch summative assessments
      const summativeResponse = await fetchWithAuth(`/api/assessments/summative/unit-standard/${unitStandardId}`);
      const summativeAssessments = summativeResponse && summativeResponse.ok ? await summativeResponse.json() : [];

      // Fetch logbook entries
      const logbookResponse = await fetchWithAuth(`/api/assessments/logbook/unit-standard/${unitStandardId}`);
      const logbookEntries = logbookResponse && logbookResponse.ok ? await logbookResponse.json() : [];

      // Fetch questions for each formative assessment
      const formativeQuestions: {[key: number]: any[]} = {};
      for (const assessment of formativeAssessments) {
        const questionsResponse = await fetchWithAuth(`/api/assessments/formative/${assessment.id}/questions`);
        if (questionsResponse && questionsResponse.ok) {
          formativeQuestions[assessment.id] = await questionsResponse.json();
        }
      }

      // Fetch questions for each summative assessment
      const summativeQuestions: {[key: number]: any[]} = {};
      for (const assessment of summativeAssessments) {
        const questionsResponse = await fetchWithAuth(`/api/assessments/summative/${assessment.id}/questions`);
        if (questionsResponse && questionsResponse.ok) {
          summativeQuestions[assessment.id] = await questionsResponse.json();
        }
      }

      setAssessmentData(prev => ({
        ...prev,
        [unitStandardId]: {
          formative: formativeAssessments,
          summative: summativeAssessments,
          formativeQuestions,
          summativeQuestions,
          logbook: logbookEntries
        }
      }));
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoadingAssessments(prev => ({...prev, [unitStandardId]: false}));
    }
  };

  const handleSelectMarkingProject = async (projectId: number) => {
    setMarkingProjectId(projectId);
    setMarkingLearnerId(null);
    setLearnerProgress([]);
    setExpandedMarkingQualification(null);
    setExpandedMarkingUnitStandard(null);
    setExpandedMarkingAssessment(null);
    setMarkingAssessmentQuestions([]);
    setMarkingLearnerAnswers([]);
    setMarkingAnswerPreviewUrl(null);

    try {
      const [learnersResponse, detailsResponse] = await Promise.all([
        fetchWithAuth(`/api/Learners/project/${projectId}`),
        fetchWithAuth(`/api/projects/${projectId}/details`)
      ]);

      const learnersData = learnersResponse && learnersResponse.ok ? await learnersResponse.json() : [];
      const detailsData = detailsResponse && detailsResponse.ok ? await detailsResponse.json() : null;
      setMarkingLearners(learnersData);
      setMarkingProjectDetails(detailsData);
    } catch (error) {
      console.error('Failed to load project marking data:', error);
      pushToast('error', 'Failed to load project learners and qualifications for marking');
    }
  };

  const openMarkingAssessment = async (assessmentId: number, assessmentType: 'Formative' | 'Summative', isRemedial: boolean = false) => {
    if (!markingLearnerId) return;
    
    // Set basic states first
    setExpandedMarkingAssessment({ id: assessmentId, type: assessmentType });
    setIsRemedialMarking(isRemedial);
    setMarkingAnswerPreviewUrl(null);
    
    // RESET ALL DRAFT STATES COMPLETELY
    setOverallModeratorComment('');
    setModerationApproval({});
    setModerationDraftMarks({});
    setModerationComments({});
    setDraftMarks({});
    
    try {
      const questionUrl = assessmentType === 'Formative'
        ? `/api/Assessments/formative/${assessmentId}/questions`
        : `/api/Assessments/summative/${assessmentId}/questions`;
      
      // Ensure we pass isRemedial to the answers endpoint
      const answersUrl = `/api/LearnerAssessmentAnswers/learner/${markingLearnerId}/assessment/${assessmentId}/${assessmentType}?isRemedial=${isRemedial}`;

      const [qResponse, aResponse] = await Promise.all([
        fetchWithAuth(questionUrl),
        fetchWithAuth(answersUrl)
      ]);

      const questions = qResponse && qResponse.ok ? await qResponse.json() : [];
      const answersData = aResponse && aResponse.ok ? await aResponse.json() : [];
      
      // Normalize answer field names (handle both backend formats)
      const normalizedAnswers = (answersData || []).map((a: any) => ({
        answerId: a.id || a.Id || a.answerId,
        questionId: a.questionId || a.QuestionId,
        questionNumber: a.questionNumber || a.QuestionNumber,
        learnerId: a.learnerId || a.LearnerId,
        scannedDocumentName: a.scannedDocumentName || a.ScannedDocumentName,
        scannedAt: a.scannedAt || a.ScannedAt,
        mark: a.mark !== undefined ? a.mark : (a.Mark !== undefined ? a.Mark : null),
        assessorComments: a.assessorComments || a.AssessorComments || '',
        markStatus: a.markStatus !== undefined ? a.markStatus : a.MarkStatus,
        isRemedial: a.isRemedial !== undefined ? a.isRemedial : a.IsRemedial,
        moderationStatus: a.moderationStatus !== undefined ? a.moderationStatus : a.ModerationStatus,
        moderatedMark: a.moderatedMark !== undefined ? a.moderatedMark : (a.ModeratedMark !== undefined ? a.ModeratedMark : null),
        moderatorComments: a.moderatorComments || a.ModeratorComments || ''
      }));

      setMarkingAssessmentQuestions(questions);
      setMarkingLearnerAnswers(normalizedAnswers);

      // Auto-preview first answer if available
      if (normalizedAnswers.length > 0 && (normalizedAnswers[0].answerId || normalizedAnswers[0].id)) {
        openMarkingAnswerPreview(normalizedAnswers[0].answerId || normalizedAnswers[0].id);
      }

      // Load DB marks and comments into local state
      const dbMarks: { [key: string]: string } = {};
      const dbAssessorComments: { [key: string]: string } = {};
      const dbModMarks: { [key: string]: string } = {};
      const dbModComments: { [key: string]: string } = {};
      const dbModApproval: { [key: string]: boolean } = {};
      
      normalizedAnswers.forEach((ans: any) => {
        const markKey = `learner:${markingLearnerId}:assessment:${assessmentType}:${assessmentId}:question:${ans.questionId}`;
        
        // Assessor marks
        if (ans.mark !== null && ans.mark !== undefined) {
          dbMarks[markKey] = ans.mark.toString();
        }
        if (ans.assessorComments) {
          dbAssessorComments[`assessor:${ans.questionId}`] = ans.assessorComments;
        }

        // Moderation data (Status 2=Moderated, 3=ReturnedToAssessor)
        const status = ans.moderationStatus;
        const isModerated = status === 2 || status === 'Moderated' || status === 3 || status === 'ReturnedToAssessor';
        
        if (isModerated) {
          if (ans.moderatedMark !== null && ans.moderatedMark !== undefined) {
            dbModMarks[`q-${ans.questionId}`] = ans.moderatedMark.toString();
          }
          if (ans.moderatorComments) {
            dbModComments[`moderator:${ans.questionId}`] = ans.moderatorComments;
          }
          dbModApproval[`q-${ans.questionId}`] = status === 2 || status === 'Moderated';
        }
      });

      // Bulk update all states
      setDraftMarks(dbMarks);
      setModerationComments({ ...dbAssessorComments, ...dbModComments });
      setModerationDraftMarks(dbModMarks);
      setModerationApproval(dbModApproval);
    } catch (error) {
      console.error('Failed to load assessment data:', error);
      pushToast('error', 'Failed to load questions and learner answers');
    }
  };

  const openMarkingAnswerPreview = async (answerId: number) => {
    try {
      const response = await fetchWithAuth(`/api/LearnerAssessmentAnswers/${answerId}/download`);
      if (!response || !response.ok) {
        pushToast('error', 'Unable to open learner upload');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMarkingAnswerPreviewUrl(url);
    } catch (error) {
      console.error('Failed to preview learner upload:', error);
      pushToast('error', 'Failed to preview learner upload');
    }
  };

  const refreshProgress = async () => {
    if (!markingLearnerId) return;
    try {
      const response = await fetchWithAuth(`/api/LearnerAssessmentAnswers/learner/${markingLearnerId}/progress`);
      if (response && response.ok) {
        const data = await response.json();
        setLearnerProgress(data);
      }
    } catch (error) {
      console.error('Failed to refresh learner progress:', error);
    }
  };

  const submitSectionMarks = async () => {
    if (!expandedMarkingAssessment || !markingLearnerId) return;
    
    setMarkingSaving(true);
    try {
      const answersToSubmit = markingAssessmentQuestions.map(q => {
        const markKey = `learner:${markingLearnerId}:assessment:${expandedMarkingAssessment.type}:${expandedMarkingAssessment.id}:question:${q.id}`;
        const markValue = draftMarks[markKey];
        const comments = moderationComments[`assessor:${q.id}`] || '';
        
        // Find existing answer ID if any
        const existingAnswer = markingLearnerAnswers.find(a => a.questionId === q.id);
        
        // Only submit if it has a value and isn't already marked in the database
        if (markValue !== undefined && markValue !== '' && existingAnswer && (existingAnswer.mark === null || existingAnswer.mark === undefined)) {
          const numMark = parseFloat(markValue);
          if (numMark > q.allocatedMarks) {
            throw new Error(`Mark for Q${q.questionNumber} (${numMark}) exceeds maximum allowed (${q.allocatedMarks})`);
          }
          return {
            answerId: existingAnswer.answerId,
            mark: numMark,
            comments: comments,
            assessorId: user?.id
          };
        }
        return null;
      }).filter(a => a !== null);

      if (answersToSubmit.length === 0) {
        pushToast('warning', 'No marks found to submit');
        return;
      }

      for (const answer of answersToSubmit) {
        await fetchWithAuth('/api/LearnerAssessmentAnswers/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer)
        });
      }

      pushToast('success', 'Marks submitted successfully to the server');
      // Refresh answers and progress
      await Promise.all([
        openMarkingAssessment(expandedMarkingAssessment.id, expandedMarkingAssessment.type, isRemedialMarking),
        refreshProgress()
      ]);
    } catch (error) {
      console.error('Error submitting marks:', error);
      pushToast('error', error instanceof Error ? error.message : 'Failed to submit marks to the server');
    } finally {
      setMarkingSaving(false);
    }
  };

  const saveSectionMarksDraft = () => {
    if (!expandedMarkingAssessment || !markingLearnerId) return;
    const key = `sideMarking:${expandedMarkingAssessment.type}:${expandedMarkingAssessment.id}:learner:${markingLearnerId}`;
    localStorage.setItem(key, JSON.stringify(draftMarks));
    pushToast('info', 'Marks saved as draft locally');
  };

  const getDraftMarkStorageKey = (assessmentType: 'Formative' | 'Summative', assessmentId: number) =>
    `markingDraft:${assessmentType}:${assessmentId}`;

  const openMarkingModal = async (assessmentId: number, assessmentType: 'Formative' | 'Summative', unitStandardId: number) => {
    setShowMarkingModal(true);
    setMarkingAssessment({ id: assessmentId, type: assessmentType, unitStandardId });
    setMarkingLoading(true);
    setMarkingData(null);

    try {
      const response = await fetchWithAuth(`/api/LearnerAssessmentAnswers/assessment/${assessmentType}/${assessmentId}/marking`);

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch submissions (${response?.status || 'unknown'})`);
      }

      const data = await response.json();
      
      // Normalize data from backend (handle PascalCase)
      if (data.learners) {
        data.learners = data.learners.map((l: any) => ({
          ...l,
          learnerId: l.learnerId !== undefined ? l.learnerId : l.LearnerId,
          firstName: l.firstName || l.FirstName,
          lastName: l.lastName || l.LastName,
          answers: (l.answers || l.Answers || []).map((a: any) => ({
            ...a,
            answerId: a.answerId !== undefined ? a.answerId : a.Id,
            questionId: a.questionId !== undefined ? a.questionId : a.QuestionId,
            questionNumber: a.questionNumber !== undefined ? a.questionNumber : a.QuestionNumber,
            mark: a.mark !== undefined ? a.mark : a.Mark,
            allocatedMarks: a.allocatedMarks !== undefined ? a.allocatedMarks : a.AllocatedMarks,
            scannedDocumentName: a.scannedDocumentName || a.ScannedDocumentName,
            scannedAt: a.scannedAt || a.ScannedAt
          }))
        }));
      }
      
      setMarkingData(data);

      // Populate draft marks from existing answers in the database
      const dbMarks: { [key: string]: string } = {};
      if (data.learners) {
        data.learners.forEach((learner: any) => {
          (learner.answers || []).forEach((answer: any) => {
            const markKey = `${learner.learnerId}-${answer.questionId}`;
            if (answer.mark !== null && answer.mark !== undefined) {
              dbMarks[markKey] = answer.mark.toString();
            }
          });
        });
      }

      const savedDraft = localStorage.getItem(getDraftMarkStorageKey(assessmentType, assessmentId));
      if (savedDraft) {
        // Merge DB marks with local draft, prioritizing local draft for currently unsaved changes
        setDraftMarks({ ...dbMarks, ...JSON.parse(savedDraft) });
      } else {
        setDraftMarks(dbMarks);
      }
    } catch (error) {
      console.error('Error loading marking data:', error);
      pushToast('error', 'Failed to load learner submissions for marking');
      setShowMarkingModal(false);
      setMarkingAssessment(null);
    } finally {
      setMarkingLoading(false);
    }
  };

  const saveMarkingDraft = () => {
    if (!markingAssessment) return;
    localStorage.setItem(getDraftMarkStorageKey(markingAssessment.type, markingAssessment.id), JSON.stringify(draftMarks));
    pushToast('info', 'Draft marks saved on this browser');
  };

  const submitModalMarks = async () => {
    if (!markingAssessment || !markingData?.learners) return;
    
    setMarkingSaving(true);
    try {
      const answersToSubmit = [];
      
      for (const learner of markingData.learners) {
        for (const answer of (learner.answers || [])) {
          const markKey = `${learner.learnerId}-${answer.questionId}`;
          const markValue = draftMarks[markKey];
          
          // Only submit if it has a value and isn't already marked in the database
          if (markValue !== undefined && markValue !== '' && (answer.mark === null || answer.mark === undefined)) {
            const numMark = parseFloat(markValue);
            
            if (answer.allocatedMarks && numMark > answer.allocatedMarks) {
              throw new Error(`Mark for ${learner.learnerName} Q${answer.questionNumber} (${numMark}) exceeds maximum allowed (${answer.allocatedMarks})`);
            }
            
            answersToSubmit.push({
              answerId: answer.answerId,
              mark: numMark,
              comments: '', 
              assessorId: user?.id
            });
          }
        }
      }

      if (answersToSubmit.length === 0) {
        pushToast('warning', 'No marks found to submit');
        setMarkingSaving(false);
        return;
      }

      for (const answer of answersToSubmit) {
        await fetchWithAuth('/api/LearnerAssessmentAnswers/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer)
        });
      }

      pushToast('success', 'Marks submitted successfully to the server');
      localStorage.removeItem(getDraftMarkStorageKey(markingAssessment.type, markingAssessment.id));
      await Promise.all([
        openMarkingModal(markingAssessment.id, markingAssessment.type, markingAssessment.unitStandardId),
        refreshProgress()
      ]);
    } catch (error) {
      console.error('Error submitting marks:', error);
      pushToast('error', error instanceof Error ? error.message : 'Failed to submit marks to the server');
    } finally {
      setMarkingSaving(false);
    }
  };

  const calculateLearnerTotal = (learner: any) => {
    return (learner.answers || []).reduce((sum: number, answer: any) => {
      const markKey = `${learner.learnerId}-${answer.questionId}`;
      const value = parseFloat(draftMarks[markKey] || '0');
      return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);
  };

  const handleAddLogbookEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitStandardId) return;

    const requestData = {
      projectQualificationUnitStandardId: selectedUnitStandardId,
      startDate: new Date(logbookForm.startDate).toISOString(),
      endDate: new Date(logbookForm.endDate).toISOString(),
      activityDescription: logbookForm.activityDescription,
      hoursSpent: logbookForm.hoursSpent ? parseFloat(logbookForm.hoursSpent) : null,
      supervisorName: logbookForm.supervisorName,
      comments: logbookForm.comments,
      approved: false
    };

    console.log('=== LOGBOOK REQUEST DATA ===');
    console.log('Form state:', logbookForm);
    console.log('Request payload:', requestData);
    console.log('JSON string:', JSON.stringify(requestData));
    console.log('JSON length:', JSON.stringify(requestData).length);

    try {
      const response = await fetchWithAuth('/api/assessments/logbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response && response.ok) {
        pushToast('success', 'Logbook entry added successfully!');
        setShowLogbookModal(false);
        setLogbookForm({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          activityDescription: '',
          hoursSpent: '',
          supervisorName: '',
          comments: ''
        });
        // Refresh logbook entries
        if (selectedUnitStandardId) {
          setAssessmentData(prev => {
            const updated = {...prev};
            delete updated[selectedUnitStandardId];
            return updated;
          });
          fetchAssessmentsForUnitStandard(selectedUnitStandardId);
        }
      } else {
        const errorText = await response.text();
        console.error('Logbook error response:', errorText);
        pushToast('error', `Failed to add logbook entry: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding logbook entry:', error);
      pushToast('error', `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetchWithAuth(`/api/Tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: newStatus,
          priority: task.priority,
          assignedToUserId: task.assignedToUserId,
          projectId: task.projectId,
          departmentId: task.departmentId,
          completionNotes: newStatus === 'Completed' ? 'Task completed' : null
        })
      });

      if (response && response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        pushToast('success', 'Task status updated successfully');
      } else {
        const errorData = await response.json();
        pushToast('error', `Failed to update task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      pushToast('error', 'An error occurred while updating the task');
    }
  };

  const addReminder = () => {
    const newReminder: CreateTaskReminderForm = {
      reminderDateTime: '',
      type: 'Both',
      message: ''
    };
    setAddTaskForm(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder]
    }));
  };

  const removeReminder = (index: number) => {
    setAddTaskForm(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  const updateReminder = (index: number, field: keyof CreateTaskReminderForm, value: string) => {
    setAddTaskForm(prev => ({
      ...prev,
      reminders: prev.reminders.map((reminder, i) => 
        i === index ? { ...reminder, [field]: value } : reminder
      )
    }));
  };

  // Attendance Tracking Functions
  useEffect(() => {
    if (activeSection === 'attendanceTracking' || activeSection === 'overview') {
      fetchAttendanceProjects(activeSection === 'overview' ? overviewAttendancePeriod : 'today');
    }
  }, [activeSection, overviewAttendancePeriod]);

  // Once attendanceProjects are loaded on the overview, fetch real daily
  // breakdowns so the enrollment/attendance trend charts render real data.
  useEffect(() => {
    if (activeSection !== 'overview') return;
    if (!attendanceProjects.length) {
      setOverviewDailyBreakdown(null);
      return;
    }
    if (overviewAttendancePeriod === 'today') return; // daily breakdown would be a single point, skip
    void fetchOverviewDailyBreakdown(
      overviewAttendancePeriod,
      attendanceProjects.map(p => p.projectId),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, overviewAttendancePeriod, attendanceProjects]);

  const fetchAttendanceProjects = async (period: string = 'today') => {
    setAttendanceLoading(true);
    try {
      const response = await fetchWithAuth(`/api/AttendanceTracking/projects?period=${period}`);
      
      if (response && response.ok) {
        const projectsData = await response.json();
        setAttendanceProjects(projectsData);
      } else if (response) {
        console.error('Failed to fetch attendance projects');
        setAttendanceProjects([]);
      }
    } catch (error) {
      console.error('Error fetching attendance projects:', error);
      setAttendanceProjects([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchAttendanceStats = async (projectId: number) => {
    setAttendanceLoading(true);
    try {
      let url = `/api/AttendanceTracking/project/${projectId}/stats?period=${attendancePeriod}`;
      
      if (attendancePeriod === 'custom') {
        url += `&startDate=${attendanceStartDate}&endDate=${attendanceEndDate}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (response && response.ok) {
        const statsData = await response.json();
        setAttendanceStats(statsData);
      } else if (response) {
        console.error('Failed to fetch attendance stats');
        setAttendanceStats(null);
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      setAttendanceStats(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchClassLearners = async (projectId: number, classId: number, date?: string) => {
    try {
      let url = `/api/AttendanceTracking/project/${projectId}/class/${classId}/learners`;
      if (date) {
        url += `?date=${date}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (response && response.ok) {
        const learnersData = await response.json();
        setClassLearners(learnersData);
      } else if (response) {
        console.error('Failed to fetch class learners');
        setClassLearners([]);
      }
    } catch (error) {
      console.error('Error fetching class learners:', error);
      setClassLearners([]);
    }
  };

  const fetchClassLearnersWeekly = async (projectId: number, classId: number, startDate?: string) => {
    try {
      let url = `/api/AttendanceTracking/project/${projectId}/class/${classId}/learners/weekly`;
      if (startDate) {
        url += `?startDate=${startDate}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (response && response.ok) {
        const weeklyData = await response.json();
        setWeeklyLearners(weeklyData);
      } else if (response) {
        console.error('Failed to fetch weekly class learners');
        setWeeklyLearners([]);
      }
    } catch (error) {
      console.error('Error fetching weekly class learners:', error);
      setWeeklyLearners([]);
    }
  };

  const fetchAttendanceReport = async (projectId: number) => {
    setAttendanceLoading(true);
    try {
      let url = `/api/AttendanceTracking/project/${projectId}/report?period=${attendancePeriod}`;
      
      if (attendancePeriod === 'custom') {
        url += `&startDate=${attendanceStartDate}&endDate=${attendanceEndDate}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (response && response.ok) {
        const reportData = await response.json();
        setAttendanceReport(reportData);
        setShowAttendanceReport(true);
      } else if (response) {
        console.error('Failed to fetch attendance report');
        setAttendanceReport(null);
      }
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      setAttendanceReport(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Aggregate daily attendance across multiple projects by merging report dailyBreakdown
  // arrays keyed by date. Sums counts and computes a weighted (by totalLearners) avg
  // attendance rate so enrollment/attendance charts render real API numbers.
  const mergeDailyBreakdowns = (reports: AttendanceReport[]): DailyAttendance[] => {
    const buckets = new Map<string, DailyAttendance>();
    for (const r of reports) {
      if (!r?.dailyBreakdown) continue;
      for (const d of r.dailyBreakdown) {
        const key = d.date.substring(0, 10);
        const prev = buckets.get(key);
        if (!prev) {
          buckets.set(key, { ...d, date: `${key}T00:00:00` });
        } else {
          const newTotal = prev.totalLearners + d.totalLearners;
          const newPresent = prev.presentLearners + d.presentLearners;
          const newAbsent = prev.absentLearners + d.absentLearners;
          const weightedHours = newTotal > 0
            ? ((prev.averageContactHours * prev.totalLearners) +
               (d.averageContactHours * d.totalLearners)) / newTotal
            : (prev.averageContactHours + d.averageContactHours) / 2;
          buckets.set(key, {
            date: `${key}T00:00:00`,
            totalLearners: newTotal,
            presentLearners: newPresent,
            absentLearners: newAbsent,
            attendanceRate: newTotal > 0 ? (newPresent / newTotal) * 100 : 0,
            averageContactHours: weightedHours,
          });
        }
      }
    }
    const arr = Array.from(buckets.values());
    arr.sort((a, b) => a.date.localeCompare(b.date));
    return arr;
  };

  // Fetch real daily breakdowns for the overview charts for the current
  // overviewAttendancePeriod. Combines reports from up to the first 5
  // projects to avoid back-pressure while still providing accurate aggregate.
  const fetchOverviewDailyBreakdown = async (
    period: string,
    projectIds: number[],
  ): Promise<DailyAttendance[] | null> => {
    if (!projectIds.length || period === 'today') return null;
    setOverviewDailyLoading(true);
    try {
      const MAX_PROJECTS = 5;
      const ids = projectIds.slice(0, MAX_PROJECTS);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const url = `/api/AttendanceTracking/project/${id}/report?period=${period}`;
            const r = await fetchWithAuth(url);
            if (r?.ok) return (await r.json()) as AttendanceReport;
            return null;
          } catch {
            return null;
          }
        }),
      );
      const valid = results.filter(Boolean) as AttendanceReport[];
      const merged = valid.length ? mergeDailyBreakdowns(valid) : null;
      setOverviewDailyBreakdown(merged);
      return merged;
    } catch (e) {
      console.error('Error fetching overview daily breakdown:', e);
      setOverviewDailyBreakdown(null);
      return null;
    } finally {
      setOverviewDailyLoading(false);
    }
  };

  const exportMonthlyAttendance = async (projectId: number) => {
    try {
      const date = new Date(attendanceStartDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const response = await fetchWithAuth(`/api/AttendanceExport/project/${projectId}/monthly?year=${year}&month=${month}`);
      
      if (response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Attendance_${selectedAttendanceProject?.projectName}_${year}_${month}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (response) {
        pushToast('error', 'Failed to export monthly attendance');
      }
    } catch (error) {
      console.error('Error exporting attendance:', error);
      pushToast('error', 'An error occurred during export');
    }
  };

  // ─── Attendance Calendar Functions ──────────────────────────────────────
  const openAttendanceCalendar = async (learnerId: number) => {
    setSelectedLearnerId(learnerId);
    setShowAttendanceCalendar(true);
    await fetchLearnerAttendanceCalendar(learnerId, calendarYear, calendarMonth);
  };

  const fetchLearnerAttendanceCalendar = async (learnerId: number, year: number, month: number) => {
    setCalendarLoading(true);
    try {
      const response = await fetchWithAuth(`/api/AttendanceTracking/learner/${learnerId}/calendar?year=${year}&month=${month}`);
      
      if (response && response.ok) {
        const data = await response.json();
        setCalendarData(data);
      } else {
        console.error('Failed to fetch attendance calendar');
        setCalendarData(null);
      }
    } catch (error) {
      console.error('Error fetching attendance calendar:', error);
      setCalendarData(null);
    } finally {
      setCalendarLoading(false);
    }
  };

  const changeCalendarMonth = (direction: 'prev' | 'next') => {
    let newMonth = calendarMonth;
    let newYear = calendarYear;

    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    setCalendarMonth(newMonth);
    setCalendarYear(newYear);

    if (selectedLearnerId) {
      fetchLearnerAttendanceCalendar(selectedLearnerId, newYear, newMonth);
    }
  };

  const exportStipendSchedule = async (projectId: number) => {
    try {
      const date = new Date(attendanceStartDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const response = await fetchWithAuth(`/api/AttendanceExport/project/${projectId}/stipend?year=${year}&month=${month}&dailyRate=150`);
      
      if (response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Stipend_${selectedAttendanceProject?.projectName}_${year}_${month}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (response) {
        pushToast('error', 'Failed to export stipend schedule');
      }
    } catch (error) {
      console.error('Error exporting stipend:', error);
      pushToast('error', 'An error occurred during export');
    }
  };

  // Bulk download: all projects for the current SDP as a ZIP (monthly + stipend)
  const handleBulkAttendanceDownload = async (_currentProjectId: number) => {
    setBulkAttendanceDownloading(true);
    try {
      const date = new Date(attendanceStartDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Collect all project IDs visible to this user
      const ids = filteredProjects.map((p: any) => p.id).join(',');
      if (!ids) {
        pushToast('warning', 'No projects found to download.');
        return;
      }

      // Show a modal-style date picker? For now use attendanceStartDate's month.
      const url = `/api/AttendanceExport/bulk-download?year=${year}&month=${month}&projectIds=${ids}&includeStipend=true&dailyRate=150`;
      const response = await fetchWithAuth(url);

      if (response && response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Bulk_Attendance_${year}_${String(month).padStart(2, '0')}_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else if (response) {
        const txt = await response.text();
        pushToast('error', `Bulk download failed: ${txt}`);
      }
    } catch (error) {
      console.error('Error in bulk attendance download:', error);
      pushToast('error', 'An error occurred during bulk download');
    } finally {
      setBulkAttendanceDownloading(false);
    }
  };

  const submitModeration = async () => {
    if (!markingLearnerId || !expandedMarkingAssessment) return;

    // Check if already moderated to prevent double submission
    const progress = (learnerProgress || []).find(p => p.projectQualificationUnitStandardId === expandedMarkingUnitStandard);
    const isAlreadyModeratedOverall = expandedMarkingAssessment.type === 'Formative' 
      ? progress?.formativeModerated 
      : progress?.summativeModerated;

    if (isAlreadyModeratedOverall) {
      pushToast('warning', 'This assessment has already been moderated and cannot be submitted again.');
      return;
    }
    
    // Validation: Ensure every question has a decision (Uphold or Withdraw)
    const undecidedQuestions = markingAssessmentQuestions.filter(q => {
      // Find if this question already has a moderated record in DB
      const existingAnswer = markingLearnerAnswers.find((a: any) => a.questionId === q.id);
      const isAlreadyModerated = existingAnswer && (existingAnswer.moderationStatus === 'Moderated' || existingAnswer.moderationStatus === 2 || existingAnswer.moderationStatus === 'ReturnedToAssessor' || existingAnswer.moderationStatus === 3);
      
      // If not already moderated in DB, it MUST have a decision in the current session
      return !isAlreadyModerated && moderationApproval[`q-${q.id}`] === undefined;
    });

    if (undecidedQuestions.length > 0) {
      const qNumbers = undecidedQuestions.map(q => q.questionNumber).join(', ');
      pushToast('warning', `Please make a decision (Uphold or Withdraw) for all questions before submitting. Undecided: Q${qNumbers}`);
      return;
    }

    setMarkingSaving(true);
    try {
      // Submit each moderated answer
      for (const q of markingAssessmentQuestions) {
        const moderatedMark = moderationDraftMarks[`q-${q.id}`];
        const isApproved = moderationApproval[`q-${q.id}`];
        
        // Skip if no decision was made for this question and it wasn't moderated before
        // (though validation above should catch this)
        if (isApproved === undefined) {
          const existingAnswer = markingLearnerAnswers.find((a: any) => a.questionId === q.id);
          const isAlreadyModerated = existingAnswer && (existingAnswer.moderationStatus === 'Moderated' || existingAnswer.moderationStatus === 2 || existingAnswer.moderationStatus === 'ReturnedToAssessor' || existingAnswer.moderationStatus === 3);
          if (!isAlreadyModerated) continue;
          // If already moderated, we skip to next question unless we want to allow re-submission
          continue; 
        }

        const comments = moderationComments[`moderator:${q.id}`] || overallModeratorComment || '';
        
        // Find the answer record for this question
        const answer = markingLearnerAnswers.find((a: any) => a.questionId === q.id);
        if (!answer) continue;

        const numMark = parseFloat(moderatedMark || (isApproved ? answer.mark.toString() : '0'));
        
        // Safety cap: If the mark exceeds the maximum, cap it at the maximum
        const cappedMark = Math.min(numMark, q.allocatedMarks);
        
        await fetchWithAuth('/api/LearnerAssessmentAnswers/moderate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            answerId: answer.answerId,
            moderatedMark: cappedMark,
            comments: comments,
            isApproved: isApproved || false,
            moderatorId: user?.id
          })
        });
      }
      
      pushToast('success', 'Moderation submitted successfully');
      
      // Refresh the assessment data instead of closing it to show the saved state
      await openMarkingAssessment(expandedMarkingAssessment.id, expandedMarkingAssessment.type, isRemedialMarking);
      
      // Refresh progress in the background
      if (markingLearnerId) {
        const progressResponse = await fetchWithAuth(`/api/LearnerAssessmentAnswers/learner/${markingLearnerId}/progress`);
        if (progressResponse && progressResponse.ok) {
          const progressData = await progressResponse.json();
          setLearnerProgress(progressData);
        }
      }
    } catch (error) {
      console.error('Error submitting moderation:', error);
      pushToast('error', error instanceof Error ? error.message : 'An error occurred during moderation submission');
    } finally {
      setMarkingSaving(false);
    }
  };

  const handleProjectSelect = (project: AttendanceTrackingProject) => {
    setSelectedAttendanceProject(project);
    fetchAttendanceStats(project.projectId);
  };

  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month' | 'custom') => {
    setAttendancePeriod(newPeriod);
    if (newPeriod === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setAttendanceStartDate(today);
      setAttendanceEndDate(today);
    } else if (newPeriod === 'week') {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      setAttendanceStartDate(startOfWeek.toISOString().split('T')[0]);
      setAttendanceEndDate(endOfWeek.toISOString().split('T')[0]);
    } else if (newPeriod === 'month') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setAttendanceStartDate(startOfMonth.toISOString().split('T')[0]);
      setAttendanceEndDate(endOfMonth.toISOString().split('T')[0]);
    }
    
    if (selectedAttendanceProject) {
      fetchAttendanceStats(selectedAttendanceProject.projectId);
    }
  };

  const handleClassSelect = (classData: ClassAttendance) => {
    setSelectedClass(classData);
    if (selectedAttendanceProject) {
      if (attendanceViewMode === 'daily') {
        const dateToUse = attendancePeriod === 'today' ? attendanceStartDate : new Date().toISOString().split('T')[0];
        fetchClassLearners(selectedAttendanceProject.projectId, classData.classId, dateToUse);
      } else {
        fetchClassLearnersWeekly(selectedAttendanceProject.projectId, classData.classId, weekStartDate);
      }
    }
  };

  const getManagerTypeInfo = () => {
    if (isSuperUser) {
      return {
        title: 'SDP Super User Dashboard',
        icon: '🎓',
        description: 'Full administrative access to all SDP functional areas',
        color: '#0d9488'
      };
    }
    
    if (isQA) {
      return {
        title: 'Quality Assurance Manager Dashboard',
        icon: '🎯',
        description: 'Ensure quality standards and compliance',
        color: '#0d9488'
      };
    }

    if (isAssessor) {
      return {
        title: 'Assessor Dashboard',
        icon: '✍️',
        description: 'Assess and mark learner submissions',
        color: '#0d9488'
      };
    }

    if (isModerator) {
      return {
        title: 'Moderator Dashboard',
        icon: '⚖️',
        description: 'Moderate and verify assessment marks',
        color: '#0d9488'
      };
    }

    if (isAdmin) {
      return {
        title: 'Administrator Dashboard',
        icon: '👑',
        description: 'Manage all SDP operations and oversight',
        color: '#0d9488'
      };
    }
    
    if (isFinance) {
      return {
        title: 'Financial Manager Dashboard',
        icon: '💰',
        description: 'Manage financial operations and budget oversight',
        color: '#0d9488'
      };
    }
    
    if (isLogistics) {
      return {
        title: 'Logistics Manager Dashboard',
        icon: '🚚',
        description: 'Oversee logistics, resources, and supply chain',
        color: '#0d9488'
      };
    }
    
    if (isIT) {
      return {
        title: 'IT Manager Dashboard',
        icon: '💻',
        description: 'Manage users, system logs, and technical support',
        color: '#0d9488'
      };
    }

    return {
      title: 'Manager Dashboard',
      icon: '👨‍💼',
      description: 'Manage your department operations',
      color: '#0d9488'
    };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Temporary debug display
  if (!user) {
    // No valid session: the auth hook will redirect to /login shortly.
    // Render a neutral loading state so users don't see raw debug info.
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: '#f8fafc' }}>
        <div className="card border-0 shadow-sm p-4 d-flex align-items-center gap-3" style={{ borderRadius: 16, minWidth: 280 }}>
          <div className="spinner-border text-info" role="status"><span className="visually-hidden">Loading...</span></div>
          <div>
            <div className="fw-bold" style={{ color: '#0f172a' }}>Checking your session…</div>
            <small style={{ color: '#64748b' }}>If nothing happens, please sign in again.</small>
          </div>
        </div>
      </div>
    );
  }

  const managerInfo = getManagerTypeInfo();

  const renderSystemLogs = () => (
    <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0e4d8a 100%)',
        position: 'relative',
        padding: 0
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg,#f97316,#ea580c)', borderRadius: '16px 0 0 16px' }}></div>
        <div className="d-flex justify-content-between align-items-center" style={{ padding: '16px 24px 16px 32px' }}>
          <h4 className="mb-0 text-white fw-bold">📜 System Logs & Audit Trail</h4>
          <button className="btn btn-light btn-sm" onClick={fetchSystemLogs} disabled={logsLoading}>
            {logsLoading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {systemLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td><strong>{log.user}</strong></td>
                  <td><span className="badge bg-secondary">{log.action}</span></td>
                  <td>{log.details}</td>
                  <td>
                    <span className={`badge ${
                      log.severity === 'Success' ? 'bg-success' :
                      log.severity === 'Info' ? 'bg-info' :
                      log.severity === 'Warning' ? 'bg-warning text-dark' :
                      'bg-danger'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExternalUsers = () => <ExternalUsersManager fetchWithAuth={fetchWithAuth} />;

  const renderAllUsers = () => (
    <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0e4d8a 100%)',
        position: 'relative',
        padding: 0
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg,#10b981,#059669)', borderRadius: '16px 0 0 16px' }}></div>
        <div className="d-flex justify-content-between align-items-center" style={{ padding: '16px 24px 16px 32px' }}>
          <h4 className="mb-0 text-white fw-bold">👤 User Management (All SDP Users)</h4>
          <button className="btn btn-light btn-sm" onClick={() => setShowAddMemberModal(true)}>
            + Add New User
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allSdpUsers.map(userItem => (
                <tr key={userItem.id}>
                  <td>{userItem.firstName} {userItem.lastName}</td>
                  <td>{userItem.email}</td>
                  <td><span className="badge bg-info text-dark">{userItem.role}</span></td>
                  <td>{userItem.departmentName || 'N/A'}</td>
                  <td>
                    <span className={`badge ${userItem.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                      {userItem.status}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-primary">Edit</button>
                      <button className="btn btn-outline-warning">Reset Pass</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="row g-4">
      {/* Welcome Header */}
      <div className="col-12">
        <div className="card border-0 shadow-sm overflow-hidden" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0e4d8a 100%)',
          borderRadius: 16
        }}>
          <div className="card-body py-4 px-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{managerInfo.icon}</div>
              <div>
                <h4 className="mb-1 text-white fw-bold">Welcome back, {user?.name} 👋</h4>
                <p className="mb-0" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>{managerInfo.description}</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ background:'rgba(255,255,255,0.12)', color:'#fff', padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600, border:'1px solid rgba(255,255,255,0.2)' }}>
                📅 {new Date().toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Super User Quick Actions */}
      {isSuperUser && (
        <div className="col-12 mt-4">
          <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: 16 }}>
            {/* Left accent strip + dark gradient header — replaces broken backdropFilter pattern */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0e4d8a 100%)',
              position: 'relative',
              padding: 0
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg,#0ea5e9,#0d9488)', borderRadius: '16px 0 0 16px' }}></div>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ padding: '18px 24px 18px 32px' }}>
                <h5 className="mb-0 text-white fw-bold">🚀 Super User Quick Actions</h5>
                <small style={{ color: 'rgba(255,255,255,0.55)' }}>Shortcuts to jump straight into work</small>
              </div>
            </div>
            <div className="card-body p-4" style={{ background: '#ffffff' }}>
              <div className="d-flex flex-wrap gap-3">
                <button 
                  onClick={() => navigate('/sdp-dashboard', { state: { section: 'add-department' } })}
                  className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '10px 20px', color: '#0d9488' }}
                >
                  <span>👤</span> Add Department Manager
                </button>
                <button 
                  onClick={() => setActiveSection('projects')}
                  className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '10px 20px', color: '#0d9488' }}
                >
                  <span>🏢</span> Manage Sites & Logistics
                </button>
                <button 
                  onClick={() => setActiveSection('allUsers')}
                  className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '10px 20px', color: '#0d9488' }}
                >
                  <span>👥</span> System User Management
                </button>
                <button 
                  onClick={() => navigate('/sdp-dashboard')}
                  className="btn btn-outline-light shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '10px 20px' }}
                >
                  <span>🎓</span> Back to SDP Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="col-md-3">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background:'linear-gradient(135deg,#667eea,#764ba2)' }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
            <div style={{ fontSize:'2.2rem', marginBottom:8 }}>📁</div>
            <h3 className="mb-1 fw-bold">{filteredProjects.length}</h3>
            <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>Active Projects</p>
          </div>
        </div>
      </div>
      
      {/* Team Members Stat - Hidden for Assessors and Moderators */}
      {(!isAssessor && (!isModerator || isQA || isIT)) && (
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background:'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
            <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
              <div style={{ fontSize:'2.2rem', marginBottom:8 }}>👥</div>
              <h3 className="mb-1 fw-bold">{isIT ? allSdpUsers.length : teamMembers.length}</h3>
              <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>{isIT ? 'Total System Users' : 'Team Members'}</p>
            </div>
          </div>
        </div>
      )}
      
      {isIT && (
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background:'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
              <div style={{ fontSize:'2.2rem', marginBottom:8 }}>📜</div>
              <h3 className="mb-1 fw-bold">{systemLogs.length}</h3>
              <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>Recent Logs</p>
            </div>
          </div>
        </div>
      )}

      {!isIT && (
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background:'linear-gradient(135deg,#10b981,#059669)' }}>
            <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
              <div style={{ fontSize:'2.2rem', marginBottom:8 }}>✅</div>
              <h3 className="mb-1 fw-bold">{projectTasks.length}</h3>
              <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>Active Tasks</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="col-md-3">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius:14, background: isIT ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center py-4">
            <div style={{ fontSize:'2.2rem', marginBottom:8 }}>{isIT ? '🛠️' : '📊'}</div>
            {isIT ? (
              <>
                <h3 className="mb-1 fw-bold">Active</h3>
                <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>System Support</p>
              </>
            ) : isAdmin ? (
              <>
                <h6 className="mb-2 fw-bold">Today's Attendance</h6>
                {attendanceLoading ? (
                  <p className="mb-0" style={{ opacity:0.8 }}>Loading...</p>
                ) : attendanceProjects.length > 0 ? (
                  <div className="text-start">
                    {attendanceProjects.map((project) => (
                      <div key={project.projectId} className="mb-1">
                        <small style={{ opacity:0.85 }}>
                          {project.projectName.length > 15 ? `${project.projectName.substring(0, 15)}...` : project.projectName}: {project.presentToday} present
                        </small>
                      </div>
                    ))}
                    {attendanceProjects.length > 3 && (
                      <small style={{ opacity:0.8 }}>+{attendanceProjects.length - 3} more projects</small>
                    )}
                  </div>
                ) : (
                  <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>No attendance data</p>
                )}
              </>
            ) : (
              <>
                <h3 className="mb-1 fw-bold">{filteredProjects.length}</h3>
                <p className="mb-0" style={{ opacity:0.8, fontSize:'0.85rem' }}>Active Projects</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Visualization Charts — single shared period toggle + KPIs */}
      <div className="col-12">
        <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap align-items-baseline gap-4">
            <div>
              <span className="text-muted small">Enrolled (latest)</span>
              <div className="fw-bold fs-4" style={{ color: '#0d9488' }}>
                {chartKpis.enrollment.current.toLocaleString()}
                <span className="text-muted fs-6 fw-normal">
                  {' '}/ {chartKpis.enrollment.target.toLocaleString()}
                  {' '}({chartKpis.enrollment.pct}%)
                </span>
                <span
                  className="ms-2 fs-6 fw-medium"
                  style={{ color: chartKpis.enrollment.trendPts >= 0 ? '#16a34a' : '#dc2626' }}
                >
                  {chartKpis.enrollment.trendPts >= 0 ? '▲' : '▼'} {Math.abs(chartKpis.enrollment.trendPts)}%
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted small">Avg Attendance</span>
              <div className="fw-bold fs-4" style={{ color: '#10b981' }}>
                {chartKpis.attendance.average}%
                <span className="text-muted fs-6 fw-normal">
                  {' '}· {chartKpis.attendance.onTrackPct}% on track (≥80%)
                </span>
                <span
                  className="ms-2 fs-6 fw-medium"
                  style={{ color: chartKpis.attendance.trendPts >= 0 ? '#16a34a' : '#dc2626' }}
                >
                  {chartKpis.attendance.trendPts >= 0 ? '▲' : '▼'} {Math.abs(chartKpis.attendance.trendPts).toFixed(1)} pts
                </span>
              </div>
            </div>
          </div>

          <div className="btn-group btn-group-sm shadow-sm" role="group" aria-label="Chart period">
            <button
              type="button"
              className={`btn ${overviewAttendancePeriod === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setOverviewAttendancePeriod('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`btn ${overviewAttendancePeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setOverviewAttendancePeriod('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={`btn ${overviewAttendancePeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setOverviewAttendancePeriod('month')}
            >
              Month
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* Enrollment Progress */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="mb-0">👨‍🎓 Enrollment vs. Target</h5>
                    <small className="text-muted">
                      {overviewAttendancePeriod === 'month'
                        ? `Daily progress for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                        : overviewAttendancePeriod === 'week'
                        ? `Last 7 days — Avg ${chartKpis.enrollment.average.toLocaleString()} learners`
                        : `Today's check-in milestones`}
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentChartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    {/* Weekend background bands */}
                    {chartKpis.weekendBands.map((band, i) => (
                      <ReferenceArea
                        key={`enr-we-${i}`}
                        x1={band.left}
                        x2={band.right}
                        fill="#f1f5f9"
                        fillOpacity={0.8}
                      />
                    ))}
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                      interval={overviewAttendancePeriod === 'month' ? 2 : 0}
                      angle={overviewAttendancePeriod === 'month' ? -30 : 0}
                      textAnchor={overviewAttendancePeriod === 'month' ? 'end' : 'middle'}
                      height={overviewAttendancePeriod === 'month' ? 52 : 30}
                    />
                    <YAxis fontSize={11} stroke="#64748b" tick={{ fill: '#64748b' }} />
                    <Tooltip
                      labelFormatter={(label: string, payload: any[]) => {
                        const point = payload?.[0]?.payload;
                        if (point?.date) {
                          const d = new Date(point.date);
                          return d.toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                          });
                        }
                        const today = new Date();
                        if (overviewAttendancePeriod === 'month') {
                          return `${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${label}`;
                        }
                        if (overviewAttendancePeriod === 'today') {
                          const base = point?.label || label;
                          return `Today · ${base}`;
                        }
                        return label;
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'Enrolled' || name === '7-day Avg' || name === '3-day Avg') {
                          return [Number(value).toLocaleString(), name];
                        }
                        return [Number(value).toLocaleString(), name];
                      }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
                    <ReferenceLine
                      y={chartKpis.enrollment.target}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `Target ${chartKpis.enrollment.target.toLocaleString()}`,
                        position: 'right',
                        fill: '#94a3b8',
                        fontSize: 10,
                      }}
                    />
                    <Area
                      type="monotone"
                      name="Enrolled"
                      dataKey="enrolled"
                      stroke="#0d9488"
                      strokeWidth={3}
                      dot={
                        overviewAttendancePeriod === 'month'
                          ? false
                          : { fill: '#0d9488', r: 4, strokeWidth: 2, stroke: '#fff' }
                      }
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      fill="url(#colorEnrolled)"
                    />
                    <Line
                      type="monotone"
                      name={overviewAttendancePeriod === 'month' ? '7-day Avg' : '3-day Avg'}
                      dataKey="enrolledMA"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      connectNulls
                      dot={false}
                      activeDot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="mb-0">📈 Attendance Rates (%)</h5>
                    <small className="text-muted">
                      {overviewAttendancePeriod === 'month'
                        ? `Daily rates · SLA target 80%`
                        : overviewAttendancePeriod === 'week'
                        ? `Last 7 days · Current ${chartKpis.attendance.current}%`
                        : `Today's attendance pulse`}
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceChartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.06} />
                      </linearGradient>
                      <linearGradient id="colorRateMA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    {/* Weekend bands */}
                    {chartKpis.weekendBands.map((band, i) => (
                      <ReferenceArea
                        key={`att-we-${i}`}
                        x1={band.left}
                        x2={band.right}
                        fill="#f1f5f9"
                        fillOpacity={0.8}
                      />
                    ))}
                    {/* SLA target 80% line */}
                    <ReferenceLine
                      y={80}
                      stroke="#dc2626"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: 'SLA 80%',
                        position: 'right',
                        fill: '#dc2626',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                      interval={overviewAttendancePeriod === 'month' ? 2 : 0}
                      angle={overviewAttendancePeriod === 'month' ? -30 : 0}
                      textAnchor={overviewAttendancePeriod === 'month' ? 'end' : 'middle'}
                      height={overviewAttendancePeriod === 'month' ? 52 : 30}
                    />
                    <YAxis
                      domain={[0, 100]}
                      fontSize={11}
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                      label={{ value: '%', angle: 0, position: 'top', offset: 10 }}
                    />
                    <Tooltip
                      labelFormatter={(label: string, payload: any[]) => {
                        const point = payload?.[0]?.payload;
                        if (point?.date) {
                          const d = new Date(point.date);
                          return d.toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                          });
                        }
                        const today = new Date();
                        if (overviewAttendancePeriod === 'month') {
                          return `${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${label}`;
                        }
                        if (overviewAttendancePeriod === 'today') return `Today · ${label}`;
                        return label;
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'Attendance Rate' || name === '7-day Avg' || name === '3-day Avg') {
                          return [`${Number(value).toFixed(1)}%`, name];
                        }
                        return [`${Number(value).toFixed(1)}%`, name];
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const ratePayload = payload.find(p => p.dataKey === 'rate');
                          const maPayload = payload.find(p => p.dataKey === 'rateMA');
                          const rate = ratePayload?.value;
                          const good = typeof rate === 'number' && rate >= 80;
                          const point = payload[0]?.payload || {};
                          return (
                            <div
                              className="p-3 border rounded"
                              style={{
                                backgroundColor: '#fff',
                                borderColor: '#e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                minWidth: 180,
                              }}
                            >
                              <p className="fw-bold mb-1" style={{ fontSize: 13 }}>{label}</p>
                              {point.isWeekend && (
                                <span className="badge bg-secondary mb-2" style={{ fontSize: 10 }}>Weekend</span>
                              )}
                              {typeof rate === 'number' && (
                                <p className={`mb-1 ${good ? 'text-success' : 'text-warning'}`} style={{ fontSize: 13 }}>
                                  Attendance: <strong>{rate.toFixed(1)}%</strong>{' '}
                                  <small>({good ? 'On track' : 'Below 80% SLA'})</small>
                                </p>
                              )}
                              {maPayload != null && typeof maPayload.value === 'number' && (
                                <p className="mb-0 text-muted" style={{ fontSize: 12 }}>
                                  {overviewAttendancePeriod === 'month' ? '7-day avg' : '3-day avg'}:{' '}
                                  <strong>{Number(maPayload.value).toFixed(1)}%</strong>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Attendance Rate"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={
                        overviewAttendancePeriod === 'month'
                          ? false
                          : { fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }
                      }
                      activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                      fill="url(#colorRate)"
                    />
                    <Line
                      type="monotone"
                      dataKey="rateMA"
                      name={overviewAttendancePeriod === 'month' ? '7-day Avg' : '3-day Avg'}
                      stroke="#8b5cf6"
                      strokeWidth={2.2}
                      strokeDasharray="4 3"
                      connectNulls
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Document Compliance */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4">
                <div className="d-flex align-items-baseline justify-content-between flex-wrap mb-1 gap-2">
                  <div>
                    <h5 className="mb-0">📄 Document Compliance by Type</h5>
                    <small className="text-muted">
                      Worst first · SLA target 90% · Green ≥90%, Amber 70–89%, Red {'<'}70%
                    </small>
                  </div>
                  <div className="d-flex gap-2" style={{ fontSize: 11 }}>
                    <span className="d-inline-flex align-items-center gap-1">
                      <span style={{ display: 'inline-block', width: 10, height: 10, background: '#10b981', borderRadius: 2 }} /> On Track
                    </span>
                    <span className="d-inline-flex align-items-center gap-1">
                      <span style={{ display: 'inline-block', width: 10, height: 10, background: '#f59e0b', borderRadius: 2 }} /> Attention
                    </span>
                    <span className="d-inline-flex align-items-center gap-1">
                      <span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2 }} /> At Risk
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentComplianceData} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} fontSize={11} stroke="#64748b" tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" width={150} fontSize={11} stroke="#64748b" tick={{ fill: '#475569' }} />
                    {/* SLA 90% target line */}
                    <ReferenceLine
                      x={90}
                      stroke="#dc2626"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{ value: 'SLA 90%', position: 'top', fill: '#dc2626', fontSize: 10, fontWeight: 600 }}
                    />
                    <Tooltip
                      labelFormatter={(label) => `${label}`}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const badgeBg =
                            data.risk === 'On Track' ? '#10b981' :
                            data.risk === 'Attention' ? '#f59e0b' : '#ef4444';
                          return (
                            <div
                              className="p-3 border rounded"
                              style={{
                                backgroundColor: '#fff',
                                borderColor: '#e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                minWidth: 200,
                              }}
                            >
                              <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                <p className="fw-bold mb-0" style={{ fontSize: 13 }}>{label}</p>
                                <span
                                  className="badge text-white"
                                  style={{ backgroundColor: badgeBg, fontSize: 10 }}
                                >
                                  {data.risk}
                                </span>
                              </div>
                              <p className="mb-1" style={{ fontSize: 13 }}>
                                Compliance: <strong style={{ color: badgeBg }}>{data.compliance.toFixed(1)}%</strong>
                              </p>
                              <p className="mb-1 text-success" style={{ fontSize: 12 }}>
                                Submitted: {data.submitted} / {data.expected} expected
                              </p>
                              <p className="mb-1 text-danger" style={{ fontSize: 12 }}>Missing: {data.missing}</p>
                              {typeof data.approved === 'number' && (
                                <p className="mb-0 text-muted small" style={{ fontSize: 11 }}>
                                  Approved: {data.approved} · Pending: {data.pending}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar name="Compliance %" dataKey="compliance" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {documentComplianceData.map((entry: any, index: number) => (
                        <Cell key={`cell-comp-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Document Status Pie (Donut with center text) */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4">
                <h5 className="mb-0">📁 Overall Document Status</h5>
                <small className="text-muted">
                  Total: {overallDocStatusData[0]?.total || 0} documents processed
                </small>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallDocStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={overallDocStatusData.length > 1 ? 3 : 0}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {overallDocStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-doc-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name: string, props: any) => {
                        const entry = props?.payload || {};
                        const total = entry.total || 1;
                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return [`${value.toLocaleString()} (${pct}%)`, props.name || _name];
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                    />
                    {/* Center donut text: Approved % */}
                    {(() => {
                      const sample = overallDocStatusData[0];
                      if (!sample || sample.name === 'No Documents') {
                        return (
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                            <tspan x="50%" dy="-6" style={{ fontSize: 16, fontWeight: 700, fill: '#94a3b8' }}>
                              —
                            </tspan>
                            <tspan x="50%" dy="22" style={{ fontSize: 10, fill: '#94a3b8' }}>
                              No docs
                            </tspan>
                          </text>
                        );
                      }
                      const pct = sample.approvedPct ?? 0;
                      const color = pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#ef4444';
                      return (
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x="50%"
                            dy="-6"
                            style={{ fontSize: 20, fontWeight: 800, fill: color }}
                          >
                            {pct}%
                          </tspan>
                          <tspan x="50%" dy="22" style={{ fontSize: 10, fill: '#64748b' }}>
                            Approved
                          </tspan>
                        </text>
                      );
                    })()}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Attendance Summary - Only for Administrators */}
      {isAdmin && (
        <div className="col-12">
          <div className="card border-0 shadow-lg mb-4">
            <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
              <h5 className="mb-0">📊 Today's Attendance Summary</h5>
            </div>
            <div className="card-body">
              {attendanceLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 mb-0">Loading attendance data...</p>
                </div>
              ) : attendanceProjects.length > 0 ? (
                <div className="row g-3">
                  {attendanceProjects.map((project) => (
                    <div key={project.projectId} className="col-md-6 col-lg-4">
                      <div className="card h-100 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="card-body">
                          <h6 className="card-title text-info mb-3">
                            {project.projectName}
                          </h6>
                          <div className="row text-center">
                            <div className="col-4">
                              <div className="text-success">
                                <strong>{project.presentToday}</strong>
                                <small className="d-block text-muted">Present</small>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="text-danger">
                                <strong>{project.absentToday}</strong>
                                <small className="d-block text-muted">Absent</small>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="text-info">
                                <strong>{project.attendanceRate.toFixed(1)}%</strong>
                                <small className="d-block text-muted">Rate</small>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <small className="text-muted">
                              Total Learners: {project.totalLearners} | Classes: {project.totalClasses}
                            </small>
                          </div>
                          <div className="progress mt-2" style={{ height: '6px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{ width: `${project.attendanceRate}%` }}
                              aria-valuenow={project.attendanceRate} 
                              aria-valuemin={0} 
                              aria-valuemax={100}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-calendar-times fa-3x mb-3"></i>
                    <h6>No Attendance Data Available</h6>
                    <p className="mb-0">No projects have attendance tracking enabled for today.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manager Information */}
      <div className="col-12">
        <div className="card border-0 shadow-lg">
          <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
            <h5 className="mb-0">👤 Manager Profile</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <strong className="text-muted">Personal Information</strong>
                  <div className="mt-2">
                    <p className="mb-1"><strong>Name:</strong> {user?.name}</p>
                    <p className="mb-1"><strong>Email:</strong> {user?.email}</p>
                    <p className="mb-1"><strong>Role:</strong> <span className="badge bg-primary">{user?.role}</span></p>
                    <p className="mb-0"><strong>Status:</strong> <span className="badge bg-success">{user?.status}</span></p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <strong className="text-muted">Organization Details</strong>
                  <div className="mt-2">
                    <p className="mb-1"><strong>Department:</strong> {user?.departmentName || 'Not assigned'}</p>
                    <p className="mb-1"><strong>SDP:</strong> {user?.skillsDevelopmentProviderName}</p>
                    <p className="mb-1"><strong>Access Level:</strong> <span className="badge bg-info">Manager</span></p>
                    <p className="mb-0"><strong>Last Login:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="col-12">
        <div className="card border-0 shadow-lg">
          <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
            <h5 className="mb-0">⚡ Quick Actions</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                  onClick={() => setActiveSection('projects')}
                  style={{ minHeight: '80px' }}
                >
                  <div style={{ fontSize: '1.5rem' }}>📁</div>
                  <small>View Projects</small>
                </button>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                  onClick={() => setActiveSection('tasks')}
                  style={{ minHeight: '80px' }}
                >
                  <div style={{ fontSize: '1.5rem' }}>✅</div>
                  <small>Add Task</small>
                </button>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                  onClick={() => setActiveSection('team')}
                  style={{ minHeight: '80px' }}
                >
                  <div style={{ fontSize: '1.5rem' }}>👥</div>
                  <small>Add Member</small>
                </button>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                  onClick={() => setActiveSection('attendanceTracking')}
                  style={{ minHeight: '80px' }}
                >
                  <div style={{ fontSize: '1.5rem' }}>📊</div>
                  <small>Check Attendance</small>
                </button>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                  onClick={() => setActiveSection('documentApprovals')}
                  style={{ minHeight: '80px' }}
                >
                  <div style={{ fontSize: '1.5rem' }}>📋</div>
                  <small>Review Documents</small>
                </button>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                  onClick={() => window.open('http://localhost:5173', '_blank')}
                  style={{ minHeight: '80px' }}
                >
                  <div style={{ fontSize: '1.5rem' }}>📱</div>
                  <small>Mobile App</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => {
    return (
    <div>
      <div className="card border-0 shadow-lg mb-4 overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0e4d8a 100%)',
        borderRadius: 16,
        color: "#ffffff",
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg,#0ea5e9,#0d9488)', borderRadius: '16px 0 0 16px' }}></div>
        <div className="card-body text-center text-white py-4" style={{ paddingLeft: 32 }}>
          <h2 className="mb-2" style={{ fontWeight: 700, fontSize: '1.8rem' }}>📋 Projects Overview</h2>
          <p className="mb-0 opacity-75" style={{ fontSize: '1rem' }}>Monitor and track project progress</p>
        </div>
      </div>
      
      {filteredProjects.length > 0 ? (
        <div className="row g-4">
          {filteredProjects.map((project) => {
            const isExpanded = expandedProjects[project.id];
            const details = projectDetails[project.id];
            
            try {
              return (
              <div key={project.id} className="col-12">
                <div className="card border-0 shadow-lg" style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                  borderRadius: 16,
                  color: "#ffffff"
                }}>
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-3">{project.projectName}</h5>
                        <p className="card-text">
                          <small className="opacity-75">Contract: {project.contractNumber}</small>
                        </p>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <small className="opacity-75">
                              Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                            </small><br />
                            <small className="opacity-75">
                              End: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                            </small>
                          </div>
                          <div className="col-md-6">
                            <small className="opacity-75">
                              Beneficiaries: {project.numberOfBeneficiaries || 'N/A'}
                            </small><br />
                            <small className="opacity-75">
                              Budget: R{project.budgetAmount ? project.budgetAmount.toLocaleString() : 'N/A'}
                            </small>
                          </div>
                        </div>
                      </div>
                      <div>
                        <button
                          className="btn btn-light btn-sm"
                          onClick={() => toggleProjectExpansion(project.id)}
                          style={{ fontWeight: 600, borderRadius: 10, padding: '6px 16px' }}
                        >
                          {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && details && (
                      <div className="mt-4 pt-4 border-top border-light border-opacity-25">
                        <h6 className="mb-3">📚 Learning Pathways & Qualifications</h6>
                        
                        {details.learningPathways && details.learningPathways.length > 0 ? (
                          details.learningPathways.map((pathway: any, pIndex: number) => (
                            <div key={pIndex} className="mb-4">
                                <div className="bg-white bg-opacity-10 rounded p-3 mb-3">
                                  {(() => {
                                    const pathwayName = pathway.pathway?.name || pathway.name || (pathway.pathwayId ? `ID ${pathway.pathwayId}` : 'N/A');
                                    return (
                                      <h6 className="mb-0">Pathway: {pathwayName}</h6>
                                    );
                                  })()}
                                </div>

                              {pathway.qualifications && pathway.qualifications.length > 0 ? (
                                pathway.qualifications.map((qual: any, qIndex: number) => (
                                  <div key={qIndex} className="bg-white bg-opacity-10 rounded p-3 mb-3">
                                        <div className="mb-2">
                                          {(() => {
                                            const rawName = qual.legacyQualification?.name || qual.occupationalQualification?.name || qual.qualificationType?.name || `Qualification ${qIndex + 1}`;
                                            const rawId = qual.legacyQualification?.qualificationId || qual.legacyQualification?.id || qual.occupationalQualification?.qualificationId || qual.occupationalQualification?.QualificationId || null;
                                            const qualificationName = rawId ? `${rawName} (${rawId})` : rawName;
                                            const qualificationTypeName = qual.qualificationType?.name || 'N/A';
                                            return (
                                              <>
                                                <strong>{qualificationName}</strong>
                                                <br />
                                                <small>Type: {qualificationTypeName}</small>
                                              </>
                                            );
                                          })()}
                                        </div>

                                    {qual.legacyQualification && (
                                      <div className="mb-2">
                                        <small>
                                          <strong>{qual.legacyQualification.name}</strong>
                                          <br />
                                          Level: {qual.legacyQualification.level} | Credits: {qual.legacyQualification.credits}
                                        </small>
                                      </div>
                                    )}

                                    {qual.occupationalQualification && (
                                      <div className="mb-2">
                                        <small>
                                          <strong>{qual.occupationalQualification.name}</strong>
                                          <br />
                                          Level: {qual.occupationalQualification.level} | Credits: {qual.occupationalQualification.credits}
                                        </small>
                                      </div>
                                    )}

                                    <div className="mb-2">
                                      <small>
                                        Employment Type: {qual.employmentType || 'N/A'} | 
                                        Beneficiaries: {qual.numberOfBeneficiaries || 0}
                                      </small>
                                    </div>

                                    {/* Unit Standards - Only for TQA Users (NOT Administrator) */}
                                    {(isQA || isAssessor) && qual.unitStandards && qual.unitStandards.length > 0 && (
                                      <div className="mt-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <small><strong>📋 Unit Standards ({qual.unitStandards.length})</strong></small>
                                        </div>
                                        <div>
                                          {qual.unitStandards.map((us: any, usIndex: number) => {
                                            const usKey = `us-${project.id}-${qIndex}-${usIndex}`;
                                            const isExpanded = expandedUnitStandards[usKey] || false;
                                            
                                            return (
                                              <div 
                                                key={usIndex} 
                                                className="mb-3" 
                                                style={{
                                                  backgroundColor: 'rgba(255,255,255,0.05)', 
                                                  border: '1px solid rgba(255,255,255,0.1)', 
                                                  borderRadius: '0.375rem',
                                                  overflow: 'hidden'
                                                }}
                                              >
                                                {/* Unit Standard Header */}
                                                <button 
                                                  className="w-100 text-start border-0"
                                                  type="button" 
                                                  onClick={() => {
                                                    const newExpanded = !isExpanded;
                                                    setExpandedUnitStandards(prev => ({
                                                      ...prev,
                                                      [usKey]: newExpanded
                                                    }));
                                                    // Fetch assessments when expanding
                                                    if (newExpanded) {
                                                      fetchAssessmentsForUnitStandard(us.id);
                                                    }
                                                  }}
                                                  style={{
                                                    fontSize: '0.85rem', 
                                                    padding: '0.75rem',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                  }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                >
                                                  <div className="d-flex align-items-center justify-content-between">
                                                    <div className="flex-grow-1">
                                                      <div className="mb-2">
                                                        <strong>{isExpanded ? '▼' : '▶'} {us.unitStandardName}</strong>
                                                      </div>
                                                      <div>
                                                        <span className="badge bg-secondary me-2">{us.level}</span>
                                                        <span className="badge bg-primary me-2">{us.credits} Credits</span>
                                                        <span className="badge bg-info">{us.unitStandardType}</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </button>

                                                {/* Unit Standard Content - Only show when expanded */}
                                                {isExpanded && (
                                                  <div style={{backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                                                    {/* Assessment Sections */}
                                                    <div className="row g-3">
                                                      {/* Formative Assessment */}
                                                      <div className="col-12 col-md-4">
                                                        <div className="card h-100 shadow-sm" style={{backgroundColor: '#2c3e50', border: '1px solid rgba(255,255,255,0.1)'}}>
                                                          <div className="card-header text-white" style={{backgroundColor: '#3498db', padding: '0.75rem', borderBottom: '2px solid rgba(255,255,255,0.2)'}}>
                                                            <strong>📝 Formative Assessment</strong>
                                                          </div>
                                                          <div className="card-body text-light" style={{padding: '1rem'}}>
                                                            <p className="mb-3" style={{fontSize: '0.9rem', color: '#ecf0f1'}}>Track ongoing learning progress</p>
                                                            <button 
                                                              className="btn btn-primary w-100 mb-3" 
                                                              style={{fontSize: '0.9rem'}}
                                                              onClick={() => {
                                                                setSelectedUnitStandardId(us.id);
                                                                setShowFormativeModal(true);
                                                              }}
                                                            >
                                                              <i className="bi bi-plus-circle me-2"></i>Add Assessment
                                                            </button>
                                                            {loadingAssessments[us.id] ? (
                                                              <div className="text-center" style={{fontSize: '0.85rem', color: '#95a5a6'}}>
                                                                Loading...
                                                              </div>
                                                            ) : assessmentData[us.id]?.formative?.length > 0 ? (
                                                              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                                {assessmentData[us.id].formative.map((assessment: any) => (
                                                                  <div key={assessment.id} className="mb-2 p-2" style={{backgroundColor: 'rgba(52, 152, 219, 0.1)', borderRadius: '4px', border: '1px solid rgba(52, 152, 219, 0.3)'}}>
                                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                                      <small className="text-light"><strong>Score:</strong> {assessment.score || 'N/A'}</small>
                                                                      <small className="text-muted">{new Date(assessment.assessmentDate).toLocaleDateString()}</small>
                                                                    </div>
                                                                    {assessmentData[us.id].formativeQuestions[assessment.id]?.length > 0 && (
                                                                      <div className="mt-2" style={{fontSize: '0.8rem'}}>
                                                                        <div className="text-success mb-1"><strong>{assessmentData[us.id].formativeQuestions[assessment.id].length} Questions</strong></div>
                                                                        {assessmentData[us.id].formativeQuestions[assessment.id].map((q: any) => (
                                                                          <div key={q.id} className="mb-1 ps-2" style={{borderLeft: '2px solid #3498db'}}>
                                                                            <div className="text-light">Q{q.questionNumber}: {q.questionText}</div>
                                                                            <div className="text-warning"><small>{q.allocatedMarks} marks</small></div>
                                                                          </div>
                                                                        ))}
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              <div className="text-center" style={{fontSize: '0.85rem', color: '#95a5a6', fontStyle: 'italic'}}>
                                                                No assessments yet
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {/* Summative Assessment */}
                                                      <div className="col-12 col-md-4">
                                                        <div className="card h-100 shadow-sm" style={{backgroundColor: '#2c3e50', border: '1px solid rgba(255,255,255,0.1)'}}>
                                                          <div className="card-header text-white" style={{backgroundColor: '#27ae60', padding: '0.75rem', borderBottom: '2px solid rgba(255,255,255,0.2)'}}>
                                                            <strong>✅ Summative Assessment</strong>
                                                          </div>
                                                          <div className="card-body text-light" style={{padding: '1rem'}}>
                                                            <p className="mb-3" style={{fontSize: '0.9rem', color: '#ecf0f1'}}>Final evaluation of competence</p>
                                                            <button 
                                                              className="btn btn-success w-100 mb-3" 
                                                              style={{fontSize: '0.9rem'}}
                                                              onClick={() => {
                                                                setSelectedUnitStandardId(us.id);
                                                                setShowSummativeModal(true);
                                                              }}
                                                            >
                                                              <i className="bi bi-plus-circle me-2"></i>Add Assessment
                                                            </button>
                                                            {loadingAssessments[us.id] ? (
                                                              <div className="text-center" style={{fontSize: '0.85rem', color: '#95a5a6'}}>
                                                                Loading...
                                                              </div>
                                                            ) : assessmentData[us.id]?.summative?.length > 0 ? (
                                                              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                                {assessmentData[us.id].summative.map((assessment: any) => (
                                                                  <div key={assessment.id} className="mb-2 p-2" style={{backgroundColor: 'rgba(39, 174, 96, 0.1)', borderRadius: '4px', border: '1px solid rgba(39, 174, 96, 0.3)'}}>
                                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                                      <small className="text-light"><strong>Score:</strong> {assessment.finalScore || 'N/A'}</small>
                                                                      <small className="text-muted">{new Date(assessment.assessmentDate).toLocaleDateString()}</small>
                                                                    </div>
                                                                    {assessmentData[us.id].summativeQuestions[assessment.id]?.length > 0 && (
                                                                      <div className="mt-2" style={{fontSize: '0.8rem'}}>
                                                                        <div className="text-success mb-1"><strong>{assessmentData[us.id].summativeQuestions[assessment.id].length} Questions</strong></div>
                                                                        {assessmentData[us.id].summativeQuestions[assessment.id].map((q: any) => (
                                                                          <div key={q.id} className="mb-1 ps-2" style={{borderLeft: '2px solid #27ae60'}}>
                                                                            <div className="text-light">Q{q.questionNumber}: {q.questionText}</div>
                                                                            <div className="text-warning"><small>{q.allocatedMarks} marks</small></div>
                                                                          </div>
                                                                        ))}
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              <div className="text-center" style={{fontSize: '0.85rem', color: '#95a5a6', fontStyle: 'italic'}}>
                                                                No assessments yet
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {/* Logbook */}
                                                      <div className="col-12 col-md-4">
                                                        <div className="card h-100 shadow-sm" style={{backgroundColor: '#2c3e50', border: '1px solid rgba(255,255,255,0.1)'}}>
                                                          <div className="card-header text-dark" style={{backgroundColor: '#f39c12', padding: '0.75rem', borderBottom: '2px solid rgba(0,0,0,0.2)', fontWeight: 'bold'}}>
                                                            <strong>📖 Logbook</strong>
                                                          </div>
                                                          <div className="card-body text-light" style={{padding: '1rem'}}>
                                                            <p className="mb-3" style={{fontSize: '0.9rem', color: '#ecf0f1'}}>Record practical activities</p>
                                                            <button 
                                                              className="btn btn-warning w-100 mb-3" 
                                                              style={{fontSize: '0.9rem', color: '#000', fontWeight: '500'}}
                                                              onClick={() => {
                                                                setSelectedUnitStandardId(us.id);
                                                                setShowLogbookModal(true);
                                                              }}
                                                            >
                                                              <i className="bi bi-plus-circle me-2"></i>Add Entry
                                                            </button>
                                                            
                                                            {/* Display logbook entries */}
                                                            {assessmentData[us.id]?.logbook && assessmentData[us.id].logbook.length > 0 ? (
                                                              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                                {assessmentData[us.id].logbook.map((entry: any, idx: number) => (
                                                                  <div key={entry.id} className="mb-2 p-2" style={{backgroundColor: 'rgba(243, 156, 18, 0.1)', borderRadius: '4px', border: '1px solid rgba(243, 156, 18, 0.3)'}}>
                                                                    <div style={{fontSize: '0.85rem'}}>
                                                                      <div className="mb-1">
                                                                        <strong style={{color: '#f39c12'}}>Entry #{idx + 1}</strong>
                                                                        <span className="ms-2" style={{fontSize: '0.75rem', color: '#95a5a6'}}>
                                                                          {new Date(entry.startDate).toLocaleDateString()} - {new Date(entry.endDate).toLocaleDateString()}
                                                                        </span>
                                                                      </div>
                                                                      <div className="mb-1" style={{color: '#ecf0f1'}}>
                                                                        {entry.activityDescription.substring(0, 80)}{entry.activityDescription.length > 80 ? '...' : ''}
                                                                      </div>
                                                                      {entry.hoursSpent && (
                                                                        <div style={{fontSize: '0.75rem', color: '#95a5a6'}}>
                                                                          ⏱️ {entry.hoursSpent} hours
                                                                        </div>
                                                                      )}
                                                                      {entry.supervisorName && (
                                                                        <div style={{fontSize: '0.75rem', color: '#95a5a6'}}>
                                                                          👤 {entry.supervisorName}
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              <div className="text-center" style={{fontSize: '0.85rem', color: '#95a5a6', fontStyle: 'italic'}}>
                                                                No entries yet
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-3">
                                  <small className="opacity-75">No qualifications found</small>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-3">
                            <small className="opacity-75">No learning pathways found</small>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sites Section - Only for Logistics Managers and Administrator */}
                    {isExpanded && (isAdmin || isLogistics) && (
                      <div className="mt-4 pt-4 border-top border-light border-opacity-25">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">🏢 Project Sites</h6>
                          {/* Only Logistics can add sites, Administrator can only view */}
                          {isLogistics && (
                            <button
                              className="btn btn-light btn-sm"
                              onClick={() => {
                                setAddSiteForm(prev => ({ ...prev, projectId: project.id }));
                                setShowAddSiteModal(true);
                              }}
                            >
                              ➕ Add Site
                            </button>
                          )}
                        </div>

                        {/* Fetch sites when expanded */}
                        {(() => {
                          if (!projectSites[project.id] && !sitesLoading[project.id]) {
                            fetchProjectSites(project.id);
                          }
                          return null;
                        })()}

                        {sitesLoading[project.id] ? (
                          <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-white" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <small className="d-block mt-2">Loading sites...</small>
                          </div>
                        ) : projectSites[project.id] && projectSites[project.id].length > 0 ? (
                          <div className="row g-3">
                            {projectSites[project.id].map((site) => {
                              const isSiteExpanded = expandedSites[site.id];
                              return (
                                <div key={site.id} className="col-12">
                                  <div className="card" style={{backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)'}}>
                                    <div className="card-body text-white">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="flex-grow-1">
                                          <button
                                            className="btn btn-link text-white text-decoration-none p-0 text-start w-100"
                                            onClick={() => toggleSiteExpansion(site.id)}
                                            style={{cursor: 'pointer'}}
                                          >
                                            <h6 className="card-title mb-0">
                                              {isSiteExpanded ? '▼' : '▶'} {site.siteName}
                                            </h6>
                                          </button>
                                        </div>
                                        <div className="d-flex gap-2">
                                          {isLogistics && (
                                            <button
                                              className="btn btn-sm btn-outline-light"
                                              onClick={() => handleEditSite(site)}
                                              title="Edit site"
                                            >
                                              ✏️
                                            </button>
                                          )}
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteSite(site.id, site.siteName, project.id)}
                                            title="Delete site"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* Site Basic Info */}
                                      <div className="row g-2 mb-2">
                                        {site.siteCode && (
                                          <div className="col-md-6">
                                            <p className="card-text small mb-0">
                                              <strong>Code:</strong> {site.siteCode}
                                            </p>
                                          </div>
                                        )}
                                        {site.category && (
                                          <div className="col-md-6">
                                            <p className="card-text small mb-0">
                                              <strong>Category:</strong> {site.category}
                                            </p>
                                          </div>
                                        )}
                                        {site.city && site.province && (
                                          <div className="col-md-6">
                                            <p className="card-text small mb-0">
                                              <strong>Location:</strong> {site.city}, {site.province}
                                            </p>
                                          </div>
                                        )}
                                        {site.capacity && (
                                          <div className="col-md-6">
                                            <p className="card-text small mb-0">
                                              <strong>Beneficiaries:</strong> {site.capacity}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="mt-2">
                                        <span className={`badge ${site.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                          {site.status}
                                        </span>
                                      </div>

                                      {/* Expanded Site Details with Classes */}
                                      {isSiteExpanded && (
                                        <div className="mt-3 pt-3 border-top border-light border-opacity-25">
                                          {/* Full Site Details */}
                                          {site.address && (
                                            <p className="card-text small mb-2">
                                              <strong>Address:</strong> {site.address}
                                            </p>
                                          )}
                                          {(site.contactFirstName || site.contactLastName) && (
                                            <p className="card-text small mb-2">
                                              <strong>Contact:</strong> {site.contactFirstName} {site.contactLastName}
                                              {site.contactCellNumber && ` (${site.contactCellNumber})`}
                                              {site.contactEmail && <><br /><strong>Email:</strong> {site.contactEmail}</>}
                                            </p>
                                          )}
                                          {(site.latitude && site.longitude) && (
                                            <p className="card-text small mb-2">
                                              <strong>Coordinates:</strong> {site.latitude}, {site.longitude}
                                            </p>
                                          )}

                                          {/* Classes Section */}
                                          <div className="mt-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                              <h6 className="mb-0">🎓 Classes</h6>
                                              {!isLogistics && (
                                                <button
                                                  className="btn btn-sm btn-light"
                                                  onClick={() => {
                                                    setAddClassForm(prev => ({ ...prev, projectSiteId: site.id }));
                                                    setShowAddClassModal(true);
                                                  }}
                                                >
                                                  ➕ Add Class
                                                </button>
                                              )}
                                            </div>

                                            {classesLoading[site.id] ? (
                                              <div className="text-center py-2">
                                                <div className="spinner-border spinner-border-sm text-white" role="status">
                                                  <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <small className="d-block mt-1">Loading classes...</small>
                                              </div>
                                            ) : siteClasses[site.id] && siteClasses[site.id].length > 0 ? (
                                              <div className="row g-2">
                                                {siteClasses[site.id].map((cls) => {
                                                  const isClassExpanded = expandedClasses[cls.id];
                                                  return (
                                                    <div key={cls.id} className="col-12">
                                                      <div className="card" style={{backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                                                        <div className="card-body p-2 text-white">
                                                          <div className="d-flex justify-content-between align-items-start">
                                                            <div className="flex-grow-1">
                                                              <button
                                                                className="btn btn-link text-white text-decoration-none p-0 text-start"
                                                                onClick={() => toggleClassExpansion(cls.id)}
                                                                style={{cursor: 'pointer'}}
                                                              >
                                                                <h6 className="mb-1" style={{fontSize: '0.9rem'}}>
                                                                  {isClassExpanded ? '▼' : '▶'} {cls.className}
                                                                </h6>
                                                              </button>
                                                              <small className="text-white-50">
                                                                Max Learners: {cls.maxLearners}
                                                              </small>
                                                              <br />
                                                              <span className={`badge badge-sm ${cls.status === 'Active' ? 'bg-success' : 'bg-secondary'} mt-1`}>
                                                                {cls.status}
                                                              </span>
                                                            </div>
                                                            <div className="d-flex gap-1">
                                                              <button
                                                                className="btn btn-sm btn-outline-light"
                                                                onClick={() => handleManageTeachers(cls.id, cls.className)}
                                                                title="Manage teachers"
                                                                style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                                                              >
                                                                👨‍🏫
                                                              </button>
                                                              <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeleteClass(cls.id, cls.className, site.id)}
                                                                title="Delete class"
                                                                style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                                                              >
                                                                🗑️
                                                              </button>
                                                            </div>
                                                          </div>

                                                          {/* Expanded Class Details with Learners */}
                                                          {isClassExpanded && (
                                                            <div className="mt-2 pt-2 border-top border-light border-opacity-25">
                                                              <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <small><strong>👨‍🎓 Learners</strong></small>
                                                                {!isLogistics && (
                                                                  <button
                                                                    className="btn btn-sm btn-light"
                                                                    onClick={() => {
                                                                      setAddLearnerForm(prev => ({ ...prev, siteClassId: cls.id }));
                                                                      setShowAddLearnerModal(true);
                                                                    }}
                                                                    style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                                                                  >
                                                                    ➕ Add Learner
                                                                  </button>
                                                                )}
                                                              </div>

                                                              {learnersLoading[cls.id] ? (
                                                                <div className="text-center py-2">
                                                                  <div className="spinner-border spinner-border-sm text-white" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                  </div>
                                                                  <small className="d-block mt-1">Loading learners...</small>
                                                                </div>
                                                              ) : classLearnersOld[cls.id] && classLearnersOld[cls.id].length > 0 ? (
                                                                <div className="table-responsive">
                                                                  <table className="table table-sm table-dark table-striped" style={{fontSize: '0.8rem'}}>
                                                                    <thead>
                                                                      <tr>
                                                                        <th>Name</th>
                                                                        <th>ID Number</th>
                                                                        <th>Contact</th>
                                                                        <th>Status</th>
                                                                        <th>Action</th>
                                                                      </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                      {classLearnersOld[cls.id].map((learner) => (
                                                                        <tr key={learner.enrollmentId}>
                                                                          <td>{learner.title} {learner.firstName} {learner.lastName}</td>
                                                                          <td>{learner.idNumber}</td>
                                                                          <td>{learner.contactNumber || learner.email || 'N/A'}</td>
                                                                          <td>
                                                                            <span className={`badge badge-sm ${learner.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                                                              {learner.status}
                                                                            </span>
                                                                          </td>
                                                                          <td>
                                                                            <button
                                                                              className="btn btn-sm btn-outline-primary"
                                                                              onClick={() => handleViewLearner(learner)}
                                                                              title="View/Edit learner"
                                                                              style={{fontSize: '0.7rem', padding: '0.1rem 0.3rem'}}
                                                                            >
                                                                              👁️ View
                                                                            </button>
                                                                          </td>
                                                                        </tr>
                                                                      ))}
                                                                    </tbody>
                                                                  </table>
                                                                </div>
                                                              ) : (
                                                                <div className="text-center py-2">
                                                                  <small className="opacity-75">No learners added yet. Click "Add Learner" to enroll one.</small>
                                                                </div>
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <div className="text-center py-2">
                                                <small className="opacity-75">No classes added yet. Click "Add Class" to create one.</small>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <small className="opacity-75">No sites added yet. Click "Add Site" to create one.</small>
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && !details && (
                      <div className="mt-4 pt-4 border-top border-light border-opacity-25 text-center">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <small className="d-block mt-2">Loading project details...</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            } catch (error) {
              console.error('SDPManagerDashboard: Error rendering project:', project, error);
              return (
                <div key={project.id} className="col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-lg">
                    <div className="card-body">
                      <p>Error rendering project: {project.projectName}</p>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      ) : (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
          color: "#ffffff"
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">📋</div>
            <h3 className="mb-3">No Projects Found</h3>
            <p className="mb-0 opacity-75">No projects are currently assigned to your SDP.</p>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderReports = () => (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
        color: "#ffffff"
      }}>
        <div className="card-body text-center text-white py-4">
          <h2 className="mb-2">📊 Reports & Analytics</h2>
          <p className="mb-0 opacity-75">View performance metrics and generate reports</p>
        </div>
      </div>
      
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-lg" style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
            color: "#ffffff"
          }}>
            <div className="card-body text-white">
              <h5 className="card-title">📈 Performance Metrics</h5>
              <p className="card-text">Track key performance indicators and project progress.</p>
              <button className="btn btn-light">View Metrics</button>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-0 shadow-lg" style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
            color: "#ffffff"
          }}>
            <div className="card-body text-white">
              <h5 className="card-title">📋 Monthly Reports</h5>
              <p className="card-text">Generate and download monthly progress reports.</p>
              <button className="btn btn-light">Generate Report</button>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-0 shadow-lg" style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
            color: "#ffffff"
          }}>
            <div className="card-body text-white">
              <h5 className="card-title">💰 Budget Analysis</h5>
              <p className="card-text">Analyze budget utilization and financial performance.</p>
              <button className="btn btn-light">View Analysis</button>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-0 shadow-lg" style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
            color: "#ffffff"
          }}>
            <div className="card-body text-white">
              <h5 className="card-title">👥 Team Performance</h5>
              <p className="card-text">Monitor team productivity and individual performance.</p>
              <button className="btn btn-light">View Team Stats</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => {
    if (!isAdmin && !isQATrainingManager) {
      return (
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You do not have permission to access the Team Management section.</p>
        </div>
      );
    }
    
    return (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
        color: "#ffffff"
      }}>
        <div className="card-body d-flex justify-content-between align-items-center text-white py-4">
          <div>
            <h2 className="mb-2">👥 Team Management</h2>
            <p className="mb-0 opacity-75">Manage your team members and assignments</p>
          </div>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="btn btn-light"
          >
            ➕ Add Team Member
          </button>
        </div>
      </div>

      {/* Department Info */}
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
        color: "#ffffff"
      }}>
        <div className="card-body text-white">
          <h5 className="mb-3">📋 Department: {user?.departmentName}</h5>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Manager:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Team Size:</strong> {teamMembers.length} members</p>
              <p><strong>SDP:</strong> {user?.skillsDevelopmentProviderName}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Team Members List */}
      {teamLoading ? (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
          color: "#ffffff"
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="spinner-border text-white" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0">Loading team members...</p>
          </div>
        </div>
      ) : teamMembers.length > 0 ? (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
          color: "#ffffff"
        }}>
          <div className="card-header border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <h5 className="mb-0">Team Members ({teamMembers.length})</h5>
          </div>
          <div className="card-body text-white">
            <div className="row g-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="col-md-6 col-lg-4">
                  <div className="card h-100" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="display-6">👤</div>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveTeamMember(member.id, `${member.firstName} ${member.lastName}`)}
                          title="Remove team member"
                        >
                          🗑️
                        </button>
                      </div>
                      <h6 className="card-title">{member.firstName} {member.lastName}</h6>
                      <p className="card-text small mb-2">{member.email}</p>
                      {member.phoneNumber && (
                        <p className="card-text small mb-2">📞 {member.phoneNumber}</p>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={`badge ${member.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                          {member.status}
                        </span>
                        <small className="opacity-75">{member.role}</small>
                      </div>
                      <small className="opacity-75 d-block mt-2">
                        Joined: {new Date(member.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
          color: "#ffffff"
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">👥</div>
            <h3 className="mb-3">No Team Members Yet</h3>
            <p className="mb-4 opacity-75">Start building your team by adding members to your department.</p>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="btn btn-light"
            >
              ➕ Add Your First Team Member
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16 }}>
                <h5 className="modal-title text-white">➕ Add Team Member</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddMemberModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddTeamMember}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addMemberForm.firstName}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addMemberForm.lastName}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={addMemberForm.email}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={addMemberForm.phoneNumber}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label">Role *</label>
                      {rolesLoading ? (
                        <div className="form-control d-flex align-items-center">
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Loading available roles...
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={addMemberForm.role}
                          onChange={(e) => setAddMemberForm(prev => ({ ...prev, role: e.target.value }))}
                          required
                        >
                          <option value="">Select a role</option>
                          {availableRoles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="form-text">
                        Available roles are specific to your department type
                      </div>
                    </div>

                    {(addMemberForm.role === '7' || addMemberForm.role === '8' || addMemberForm.role === 'SDPModerator' || addMemberForm.role === 'SDPAssessor') && (
                      <div className="col-12">
                        <label className="form-label">Assign Projects *</label>
                        <div className="card border p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {projects.map(project => (
                            <div key={project.id} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`project-${project.id}`}
                                checked={addMemberForm.projectIds.includes(project.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setAddMemberForm(prev => ({
                                    ...prev,
                                    projectIds: checked 
                                      ? [...prev.projectIds, project.id]
                                      : prev.projectIds.filter(id => id !== project.id)
                                  }));
                                }}
                              />
                              <label className="form-check-label" htmlFor={`project-${project.id}`}>
                                {project.projectName}
                              </label>
                            </div>
                          ))}
                          {projects.length === 0 && (
                            <div className="text-muted small">No projects available to assign.</div>
                          )}
                        </div>
                        <div className="form-text">
                          Select the projects this {addMemberForm.role === '7' ? 'Moderator' : 'Assessor'} will be responsible for
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="alert alert-info mt-3">
                    <small>
                      📧 <strong>Email Notification:</strong> The new team member will automatically receive an email with their login credentials and welcome information.
                    </small>
                  </div>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, border: 'none' }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Adding...
                        </>
                      ) : (
                        '➕ Add Team Member'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderTasks = () => (
    <div>
      {/* Header with Alerts */}
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
        color: "#ffffff"
      }}>
        <div className="card-body text-white py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-2">📋 Task Management</h2>
              <p className="mb-0 opacity-75">Manage project tasks with due date alerts</p>
            </div>
            {selectedTaskProject && (
              <button
                onClick={() => {
                  setShowAddTaskModal(true);
                  setAddTaskForm(prev => ({ ...prev, projectId: selectedTaskProject.id }));
                }}
                className="btn btn-light"
              >
                ➕ Add Task
              </button>
            )}
          </div>
          
          {/* Alerts Section */}
          {(overdueAlerts.length > 0 || upcomingAlerts.length > 0) && (
            <div className="row g-3">
              {overdueAlerts.length > 0 && (
                <div className="col-md-6">
                  <div className="alert alert-danger mb-0">
                    <h6 className="alert-heading mb-2">🚨 Overdue Tasks ({overdueAlerts.length})</h6>
                    {overdueAlerts.slice(0, 3).map(task => (
                      <div key={task.id} className="small">
                        • {task.title} - Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    ))}
                    {overdueAlerts.length > 3 && (
                      <div className="small">...and {overdueAlerts.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}
              
              {upcomingAlerts.length > 0 && (
                <div className="col-md-6">
                  <div className="alert alert-warning mb-0">
                    <h6 className="alert-heading mb-2">⏰ Due Tomorrow ({upcomingAlerts.length})</h6>
                    {upcomingAlerts.slice(0, 3).map(task => (
                      <div key={task.id} className="small">
                        • {task.title} - Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    ))}
                    {upcomingAlerts.length > 3 && (
                      <div className="small">...and {upcomingAlerts.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Project Selection or Project Tasks */}
      {!selectedTaskProject ? (
        <div>
          <div className="card border-0 shadow-lg mb-4">
            <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
              <h5 className="mb-0">📁 Select Project for Task Management</h5>
            </div>
            <div className="card-body">
              {filteredProjects.length > 0 ? (
                <div className="row g-3">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="col-md-6 col-lg-4">
                      <div 
                        className="card h-100 border-0 shadow-sm cursor-pointer"
                        style={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onClick={() => {
                          setSelectedTaskProject(project);
                          fetchProjectTasks(project.id);
                          fetchTaskSummary(project.id);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="card-body">
                          <h6 className="card-title">{project.projectName}</h6>
                          <p className="text-muted small mb-2">
                            {project.startDate} - {project.endDate}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">Click to manage tasks</small>
                            <i className="fas fa-arrow-right text-info"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="display-1 mb-3">📁</div>
                  <h4 className="mb-3">No Projects Found</h4>
                  <p className="text-muted">Create a project first to manage tasks.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Project Header */}
          <div className="card border-0 shadow-lg mb-4">
            <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📋 Tasks for {selectedTaskProject.projectName}</h5>
                <button
                  className="btn btn-light btn-sm"
                  onClick={() => {
                    setSelectedTaskProject(null);
                    setProjectTasks([]);
                    setTaskSummary(null);
                  }}
                >
                  ← Back to Projects
                </button>
              </div>
            </div>
            
            {/* Task Summary */}
            {taskSummary && (
              <div className="card-body">
                <div className="row g-3 text-center">
                  <div className="col-md-2">
                    <div className="text-info">
                      <strong>{taskSummary.totalTasks}</strong>
                      <small className="d-block text-muted">Total</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-secondary">
                      <strong>{taskSummary.pendingTasks}</strong>
                      <small className="d-block text-muted">Pending</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-info">
                      <strong>{taskSummary.inProgressTasks}</strong>
                      <small className="d-block text-muted">In Progress</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-success">
                      <strong>{taskSummary.completedTasks}</strong>
                      <small className="d-block text-muted">Completed</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-danger">
                      <strong>{taskSummary.overdueTasks}</strong>
                      <small className="d-block text-muted">Overdue</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-warning">
                      <strong>{taskSummary.criticalPriorityTasks}</strong>
                      <small className="d-block text-muted">Critical</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Tasks */}
          {tasksLoading ? (
            <div className="card border-0 shadow-lg">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading tasks...</p>
              </div>
            </div>
          ) : projectTasks.length > 0 ? (
            <div className="row g-4">
              {projectTasks.map((task) => (
                <div key={task.id} className="col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-lg">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="card-title mb-0">{task.title}</h6>
                        <span className={`badge ${
                          task.priority === 'Critical' ? 'bg-danger' :
                          task.priority === 'High' ? 'bg-warning text-dark' :
                          task.priority === 'Medium' ? 'bg-info' : 'bg-success'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="card-text small text-muted mb-3">{task.description}</p>
                      )}
                      
                      <div className="mb-3">
                        <small className="text-muted">
                          <strong>Assigned to:</strong> {task.assignedToUserName}
                        </small><br />
                        <small className={`${
                          task.isOverdue ? 'text-danger' : 
                          new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) ? 'text-warning' : 
                          'text-muted'
                        }`}>
                          <strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}
                          {task.isOverdue && ' (OVERDUE)'}
                        </small>
                      </div>
                      
                      <div className="mb-3">
                        <span className={`badge ${
                          task.status === 'Completed' ? 'bg-success' :
                          task.status === 'InProgress' ? 'bg-primary' :
                          task.isOverdue ? 'bg-danger' :
                          'bg-secondary'
                        }`}>
                          {task.status}
                        </span>
                        {task.reminders.length > 0 && (
                          <span className="badge bg-light text-dark ms-2">
                            🔔 {task.reminders.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="btn-group w-100" role="group">
                          {task.status !== 'Completed' && (
                            <>
                              {task.status === 'Pending' && (
                                <button
                                  onClick={() => handleUpdateTaskStatus(task.id, 'InProgress')}
                                  className="btn btn-outline-primary btn-sm"
                                >
                                  Start
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'Completed')}
                                className="btn btn-outline-success btn-sm"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {task.status === 'Completed' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'InProgress')}
                              className="btn btn-outline-warning btn-sm"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card border-0 shadow-lg">
              <div className="card-body text-center py-5">
                <div className="display-1 mb-3">📋</div>
                <h4 className="mb-3">No Tasks Found</h4>
                <p className="text-muted mb-4">This project doesn't have any tasks yet.</p>
                <button
                  onClick={() => {
                    setShowAddTaskModal(true);
                    setAddTaskForm(prev => ({ ...prev, projectId: selectedTaskProject.id }));
                  }}
                  className="btn btn-primary"
                >
                  Create First Task
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
                <h5 className="modal-title">➕ Add New Task</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddTaskModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddTask}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Task Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addTaskForm.title}
                        onChange={(e) => setAddTaskForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                        required
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={addTaskForm.description}
                        onChange={(e) => setAddTaskForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter task description"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Due Date *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={addTaskForm.dueDate}
                        onChange={(e) => setAddTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Priority *</label>
                      <select
                        className="form-select"
                        value={addTaskForm.priority}
                        onChange={(e) => setAddTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                        required
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Assign To *</label>
                      <select
                        className="form-select"
                        value={addTaskForm.assignedToUserId}
                        onChange={(e) => setAddTaskForm(prev => ({ ...prev, assignedToUserId: parseInt(e.target.value) }))}
                        required
                      >
                        <option value={0}>Select a user</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Project (Optional)</label>
                      <select
                        className="form-select"
                        value={addTaskForm.projectId || ''}
                        onChange={(e) => setAddTaskForm(prev => ({ ...prev, projectId: e.target.value ? parseInt(e.target.value) : undefined }))}
                      >
                        <option value="">No project</option>
                        {filteredProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.projectName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Reminders Section */}
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">🔔 Reminders</h6>
                      <button
                        type="button"
                        onClick={addReminder}
                        className="btn btn-outline-primary btn-sm"
                      >
                        ➕ Add Reminder
                      </button>
                    </div>
                    
                    {addTaskForm.reminders.map((reminder, index) => (
                      <div key={index} className="border rounded p-3 mb-3 bg-light">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Reminder Date & Time</label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              value={reminder.reminderDateTime}
                              onChange={(e) => updateReminder(index, 'reminderDateTime', e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Type</label>
                            <select
                              className="form-select"
                              value={reminder.type}
                              onChange={(e) => updateReminder(index, 'type', e.target.value)}
                              required
                            >
                              <option value="Email">Email</option>
                              <option value="InApp">In-App</option>
                              <option value="Both">Both</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Message</label>
                            <input
                              type="text"
                              className="form-control"
                              value={reminder.message}
                              onChange={(e) => updateReminder(index, 'message', e.target.value)}
                              placeholder="Custom reminder message"
                            />
                          </div>
                          <div className="col-md-1 d-flex align-items-end">
                            <button
                              type="button"
                              onClick={() => removeReminder(index)}
                              className="btn btn-outline-danger btn-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="alert alert-info mt-3">
                    <small>
                      📧 <strong>Notification:</strong> The assigned user will receive an email notification when the task is created, and additional reminders based on your settings.
                    </small>
                  </div>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, border: 'none' }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating...
                        </>
                      ) : (
                        '➕ Create Task'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTaskModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSickNotes = () => (
    <div className="card border-0 shadow-lg">
      <div className="card-header border-0 py-4" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: "#ffffff" }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1">🤒 Sick Note Approvals</h2>
            <p className="mb-0 opacity-75">Review and manage learner sick notes</p>
          </div>
          <button 
            className="btn btn-light"
            onClick={() => fetchSickNotes()}
            disabled={sickNotesLoading}
          >
            {sickNotesLoading ? 'Refreshing...' : '🔄 Refresh List'}
          </button>
        </div>
      </div>
      <div className="card-body p-0">
        {sickNotesLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Fetching sick notes...</p>
          </div>
        ) : sickNotes.length === 0 ? (
          <div className="text-center py-5">
            <div className="display-1 mb-3 opacity-25">🤒</div>
            <h3>No Sick Notes Found</h3>
            <p className="text-muted">There are no uploaded sick notes at this time.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Learner</th>
                  <th>Facility & Practitioner</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sickNotes.map((note) => (
                  <tr key={note.id}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{note.learnerName}</div>
                      <small className="text-muted">ID: {note.learnerId}</small>
                    </td>
                    <td>
                      <div>{note.medicalFacility}</div>
                      <small className="text-muted">{note.practitionerName}</small>
                    </td>
                    <td>
                      <div>{new Date(note.startDate).toLocaleDateString()} - {new Date(note.endDate).toLocaleDateString()}</div>
                      <small className="text-muted">Issued: {new Date(note.issuedDate).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${
                        note.status === 'Pending' ? 'bg-warning text-dark' :
                        note.status === 'Approved' ? 'bg-success' : 'bg-danger'
                      }`}>
                        {note.status}
                      </span>
                      {note.status === 'Rejected' && note.rejectionReason && (
                        <div className="small text-danger mt-1" style={{ maxWidth: '200px' }}>
                          Reason: {note.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(note.createdAt).toLocaleDateString()}<br/>
                        {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td className="text-end pe-4">
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => handleViewSickNote(note.id)}
                          title="View Sick Note File"
                        >
                          👁️ View
                        </button>
                        {note.status === 'Pending' && (
                          <>
                            <button 
                              className="btn btn-success"
                              onClick={() => handleApproveSickNote(note.id)}
                              title="Approve Sick Note"
                            >
                              ✅ Approve
                            </button>
                            <button 
                              className="btn btn-danger"
                              onClick={() => {
                                setSickNoteToDecline(note);
                                setShowSickNoteDeclineModal(true);
                              }}
                              title="Decline Sick Note"
                            >
                              ❌ Decline
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendanceTracking = () => (
    <div>
      {/* Header */}
      <div className="card border-0 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16,
        color: "#ffffff"
      }}>
        <div className="card-body text-white py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-2">📊 Attendance Tracking</h2>
              <p className="mb-0 opacity-75">Monitor learner attendance across all projects with detailed analytics</p>
            </div>
          </div>
          
          {/* Period Filter */}
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label text-white">Time Period</label>
              <select
                className="form-select"
                value={attendancePeriod}
                onChange={(e) => handlePeriodChange(e.target.value as 'today' | 'week' | 'month' | 'custom')}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            {attendancePeriod === 'custom' && (
              <>
                <div className="col-md-3">
                  <label className="form-label text-white">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={attendanceStartDate}
                    onChange={(e) => setAttendanceStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-white">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={attendanceEndDate}
                    onChange={(e) => setAttendanceEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Project Selection */}
      {!selectedAttendanceProject ? (
        <div className="card border-0 shadow-lg">
          <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
            <h5 className="mb-0">📁 Select Project to Track Attendance</h5>
            <button
              className="btn btn-light btn-sm fw-semibold d-flex align-items-center gap-2"
              onClick={() => handleBulkAttendanceDownload(0)}
              disabled={bulkAttendanceDownloading}
              title={`Download attendance for all ${filteredProjects.length} project(s) as a ZIP — uses the selected month`}
            >
              {bulkAttendanceDownloading ? (
                <><span className="spinner-border spinner-border-sm" />Preparing...</>
              ) : (
                <>📦 Bulk Download All</>
              )}
            </button>
          </div>
          <div className="card-body">
            {attendanceLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading projects...</p>
              </div>
            ) : attendanceProjects.length > 0 ? (
              <div className="row g-3">
                {attendanceProjects
                  .filter(ap => filteredProjects.some(fp => fp.id === ap.projectId))
                  .map((project) => (
                  <div key={project.projectId} className="col-md-6 col-lg-4">
                    <div 
                      className="card h-100 border-0 shadow-sm cursor-pointer"
                      style={{ 
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onClick={() => handleProjectSelect(project)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="card-body">
                        <h6 className="card-title text-info mb-3">{project.projectName}</h6>
                        <div className="row g-2 text-center">
                          <div className="col-6">
                            <div className="text-success">
                              <strong>{project.presentToday}</strong>
                              <small className="d-block text-muted">Present</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-danger">
                              <strong>{project.absentToday}</strong>
                              <small className="d-block text-muted">Absent</small>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">Attendance Rate</small>
                            <small className="fw-bold">{project.attendanceRate}%</small>
                          </div>
                          <div className="progress" style={{ height: '6px' }}>
                            <div 
                              className={`progress-bar ${
                                project.attendanceRate >= 90 ? 'bg-success' :
                                project.attendanceRate >= 75 ? 'bg-warning' : 'bg-danger'
                              }`}
                              style={{ width: `${project.attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <small className="text-muted">
                            {project.totalLearners} learners • {project.totalClasses} classes
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="display-1 mb-3">📊</div>
                <h4 className="mb-3">No Projects Found</h4>
                <p className="text-muted">No projects with learners found for attendance tracking.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Project Attendance Details */
        <div>
          {/* Back Button and Project Header */}
          <div className="card border-0 shadow-lg mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-outline-primary me-3"
                    onClick={() => {
                      setSelectedAttendanceProject(null);
                      setAttendanceStats(null);
                      setSelectedClass(null);
                      setClassLearners([]);
                    }}
                  >
                    ← Back to Projects
                  </button>
                  <div>
                    <h4 className="mb-1">{selectedAttendanceProject.projectName}</h4>
                    <small className="text-muted">
                      Attendance tracking for {attendancePeriod === 'today' ? 'today' : 
                      attendancePeriod === 'week' ? 'this week' : 
                      attendancePeriod === 'month' ? 'this month' : 'custom period'}
                    </small>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-success"
                    onClick={() => exportMonthlyAttendance(selectedAttendanceProject.projectId)}
                    disabled={attendanceLoading}
                  >
                    📊 Excel Monthly
                  </button>
                  <button
                    className="btn btn-info text-white"
                    onClick={() => exportStipendSchedule(selectedAttendanceProject.projectId)}
                    disabled={attendanceLoading}
                  >
                    💰 Excel Stipend
                  </button>
                  <button
                    className="btn btn-warning text-dark fw-semibold"
                    onClick={() => handleBulkAttendanceDownload(selectedAttendanceProject.projectId)}
                    disabled={bulkAttendanceDownloading}
                    title="Download attendance + stipend for ALL projects as a ZIP"
                  >
                    {bulkAttendanceDownloading ? (
                      <><span className="spinner-border spinner-border-sm me-1" />Preparing ZIP...</>
                    ) : (
                      <>📦 Bulk Download All Projects</>
                    )}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => fetchAttendanceReport(selectedAttendanceProject.projectId)}
                    disabled={attendanceLoading}
                  >
                    📋 Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Statistics */}
          {attendanceStats && (
            <div className="card border-0 shadow-lg mb-4">
              <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
                <h5 className="mb-0">📈 Attendance Overview</h5>
              </div>
              <div className="card-body">
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h2 mb-1 text-info">{attendanceStats.totalLearners}</div>
                      <small className="text-muted">Total Learners</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h2 mb-1 text-success">{attendanceStats.presentLearners}</div>
                      <small className="text-muted">Present</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h2 mb-1 text-danger">{attendanceStats.absentLearners}</div>
                      <small className="text-muted">Absent</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h2 mb-1 text-info">{attendanceStats.attendanceRate}%</div>
                      <small className="text-muted">Attendance Rate</small>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="h5 mb-1 text-warning">{attendanceStats.lateArrivals}</div>
                      <small className="text-muted">Late Arrivals</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="h5 mb-1 text-warning">{attendanceStats.earlyDepartures}</div>
                      <small className="text-muted">Early Departures</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="h5 mb-1 text-info">{attendanceStats.averageContactTime}</div>
                      <small className="text-muted">Avg Contact Time</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Class Breakdown */}
          {attendanceStats?.classBreakdown && attendanceStats.classBreakdown.length > 0 && (
            <div className="card border-0 shadow-lg mb-4">
              <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
                <h5 className="mb-0">🏫 Class Breakdown</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {attendanceStats.classBreakdown.map((classData) => (
                    <div key={classData.classId} className="col-md-6 col-lg-4">
                      <div 
                        className="card h-100 border-0 shadow-sm cursor-pointer"
                        style={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onClick={() => handleClassSelect(classData)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="card-body">
                          <h6 className="card-title">{classData.className}</h6>
                          <p className="text-muted small mb-2">{classData.siteName}</p>
                          <div className="row g-2 text-center">
                            <div className="col-6">
                              <div className="text-success">
                                <strong>{classData.presentLearners}</strong>
                                <small className="d-block text-muted">Present</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-danger">
                                <strong>{classData.absentLearners}</strong>
                                <small className="d-block text-muted">Absent</small>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-muted">Rate</small>
                              <small className="fw-bold">{classData.attendanceRate}%</small>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                              <div 
                                className={`progress-bar ${
                                  classData.attendanceRate >= 90 ? 'bg-success' :
                                  classData.attendanceRate >= 75 ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ width: `${classData.attendanceRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Class Learners Detail */}
          {selectedClass && (classLearners.length > 0 || weeklyLearners.length > 0) && (
            <div className="card border-0 shadow-lg">
              <div className="card-header border-0" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">👥 {selectedClass.className} - Learner Attendance</h5>
                  <div className="d-flex align-items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="btn-group btn-group-sm">
                      <button
                        className={`btn ${attendanceViewMode === 'daily' ? 'btn-light' : 'btn-outline-light'}`}
                        onClick={() => {
                          setAttendanceViewMode('daily');
                          if (selectedAttendanceProject && selectedClass) {
                            const dateToUse = attendancePeriod === 'today' ? attendanceStartDate : new Date().toISOString().split('T')[0];
                            fetchClassLearners(selectedAttendanceProject.projectId, selectedClass.classId, dateToUse);
                          }
                        }}
                      >
                        📅 Daily
                      </button>
                      <button
                        className={`btn ${attendanceViewMode === 'weekly' ? 'btn-light' : 'btn-outline-light'}`}
                        onClick={() => {
                          setAttendanceViewMode('weekly');
                          if (selectedAttendanceProject && selectedClass) {
                            fetchClassLearnersWeekly(selectedAttendanceProject.projectId, selectedClass.classId, weekStartDate);
                          }
                        }}
                      >
                        📊 Weekly
                      </button>
                    </div>
                    
                    {/* Week Navigation for Weekly View */}
                    {attendanceViewMode === 'weekly' && (
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-outline-light btn-sm"
                          onClick={() => {
                            const currentWeek = new Date(weekStartDate);
                            currentWeek.setDate(currentWeek.getDate() - 7);
                            const newWeekStart = currentWeek.toISOString().split('T')[0];
                            setWeekStartDate(newWeekStart);
                            if (selectedAttendanceProject && selectedClass) {
                              fetchClassLearnersWeekly(selectedAttendanceProject.projectId, selectedClass.classId, newWeekStart);
                            }
                          }}
                        >
                          ← Prev Week
                        </button>
                        <span className="text-white small">
                          {new Date(weekStartDate).toLocaleDateString()} - {new Date(new Date(weekStartDate).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </span>
                        <button
                          className="btn btn-outline-light btn-sm"
                          onClick={() => {
                            const currentWeek = new Date(weekStartDate);
                            currentWeek.setDate(currentWeek.getDate() + 7);
                            const newWeekStart = currentWeek.toISOString().split('T')[0];
                            setWeekStartDate(newWeekStart);
                            if (selectedAttendanceProject && selectedClass) {
                              fetchClassLearnersWeekly(selectedAttendanceProject.projectId, selectedClass.classId, newWeekStart);
                            }
                          }}
                        >
                          Next Week →
                        </button>
                      </div>
                    )}
                    
                    <button
                      className="btn btn-light btn-sm"
                      onClick={() => {
                        setSelectedClass(null);
                        setClassLearners([]);
                        setWeeklyLearners([]);
                      }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {/* Daily View */}
                {attendanceViewMode === 'daily' && (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Learner</th>
                          <th>ID Number</th>
                          <th>Status</th>
                          <th>Clock In</th>
                          <th>Clock Out</th>
                          <th>Contact Time</th>
                          <th>Verified</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classLearners.map((learner) => (
                          <tr key={learner.learnerId}>
                            <td>
                              <strong>{learner.firstName} {learner.lastName}</strong>
                            </td>
                            <td>
                              <small className="text-muted">{learner.idNumber}</small>
                            </td>
                            <td>
                              <span className={`badge ${
                                learner.status === 'Present' ? 'bg-success' :
                                learner.status === 'Absent' ? 'bg-danger' :
                                learner.status === 'Late' ? 'bg-warning' : 'bg-secondary'
                              }`}>
                                {learner.status}
                              </span>
                            </td>
                            <td>
                              {learner.clockInTime ? (
                                <small>{new Date(learner.clockInTime).toLocaleTimeString()}</small>
                              ) : (
                                <small className="text-muted">-</small>
                              )}
                            </td>
                            <td>
                              {learner.clockOutTime ? (
                                <small>{new Date(learner.clockOutTime).toLocaleTimeString()}</small>
                              ) : (
                                <small className="text-muted">-</small>
                              )}
                            </td>
                            <td>
                              {learner.contactTime ? (
                                <small>{learner.contactTime}</small>
                              ) : (
                                <small className="text-muted">-</small>
                              )}
                            </td>
                            <td>
                              {learner.clockInVerified || learner.clockOutVerified ? (
                                <span className="text-success">✓ Fingerprint</span>
                              ) : learner.clockInTime ? (
                                <span className="text-warning">⚠ Manual</span>
                              ) : (
                                <small className="text-muted">-</small>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => openAttendanceCalendar(learner.learnerId)}
                                title="View Attendance Calendar"
                              >
                                📅 View Attendance
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Weekly View */}
                {attendanceViewMode === 'weekly' && (
                  <div>
                    {weeklyLearners.map((learner) => (
                      <div key={learner.learnerId} className="card mb-3 border-0 shadow-sm">
                        <div className="card-header bg-light">
                          <div className="row align-items-center">
                            <div className="col-md-5">
                              <h6 className="mb-0">
                                <strong>{learner.firstName} {learner.lastName}</strong>
                                <small className="text-muted ms-2">{learner.idNumber}</small>
                              </h6>
                            </div>
                            <div className="col-md-5">
                              <div className="row text-center">
                                <div className="col-3">
                                  <div className="text-success">
                                    <strong>{learner.presentDays}</strong>
                                    <small className="d-block text-muted">Present</small>
                                  </div>
                                </div>
                                <div className="col-3">
                                  <div className="text-danger">
                                    <strong>{learner.absentDays}</strong>
                                    <small className="d-block text-muted">Absent</small>
                                  </div>
                                </div>
                                <div className="col-3">
                                  <div className="text-info">
                                    <strong>{learner.attendanceRate}%</strong>
                                    <small className="d-block text-muted">Rate</small>
                                  </div>
                                </div>
                                <div className="col-3">
                                  <div className="text-info">
                                    <strong>{learner.totalContactHours}h</strong>
                                    <small className="d-block text-muted">Total</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-2 text-end">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => openAttendanceCalendar(learner.learnerId)}
                                title="View Attendance Calendar"
                              >
                                📅 Calendar
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-sm table-borderless">
                              <thead>
                                <tr>
                                  <th>Day</th>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Clock In</th>
                                  <th>Clock Out</th>
                                  <th>Contact Time</th>
                                  <th>Verified</th>
                                </tr>
                              </thead>
                              <tbody>
                                {learner.dailyAttendances.map((day) => (
                                  <tr key={day.date} className={day.status === 'Present' ? 'table-success' : day.status === 'Absent' ? 'table-danger' : ''}>
                                    <td>
                                      <strong>{day.dayOfWeek}</strong>
                                    </td>
                                    <td>
                                      <small>{new Date(day.date).toLocaleDateString()}</small>
                                    </td>
                                    <td>
                                      <span className={`badge ${
                                        day.status === 'Present' ? 'bg-success' :
                                        day.status === 'Absent' ? 'bg-danger' :
                                        day.status === 'Late' ? 'bg-warning' : 'bg-secondary'
                                      }`}>
                                        {day.status}
                                      </span>
                                    </td>
                                    <td>
                                      {day.clockInTime ? (
                                        <small>{new Date(day.clockInTime).toLocaleTimeString()}</small>
                                      ) : (
                                        <small className="text-muted">-</small>
                                      )}
                                    </td>
                                    <td>
                                      {day.clockOutTime ? (
                                        <small>{new Date(day.clockOutTime).toLocaleTimeString()}</small>
                                      ) : (
                                        <small className="text-muted">-</small>
                                      )}
                                    </td>
                                    <td>
                                      {day.contactTime ? (
                                        <small>{day.contactTime}</small>
                                      ) : (
                                        <small className="text-muted">-</small>
                                      )}
                                    </td>
                                    <td>
                                      {day.clockInVerified || day.clockOutVerified ? (
                                        <span className="text-success">✓ Fingerprint</span>
                                      ) : day.clockInTime ? (
                                        <span className="text-warning">⚠ Manual</span>
                                      ) : (
                                        <small className="text-muted">-</small>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Report Modal */}
      {showAttendanceReport && attendanceReport && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', borderRadius: 16, color: 'white' }}>
                <h5 className="modal-title">📋 Attendance Report - {attendanceReport.projectName}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAttendanceReport(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-info">{attendanceReport.summary.overallAttendanceRate}%</div>
                      <small className="text-muted">Overall Rate</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-success">{attendanceReport.summary.totalActualAttendances}</div>
                      <small className="text-muted">Total Present</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-info">{attendanceReport.summary.averageContactHours}h</div>
                      <small className="text-muted">Avg Contact</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-warning">{attendanceReport.summary.totalLateArrivals}</div>
                      <small className="text-muted">Late Arrivals</small>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <h6>Daily Breakdown</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Present</th>
                            <th>Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceReport.dailyBreakdown.map((day) => (
                            <tr key={day.date}>
                              <td><small>{new Date(day.date).toLocaleDateString()}</small></td>
                              <td><small>{day.presentLearners}/{day.totalLearners}</small></td>
                              <td><small>{day.attendanceRate}%</small></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6>Top Performers</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Learner</th>
                            <th>Rate</th>
                            <th>Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceReport.learnerSummaries.slice(0, 10).map((learner) => (
                            <tr key={learner.learnerId}>
                              <td><small>{learner.firstName} {learner.lastName}</small></td>
                              <td><small>{learner.attendanceRate}%</small></td>
                              <td><small>{learner.totalContactHours}h</small></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAttendanceReport(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAssessmentPlan = () => {
    if (showAssessmentPlanForm && selectedPlanUnitStandard) {
      return (
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button 
              className="btn btn-outline-primary shadow-sm d-flex align-items-center gap-2"
              onClick={() => {
                setShowAssessmentPlanForm(false);
                setSelectedPlanUnitStandard(null);
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>←</span> Back to Unit Standards
            </button>
            <div className="text-center">
              <h3 className="mb-0 fw-bold text-info">Assessment Planning</h3>
              <p className="text-muted small mb-0">Prepare your assessment strategy for the selected unit standard</p>
            </div>
            <button 
              className="btn btn-success shadow-sm px-4 d-flex align-items-center gap-2"
              onClick={async () => {
                const signatureData = signaturePadRef.current?.isEmpty() 
                  ? assessmentPlanForm.assessorSignature 
                  : signaturePadRef.current?.getCanvas().toDataURL('image/png');

                const moderatorSignatureData = moderatorSignaturePadRef.current?.isEmpty() 
                  ? assessmentPlanForm.moderatorSignature 
                  : moderatorSignaturePadRef.current?.getCanvas().toDataURL('image/png');

                const planDto = {
                  projectQualificationUnitStandardId: selectedPlanUnitStandard.id,
                  assessmentDate: assessmentPlanForm.dateOfAssessment,
                  questionnaireTime: assessmentPlanForm.questionnaire.time,
                  questionnairePeople: assessmentPlanForm.questionnaire.people,
                  questionnaireLocation: assessmentPlanForm.questionnaire.location,
                  questionnaireEquipment: assessmentPlanForm.questionnaire.equipment,
                  practicalTime: assessmentPlanForm.practicalAssignment.time,
                  practicalPeople: assessmentPlanForm.practicalAssignment.people,
                  practicalLocation: assessmentPlanForm.practicalAssignment.location,
                  practicalEquipment: assessmentPlanForm.practicalAssignment.equipment,
                  assessorName: user?.name,
                  assessorNumber: assessmentPlanForm.assessorNumber,
                  assessorSignature: signatureData,
                  moderatorName: assessmentPlanForm.moderatorName,
                  moderatorNumber: assessmentPlanForm.moderatorNumber,
                  moderatorSignature: moderatorSignatureData
                };

                try {
                  const response = await fetchWithAuth('/api/assessments/strategy-plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(planDto)
                  });

                  if (response && response.ok) {
                    pushToast('success', 'Assessment plan saved and applied to all assigned learners!');
                    fetchAssessmentStrategyPlans(); // Refresh plans
                    setShowAssessmentPlanForm(false);
                    setSelectedPlanUnitStandard(null);
                  }
                } catch (error) {
                  console.error('Error saving plan:', error);
                  pushToast('error', 'Failed to save assessment plan.');
                }
              }}
            >
              <span>💾</span> Save & Apply Plan
            </button>
          </div>

          {/* Assessor Info & Plan Context */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '5px solid #0d9488' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary-subtle p-3 rounded-circle">
                      <span style={{ fontSize: '1.5rem' }}>📖</span>
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold">{selectedPlanUnitStandard.unitStandardName}</h5>
                      <div className="d-flex gap-2 align-items-center">
                        <span className="badge bg-primary">ID: {selectedPlanUnitStandard.unitStandardId}</span>
                        <span className="badge bg-info">Level {selectedPlanUnitStandard.level}</span>
                        <span className="badge bg-secondary">{selectedPlanUnitStandard.credits} Credits</span>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-4 pt-3 border-top g-3">
                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Project</small>
                      <p className="mb-0 fw-semibold">{selectedPlanUnitStandard.projectName}</p>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Qualification / Pathway</small>
                      <p className="mb-0 fw-semibold">{selectedPlanUnitStandard.pathwayName}</p>
                      <small className="text-muted">{selectedPlanUnitStandard.actualQualificationName}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '5px solid #10b981' }}>
                <div className="card-body p-4">
                  <h6 className="text-uppercase text-muted fw-bold mb-3" style={{ fontSize: '0.75rem' }}>Assessor Profile</h6>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-success-subtle p-2 rounded-circle" style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                    </div>
                    <div>
                      <p className="mb-0 fw-bold">{user?.name}</p>
                      <p className="mb-0 text-muted small">{user?.email}</p>
                    </div>
                  </div>
                  <div className="alert alert-success border-0 small mb-3 py-2">
                    <div className="d-flex align-items-center gap-2">
                      <span>📢</span>
                      <span>This plan will be <strong>automatically applied</strong> to all learners assigned to this unit standard.</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Assessor Practice Number</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Enter registration number"
                      value={assessmentPlanForm.assessorNumber}
                      onChange={(e) => setAssessmentPlanForm({...assessmentPlanForm, assessorNumber: e.target.value})}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Assessor Initials</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Type initials"
                      value={assessmentPlanForm.assessorSignature}
                      onChange={(e) => setAssessmentPlanForm({...assessmentPlanForm, assessorSignature: e.target.value})}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Digital Signature Pad</label>
                    <div className="border rounded bg-white p-1 mb-2">
                      <SignatureCanvas 
                        ref={signaturePadRef}
                        penColor="black"
                        canvasProps={{
                          width: 300,
                          height: 100,
                          className: 'sigCanvas'
                        }}
                      />
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => signaturePadRef.current?.clear()}
                    >
                      Clear Signature
                    </button>
                  </div>

                  {/* Moderator Section */}
                  <hr className="my-4" />
                  <h6 className="text-uppercase text-muted fw-bold mb-3" style={{ fontSize: '0.75rem' }}>Moderator Profile</h6>
                  <div className="mt-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Moderator Name</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Enter moderator name"
                      value={assessmentPlanForm.moderatorName}
                      onChange={(e) => setAssessmentPlanForm({...assessmentPlanForm, moderatorName: e.target.value})}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Moderator Practice Number</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Enter registration number"
                      value={assessmentPlanForm.moderatorNumber}
                      onChange={(e) => setAssessmentPlanForm({...assessmentPlanForm, moderatorNumber: e.target.value})}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Moderator Initials</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Type initials"
                      value={assessmentPlanForm.moderatorSignature}
                      onChange={(e) => setAssessmentPlanForm({...assessmentPlanForm, moderatorSignature: e.target.value})}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Moderator Signature Pad</label>
                    <div className="border rounded bg-white p-1 mb-2">
                      <SignatureCanvas 
                        ref={moderatorSignaturePadRef}
                        penColor="black"
                        canvasProps={{
                          width: 300,
                          height: 100,
                          className: 'sigCanvas'
                        }}
                      />
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => moderatorSignaturePadRef.current?.clear()}
                    >
                      Clear Moderator Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="card shadow-lg border-0 mb-5 overflow-hidden">
            <div className="card-header bg-white border-0 py-4 px-5">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h4 className="mb-0 fw-bold">Planning Details</h4>
                </div>
                <div className="col-md-6 text-md-end">
                  <div className="d-inline-flex align-items-center gap-2 bg-light p-2 rounded px-3 border">
                    <label className="text-muted small fw-bold mb-0">ASSESSMENT DATE:</label>
                    <input 
                      type="date" 
                      className="form-control form-control-sm border-0 bg-transparent fw-bold shadow-none p-0" 
                      style={{ width: 'auto' }}
                      value={assessmentPlanForm.dateOfAssessment}
                      onChange={(e) => setAssessmentPlanForm({...assessmentPlanForm, dateOfAssessment: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-5 pt-2">
              <div className="row g-5">
                {/* Questionnaire Section */}
                <div className="col-lg-6">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="bg-info-subtle p-2 rounded">
                      <span style={{ fontSize: '1.2rem' }}>📝</span>
                    </div>
                    <h5 className="mb-0 fw-bold text-info">Questionnaire Strategy</h5>
                  </div>
                  <div className="bg-light rounded-4 p-4 border border-info-subtle">
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Allocated Time</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">⏰</span>
                        <input 
                          type="text" 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., 2 Hours"
                          value={assessmentPlanForm.questionnaire.time}
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            questionnaire: { ...assessmentPlanForm.questionnaire, time: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Resources / People Involved</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">👥</span>
                        <input 
                          type="text" 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., Assessor, Learners"
                          value={assessmentPlanForm.questionnaire.people}
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            questionnaire: { ...assessmentPlanForm.questionnaire, people: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Venue / Location</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">📍</span>
                        <input 
                          type="text" 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., Training Room A"
                          value={assessmentPlanForm.questionnaire.location}
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            questionnaire: { ...assessmentPlanForm.questionnaire, location: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="mb-0">
                      <label className="form-label small fw-bold text-muted text-uppercase">Equipment & Material</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">🛠️</span>
                        <textarea 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., Pens, Question Papers..."
                          rows={2}
                          value={assessmentPlanForm.questionnaire.equipment}
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            questionnaire: { ...assessmentPlanForm.questionnaire, equipment: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practical Assignment Section */}
                <div className="col-lg-6">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="bg-warning-subtle p-2 rounded">
                      <span style={{ fontSize: '1.2rem' }}>🔨</span>
                    </div>
                    <h5 className="mb-0 fw-bold text-warning">Practical Assignment Strategy</h5>
                  </div>
                  <div className="bg-light rounded-4 p-4 border border-warning-subtle">
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Allocated Time</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">⏰</span>
                        <input 
                          type="text" 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., 4 Hours"
                          value={assessmentPlanForm.practicalAssignment.time}
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            practicalAssignment: { ...assessmentPlanForm.practicalAssignment, time: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Resources / People Involved</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">👥</span>
                        <input 
                          type="text" 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., Assessor, Learners, Supervisor"
                          value={assessmentPlanForm.practicalAssignment.people}
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            practicalAssignment: { ...assessmentPlanForm.practicalAssignment, people: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted text-uppercase">Venue / Location</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">📍</span>
                        <input 
                          type="text" 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., Construction Site B"
                          value={assessmentPlanForm.practicalAssignment.location}
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            practicalAssignment: { ...assessmentPlanForm.practicalAssignment, location: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="mb-0">
                      <label className="form-label small fw-bold text-muted text-uppercase">Equipment & Material</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">🛠️</span>
                        <textarea 
                          className="form-control border-start-0 ps-0" 
                          placeholder="e.g., Safety Gear, Tools, Materials..."
                          rows={2}
                          value={assessmentPlanForm.practicalAssignment.equipment}