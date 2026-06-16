import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import FunderReport from './FunderReport';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
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

const SDPManagerDashboard: React.FC = () => {
  console.log('SDPManagerDashboard: Component rendered/re-rendered');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'reports' | 'team' | 'tasks' | 'attendanceTracking' | 'documentApprovals' | 'sickNotes' | 'marking' | 'moderation' | 'assessmentPlan' | 'candidatePreparation' | 'assessorReport' | 'systemLogs' | 'allUsers'>((location.state as any)?.section || 'overview');
  const [dataLoading, setDataLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<{[key: number]: boolean}>({});
  const [projectDetails, setProjectDetails] = useState<{[key: number]: any}>({});
  const [competencyReport, setCompetencyReport] = useState<CompetencyReport | null>(null);
  const [fetchingReport, setFetchingReport] = useState(false);

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
    try {
      const response = await fetchWithAuth('/api/assessments/strategy-plans');
      if (response && response.ok) {
        const data = await response.json();
        const plansMap: {[key: number]: any} = {};
        data.forEach((plan: any) => {
          plansMap[plan.projectQualificationUnitStandardId] = plan;
        });
        setAssessmentStrategyPlans(plansMap);
      }
    } catch (error) {
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

  // QA Metrics state (for Quality Assurance Managers)
  const [qaMetrics, setQaMetrics] = useState<any | null>(null);
  const [qaMetricsLoading, setQaMetricsLoading] = useState(false);

  // IT Dashboard state
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [allSdpUsers, setAllSdpUsers] = useState<any[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);

  // Helper role flags for conditional rendering
  const role = String(user?.role);
  const deptName = (user?.departmentName || '').toLowerCase();
  
  // Super User check (Main SDP Admin - Role 3 without departmentId)
  const isSuperUser = (role === 'SDPAdministrator' || role === '3' || user?.userType === 'SDPAdmin' || (user?.skillsDevelopmentProviderId && !user?.departmentId)) && (!user?.departmentId || user?.departmentId === 0);
  
  // Define roles with strict precedence to avoid overlapping
  // Define roles with strict precedence to avoid overlapping
  // Priority 1: Explicit Role IDs & Known QA Emails
  const isQAEmail = user?.email === 'maphangosbusiso@gmail.com' || user?.email === 'qa.manager@masakhane.com';
  const isModeratorEmail = user?.email === 'maphangolwemihla5@gmail.com';
  
  const hasQARole = role === '14' || role === '17' || isQAEmail;
  const hasAssessorRole = role === 'SDPAssessor' || role === '8';
  const hasModeratorRole = role === 'SDPModerator' || role === '7' || role === '9' || isModeratorEmail;

  // Priority 2: Final Mutually Exclusive Flags
  // QA Managers are Super Users, have QA roles, specific QA emails, 
  // or are in strictly Quality depts (and not explicitly assigned Assessor or Moderator roles)
  const isQA = (isSuperUser || hasQARole || 
    ((deptName === 'quality assurance' || deptName === 'qa' || deptName === 'quality') && !hasAssessorRole && !hasModeratorRole)) && !isModeratorEmail;
  
  // Assessors are those with the role OR in the department, provided they aren't the QA Manager
  const isAssessor = !isQA && (hasAssessorRole || deptName.includes('assessor'));
  
  // Moderators are those with the role OR in the department, provided they aren't QA or Assessor
  const isModerator = isModeratorEmail || (!isQA && !isAssessor && (hasModeratorRole || deptName.includes('moderator')));
  
  const isAdmin = (isSuperUser || (role === 'SDPAdministrator' || role === '3' || deptName.includes('admin'))) && !isAssessor && !isModerator && !isQA;
  const isFinance = (isSuperUser || (role === 'SDPFinance' || role === '4' || role === '11' || deptName.includes('finance'))) && !isAssessor && !isModerator && !isQA;
  const isLogistics = (isSuperUser || (role === 'SDPLogistics' || role === '5' || role === '12' || deptName.includes('logistic'))) && !isAssessor && !isModerator && !isQA;
  const isIT = (isSuperUser || (role === 'SDPIT' || role === '6' || role === '13' || (deptName.includes('it') && !deptName.includes('quality')))) && !isAssessor && !isModerator && !isQA;
  const isQATrainingManager = isQA || isSuperUser;

  // IT Dashboard fetch functions
  const fetchSystemLogs = async () => {
    setLogsLoading(true);
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
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchAllSdpUsers = async () => {
    setAllUsersLoading(true);
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
        }
      }
    } catch (error) {
      console.error('Error fetching SDP users:', error);
    } finally {
      setAllUsersLoading(false);
    }
  };

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
      console.error('No token found, redirecting to login');
      navigate('/login');
      return null;
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        console.error('Unauthorized access (401), redirecting to login');
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

  // Filter projects based on assignments for Assessors and Moderators
  const filteredProjects = useMemo(() => {
    // Everyone should see all projects for their SDP by default in this management view
    return projects;
  }, [projects]);

  // Data visualization preparations
  const enrollmentChartData = useMemo(() => {
    return filteredProjects.map(project => {
      const attendanceProject = attendanceProjects.find(ap => ap.projectId === project.id);
      return {
        name: project.projectName.length > 15 ? `${project.projectName.substring(0, 15)}...` : project.projectName,
        enrolled: attendanceProject?.totalLearners || 0,
        target: project.numberOfBeneficiaries || 0
      };
    });
  }, [filteredProjects, attendanceProjects]);

  const attendanceChartData = useMemo(() => {
    return filteredProjects.map(project => {
      const attendanceProject = attendanceProjects.find(ap => ap.projectId === project.id);
      return {
        name: project.projectName.length > 15 ? `${project.projectName.substring(0, 15)}...` : project.projectName,
        rate: attendanceProject?.attendanceRate || 0
      };
    });
  }, [filteredProjects, attendanceProjects]);

  const documentComplianceData = useMemo(() => {
    if (!documentApprovalStats) return [];
    return documentApprovalStats.documentTypeBreakdown.map(type => ({
      name: type.documentType,
      compliance: type.complianceRate,
      submitted: type.submittedDocuments,
      expected: type.expectedDocuments,
      missing: type.missingDocuments
    }));
  }, [documentApprovalStats]);

  const overallDocStatusData = useMemo(() => {
    if (!documentApprovalStats) return [];
    
    const data = [
      { name: 'Approved', value: documentApprovalStats.approvedDocuments || 0, color: '#10b981' },
      { name: 'Declined', value: documentApprovalStats.declinedDocuments || 0, color: '#ef4444' },
      { name: 'Pending', value: documentApprovalStats.pendingDocuments || 0, color: '#f59e0b' }
    ];

    // Check if we have any data to display
    const hasData = data.some(item => item.value > 0);
    if (!hasData) {
      // Return a "No Data" entry so the chart at least renders something
      return [{ name: 'No Documents', value: 1, color: '#e2e8f0' }];
    }
    
    return data;
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
      } else {
        alert('Failed to compile POE document. Please ensure all evidence is uploaded.');
      }
    } catch (error) {
      console.error('Error compiling POE:', error);
      alert('An error occurred while compiling the POE document.');
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
        alert('Sick note approved successfully');
        fetchSickNotes();
      } else if (response) {
        alert('Failed to approve sick note');
      }
    } catch (error) {
      console.error('Error approving sick note:', error);
      alert('An error occurred');
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
        alert('Sick note declined successfully');
        setShowSickNoteDeclineModal(false);
        setSickNoteDeclineReason('');
        setSickNoteToDecline(null);
        fetchSickNotes();
      } else if (response) {
        alert('Failed to decline sick note');
      }
    } catch (error) {
      console.error('Error declining sick note:', error);
      alert('An error occurred');
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
        alert('Failed to view sick note file');
      }
    } catch (error) {
      console.error('Error viewing sick note:', error);
      alert('An error occurred');
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
      } else if (response) {
        const error = await response.text();
        alert(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Error adding question');
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
      alert('Please fill in all required fields');
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
        alert('Team member added successfully! They will receive an email with their login credentials.');
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to add team member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('An error occurred while adding the team member');
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
        alert('Team member removed successfully');
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to remove team member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('An error occurred while removing the team member');
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
      alert('Please fill in all required fields');
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
        alert('Site added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to add site: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding site:', error);
      alert('An error occurred while adding the site');
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
      alert('Please fill in all required fields');
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
        alert('Site updated successfully!');
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to update site: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating site:', error);
      alert('An error occurred while updating the site');
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
        alert('Site deleted successfully');
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to delete site: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('An error occurred while deleting the site');
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
      alert('Please fill in all required fields');
      return;
    }

    // Validate class name (only letters and spaces)
    if (!/^[a-zA-Z\s]+$/.test(addClassForm.className)) {
      alert('Class name can only contain letters and spaces');
      return;
    }

    // Validate max learners (only positive numbers)
    const maxLearners = parseInt(addClassForm.maxLearners);
    if (isNaN(maxLearners) || maxLearners <= 0) {
      alert('Maximum learners must be a positive number');
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
        alert('Class added successfully!');
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to add class: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding class:', error);
      alert('An error occurred while adding the class');
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
        alert('Class deleted successfully');
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to delete class: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('An error occurred while deleting the class');
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

  const handleRemoveTeacher = async (assignmentId: number, teacherName: string) => {
    if (!confirm(`Remove ${teacherName} from this class?`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/Attendance/class-teacher/${assignmentId}`, {
        method: 'DELETE'
      });

      if (response && response.ok) {
        alert(`${teacherName} removed successfully`);
        if (selectedClassForTeacher) {
          await fetchClassTeachers(selectedClassForTeacher.id);
        }
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to remove teacher: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing teacher:', error);
      alert('An error occurred while removing the teacher');
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
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(newTeacherForm.email)) {
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
        alert('Teacher created and assigned successfully! Login credentials sent to email.');
        setNewTeacherForm({firstName: '', lastName: '', email: ''});
        setShowAddTeacherForm(false);
        await fetchClassTeachers(selectedClassForTeacher.id);
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to create teacher: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      alert('An error occurred while creating the teacher');
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
      alert('Please fill in all required fields (Title, First Name, Last Name, ID Number)');
      return;
    }

    // Validate ID Number (must be 13 digits)
    if (!/^\d{13}$/.test(addLearnerForm.idNumber)) {
      alert('ID Number must be exactly 13 digits (numbers only)');
      return;
    }

    // Validate ID number format
    const idValidation = parseSouthAfricanID(addLearnerForm.idNumber);
    if (!idValidation.valid) {
      alert(`Invalid ID Number: ${idValidation.error}`);
      return;
    }

    // Check for any field validation errors
    if (Object.keys(formErrors).length > 0) {
      alert('Please fix the validation errors before submitting:\n' + Object.values(formErrors).join('\n'));
      return;
    }

    // Validate optional fields if filled
    if (addLearnerForm.contactNumber && !validateContactNumber(addLearnerForm.contactNumber)) {
      alert('Invalid contact number. Must be 10 digits starting with 0');
      return;
    }

    if (addLearnerForm.email && !validateEmail(addLearnerForm.email)) {
      alert('Invalid email address');
      return;
    }

    if (addLearnerForm.postalCode && !validatePostalCode(addLearnerForm.postalCode)) {
      alert('Invalid postal code. Must be 4 digits');
      return;
    }

    if (addLearnerForm.yearOfCompletion && !validateYear(addLearnerForm.yearOfCompletion)) {
      alert(`Invalid year of completion. Must be between 1900 and ${new Date().getFullYear()}`);
      return;
    }

    if (addLearnerForm.nextOfKinContactNumber && !validateContactNumber(addLearnerForm.nextOfKinContactNumber)) {
      alert('Invalid next of kin contact number. Must be 10 digits starting with 0');
      return;
    }

    if (addLearnerForm.accountNumber && !validateAccountNumber(addLearnerForm.accountNumber)) {
      alert('Invalid account number. Must be 6-11 digits');
      return;
    }

    if (addLearnerForm.branchCode && !validateBranchCode(addLearnerForm.branchCode)) {
      alert('Invalid branch code. Must be 6 digits');
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
        alert('Learner added successfully!');
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
        
        alert(`Failed to add learner: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error adding learner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`An error occurred while adding the learner: ${errorMessage}`);
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
        alert('Document approved successfully!');
      } else if (response) {
        const error = await response.json();
        alert(`Failed to approve document: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving document:', error);
      alert('An error occurred while approving the document');
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
        alert('Document declined successfully!');
      } else if (response) {
        const error = await response.json();
        alert(`Failed to decline document: ${error.message}`);
      }
    } catch (error) {
      console.error('Error declining document:', error);
      alert('An error occurred while declining the document');
    }
  };

  const viewDocument = async (documentId: number) => {
    try {
      // Find the document details
      const document = selectedProjectDocuments
        .flatMap(learner => learner.documents)
        .find(doc => doc.id === documentId);
      
      if (!document) {
        alert('Document not found');
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
        alert('Failed to load document');
        setShowDocumentModal(false);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('An error occurred while loading the document');
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
        alert(error.message || 'Failed to download documents');
      }
    } catch (error) {
      console.error('Error in bulk download:', error);
      alert('An error occurred during bulk download');
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
        alert('Learner updated successfully');
        setShowLearnerModal(false);
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to update learner: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating learner:', error);
      alert('An error occurred while updating the learner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLearner || !selectedFile || !selectedDocumentType) {
      alert('Please select a document type and file');
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
        alert('Document uploaded successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to upload document: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('An error occurred while uploading the document');
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
        alert(`Failed to view document: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('An error occurred while viewing the document');
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
      alert('Please fill in all required fields');
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
        alert('Task created successfully! The assigned user will receive an email notification.');
      } else if (response) {
        const errorData = await response.json();
        alert(`Failed to create task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('An error occurred while creating the task');
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
        alert('Please ensure all questions have text and valid marks greater than 0.');
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
        alert(`Formative assessment added successfully!\n${formativeQuestions.length} question(s) saved\nTotal Marks: ${totalMarks.toFixed(2)}`);
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
        alert('Failed to add assessment');
      }
    } catch (error) {
      console.error('Error adding formative assessment:', error);
      alert('An error occurred');
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
        alert('Please ensure all questions have text and valid marks greater than 0.');
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
        alert(`Summative assessment added successfully!\n${summativeQuestions.length} question(s) saved\nTotal Marks: ${totalMarks.toFixed(2)}`);
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
        alert('Failed to add assessment');
      }
    } catch (error) {
      console.error('Error adding summative assessment:', error);
      alert('An error occurred');
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
      alert('Failed to load project learners and qualifications for marking');
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
      alert('Failed to load questions and learner answers');
    }
  };

  const openMarkingAnswerPreview = async (answerId: number) => {
    try {
      const response = await fetchWithAuth(`/api/LearnerAssessmentAnswers/${answerId}/download`);
      if (!response || !response.ok) {
        alert('Unable to open learner upload');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMarkingAnswerPreviewUrl(url);
    } catch (error) {
      console.error('Failed to preview learner upload:', error);
      alert('Failed to preview learner upload');
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
        alert('No marks found to submit');
        return;
      }

      for (const answer of answersToSubmit) {
        await fetchWithAuth('/api/LearnerAssessmentAnswers/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer)
        });
      }

      alert('Marks submitted successfully to the server');
      // Refresh answers and progress
      await Promise.all([
        openMarkingAssessment(expandedMarkingAssessment.id, expandedMarkingAssessment.type, isRemedialMarking),
        refreshProgress()
      ]);
    } catch (error) {
      console.error('Error submitting marks:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit marks to the server');
    } finally {
      setMarkingSaving(false);
    }
  };

  const saveSectionMarksDraft = () => {
    if (!expandedMarkingAssessment || !markingLearnerId) return;
    const key = `sideMarking:${expandedMarkingAssessment.type}:${expandedMarkingAssessment.id}:learner:${markingLearnerId}`;
    localStorage.setItem(key, JSON.stringify(draftMarks));
    alert('Marks saved as draft locally');
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
      alert('Failed to load learner submissions for marking');
      setShowMarkingModal(false);
      setMarkingAssessment(null);
    } finally {
      setMarkingLoading(false);
    }
  };

  const saveMarkingDraft = () => {
    if (!markingAssessment) return;
    localStorage.setItem(getDraftMarkStorageKey(markingAssessment.type, markingAssessment.id), JSON.stringify(draftMarks));
    alert('Draft marks saved on this browser');
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
        alert('No marks found to submit');
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

      alert('Marks submitted successfully to the server');
      localStorage.removeItem(getDraftMarkStorageKey(markingAssessment.type, markingAssessment.id));
      await Promise.all([
        openMarkingModal(markingAssessment.id, markingAssessment.type, markingAssessment.unitStandardId),
        refreshProgress()
      ]);
    } catch (error) {
      console.error('Error submitting marks:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit marks to the server');
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
        alert('Logbook entry added successfully!');
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
        alert(`Failed to add logbook entry: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding logbook entry:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        alert('Task status updated successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to update task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('An error occurred while updating the task');
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
        alert('Failed to export monthly attendance');
      }
    } catch (error) {
      console.error('Error exporting attendance:', error);
      alert('An error occurred during export');
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
        alert('Failed to export stipend schedule');
      }
    } catch (error) {
      console.error('Error exporting stipend:', error);
      alert('An error occurred during export');
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
      alert('This assessment has already been moderated and cannot be submitted again.');
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
      alert(`Please make a decision (Uphold or Withdraw) for all questions before submitting. Undecided: Q${qNumbers}`);
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
      
      alert('Moderation submitted successfully');
      
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
      alert(error instanceof Error ? error.message : 'An error occurred during moderation submission');
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
        color: '#4facfe'
      };
    }
    
    if (isQA) {
      return {
        title: 'Quality Assurance Manager Dashboard',
        icon: '🎯',
        description: 'Ensure quality standards and compliance',
        color: '#4facfe'
      };
    }

    if (isAssessor) {
      return {
        title: 'Assessor Dashboard',
        icon: '✍️',
        description: 'Assess and mark learner submissions',
        color: '#4facfe'
      };
    }

    if (isModerator) {
      return {
        title: 'Moderator Dashboard',
        icon: '⚖️',
        description: 'Moderate and verify assessment marks',
        color: '#4facfe'
      };
    }

    if (isAdmin) {
      return {
        title: 'Administrator Dashboard',
        icon: '👑',
        description: 'Manage all SDP operations and oversight',
        color: '#4facfe'
      };
    }
    
    if (isFinance) {
      return {
        title: 'Financial Manager Dashboard',
        icon: '💰',
        description: 'Manage financial operations and budget oversight',
        color: '#4facfe'
      };
    }
    
    if (isLogistics) {
      return {
        title: 'Logistics Manager Dashboard',
        icon: '🚚',
        description: 'Oversee logistics, resources, and supply chain',
        color: '#4facfe'
      };
    }
    
    if (isIT) {
      return {
        title: 'IT Manager Dashboard',
        icon: '💻',
        description: 'Manage users, system logs, and technical support',
        color: '#4facfe'
      };
    }

    return {
      title: 'Manager Dashboard',
      icon: '👨‍💼',
      description: 'Manage your department operations',
      color: '#4facfe'
    };
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

  // Temporary debug display
  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>Debug: No User Data</h4>
          <p>User data not found in localStorage</p>
        </div>
      </div>
    );
  }

  const managerInfo = getManagerTypeInfo();

  const renderSystemLogs = () => (
    <div className="card border-0 shadow-lg">
      <div className="card-header border-0 bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">📜 System Logs & Audit Trail</h4>
        <button className="btn btn-light btn-sm" onClick={fetchSystemLogs} disabled={logsLoading}>
          {logsLoading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
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

  const renderAllUsers = () => (
    <div className="card border-0 shadow-lg">
      <div className="card-header border-0 bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">👤 User Management (All SDP Users)</h4>
        <button className="btn btn-light btn-sm" onClick={() => setShowAddMemberModal(true)}>
          + Add New User
        </button>
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
        <div className="card border-0 shadow-lg" style={{
          backgroundColor: "#4facfe",
          color: "#ffffff"
        }}>
          <div className="card-body text-center text-white py-5">
            <div className="display-1 mb-3">{managerInfo.icon}</div>
            <h2 className="mb-3">Welcome, {user?.name}</h2>
            <p className="mb-2 opacity-75">{managerInfo.title} Dashboard</p>
            <p className="mb-0 opacity-75">{managerInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Super User Quick Actions */}
      {isSuperUser && (
        <div className="col-12 mt-4">
          <div className="card border-0 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body p-4">
              <h5 className="text-white mb-3">🚀 Super User Quick Actions</h5>
              <div className="d-flex flex-wrap gap-3">
                <button 
                  onClick={() => navigate('/sdp-dashboard', { state: { section: 'add-department' } })}
                  className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '10px 20px', color: '#4facfe' }}
                >
                  <span>👤</span> Add Department Manager
                </button>
                <button 
                  onClick={() => setActiveSection('projects')}
                  className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '10px 20px', color: '#4facfe' }}
                >
                  <span>🏢</span> Manage Sites & Logistics
                </button>
                <button 
                  onClick={() => setActiveSection('allUsers')}
                  className="btn btn-light shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '10px 20px', color: '#4facfe' }}
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
        <div className="card border-0 shadow-lg h-100" style={{
          backgroundColor: "#4facfe",
          color: "#ffffff"
        }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center">
            <div className="display-4 mb-3">📁</div>
            <h4 className="mb-2">{filteredProjects.length}</h4>
            <p className="mb-0 opacity-75">Active Projects</p>
          </div>
        </div>
      </div>
      
      {/* Team Members Stat - Hidden for Assessors and Moderators */}
      {(!isAssessor && (!isModerator || isQA || isIT)) && (
        <div className="col-md-3">
          <div className="card border-0 shadow-lg h-100" style={{
            backgroundColor: "#4facfe",
            color: "#ffffff"
          }}>
            <div className="card-body text-center text-white d-flex flex-column justify-content-center">
              <div className="display-4 mb-3">👥</div>
              <h4 className="mb-2">{isIT ? allSdpUsers.length : teamMembers.length}</h4>
              <p className="mb-0 opacity-75">{isIT ? 'Total System Users' : 'Team Members'}</p>
            </div>
          </div>
        </div>
      )}
      
      {isIT && (
        <div className="col-md-3">
          <div className="card border-0 shadow-lg h-100" style={{
            backgroundColor: "#f59e0b",
            color: "#ffffff"
          }}>
            <div className="card-body text-center text-white d-flex flex-column justify-content-center">
              <div className="display-4 mb-3">📜</div>
              <h4 className="mb-2">{systemLogs.length}</h4>
              <p className="mb-0 opacity-75">Recent Logs</p>
            </div>
          </div>
        </div>
      )}

      {!isIT && (
        <div className="col-md-3">
          <div className="card border-0 shadow-lg h-100" style={{
            backgroundColor: "#4facfe",
            color: "#ffffff"
          }}>
            <div className="card-body text-center text-white d-flex flex-column justify-content-center">
              <div className="display-4 mb-3">✅</div>
              <h4 className="mb-2">{projectTasks.length}</h4>
              <p className="mb-0 opacity-75">Active Tasks</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="col-md-3">
        <div className="card border-0 shadow-lg h-100" style={{
          backgroundColor: isIT ? "#10b981" : "#4facfe",
          color: "#ffffff"
        }}>
          <div className="card-body text-center text-white d-flex flex-column justify-content-center">
            <div className="display-4 mb-3">{isIT ? '🛠️' : '📊'}</div>
            {isIT ? (
              <>
                <h4 className="mb-2">Active</h4>
                <p className="mb-0 opacity-75">System Support</p>
              </>
            ) : isAdmin ? (
              <>
                <h6 className="mb-2">Today's Attendance</h6>
                {attendanceLoading ? (
                  <p className="mb-0 opacity-75">Loading...</p>
                ) : attendanceProjects.length > 0 ? (
                  <div className="text-start">
                    {attendanceProjects.map((project, index) => (
                      <div key={project.projectId} className="mb-1">
                        <small className="opacity-75">
                          {project.projectName.length > 15 ? 
                            `${project.projectName.substring(0, 15)}...` : 
                            project.projectName
                          }: {project.presentToday} present
                        </small>
                      </div>
                    ))}
                    {attendanceProjects.length > 3 && (
                      <small className="opacity-75">
                        +{attendanceProjects.length - 3} more projects
                      </small>
                    )}
                  </div>
                ) : (
                  <p className="mb-0 opacity-75">No attendance data</p>
                )}
              </>
            ) : (
              <>
                <h4 className="mb-2">{filteredProjects.length}</h4>
                <p className="mb-0 opacity-75">Active Projects</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Visualization Charts */}
      <div className="col-12">
        <div className="row g-4">
          {/* Enrollment Progress */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4">
                <h5 className="mb-0">👨‍🎓 Enrollment vs. Target</h5>
                <small className="text-muted">Actual learners enrolled against project capacity</small>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="Enrolled" dataKey="enrolled" fill="#4facfe" radius={[4, 4, 0, 0]} />
                    <Bar name="Target" dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">📈 Attendance Rates (%)</h5>
                  <small className="text-muted">Current attendance performance per project</small>
                </div>
                <div className="btn-group btn-group-sm">
                  <button 
                    className={`btn ${overviewAttendancePeriod === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setOverviewAttendancePeriod('today')}
                  >
                    Today
                  </button>
                  <button 
                    className={`btn ${overviewAttendancePeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setOverviewAttendancePeriod('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={`btn ${overviewAttendancePeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setOverviewAttendancePeriod('month')}
                  >
                    Month
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceChartData}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="rate" stroke="#10b981" fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Document Compliance */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4">
                <h5 className="mb-0">📄 Document Compliance by Type</h5>
                <small className="text-muted">Percentage of expected documents submitted</small>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentComplianceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={150} fontSize={10} />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        if (name === 'Compliance %') return [`${value.toFixed(1)}%`, name];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Document: ${label}`}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow-sm">
                              <p className="fw-bold mb-1">{label}</p>
                              <p className="text-primary mb-0">Compliance: {data.compliance.toFixed(1)}%</p>
                              <p className="text-success mb-0">Submitted: {data.submitted}</p>
                              <p className="text-danger mb-0">Missing: {data.missing}</p>
                              <p className="text-muted small mb-0">Total Expected: {data.expected}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar name="Compliance %" dataKey="compliance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Document Status Pie */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header border-0 bg-white pt-4">
                <h5 className="mb-0">📁 Overall Document Status</h5>
                <small className="text-muted">Approval progress of all submissions</small>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallDocStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {overallDocStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
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
            <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
              <h5 className="mb-0">📊 Today's Attendance Summary</h5>
            </div>
            <div className="card-body">
              {attendanceLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
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
                          <h6 className="card-title text-primary mb-3">
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

      {/* System Functions Overview */}
      <div className="col-12">
        <div className="card border-0 shadow-lg mb-4">
          <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
            <h4 className="mb-0">🎯 System Functions Overview</h4>
          </div>
          <div className="card-body">
            <div className="row g-4">
              
                {/* Projects Management - Hidden for Assessors and Moderators */}
                {(!isAssessor && (!isModerator || isQA || isIT)) && (
                  <div className="col-md-6">
                    <div className="card h-100 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ fontSize: '2rem' }}>📁</div>
                          <div>
                            <h5 className="mb-1 text-primary">Projects Management</h5>
                            <small className="text-muted">Comprehensive project oversight</small>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>✨</span>
                            <div>
                              <strong>Project Creation & Setup:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Create new projects with qualifications and unit standards</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🏢</span>
                            <div>
                              <strong>Site Management:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Add and manage project sites with location details</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🎓</span>
                            <div>
                              <strong>Class Management:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Create classes within sites and assign capacity</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>👨‍🎓</span>
                            <div>
                              <strong>Learner Enrollment:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Register learners with comprehensive profiles</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📝</span>
                            <div>
                              <strong>Assessment System:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Create formative, summative, and logbook assessments</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>👨‍🏫</span>
                            <div>
                              <strong>Teacher Assignment:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Assign teachers to classes with email notifications</small>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveSection('projects')}
                        >
                          Manage Projects →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* IT User Management Card */}
                {isIT && (
                  <div className="col-md-6">
                    <div className="card h-100 border-0" style={{ backgroundColor: '#f0f9ff' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ fontSize: '2rem' }}>👤</div>
                          <div>
                            <h5 className="mb-1 text-primary">System User Management</h5>
                            <small className="text-muted">Manage all users in the system</small>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>➕</span>
                            <div>
                              <strong>User Creation:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Create and invite new managers, teachers, and admins</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🔐</span>
                            <div>
                              <strong>Security Controls:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Reset passwords and manage account status</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🏢</span>
                            <div>
                              <strong>Department Sync:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Assign users to appropriate departments</small>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveSection('allUsers')}
                        >
                          Manage System Users →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* IT System Logs Card */}
                {isIT && (
                  <div className="col-md-6">
                    <div className="card h-100 border-0" style={{ backgroundColor: '#fff7ed' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ fontSize: '2rem' }}>📜</div>
                          <div>
                            <h5 className="mb-1 text-warning">System Logs & Monitoring</h5>
                            <small className="text-muted">Track system activity and health</small>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🔍</span>
                            <div>
                              <strong>Audit Trail:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Review user actions and system changes</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>⚠️</span>
                            <div>
                              <strong>Error Tracking:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Monitor and investigate system warnings or errors</small>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => setActiveSection('systemLogs')}
                        >
                          View System Logs →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Management - Hidden for Assessors and Moderators (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <div className="col-md-6">
                    <div className="card h-100 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ fontSize: '2rem' }}>👥</div>
                          <div>
                            <h5 className="mb-1 text-primary">Team Management</h5>
                            <small className="text-muted">Manage your department team</small>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>➕</span>
                            <div>
                              <strong>Add Team Members:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Invite new members to your department</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🎭</span>
                            <div>
                              <strong>Role Assignment:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Assign appropriate roles and permissions</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📞</span>
                            <div>
                              <strong>Contact Management:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Maintain team contact information</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🏢</span>
                            <div>
                              <strong>Department Overview:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>View all team members and their roles</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📊</span>
                            <div>
                              <strong>User Status:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Monitor active and inactive team members</small>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveSection('team')}
                        >
                          Manage Team →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Management - Hidden for Assessors and Moderators (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <div className="col-md-6">
                    <div className="card h-100 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ fontSize: '2rem' }}>✅</div>
                          <div>
                            <h5 className="mb-1 text-primary">Task Management</h5>
                            <small className="text-muted">Project-focused task tracking</small>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📋</span>
                            <div>
                              <strong>Project-Based Tasks:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Create tasks linked to specific projects</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>⏰</span>
                            <div>
                              <strong>Due Date Alerts:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Automatic alerts for overdue and upcoming tasks</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🎯</span>
                            <div>
                              <strong>Priority Management:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Set task priorities (Low, Medium, High, Critical)</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>👤</span>
                            <div>
                              <strong>Task Assignment:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Assign tasks to team members</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📈</span>
                            <div>
                              <strong>Progress Tracking:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Monitor task status and completion rates</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📊</span>
                            <div>
                              <strong>Task Statistics:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>View comprehensive task analytics</small>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveSection('tasks')}
                        >
                          Manage Tasks →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendance Tracking - Hidden for Assessors and Moderators (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <div className="col-md-6">
                    <div className="card h-100 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ fontSize: '2rem' }}>📊</div>
                          <div>
                            <h5 className="mb-1 text-primary">Attendance Tracking</h5>
                            <small className="text-muted">Advanced attendance analytics</small>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>⚡</span>
                            <div>
                              <strong>Real-Time Monitoring:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Track daily attendance across all projects</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📅</span>
                            <div>
                              <strong>Weekly Analysis:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Individual learner weekly attendance patterns</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🏫</span>
                            <div>
                              <strong>Class Breakdown:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Attendance rates by class and site</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🔍</span>
                            <div>
                              <strong>Time Filtering:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>View attendance by day, week, month, or custom range</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>⏱️</span>
                            <div>
                              <strong>Contact Hours:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Calculate and track learner contact time</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📄</span>
                            <div>
                              <strong>Attendance Reports:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Generate comprehensive attendance reports</small>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveSection('attendanceTracking')}
                        >
                          Track Attendance →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Approvals - Hidden for Assessors and Moderators (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <div className="col-md-6">
                    <div className="card h-100 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ fontSize: '2rem' }}>📋</div>
                          <div>
                            <h5 className="mb-1 text-primary">Document Approvals</h5>
                            <small className="text-muted">Learner document verification</small>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🔍</span>
                            <div>
                              <strong>Document Review:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Review and approve learner documents</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📄</span>
                            <div>
                              <strong>Document Types:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Handle ID, CV, bank letters, qualifications, etc.</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>✅</span>
                            <div>
                              <strong>Approval Workflow:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Approve or decline with detailed reasons</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>👁️</span>
                            <div>
                              <strong>Document Preview:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>View documents before making decisions</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>📈</span>
                            <div>
                              <strong>Approval Statistics:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Track approval rates and document compliance</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>🎯</span>
                            <div>
                              <strong>Project Overview:</strong>
                              <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Monitor document status across all projects</small>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveSection('documentApprovals')}
                        >
                          Review Documents →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Mobile Integration */}
              <div className="col-md-6">
                <div className="card h-100 border-0" style={{ backgroundColor: '#e8f5e8' }}>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-3" style={{ fontSize: '2rem' }}>📱</div>
                      <div>
                        <h5 className="mb-1 text-success">Mobile App Integration</h5>
                        <small className="text-muted">Connected mobile functionality</small>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>👆</span>
                        <div>
                          <strong>Fingerprint Attendance:</strong>
                          <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Biometric clocking via mobile app</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>📸</span>
                        <div>
                          <strong>Document Scanning:</strong>
                          <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Mobile document capture and upload</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>📝</span>
                        <div>
                          <strong>Assessment Scanning:</strong>
                          <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Scan and submit assessment answers</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>👨‍🎓</span>
                        <div>
                          <strong>Learner Registration:</strong>
                          <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Mobile learner enrollment with photos</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>👨‍🏫</span>
                        <div>
                          <strong>Teacher Dashboard:</strong>
                          <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Mobile teacher interface for class management</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>🔄</span>
                        <div>
                          <strong>Real-Time Sync:</strong>
                          <small className="d-block" style={{ color: '#2c3e50', fontWeight: '500' }}>Instant synchronization with web dashboard</small>
                        </div>
                      </div>
                    </div>
                    <div className="badge bg-success">Mobile App Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager Information */}
      <div className="col-12">
        <div className="card border-0 shadow-lg">
          <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
          <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
    console.log('SDPManagerDashboard: renderProjects called, projects.length:', filteredProjects.length);
    console.log('SDPManagerDashboard: projects array:', filteredProjects);
    
    return (
    <div>
      <div className="card border-0 shadow-lg mb-4" style={{
        backgroundColor: "#4facfe",
        color: "#ffffff"
      }}>
        <div className="card-body text-center text-white py-4">
          <h2 className="mb-2">📋 Projects Overview</h2>
          <p className="mb-0 opacity-75">Monitor and track project progress</p>
        </div>
      </div>
      
      {filteredProjects.length > 0 ? (
        <div className="row g-4">
          {filteredProjects.map((project) => {
            console.log('SDPManagerDashboard: Rendering project:', project);
            const isExpanded = expandedProjects[project.id];
            const details = projectDetails[project.id];
            
            try {
              return (
              <div key={project.id} className="col-12">
                <div className="card border-0 shadow-lg" style={{
                  backgroundColor: "#4facfe",
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
          backgroundColor: "#4facfe",
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
        backgroundColor: "#4facfe",
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
            backgroundColor: "#4facfe",
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
            backgroundColor: "#4facfe",
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
            backgroundColor: "#4facfe",
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
            backgroundColor: "#4facfe",
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
        backgroundColor: "#4facfe",
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
        backgroundColor: "#4facfe",
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
          backgroundColor: "#4facfe",
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
          backgroundColor: "#4facfe",
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
          backgroundColor: "#4facfe",
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
              <div className="modal-header" style={{ backgroundColor: "#4facfe" }}>
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
                      style={{ backgroundColor: "#4facfe", border: 'none' }}
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
        backgroundColor: "#4facfe",
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
            <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
                            <i className="fas fa-arrow-right text-primary"></i>
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
            <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
                    <div className="text-primary">
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
                <div className="spinner-border text-primary" role="status">
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
              <div className="modal-header" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
                      style={{ backgroundColor: "#4facfe", border: 'none' }}
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
      <div className="card-header border-0 py-4" style={{ backgroundColor: "#4facfe", color: "#ffffff" }}>
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
            <div className="spinner-border text-primary" role="status">
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
        backgroundColor: "#4facfe",
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
          <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
            <h5 className="mb-0">📁 Select Project to Track Attendance</h5>
          </div>
          <div className="card-body">
            {attendanceLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
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
                        <h6 className="card-title text-primary mb-3">{project.projectName}</h6>
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
                <div className="d-flex gap-2">
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
              <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
                <h5 className="mb-0">📈 Attendance Overview</h5>
              </div>
              <div className="card-body">
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h2 mb-1 text-primary">{attendanceStats.totalLearners}</div>
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
              <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
              <div className="card-header border-0" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
                            <div className="col-md-6">
                              <h6 className="mb-0">
                                <strong>{learner.firstName} {learner.lastName}</strong>
                                <small className="text-muted ms-2">{learner.idNumber}</small>
                              </h6>
                            </div>
                            <div className="col-md-6">
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
                                  <div className="text-primary">
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
              <div className="modal-header" style={{ backgroundColor: "#4facfe", color: 'white' }}>
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
                      <div className="h4 text-primary">{attendanceReport.summary.overallAttendanceRate}%</div>
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
              <h3 className="mb-0 fw-bold text-primary">Assessment Planning</h3>
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
                    alert('Assessment plan saved and applied to all assigned learners!');
                    fetchAssessmentStrategyPlans(); // Refresh plans
                    setShowAssessmentPlanForm(false);
                    setSelectedPlanUnitStandard(null);
                  }
                } catch (error) {
                  console.error('Error saving plan:', error);
                  alert('Failed to save assessment plan.');
                }
              }}
            >
              <span>💾</span> Save & Apply Plan
            </button>
          </div>

          {/* Assessor Info & Plan Context */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '5px solid #4facfe' }}>
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
                          onChange={(e) => setAssessmentPlanForm({
                            ...assessmentPlanForm, 
                            practicalAssignment: { ...assessmentPlanForm.practicalAssignment, equipment: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-top text-center">
                <p className="text-muted small mb-4">
                  <strong>Verification Status:</strong> Verified Assessor Profile (Digital Signature Applied: {user?.name})
                </p>
                <button 
                  className="btn btn-success btn-lg shadow-sm px-5 d-inline-flex align-items-center gap-2"
                  onClick={async () => {
                    const signatureData = signaturePadRef.current?.isEmpty() 
                      ? assessmentPlanForm.assessorSignature 
                      : signaturePadRef.current?.getCanvas().toDataURL('image/png');

                    const planDto = {
                      ...(assessmentStrategyPlans[selectedPlanUnitStandard.id] || {}),
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
                      assessorSignature: signatureData
                    };

                    try {
                      const response = await fetchWithAuth('/api/assessments/strategy-plans', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(planDto)
                      });

                      if (response && response.ok) {
                        alert('Assessment plan saved and applied to all assigned learners!');
                        fetchAssessmentStrategyPlans(); // Refresh plans
                        setShowAssessmentPlanForm(false);
                        setSelectedPlanUnitStandard(null);
                      }
                    } catch (error) {
                      console.error('Error saving plan:', error);
                      alert('Failed to save assessment plan.');
                    }
                  }}
                >
                  <span>💾</span> Save & Apply Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // List of Unit Standards
    const allUnitStandards: any[] = [];
    filteredProjects.forEach(project => {
      const details = projectDetails[project.id];
      if (details?.learningPathways) {
        details.learningPathways.forEach((lp: any) => {
          if (lp.qualifications) {
            lp.qualifications.forEach((q: any) => {
              if (q.unitStandards) {
                q.unitStandards.forEach((us: any) => {
                  allUnitStandards.push({
                    ...us,
                    projectId: project.id,
                    projectName: project.projectName,
                    pathwayName: lp.pathway?.name || 'Unknown',
                    actualQualificationName: q.legacyQualification?.name || q.occupationalQualification?.name || 'Unknown'
                  });
                });
              }
            });
          }
        });
      }
    });

    return (
      <div className="container-fluid">
        <div className="card border-0 shadow-lg mb-4" style={{ backgroundColor: "#4facfe", color: "#ffffff" }}>
          <div className="card-body text-center text-white py-4">
            <h2 className="mb-2">📝 Assessment Planning</h2>
            <p className="mb-0 opacity-75">Select a unit standard to create an assessment plan</p>
          </div>
        </div>

        <div className="card border-0 shadow-lg">
          <div className="card-header bg-white border-0 pt-4 px-4">
            <h5 className="mb-0">Unit Standards</h5>
            <p className="text-muted small">Available unit standards from your assigned projects</p>
          </div>
          <div className="card-body p-4">
            {allUnitStandards.length > 0 ? (
              <div className="row g-3">
                {allUnitStandards.map((us, index) => (
                  <div key={`${us.id}-${index}`} className="col-md-6 col-lg-4">
                    {(() => {
                      const hasStrategy = !!(assessmentStrategyPlans[us.id]?.assessmentDate);
                      return (
                        <div 
                          className={`card h-100 hover-shadow transition-all ${hasStrategy ? 'opacity-75' : 'cursor-pointer'}`}
                          style={{ borderLeft: `4px solid ${hasStrategy ? '#10b981' : '#4facfe'}` }}
                          onClick={() => {
                            if (!hasStrategy) {
                              setSelectedPlanUnitStandard(us);
                              setShowAssessmentPlanForm(true);
                            }
                          }}
                        >
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className={`badge ${hasStrategy ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} px-2 py-1`}>
                                US ID: {us.unitStandardId || 'N/A'}
                              </span>
                              <span className="badge bg-info-subtle text-info px-2 py-1">L{us.level}</span>
                            </div>
                            <h6 className="card-title mb-2 text-dark">{us.unitStandardName}</h6>
                            <div className="mb-3">
                              <small className="text-muted d-block"><strong>Project:</strong> {us.projectName}</small>
                              <small className="text-muted d-block"><strong>Pathway:</strong> {us.pathwayName}</small>
                              <small className="text-muted d-block"><strong>Qualification:</strong> {us.actualQualificationName}</small>
                              <small className="text-muted d-block"><strong>Credits:</strong> {us.credits}</small>
                            </div>
                            
                            {hasStrategy ? (
                              <div className="mt-auto">
                                <div className="alert alert-success py-1 px-2 mb-2 small d-flex align-items-center gap-2">
                                  <span>✅</span> Plan Created
                                </div>
                                <button className="btn btn-sm btn-outline-success w-100" disabled>
                                  Plan Applied
                                </button>
                              </div>
                            ) : (
                              <button className="btn btn-sm btn-outline-primary w-100 mt-auto">
                                Create Plan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="display-1 mb-3">📁</div>
                <h4>No Unit Standards Found</h4>
                <p className="text-muted">Expand projects in the "Projects" section to load unit standards first.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveSection('projects')}
                >
                  Go to Projects
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCandidatePreparation = () => {
    if (showPrepForm && selectedPrepUnitStandard) {
      const isReadOnly = !!(assessmentStrategyPlans[selectedPrepUnitStandard.id]?.prepItemsJson);

      return (
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button 
              className="btn btn-outline-primary shadow-sm d-flex align-items-center gap-2"
              onClick={() => {
                setShowPrepForm(false);
                setSelectedPrepUnitStandard(null);
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>←</span> Back to Unit Standards
            </button>
            <div className="text-center">
              <h3 className="mb-0 fw-bold text-primary">Candidate Assessment Preparation</h3>
              <p className="text-muted small mb-0">{isReadOnly ? 'View preparation record' : 'Prepare candidates for their upcoming assessment'}</p>
            </div>
            {!isReadOnly && (
              <button 
                className="btn btn-success shadow-sm px-4 d-flex align-items-center gap-2"
                onClick={async () => {
                  const planDto = {
                    ...(assessmentStrategyPlans[selectedPrepUnitStandard.id] || {}),
                    projectQualificationUnitStandardId: selectedPrepUnitStandard.id,
                    prepDate: prepForm.date,
                    prepTime: prepForm.time,
                    prepVenue: prepForm.venue,
                    prepComments: prepForm.comments,
                    prepItemsJson: JSON.stringify(prepForm.items)
                  };

                  try {
                    const response = await fetchWithAuth('/api/assessments/strategy-plans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(planDto)
                    });

                    if (response && response.ok) {
                      alert('Candidate preparation plan saved and applied to all assigned learners!');
                      fetchAssessmentStrategyPlans(); // Refresh plans
                      setShowPrepForm(false);
                      setSelectedPrepUnitStandard(null);
                    }
                  } catch (error) {
                    console.error('Error saving prep plan:', error);
                    alert('Failed to save candidate preparation plan.');
                  }
                }}
              >
                <span>💾</span> Save & Apply
              </button>
            )}
            {isReadOnly && (
              <div className="badge bg-success-subtle text-success p-2 px-3 border border-success border-opacity-25 d-flex align-items-center gap-2">
                <span>✅</span> Record Finalized
              </div>
            )}
          </div>

          {/* Context & Assessor Info */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '5px solid #4facfe' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary-subtle p-3 rounded-circle">
                      <span style={{ fontSize: '1.5rem' }}>📖</span>
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold">{selectedPrepUnitStandard.unitStandardName}</h5>
                      <div className="d-flex gap-2 align-items-center">
                        <span className="badge bg-primary">ID: {selectedPrepUnitStandard.unitStandardId}</span>
                        <span className="badge bg-info">Level {selectedPlanUnitStandard?.level || selectedPrepUnitStandard.level}</span>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-4 pt-3 border-top g-3">
                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Assigned Project</small>
                      <p className="mb-0 fw-semibold">{selectedPrepUnitStandard.projectName}</p>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Qualification / Pathway</small>
                      <p className="mb-0 fw-semibold">{selectedPrepUnitStandard.pathwayName}</p>
                      <small className="text-muted">{selectedPrepUnitStandard.actualQualificationName}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '5px solid #10b981' }}>
                <div className="card-body p-4">
                  <h6 className="text-uppercase text-muted fw-bold mb-3" style={{ fontSize: '0.75rem' }}>Assessor</h6>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-success-subtle p-2 rounded-circle">
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                    </div>
                    <div>
                      <p className="mb-0 fw-bold">{user?.name}</p>
                      <p className="mb-0 text-muted small">{user?.email}</p>
                    </div>
                  </div>
                  <div className="alert alert-info border-0 small mb-0 py-2">
                    <span>💡 This prep plan applies to <strong>all candidates</strong> for this US.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="card shadow-lg border-0 overflow-hidden mb-5">
            <div className="card-header bg-white border-0 py-4 px-5">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="p-2 bg-light rounded border">
                    <label className="text-muted small fw-bold d-block mb-1">PREPARATION DATE</label>
                    <input 
                      type="date" 
                      className="form-control form-control-sm border-0 bg-transparent fw-bold shadow-none p-0"
                      value={prepForm.date}
                      onChange={(e) => setPrepForm({...prepForm, date: e.target.value})}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-2 bg-light rounded border">
                    <label className="text-muted small fw-bold d-block mb-1">TIME</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm border-0 bg-transparent fw-bold shadow-none p-0"
                      placeholder="e.g., 09:00 AM"
                      value={prepForm.time}
                      onChange={(e) => setPrepForm({...prepForm, time: e.target.value})}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-2 bg-light rounded border">
                    <label className="text-muted small fw-bold d-block mb-1">VENUE / LOCATION</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm border-0 bg-transparent fw-bold shadow-none p-0"
                      placeholder="Enter venue..."
                      value={prepForm.venue}
                      onChange={(e) => setPrepForm({...prepForm, venue: e.target.value})}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-5 py-3" style={{ width: '40%' }}>How to prepare the candidate</th>
                      <th className="py-3" style={{ width: '30%' }}>Document Requirements</th>
                      <th className="py-3 text-center" style={{ width: '10%' }}>Agree</th>
                      <th className="pe-5 py-3" style={{ width: '20%' }}>Action Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prepForm.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="ps-5 py-3">
                          <p className="mb-0 fw-medium text-dark">{item.text}</p>
                        </td>
                        <td className="py-3">
                          <span className="text-muted small">{item.docs}</span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="form-check d-flex justify-content-center">
                            <input 
                              className="form-check-input shadow-none cursor-pointer" 
                              type="checkbox"
                              style={{ width: '1.2rem', height: '1.2rem' }}
                              checked={item.agreed}
                              onChange={(e) => {
                                const newItems = [...prepForm.items];
                                newItems[index].agreed = e.target.checked;
                                setPrepForm({...prepForm, items: newItems});
                              }}
                              disabled={isReadOnly}
                            />
                          </div>
                        </td>
                        <td className="pe-5 py-3">
                          <input 
                            type="text" 
                            className="form-control form-control-sm border-0 bg-light shadow-none"
                            placeholder="Add action..."
                            value={item.action}
                            onChange={(e) => {
                              const newItems = [...prepForm.items];
                              newItems[index].action = e.target.value;
                              setPrepForm({...prepForm, items: newItems});
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-5 border-top bg-light-subtle">
                <label className="form-label fw-bold text-muted text-uppercase small">Comments or questions:</label>
                <textarea 
                  className="form-control border shadow-sm" 
                  rows={3}
                  placeholder={isReadOnly ? 'No comments provided.' : 'Enter any additional comments or questions here...'}
                  value={prepForm.comments}
                  onChange={(e) => setPrepForm({...prepForm, comments: e.target.value})}
                  disabled={isReadOnly}
                ></textarea>
                
                <div className="mt-4 text-center">
                  <p className="text-muted small mb-4">
                    <strong>Digital Verification:</strong> This preparation record is digitally verified by Assessor {user?.name}.
                  </p>
                  {!isReadOnly && (
                    <button 
                      className="btn btn-success btn-lg shadow-sm px-5 d-inline-flex align-items-center gap-2 mb-3"
                      onClick={async () => {
                        const planDto = {
                          ...(assessmentStrategyPlans[selectedPrepUnitStandard.id] || {}),
                          projectQualificationUnitStandardId: selectedPrepUnitStandard.id,
                          prepDate: prepForm.date,
                          prepTime: prepForm.time,
                          prepVenue: prepForm.venue,
                          prepComments: prepForm.comments,
                          prepItemsJson: JSON.stringify(prepForm.items)
                        };

                        try {
                          const response = await fetchWithAuth('/api/assessments/strategy-plans', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(planDto)
                          });

                          if (response && response.ok) {
                            alert('Candidate preparation plan saved and applied to all assigned learners!');
                            fetchAssessmentStrategyPlans(); // Refresh plans
                            setShowPrepForm(false);
                            setSelectedPrepUnitStandard(null);
                          }
                        } catch (error) {
                          console.error('Error saving prep plan:', error);
                          alert('Failed to save candidate preparation plan.');
                        }
                      }}
                    >
                      <span>💾</span> Save & Apply
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // List of Unit Standards for Prep
    const allUnitStandards: any[] = [];
    filteredProjects.forEach(project => {
      const details = projectDetails[project.id];
      if (details?.learningPathways) {
        details.learningPathways.forEach((lp: any) => {
          if (lp.qualifications) {
            lp.qualifications.forEach((q: any) => {
              if (q.unitStandards) {
                q.unitStandards.forEach((us: any) => {
                  allUnitStandards.push({
                    ...us,
                    projectId: project.id,
                    projectName: project.projectName,
                    pathwayName: lp.pathway?.name || 'Unknown',
                    actualQualificationName: q.legacyQualification?.name || q.occupationalQualification?.name || 'Unknown'
                  });
                });
              }
            });
          }
        });
      }
    });

    return (
      <div className="container-fluid">
        <div className="card border-0 shadow-lg mb-4" style={{ backgroundColor: "#4facfe", color: "#ffffff" }}>
          <div className="card-body text-center text-white py-4">
            <h2 className="mb-2">🤝 Candidate Preparation</h2>
            <p className="mb-0 opacity-75">Select a unit standard to record candidate assessment preparation</p>
          </div>
        </div>

        <div className="card border-0 shadow-lg">
          <div className="card-header bg-white border-0 pt-4 px-4">
            <h5 className="mb-0">Unit Standards</h5>
            <p className="text-muted small">Available unit standards from your assigned projects</p>
          </div>
          <div className="card-body p-4">
            {allUnitStandards.length > 0 ? (
              <div className="row g-3">
                {allUnitStandards.map((us, index) => (
                  <div key={`${us.id}-${index}`} className="col-md-6 col-lg-4">
                    {(() => {
                      const hasPrep = !!(assessmentStrategyPlans[us.id]?.prepItemsJson);
                      return (
                        <div 
                          className={`card h-100 transition-all border-0 shadow-sm hover-shadow cursor-pointer ${hasPrep ? 'bg-success-subtle bg-opacity-10' : ''}`} 
                          style={{ 
                            borderTop: `4px solid ${hasPrep ? '#10b981' : '#4facfe'}`
                          }}
                          onClick={() => {
                            const existingPlan = assessmentStrategyPlans[us.id];
                            if (existingPlan && existingPlan.prepItemsJson) {
                              try {
                                setPrepForm({
                                  date: existingPlan.prepDate ? existingPlan.prepDate.split('T')[0] : new Date().toISOString().split('T')[0],
                                  time: existingPlan.prepTime || '',
                                  venue: existingPlan.prepVenue || '',
                                  comments: existingPlan.prepComments || '',
                                  items: JSON.parse(existingPlan.prepItemsJson)
                                });
                              } catch (e) {
                                console.error('Error parsing prep items:', e);
                              }
                            } else {
                              // Reset to default if no plan exists
                              setPrepForm({
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
                            }
                            setSelectedPrepUnitStandard(us);
                            setShowPrepForm(true);
                          }}
                        >
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className={`badge ${hasPrep ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} px-2 py-1`}>
                                US ID: {us.unitStandardId || 'N/A'}
                              </span>
                              <span className="badge bg-info-subtle text-info px-2 py-1">L{us.level}</span>
                            </div>
                            <h6 className="card-title mb-2 text-dark fw-bold">{us.unitStandardName}</h6>
                            <div className="mb-3">
                              <small className="text-muted d-block"><strong>Project:</strong> {us.projectName}</small>
                              <small className="text-muted d-block"><strong>Pathway:</strong> {us.pathwayName}</small>
                              <small className="text-muted d-block"><strong>Qualification:</strong> {us.actualQualificationName}</small>
                            </div>
                            
                            {hasPrep ? (
                              <div className="mt-auto">
                                <div className="alert alert-success py-1 px-2 mb-2 small d-flex align-items-center gap-2 border-0">
                                  <span>✅</span> Preparation Recorded
                                </div>
                                <button className="btn btn-sm btn-success w-100" disabled>
                                  Completed
                                </button>
                              </div>
                            ) : (
                              <button className="btn btn-sm btn-primary w-100 mt-auto">
                                Record Preparation
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="display-1 mb-3">📁</div>
                <h4>No Unit Standards Found</h4>
                <p className="text-muted">Expand projects in the "Projects" section to load unit standards first.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveSection('projects')}
                >
                  Go to Projects
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAssessorReport = () => {
    const handleProjectChange = async (projectId: number) => {
      const project = filteredProjects.find(p => p.id === projectId);
      setSelectedReportProject(project);
      setSelectedReportLearner(null);
      setReportLoading(true);
      setFetchingReport(true);
      
      try {
        const response = await fetchWithAuth(`/api/Learners/project/${projectId}`);
        if (response && response.ok) {
          const learners = await response.json();
          setMarkingLearners(learners);
        }
        
        // Fetch project details for US list
        if (!projectDetails[projectId]) {
          const detailsResponse = await fetchWithAuth(`/api/projects/${projectId}/details`);
          if (detailsResponse && detailsResponse.ok) {
            const details = await detailsResponse.json();
            setProjectDetails(prev => ({ ...prev, [projectId]: details }));
          }
        }

        // Fetch real competency report data
        const reportResponse = await fetchWithAuth(`/api/AssessmentReports/project/${projectId}`);
        if (reportResponse && reportResponse.ok) {
          const reportData = await reportResponse.json();
          setCompetencyReport(reportData);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setReportLoading(false);
        setFetchingReport(false);
      }
    };

    const getAssessorDecision = (formativeScore: number, summativeScore: number) => {
      // 50% threshold for Competence (C) or Not Yet Competent (NYC)
      const formativeStatus = formativeScore >= 50 ? 'C' : 'NYC';
      const summativeStatus = summativeScore >= 50 ? 'C' : 'NYC';
      const decision = (formativeScore >= 50 && summativeScore >= 50) ? 'C' : 'NYC';
      const remedialRequired = decision === 'NYC';
      
      return { formativeStatus, summativeStatus, decision, remedialRequired };
    };

    // Extract all US for the project
    const projectUSList: any[] = [];
    if (selectedReportProject) {
      const details = projectDetails[selectedReportProject.id];
      details?.learningPathways?.forEach((lp: any) => {
        lp.qualifications?.forEach((q: any) => {
          q.unitStandards?.forEach((us: any) => {
            projectUSList.push({
              ...us,
              pathwayName: lp.pathway?.name || 'Unknown',
              qualificationName: q.legacyQualification?.name || q.occupationalQualification?.name || 'Unknown'
            });
          });
        });
      });
    }

    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-lg mb-4" style={{ backgroundColor: "#4facfe", color: "#ffffff" }}>
          <div className="card-body text-center text-white py-4">
            <h2 className="mb-2">📊 Assessor Reports</h2>
            <p className="mb-0 opacity-75">Generate competency reports for individuals or entire classes</p>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <label className="form-label fw-bold small text-muted text-uppercase">1. Select Project</label>
                <select 
                  className="form-select border-0 bg-light shadow-none"
                  value={selectedReportProject?.id || ''}
                  onChange={(e) => handleProjectChange(Number(e.target.value))}
                >
                  <option value="">Choose project...</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <label className="form-label fw-bold small text-muted text-uppercase">2. Report Type</label>
                <div className="d-flex gap-2">
                  <button 
                    className={`btn btn-sm flex-fill ${reportType === 'class' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setReportType('class')}
                  >
                    📋 Class Report (Learner Matrix)
                  </button>
                  <button 
                    className={`btn btn-sm flex-fill ${reportType === 'individual' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setReportType('individual')}
                  >
                    👤 Individual Learner Report
                  </button>
                </div>
              </div>
            </div>
          </div>
          {reportType === 'individual' && selectedReportProject && (
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <label className="form-label fw-bold small text-muted text-uppercase">3. Select Learner for Individual View</label>
                  <select 
                    className="form-select border-0 bg-light shadow-none"
                    value={selectedReportLearner?.learnerId || ''}
                    onChange={(e) => {
                      const learner = markingLearners.find(l => l.learnerId === Number(e.target.value));
                      setSelectedReportLearner(learner);
                    }}
                  >
                    <option value="">Choose learner...</option>
                    {markingLearners.map(l => (
                      <option key={l.learnerId} value={l.learnerId}>{l.firstName} {l.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedReportProject && (
          <div className="card border-0 shadow-lg overflow-hidden">
            <div className="card-header bg-white py-4 px-5 border-0 d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1 fw-bold">
                  {reportType === 'individual' 
                    ? `Competency Report: ${selectedReportLearner ? `${selectedReportLearner.firstName} ${selectedReportLearner.lastName}` : 'Select a learner'}`
                    : `Class Competency Report: ${selectedReportProject.projectName}`
                  }
                </h4>
                <p className="text-muted small mb-0">Decision based on 50% competency threshold per assessment type</p>
              </div>
              <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={() => window.print()}>
                <span>🖨️</span> Print Report
              </button>
            </div>

            <div className="card-body p-0">
              {reportType === 'individual' ? (
                selectedReportLearner ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ backgroundColor: '#2563eb', color: 'white' }}>
                        <tr>
                          <th className="ps-4 py-3" style={{ width: '15%', borderRight: '1px solid rgba(255,255,255,0.1)' }}>US ID</th>
                          <th className="py-3 px-3" style={{ width: '40%', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Unit Standard/Module Title</th>
                          <th className="py-3 text-center" style={{ width: '15%', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Formative Assessment (C/NYC)</th>
                          <th className="py-3 text-center" style={{ width: '15%', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Summative Assessment (C/NYC)</th>
                          <th className="py-3 text-center pe-4" style={{ width: '15%' }}>Assessor Decision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(competencyReport?.unitStandards && competencyReport.unitStandards.length > 0 ? competencyReport.unitStandards : projectUSList).map((us) => {
                          // Try to find status in report data
                          const learnerCompetency = competencyReport?.learners?.find(l => l.learnerId === selectedReportLearner.learnerId);
                          const learnerStatus = learnerCompetency?.unitStandardStatuses?.find(s => s.unitStandardId === us.id || s.unitStandardCode === us.unitStandardId);
                          
                          // Default to NYC as requested
                          const formativeStatus = learnerStatus?.formativeStatus || 'NYC';
                          const summativeStatus = learnerStatus?.summativeStatus || 'NYC';
                          const decision = learnerStatus?.finalStatus || 'NYC';
                          
                          return (
                            <tr key={us.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td className="ps-4 py-3 fw-normal text-dark" style={{ borderRight: '1px solid #f1f5f9' }}>{us.unitStandardId}</td>
                              <td className="py-3 px-3" style={{ borderRight: '1px solid #f1f5f9' }}>
                                <div className="text-dark">{us.unitStandardId} - {us.unitStandardName}</div>
                              </td>
                              <td className="text-center py-3" style={{ borderRight: '1px solid #f1f5f9' }}>
                                <span className={formativeStatus === 'C' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                  {formativeStatus}
                                </span>
                              </td>
                              <td className="text-center py-3" style={{ borderRight: '1px solid #f1f5f9' }}>
                                <span className={summativeStatus === 'C' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                  {summativeStatus}
                                </span>
                              </td>
                              <td className="text-center py-3 pe-4">
                                <span className={decision === 'C' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                  {decision === 'C' ? 'C' : 'NYC'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="display-1 opacity-25">👤</div>
                    <h5 className="mt-3">Please select a learner from the dropdown to view their individual report</h5>
                    <p className="text-muted">Or switch to "Class Report" to see everyone at once.</p>
                  </div>
                )
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#2563eb', color: 'white' }}>
                      <tr>
                        <th className="ps-4 py-3" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>Learner Name</th>
                        {(competencyReport?.unitStandards && competencyReport.unitStandards.length > 0 ? competencyReport.unitStandards : projectUSList).map(us => (
                          <th key={us.id} className="text-center py-3" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>US {us.unitStandardId || us.unitStandardCode}</th>
                        ))}
                        <th className="text-center pe-4 py-3">Overall Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(competencyReport?.learners || markingLearners).map((learner: any) => {
                        const learnerId = learner.learnerId || learner.Id;
                        const firstName = learner.firstName || learner.FirstName;
                        const lastName = learner.lastName || learner.LastName;
                        
                        // Find status if report is loaded
                        const reportLearner = competencyReport?.learners?.find(l => l.learnerId === learnerId);
                        
                        return (
                          <tr key={learnerId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td className="ps-4 py-3 fw-bold text-dark" style={{ borderRight: '1px solid #f1f5f9' }}>{firstName} {lastName}</td>
                            {(competencyReport?.unitStandards && competencyReport.unitStandards.length > 0 ? competencyReport.unitStandards : projectUSList).map((us) => {
                              const status = reportLearner?.unitStandardStatuses?.find(s => s.unitStandardId === us.id || s.unitStandardCode === us.unitStandardId);
                              const finalStatus = status?.finalStatus || 'NYC';
                              
                              return (
                                <td key={us.id} className="text-center py-3" style={{ borderRight: '1px solid #f1f5f9' }}>
                                  <span className={finalStatus === 'C' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                    {finalStatus}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="text-center py-3 pe-4">
                              <span className={`badge ${
                                (reportLearner?.overallStatus === 'Competent') ? 'bg-success-subtle text-success' :
                                (reportLearner?.overallStatus === 'Not Yet Competent') ? 'bg-danger-subtle text-danger' :
                                'bg-info-subtle text-info'
                              }`}>
                                {reportLearner?.overallStatus || 'In Progress'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {(competencyReport?.learners?.length === 0 && markingLearners.length === 0) && (
                        <tr>
                          <td colSpan={(competencyReport?.unitStandards?.length || projectUSList.length) + 2} className="text-center py-5 text-muted">
                            No learners found for this project.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="card-footer bg-white py-4 px-5 border-0">
              <div className="alert alert-info border-0 shadow-sm d-flex align-items-center gap-3 mb-0">
                <span className="fs-3">ℹ️</span>
                <div>
                  <h6 className="mb-1 fw-bold">Understanding the Decision</h6>
                  <p className="mb-0 small">
                    A learner is declared <strong>Competent (C)</strong> if they achieve 50% or more in both Formative and Summative assessments. 
                    If either score is below 50%, they are declared <strong>Not Yet Competent (NYC)</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedReportProject && (
          <div className="card border-0 shadow-lg p-5 text-center">
            <div className="display-1 opacity-25">📋</div>
            <h4 className="mt-4">Select a Project to Begin</h4>
            <p className="text-muted">You can generate comprehensive competency reports once a project is selected.</p>
          </div>
        )}
      </div>
    );
  };

  const renderMarking = () => (
    <div className="container-fluid">
      <div className="mb-4">
        <h3 className="mb-1">{activeSection === 'marking' ? 'Marking' : 'Moderation'}</h3>
        <p className="text-muted mb-0">
          {activeSection === 'marking' 
            ? 'Projects → Learners → Qualifications → Unit Standards → Assessments → Mark Answer' 
            : 'Projects → Learners → Qualifications → Unit Standards → Assessments → Moderate Answer'}
        </p>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <label className="form-label fw-semibold">Select Project</label>
            <select
              className="form-select"
              value={markingProjectId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) {
                  handleSelectMarkingProject(id);
                }
              }}
            >
              <option value="">Choose project...</option>
              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  #{project.id} - {project.projectName}{project.contractNumber ? ` (${project.contractNumber})` : ''}
                </option>
              ))}
            </select>
        </div>
      </div>

      {markingProjectId && (
        <div className="mt-3">
          {/* Step 1: Learner List (Full Width) */}
          {!markingLearnerId && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">Learners</h5>
              </div>
              <div className="card-body">
                {markingLearners.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-users fa-3x mb-3 opacity-25"></i>
                    <p>No learners found in this project.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {markingLearners.map((learner: any) => (
                      <div key={learner.learnerId} className="col-12 col-md-6 col-lg-4">
                        <button
                          className={`btn w-100 text-start p-3 border-2 h-100 d-flex flex-column justify-content-between ${
                            markingLearnerId === learner.learnerId
                              ? (markedLearnerIds.has(learner.learnerId) ? 'btn-success' : (learner.hasUploads ? 'btn-warning' : 'btn-primary'))
                              : (markedLearnerIds.has(learner.learnerId) ? 'btn-success' : (learner.hasUploads ? 'btn-warning' : 'btn-outline-primary'))
                          }`}
                          style={markedLearnerIds.has(learner.learnerId) ? {
                            backgroundColor: '#16a34a',
                            borderColor: '#15803d',
                            color: '#ffffff',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          } : learner.hasUploads ? { 
                            backgroundColor: '#f59e0b', 
                            borderColor: '#d97706', 
                            color: '#111827',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          } : { 
                            borderStyle: 'solid',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setMarkingLearnerId(learner.learnerId);
                            setExpandedMarkingQualification(null);
                            setExpandedMarkingUnitStandard(null);
                            setExpandedMarkingAssessment(null);
                            setMarkingAssessmentQuestions([]);
                            setMarkingLearnerAnswers([]);
                            setMarkingAnswerPreviewUrl(null);
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="fw-bold fs-5">{learner.firstName} {learner.lastName}</div>
                            {learner.hasUploads && (
                              <span className="badge bg-dark">
                                Uploads: {learner.uploadCount ?? 0}
                              </span>
                            )}
                            {markedLearnerIds.has(learner.learnerId) && (
                              <span className="badge bg-white text-success">
                                ✓ Fully Marked
                              </span>
                            )}
                          </div>
                          <div>
                            <small className={markedLearnerIds.has(learner.learnerId) ? 'text-white opacity-75' : (learner.hasUploads ? 'text-dark opacity-75' : 'text-muted')}>
                              ID: {learner.idNumber || 'N/A'}
                            </small>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Qualification Structure (Full Width) */}
          {markingLearnerId && !expandedMarkingAssessment && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <button 
                    className="btn btn-sm btn-outline-secondary me-3" 
                    onClick={() => setMarkingLearnerId(null)}
                  >
                    ← Back to Learners
                  </button>
                  <button 
                    className="btn btn-sm btn-primary me-3" 
                    onClick={() => compilePOE(markingLearnerId)}
                    title="Generate the full Portfolio of Evidence document"
                  >
                    📄 Compile POE Document
                  </button>
                  <div>
                    <h5 className="mb-0 fw-bold">Qualification Structure</h5>
                    <small className="text-muted">
                      Learner: {markingLearners.find(l => l.learnerId === markingLearnerId)?.firstName} {markingLearners.find(l => l.learnerId === markingLearnerId)?.lastName}
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {(markingProjectDetails?.learningPathways || []).map((pathway: any, pIndex: number) => (
                  <div key={pIndex} className="mb-4">
                    <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">
                      {pathway.pathway?.name || 'Learning Pathway'}
                    </h6>
                    <div className="row g-3">
                      {(pathway.qualifications || []).map((qual: any, qIndex: number) => {
                        const qKey = pIndex * 1000 + qIndex;
                        const qOpen = expandedMarkingQualification === qKey;
                        
                        // Calculate qualification completion
                        const unitStandardIds = (qual.unitStandards || []).map((us: any) => us.id);
                        const qualProgress = learnerProgress.filter(p => unitStandardIds.includes(p.projectQualificationUnitStandardId));
                        const completedUSCount = qualProgress.filter(p => p.formativeCompleted && p.summativeCompleted).length;
                        const totalUSCount = unitStandardIds.length;
                        const isQualCompleted = totalUSCount > 0 && completedUSCount === totalUSCount;

                        return (
                          <div key={qIndex} className="col-12">
                            <div className={`card border shadow-none ${isQualCompleted ? 'border-success' : ''}`}>
                              <div 
                                className={`card-header ${isQualCompleted ? 'bg-success bg-opacity-10' : 'bg-light'} cursor-pointer`}
                                onClick={() => setExpandedMarkingQualification(qOpen ? null : qKey)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className={`fw-semibold ${isQualCompleted ? 'text-success' : ''}`}>
                                    {qOpen ? '▼' : '▶'} {qual.legacyQualification?.name || qual.occupationalQualification?.name || `Qualification ${qIndex + 1}`}
                                  </span>
                                  {totalUSCount > 0 && (
                                    <span className={`badge ${isQualCompleted ? 'bg-success' : 'bg-secondary'} ms-2`}>
                                      {completedUSCount} / {totalUSCount} Unit Standards Marked
                                    </span>
                                  )}
                                </div>
                              </div>
                              {qOpen && (
                                <div className="card-body p-3">
                                  <div className="row g-3">
                                    {(qual.unitStandards || []).map((us: any) => {
                                      const usOpen = expandedMarkingUnitStandard === us.id;
                                      const usData = assessmentData[us.id];
                                      const progress = learnerProgress.find(p => p.projectQualificationUnitStandardId === us.id);
                                      const isFormativeMarked = progress?.formativeCompleted;
                                      const isSummativeMarked = progress?.summativeCompleted;

                                      return (
                                        <div key={us.id} className="col-12 col-md-6">
                                          <div className={`border rounded h-100 ${isFormativeMarked && isSummativeMarked ? 'border-success' : ''}`}>
                                            <div 
                                              className={`p-2 ${isFormativeMarked && isSummativeMarked ? 'bg-success bg-opacity-10' : 'bg-light'} border-bottom d-flex justify-content-between align-items-center cursor-pointer`}
                                              onClick={() => {
                                                const open = usOpen ? null : us.id;
                                                setExpandedMarkingUnitStandard(open);
                                                if (open) fetchAssessmentsForUnitStandard(us.id);
                                              }}
                                              style={{ cursor: 'pointer' }}
                                            >
                                              <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                <small className="fw-bold text-truncate">{us.unitStandardName}</small>
                                                <div className="d-flex gap-1 flex-shrink-0">
                                                  {isFormativeMarked && <span className="badge bg-primary" style={{fontSize: '0.6rem'}}>F</span>}
                                                  {isSummativeMarked && <span className="badge bg-success" style={{fontSize: '0.6rem'}}>S</span>}
                                                </div>
                                              </div>
                                              <div className="d-flex align-items-center">
                                                {isFormativeMarked && isSummativeMarked && <i className="fas fa-check-circle text-success me-2" style={{fontSize: '0.8rem'}}></i>}
                                                <span>{usOpen ? '▼' : '▶'}</span>
                                              </div>
                                            </div>
                                            {usOpen && (
                                              <div className="p-2 d-flex flex-column gap-2" style={{ minHeight: '50px' }}>
                                                {/* Assessment Plan Strategy Section */}
                                                {assessmentStrategyPlans[us.id] && (
                                                  <div className="bg-info bg-opacity-10 border border-info border-opacity-25 rounded p-2 mb-2">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                      <small className="fw-bold text-info text-uppercase" style={{ fontSize: '0.65rem' }}>
                                                        <i className="fas fa-clipboard-list me-1"></i> Assessment Plan Strategy
                                                      </small>
                                                      <span className="badge bg-info small" style={{ fontSize: '0.6rem' }}>Applied</span>
                                                    </div>
                                                    <div className="row g-2">
                                                      <div className="col-6">
                                                        <div className="bg-white bg-opacity-50 p-1 rounded small" style={{ fontSize: '0.7rem' }}>
                                                          <strong>Date:</strong> {assessmentStrategyPlans[us.id].assessmentDate ? new Date(assessmentStrategyPlans[us.id].assessmentDate).toLocaleDateString() : 'Not set'}
                                                        </div>
                                                      </div>
                                                      <div className="col-6">
                                                        <div className="bg-white bg-opacity-50 p-1 rounded small" style={{ fontSize: '0.7rem' }}>
                                                          <strong>Assessor:</strong> {assessmentStrategyPlans[us.id].assessorName || 'Not set'}
                                                        </div>
                                                      </div>
                                                      <div className="col-12">
                                                        <div className="bg-white bg-opacity-50 p-1 rounded small" style={{ fontSize: '0.7rem' }}>
                                                          <strong>Venue:</strong> {assessmentStrategyPlans[us.id].questionnaireLocation || assessmentStrategyPlans[us.id].practicalLocation || 'Not specified'}
                                                        </div>
                                                      </div>
                                                      {assessmentStrategyPlans[us.id].assessorNumber && (
                                                        <div className="col-12">
                                                          <div className="bg-white bg-opacity-50 p-1 rounded small" style={{ fontSize: '0.7rem' }}>
                                                            <strong>Assessor Reg #:</strong> {assessmentStrategyPlans[us.id].assessorNumber}
                                                          </div>
                                                        </div>
                                                      )}
                                                      {assessmentStrategyPlans[us.id].assessorSignature && (
                                                        <div className="col-12">
                                                          <div className="bg-white bg-opacity-50 p-1 rounded small d-flex align-items-center gap-2" style={{ fontSize: '0.7rem' }}>
                                                            <strong>Signature:</strong> 
                                                            {assessmentStrategyPlans[us.id].assessorSignature.startsWith('data:image') ? (
                                                              <img src={assessmentStrategyPlans[us.id].assessorSignature} alt="Signature" style={{ height: '20px', objectFit: 'contain' }} />
                                                            ) : (
                                                              <span className="text-success">✓ Captured</span>
                                                            )}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                <div className="d-flex flex-wrap gap-2">
                                                  {loadingAssessments[us.id] ? (
                                                    <div className="w-100 text-center py-2">
                                                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      {(() => {
                                                        const progress = (learnerProgress || []).find(p => p.projectQualificationUnitStandardId === us.id);
                                                        return (
                                                          <>
                                                            {(usData?.formative || []).map((a: any) => {
                                                              const isThisFormativeMarked = progress?.formativeAssessmentId === a.id && progress?.formativeCompleted;
                                                              const isThisFormativeModerated = progress?.formativeAssessmentId === a.id && progress?.formativeModerated;
                                                              const canModerate = activeSection === 'moderation' && isThisFormativeMarked;
                                                              const isFormativeDone = isThisFormativeModerated;

                                                              return (
                                                                <div key={`f-group-${a.id}`} className="d-flex gap-1 align-items-center">
                                                                  <button 
                                                                    className={`btn btn-sm ${
                                                                      activeSection === 'moderation' 
                                                                        ? (isThisFormativeModerated ? 'btn-info text-white' : (isThisFormativeMarked ? 'btn-success' : 'btn-outline-secondary')) 
                                                                        : (isThisFormativeMarked ? 'btn-primary' : 'btn-outline-primary')
                                                                    }`} 
                                                                    onClick={() => openMarkingAssessment(a.id, 'Formative', false)}
                                                                    disabled={activeSection === 'moderation' ? !isThisFormativeMarked : false}
                                                                  >
                                                                    {activeSection === 'moderation' ? (
                                                                      <>
                                                                        <i className={`fas ${isThisFormativeModerated ? 'fa-eye' : (isThisFormativeMarked ? 'fa-user-check' : 'fa-clock')} me-1`}></i>
                                                                        {isThisFormativeModerated ? 'View Moderation' : (isThisFormativeMarked ? 'Moderate Formative' : 'Awaiting Mark')}
                                                                      </>
                                                                    ) : (
                                                                      <>
                                                                        {isThisFormativeMarked && <i className="fas fa-check me-1"></i>}
                                                                        Formative #{a.id}
                                                                      </>
                                                                    )}
                                                                  </button>
                                                                  {activeSection === 'marking' && (
                                                                    <button 
                                                                      className="btn btn-sm btn-outline-warning" 
                                                                      onClick={() => openMarkingAssessment(a.id, 'Formative', true)}
                                                                      title="Mark Remedial"
                                                                      disabled={isFormativeDone}
                                                                    >
                                                                      Rem
                                                                    </button>
                                                                  )}
                                                                </div>
                                                              );
                                                            })}
                                                            {(usData?.summative || []).map((a: any) => {
                                                              const isThisSummativeMarked = progress?.summativeAssessmentId === a.id && progress?.summativeCompleted;
                                                              const isThisSummativeModerated = progress?.summativeAssessmentId === a.id && progress?.summativeModerated;
                                                              const isSummativeDone = isThisSummativeModerated;
                                                              
                                                              return (
                                                                <div key={`s-group-${a.id}`} className="d-flex gap-1 align-items-center">
                                                                  <button 
                                                                    className={`btn btn-sm ${
                                                                      activeSection === 'moderation' 
                                                                        ? (isThisSummativeModerated ? 'btn-info text-white' : (isThisSummativeMarked ? 'btn-success' : 'btn-outline-secondary')) 
                                                                        : (isThisSummativeMarked ? 'btn-success' : 'btn-outline-success')
                                                                    }`} 
                                                                    onClick={() => openMarkingAssessment(a.id, 'Summative', false)}
                                                                    disabled={activeSection === 'moderation' ? !isThisSummativeMarked : false}
                                                                  >
                                                                    {activeSection === 'moderation' ? (
                                                                      <>
                                                                        <i className={`fas ${isThisSummativeModerated ? 'fa-eye' : (isThisSummativeMarked ? 'fa-user-check' : 'fa-clock')} me-1`}></i>
                                                                        {isThisSummativeModerated ? 'View Moderation' : (isThisSummativeMarked ? 'Moderate Summative' : 'Awaiting Mark')}
                                                                      </>
                                                                    ) : (
                                                                      <>
                                                                        {isThisSummativeMarked && <i className="fas fa-check me-1"></i>}
                                                                        Summative #{a.id}
                                                                      </>
                                                                    )}
                                                                  </button>
                                                                  {activeSection === 'marking' && (
                                                                    <button 
                                                                      className="btn btn-sm btn-outline-warning" 
                                                                      onClick={() => openMarkingAssessment(a.id, 'Summative', true)}
                                                                      title="Mark Remedial"
                                                                      disabled={isSummativeDone}
                                                                    >
                                                                      Rem
                                                                    </button>
                                                                  )}
                                                                </div>
                                                              );
                                                            })}
                                                          </>
                                                        );
                                                      })()}
                                                      {(!usData?.formative?.length && !usData?.summative?.length) && (
                                                        <small className="text-muted italic">No assessments found</small>
                                                      )}
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Marking Workspace (Split Screen) */}
          {expandedMarkingAssessment && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                {(() => {
                  const progress = (learnerProgress || []).find(p => p.projectQualificationUnitStandardId === expandedMarkingUnitStandard);
                  const isModeratedAssessment = expandedMarkingAssessment.type === 'Formative' 
                    ? progress?.formativeModerated 
                    : progress?.summativeModerated;
                  
                  // Check if all questions have a decision for the "Submit" button state
                  const allDecided = markingAssessmentQuestions.every(q => {
                    const existingAnswer = markingLearnerAnswers.find((a: any) => a.learnerId === markingLearnerId && a.questionId === q.id);
                    const isAlreadyModerated = existingAnswer && (existingAnswer.moderationStatus === 'Moderated' || existingAnswer.moderationStatus === 2 || existingAnswer.moderationStatus === 'ReturnedToAssessor' || existingAnswer.moderationStatus === 3);
                    return isAlreadyModerated || moderationApproval[`q-${q.id}`] !== undefined;
                  });
                  
                  return (
                    <>
                      <div className="d-flex align-items-center">
                        <button 
                          className="btn btn-sm btn-outline-secondary me-3" 
                          onClick={() => setExpandedMarkingAssessment(null)}
                        >
                          ← Back to Structure
                        </button>
                        <h5 className="mb-0 fw-bold">
                          {isRemedialMarking ? 'REMEDIAL ' : ''}{expandedMarkingAssessment.type} #{expandedMarkingAssessment.id} - {activeSection === 'moderation' && isModeratedAssessment ? 'Moderation View (Read-Only)' : 'Marking Workspace'}
                        </h5>
                      </div>
                      <button 
                        className={`btn ${activeSection === 'marking' ? 'btn-primary' : 'btn-success'} px-4`} 
                        onClick={activeSection === 'marking' ? submitSectionMarks : submitModeration}
                        disabled={markingSaving || (activeSection === 'marking' && markingLearnerAnswers.length === 0) || (activeSection === 'moderation' && (isModeratedAssessment || !allDecided))}
                      >
                        {markingSaving ? 'Saving...' : (activeSection === 'marking' ? 'Save Marks' : (isModeratedAssessment ? 'Moderated' : (allDecided ? 'Submit Moderation' : 'Decision Required')))}
                      </button>
                    </>
                  );
                })()}
              </div>
              <div className="card-body">
                {activeSection === 'marking' && markingLearnerAnswers.length === 0 && (
                  <div className="alert alert-warning d-flex align-items-center mb-4 border-0 shadow-sm">
                    <span className="fs-4 me-3">⚠️</span>
                    <div>
                      <h6 className="alert-heading mb-1 fw-bold">No Script Uploaded</h6>
                      <p className="mb-0 small">You cannot enter or save marks for this assessment because the learner hasn't uploaded any scripts yet.</p>
                    </div>
                  </div>
                )}
                <div className="row g-4">
                  <div className="col-12 col-lg-5">
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <i className="fas fa-edit me-2 text-primary"></i>
                      Questions and Marking
                    </h6>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                      {markingAssessmentQuestions.length === 0 ? (
                        <div className="text-center py-4 text-muted border rounded bg-light">
                          No questions found for this assessment.
                        </div>
                      ) : (
                        markingAssessmentQuestions.map((q: any) => {
                        // Find the most relevant answer for this specific learner and question
                        // We filter by learnerId and then sort to prioritize moderated entries (status 2 or 3)
                        const learnerAnswers = (markingLearnerAnswers || [])
                          .filter((a: any) => a.learnerId === markingLearnerId && a.questionId === q.id)
                          .sort((a: any, b: any) => {
                            const aStatus = a.moderationStatus === 'Moderated' || a.moderationStatus === 2 || a.moderationStatus === 'ReturnedToAssessor' || a.moderationStatus === 3 ? 1 : 0;
                            const bStatus = b.moderationStatus === 'Moderated' || b.moderationStatus === 2 || b.moderationStatus === 'ReturnedToAssessor' || b.moderationStatus === 3 ? 1 : 0;
                            if (aStatus !== bStatus) return bStatus - aStatus; // Moderated first
                            return (b.answerId || b.id || 0) - (a.answerId || a.id || 0); // Newest first
                          });

                        const answer = learnerAnswers[0];
                        // Allow marking if ANY uploads exist for this assessment, even if not linked to this specific question
                        const hasAnyUploads = markingLearnerAnswers.length > 0;
                        const hasScript = !!answer || hasAnyUploads;
                        const isMarked = !!answer && answer.mark !== null && answer.mark !== undefined;
                        
                        return (
                          <div key={q.id} className={`border rounded p-3 mb-3 bg-white shadow-sm ${isMarked ? 'border-success' : ''}`}>
                            {(() => {
                              const progress = (learnerProgress || []).find(p => p.projectQualificationUnitStandardId === expandedMarkingUnitStandard);
                              const isModeratedAssessment = expandedMarkingAssessment.type === 'Formative' 
                                ? progress?.formativeModerated 
                                : progress?.summativeModerated;
                              
                              const isThisQuestionModerated = answer && (
                                answer.moderationStatus === 'Moderated' || 
                                answer.moderationStatus === 2 || 
                                answer.moderationStatus === 'ReturnedToAssessor' || 
                                answer.moderationStatus === 3
                              );
                              
                              return (
                                <>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="fw-bold">Q{q.questionNumber}:</div>
                                      {isMarked && <span className="badge bg-success small">Marked</span>}
                                      {(activeSection === 'moderation' && (isModeratedAssessment || isThisQuestionModerated)) && <span className="badge bg-info text-white small">Moderated</span>}
                                    </div>
                                    <span className="badge bg-light text-dark border">
                                      {q.allocatedMarks} marks
                                    </span>
                                  </div>
                                  <div className="mb-3 text-dark">{q.questionText}</div>

                                  {!hasScript && activeSection === 'marking' && (
                                    <div className="alert alert-warning py-2 px-3 mb-3 border-0 small d-flex align-items-center">
                                      <i className="fas fa-exclamation-triangle me-2"></i>
                                      <span>No script uploaded for this question. Marking disabled.</span>
                                    </div>
                                  )}

                                  {hasScript && !answer && activeSection === 'marking' && (
                                    <div className="alert alert-info py-2 px-3 mb-3 border-0 small d-flex align-items-center">
                                      <i className="fas fa-info-circle me-2"></i>
                                      <span>No upload linked to this question specifically — use the uploads panel on the right to view the learner's answer.</span>
                                    </div>
                                  )}

                                  {isMarked && activeSection === 'marking' && (
                                    <div className="alert alert-info py-2 px-3 mb-3 border-0 small d-flex align-items-center">
                                      <i className="fas fa-check-circle me-2"></i>
                                      <span>Question has been marked. Scored: <strong>{answer.mark} / {q.allocatedMarks}</strong></span>
                                    </div>
                                  )}
                                  
                                  {/* Assessor Marking Section */}
                                  <div className={`p-3 rounded mb-3 ${activeSection === 'marking' ? (isMarked ? 'bg-success bg-opacity-10 border-success' : (hasScript ? 'bg-light border-primary' : 'bg-light border-warning opacity-75')) : 'bg-light border'} border-start border-4`}>
                                    <div className={`fw-bold small ${isMarked || activeSection === 'moderation' ? 'text-success' : 'text-primary'} mb-2`}>ASSESSOR SECTION</div>
                                    <div className="form-floating mb-2">
                                      <input
                                        className={`form-control ${activeSection === 'moderation' ? 'bg-light' : ''}`}
                                        id={`q-${q.id}`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9]*[.,]?[0-9]*"
                                        placeholder="Enter mark"
                                        value={activeSection === 'moderation' ? (answer?.mark?.toString() || '') : (draftMarks[`learner:${markingLearnerId}:assessment:${expandedMarkingAssessment.type}:${expandedMarkingAssessment.id}:question:${q.id}`] || '')}
                                        onChange={(e) => {
                                          if (activeSection === 'moderation') return;
                                          // Normalise comma to dot, strip invalid chars
                                          const raw = e.target.value.replace(',', '.');
                                          if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                                          const numValue = parseFloat(raw);
                                          const key = `learner:${markingLearnerId}:assessment:${expandedMarkingAssessment.type}:${expandedMarkingAssessment.id}:question:${q.id}`;
                                          if (!isNaN(numValue) && numValue > q.allocatedMarks) {
                                            setDraftMarks(prev => ({ ...prev, [key]: q.allocatedMarks.toString() }));
                                            return;
                                          }
                                          setDraftMarks(prev => ({ ...prev, [key]: raw }));
                                        }}
                                        disabled={activeSection !== 'marking' || !hasScript || isMarked}
                                      />
                                      <label htmlFor={`q-${q.id}`}>Assessor Mark (max {q.allocatedMarks})</label>
                                    </div>
                                    <div className="form-floating">
                                      <textarea
                                        className={`form-control ${activeSection === 'moderation' ? 'bg-light' : ''}`}
                                        style={{ height: '80px' }}
                                        placeholder="Assessor comments"
                                        value={activeSection === 'moderation' ? (answer?.assessorComments || '') : (moderationComments[`assessor:${q.id}`] || '')}
                                        onChange={(e) => {
                                          if (activeSection === 'moderation') return;
                                          setModerationComments(prev => ({ ...prev, [`assessor:${q.id}`]: e.target.value }));
                                        }}
                                        disabled={activeSection !== 'marking' || !hasScript || isMarked}
                                      ></textarea>
                                      <label>Assessor Comments</label>
                                    </div>
                                  </div>

                                  {/* Moderator Section */}
                                  {activeSection === 'moderation' && (
                                    <div className="p-3 rounded mb-3 bg-white border-success border-start border-4 shadow-sm">
                                      <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="fw-bold small text-success text-uppercase tracking-wider">MODERATOR SECTION</div>
                                        {answer && (
                                          <span className={`badge border ${answer.mark > q.allocatedMarks ? 'bg-danger text-white' : 'bg-light text-dark'}`}>
                                            Assessor Mark: <strong className={answer.mark > q.allocatedMarks ? 'text-white' : 'text-primary'}>{answer.mark}</strong> / {q.allocatedMarks}
                                            {answer.mark > q.allocatedMarks && <i className="fas fa-exclamation-triangle ms-2" title="Mark exceeds maximum!"></i>}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {answer && answer.mark > q.allocatedMarks && (
                                        <div className="alert alert-danger py-1 px-2 small mb-3 border-0">
                                          <i className="fas fa-exclamation-circle me-1"></i>
                                          Warning: Assessor's mark ({answer.mark}) exceeds maximum ({q.allocatedMarks}). Upholding will cap it to {q.allocatedMarks}.
                                        </div>
                                      )}
                                      
                                      <div className="row g-2 mb-3">
                                        <div className="col-12">
                                          <div className="form-floating">
                                            <input
                                              className={`form-control ${moderationApproval[`q-${q.id}`] !== undefined || isModeratedAssessment || isThisQuestionModerated ? 'bg-light fw-bold text-success' : ''}`}
                                              type="text"
                                              inputMode="decimal"
                                              pattern="[0-9]*[.,]?[0-9]*"
                                              placeholder="Moderated mark"
                                              value={moderationDraftMarks[`q-${q.id}`] !== undefined 
                                                ? moderationDraftMarks[`q-${q.id}`] 
                                                : (isThisQuestionModerated ? (answer?.moderatedMark?.toString() || '') : (moderationApproval[`q-${q.id}`] !== undefined ? (answer?.mark?.toString() || '') : ''))}
                                              onChange={(e) => {
                                                const raw = e.target.value.replace(',', '.');
                                                if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                                                setModerationDraftMarks(prev => ({ ...prev, [`q-${q.id}`]: raw }));
                                              }}
                                              disabled={isModeratedAssessment}
                                            />
                                            <label>Moderated Mark (Max: {q.allocatedMarks})</label>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="form-floating mb-3">
                                        <textarea
                                          className="form-control"
                                          style={{ height: '80px' }}
                                          placeholder="Moderator feedback"
                                          value={isModeratedAssessment || isThisQuestionModerated ? (answer?.moderatorComments || '') : (moderationComments[`moderator:${q.id}`] || '')}
                                          onChange={(e) => setModerationComments(prev => ({ ...prev, [`moderator:${q.id}`]: e.target.value }))}
                                          disabled={isModeratedAssessment || isThisQuestionModerated}
                                        ></textarea>
                                        <label>Moderator Feedback / Comments</label>
                                      </div>

                                      <div className="d-flex gap-2">
                                        <button 
                                          className={`btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${
                                            (isThisQuestionModerated ? (answer?.moderationStatus === 2 || answer?.moderationStatus === 'Moderated') : moderationApproval[`q-${q.id}`] === true) 
                                              ? 'btn-success disabled' 
                                              : 'btn-outline-success'
                                          }`}
                                          onClick={() => {
                                            if (isThisQuestionModerated || isModeratedAssessment || moderationApproval[`q-${q.id}`] !== undefined) return;
                                            setModerationApproval(prev => ({ ...prev, [`q-${q.id}`]: true }));
                                            if (answer) {
                                              setModerationDraftMarks(prev => ({ ...prev, [`q-${q.id}`]: answer.mark.toString() }));
                                            }
                                          }}
                                          disabled={isThisQuestionModerated || isModeratedAssessment || moderationApproval[`q-${q.id}`] !== undefined}
                                        >
                                          <i className={`fas ${(isThisQuestionModerated ? (answer?.moderationStatus === 2 || answer?.moderationStatus === 'Moderated') : moderationApproval[`q-${q.id}`] === true) ? 'fa-check-circle' : 'fa-check'}`}></i>
                                          {(isThisQuestionModerated ? (answer?.moderationStatus === 2 || answer?.moderationStatus === 'Moderated') : moderationApproval[`q-${q.id}`] === true) ? 'Mark Upheld' : 'Uphold Mark'}
                                        </button>
                                        <button 
                                          className={`btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${
                                            (isThisQuestionModerated ? (answer?.moderationStatus === 3 || answer?.moderationStatus === 'ReturnedToAssessor') : moderationApproval[`q-${q.id}`] === false) 
                                              ? 'btn-danger disabled' 
                                              : 'btn-outline-danger'
                                          }`}
                                          onClick={() => {
                                            if (isThisQuestionModerated || isModeratedAssessment || moderationApproval[`q-${q.id}`] !== undefined) return;
                                            setModerationApproval(prev => ({ ...prev, [`q-${q.id}`]: false }));
                                            if (answer) {
                                              setModerationDraftMarks(prev => ({ ...prev, [`q-${q.id}`]: answer.mark.toString() }));
                                            }
                                          }}
                                          disabled={isThisQuestionModerated || isModeratedAssessment || moderationApproval[`q-${q.id}`] !== undefined}
                                        >
                                          <i className={`fas ${(isThisQuestionModerated ? (answer?.moderationStatus === 3 || answer?.moderationStatus === 'ReturnedToAssessor') : moderationApproval[`q-${q.id}`] === false) ? 'fa-times-circle' : 'fa-undo'}`}></i>
                                          {(isThisQuestionModerated ? (answer?.moderationStatus === 3 || answer?.moderationStatus === 'ReturnedToAssessor') : moderationApproval[`q-${q.id}`] === false) ? 'Mark Withdrawn' : 'Withdraw Mark'}
                                        </button>
                                      </div>
                                      
                                      {(moderationApproval[`q-${q.id}`] !== undefined || (isThisQuestionModerated && !isModeratedAssessment)) && (
                                        <div className="mt-2 text-center">
                                          <button 
                                            className="btn btn-link btn-sm text-muted text-decoration-none"
                                            onClick={() => {
                                              if (isModeratedAssessment) return;
                                              setModerationApproval(prev => {
                                                const next = { ...prev };
                                                delete next[`q-${q.id}`];
                                                return next;
                                              });
                                              setModerationDraftMarks(prev => {
                                                const next = { ...prev };
                                                delete next[`q-${q.id}`];
                                                return next;
                                              });
                                              
                                              // If it's already moderated in DB, we'll allow re-moderating by clearing the local status
                                              if (isThisQuestionModerated && answer) {
                                                setMarkingLearnerAnswers(prev => prev.map(a => 
                                                  a.answerId === answer.answerId ? { ...a, moderationStatus: 1 } : a
                                                ));
                                              }
                                            }}
                                          >
                                            <i className="fas fa-undo me-1"></i> Reset choice for this question
                                          </button>
                                        </div>
                                      )}

                                      {((isThisQuestionModerated && (answer?.moderationStatus === 2 || answer?.moderationStatus === 'Moderated')) || moderationApproval[`q-${q.id}`] === true) && (
                                        <div className="mt-2 text-success small">
                                          <i className="fas fa-info-circle me-1"></i>
                                          Mark upheld. {answer && answer.mark > q.allocatedMarks ? `Capped at ${q.allocatedMarks} (Assessor had ${answer.mark})` : `Assessor's mark of ${answer?.mark} will be used.`}
                                        </div>
                                      )}
                                      {((isThisQuestionModerated && (answer?.moderationStatus === 3 || answer?.moderationStatus === 'ReturnedToAssessor')) || moderationApproval[`q-${q.id}`] === false) && (
                                        <div className="mt-2 text-danger small">
                                          <i className="fas fa-exclamation-circle me-1"></i>
                                          Mark withdrawn. This will be returned to the assessor for review.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        );
                      })
                      )}

                      {/* Overall Moderation Comments - Once at the end */}
                      {activeSection === 'moderation' && markingAssessmentQuestions.length > 0 && (
                        <div className="card border-0 shadow-sm mt-4 overflow-hidden">
                          <div className="card-header bg-success text-white py-2">
                            <h6 className="mb-0 small fw-bold text-uppercase tracking-wider">
                              <i className="fas fa-comment-alt me-2"></i>
                              Overall Moderation Summary / Feedback
                            </h6>
                          </div>
                          <div className="card-body p-0">
                            <textarea
                              className="form-control border-0 rounded-0"
                              style={{ height: '120px', resize: 'none' }}
                              placeholder="Provide a final moderation summary for this assessment (Formative/Summative)..."
                              value={overallModeratorComment}
                              onChange={(e) => setOverallModeratorComment(e.target.value)}
                            ></textarea>
                          </div>
                          <div className="card-footer bg-light py-2">
                            <small className="text-muted">
                              <i className="fas fa-info-circle me-1"></i>
                              This comment will be applied to the entire assessment record.
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-12 col-lg-7">
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <i className="fas fa-eye me-2 text-primary"></i>
                      Learner Upload View
                    </h6>
                    <div className="card border-0 shadow-none bg-light h-100">
                      <div className="card-header bg-transparent border-0 p-0 mb-3">
                        <div className="d-flex flex-wrap gap-2">
                          {markingLearnerAnswers.length === 0 ? (
                            <small className="text-muted">No uploads found for this learner.</small>
                          ) : (
                            markingLearnerAnswers.map((a: any) => (
                              <button 
                                key={a.answerId} 
                                className={`btn btn-sm ${markingAnswerPreviewUrl?.includes(`answerId=${a.answerId}`) ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => openMarkingAnswerPreview(a.answerId)}
                              >
                                Q{a.questionNumber} View
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="card-body p-0 border rounded overflow-hidden" style={{ minHeight: '500px', backgroundColor: '#ffffff' }}>
                        {markingAnswerPreviewUrl ? (
                          <iframe 
                            src={markingAnswerPreviewUrl} 
                            title="Learner upload preview" 
                            style={{ width: '100%', height: '600px', border: 'none' }} 
                          />
                        ) : (
                          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted p-5 text-center">
                            <i className="fas fa-file-image fa-4x mb-3 opacity-25"></i>
                            <h6>No Preview Selected</h6>
                            <p className="small">Select a question above to preview the learner's uploaded answer.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );

  const renderDocumentApprovals = () => (
    <div>
      {/* Statistics Summary */}
      <div className="card border-0 shadow-lg mb-4" style={{
        backgroundColor: "#4facfe",
        color: "#ffffff"
      }}>
        <div className="card-body text-white py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-2">📋 Document Approvals</h2>
              <p className="mb-0 opacity-75">Review and approve learner documents across all projects</p>
            </div>
          </div>
          
          {documentApprovalStats && (
            <div>
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h3 mb-1">{documentApprovalStats.totalDocuments}</div>
                    <small className="opacity-75">Total Documents</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h3 mb-1 text-warning">{documentApprovalStats.pendingDocuments}</div>
                    <small className="opacity-75">Pending Review</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h3 mb-1 text-success">{documentApprovalStats.approvedDocuments}</div>
                    <small className="opacity-75">Approved ({documentApprovalStats.approvalRate}%)</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h3 mb-1 text-danger">{documentApprovalStats.declinedDocuments}</div>
                    <small className="opacity-75">Declined ({documentApprovalStats.declineRate}%)</small>
                  </div>
                </div>
              </div>
              
              {/* Expandable Document Type Breakdown */}
              <div className="border-top pt-3">
                <button 
                  className="btn btn-link text-white p-0 d-flex align-items-center"
                  onClick={() => setShowStatsBreakdown(!showStatsBreakdown)}
                  style={{ textDecoration: 'none' }}
                >
                  <i className={`fas fa-chevron-${showStatsBreakdown ? 'up' : 'down'} me-2`}></i>
                  <span>Document Compliance Summary ({documentApprovalStats.totalLearners} learners)</span>
                </button>
                
                {showStatsBreakdown && (
                  <div className="mt-3">
                    <div className="row g-2">
                      {documentApprovalStats.documentTypeBreakdown.map((docType, index) => (
                        <div key={docType.documentType} className="col-md-6 col-lg-4">
                          <div className="card bg-white bg-opacity-10 border-0">
                            <div className="card-body p-3">
                              <h6 className="card-title text-white mb-2">
                                <i className="fas fa-file-alt me-2"></i>
                                {docType.documentType}
                              </h6>
                              <div className="row g-1 small text-white">
                                <div className="col-6">
                                  <div className="d-flex justify-content-between">
                                    <span>Expected:</span>
                                    <strong>{docType.expectedDocuments}</strong>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="d-flex justify-content-between">
                                    <span>Submitted:</span>
                                    <strong className={docType.submittedDocuments === docType.expectedDocuments ? 'text-success' : 'text-warning'}>
                                      {docType.submittedDocuments}
                                    </strong>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="d-flex justify-content-between">
                                    <span>Approved:</span>
                                    <strong className="text-success">{docType.approvedDocuments}</strong>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="d-flex justify-content-between">
                                    <span>Missing:</span>
                                    <strong className={docType.missingDocuments > 0 ? 'text-danger' : 'text-success'}>
                                      {docType.missingDocuments}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-white opacity-75">Compliance:</small>
                                  <span className={`badge ${
                                    docType.complianceRate === 100 ? 'bg-success' :
                                    docType.complianceRate >= 80 ? 'bg-warning' : 'bg-danger'
                                  }`}>
                                    {docType.complianceRate}%
                                  </span>
                                </div>
                                <div className="progress mt-1" style={{ height: '4px' }}>
                                  <div 
                                    className={`progress-bar ${
                                      docType.complianceRate === 100 ? 'bg-success' :
                                      docType.complianceRate >= 80 ? 'bg-warning' : 'bg-danger'
                                    }`}
                                    style={{ width: `${docType.complianceRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Selection or Learner Documents */}
      {!selectedProjectForApproval ? (
        <div className="card border-0 shadow-lg">
          <div className="card-body">
            <h5 className="card-title mb-4">📁 Select Project to Review Documents</h5>
            
            {documentApprovalsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading projects...</p>
              </div>
            ) : projectDocuments.length === 0 ? (
              <div className="text-center py-5">
                <div className="text-muted">
                  <i className="fas fa-folder-open fa-3x mb-3"></i>
                  <h5>No Projects with Documents Found</h5>
                  <p>No projects have learner documents that require approval.</p>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {projectDocuments.map(project => (
                  <div key={project.projectId} className="col-md-6 col-lg-4">
                    <div 
                      className="card h-100 border-2 cursor-pointer hover-shadow"
                      style={{ 
                        borderColor: project.pendingDocuments > 0 ? '#ffc107' : '#28a745',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        setSelectedProjectForApproval(project);
                        setExpandedLearners({}); // Reset expanded state
                        fetchProjectLearnerDocuments(project.projectId);
                      }}
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
                        <h6 className="card-title text-primary">{project.projectName}</h6>
                        <div className="row g-2 text-center">
                          <div className="col-6">
                            <div className="small text-muted">Total</div>
                            <div className="fw-bold">{project.totalDocuments}</div>
                          </div>
                          <div className="col-6">
                            <div className="small text-muted">Pending</div>
                            <div className="fw-bold text-warning">{project.pendingDocuments}</div>
                          </div>
                          <div className="col-6">
                            <div className="small text-muted">Approved</div>
                            <div className="fw-bold text-success">{project.approvedDocuments}</div>
                          </div>
                          <div className="col-6">
                            <div className="small text-muted">Declined</div>
                            <div className="fw-bold text-danger">{project.declinedDocuments}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Learner Documents View */
        <div className="card border-0 shadow-lg">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="card-title mb-0">
                👥 {selectedProjectForApproval.projectName} - Learner Documents
              </h5>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSelectedProjectForApproval(null);
                  setSelectedProjectDocuments([]);
                  setExpandedLearners({}); // Reset expanded state
                }}
              >
                ← Back to Projects
              </button>
            </div>

            <div className="card bg-light border-0 mb-4">
              <div className="card-body">
                <div className="row align-items-center g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted">Filter by Status</label>
                    <select 
                      className="form-select"
                      value={documentFilterStatus}
                      onChange={(e) => setDocumentFilterStatus(e.target.value)}
                    >
                      <option value="All">All Documents</option>
                      <option value="Pending">Pending Approval</option>
                      <option value="Approved">Approved Only</option>
                      <option value="Declined">Declined Only</option>
                    </select>
                  </div>
                  <div className="col-md-4 offset-md-4 text-md-end">
                    <button 
                      className="btn btn-primary"
                      onClick={handleBulkDownload}
                      disabled={bulkDownloading || selectedProjectDocuments.length === 0}
                    >
                      {bulkDownloading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Preparing ZIP...</>
                      ) : (
                        <><i className="fas fa-file-archive me-2"></i>Bulk Download {documentFilterStatus !== 'All' ? documentFilterStatus : ''}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {documentApprovalsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading learner documents...</p>
              </div>
            ) : selectedProjectDocuments.length === 0 ? (
              <div className="text-center py-5">
                <div className="text-muted">
                  <i className="fas fa-file-alt fa-3x mb-3"></i>
                  <h5>No Documents Found</h5>
                  <p>No learners in this project have uploaded documents.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProjectDocuments
                  .map(learner => ({
                    ...learner,
                    filteredDocuments: learner.documents.filter(doc => 
                      documentFilterStatus === 'All' || doc.approvalStatus === documentFilterStatus
                    )
                  }))
                  .filter(learner => 
                    documentFilterStatus === 'All' || learner.filteredDocuments.length > 0
                  )
                  .map((learner, index) => (
                  <div key={learner.learnerId} className="card border-0 shadow-sm mb-3">
                    <div 
                      className="card-header bg-light cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleLearnerExpansion(learner.learnerId)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i className={`fas fa-chevron-${expandedLearners[learner.learnerId] ? 'down' : 'right'} me-2 text-muted`}></i>
                          <div>
                            <strong>{learner.firstName} {learner.lastName}</strong>
                            <small className="text-muted ms-2">ID: {learner.idNumber}</small>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <span className="badge bg-secondary">{learner.totalDocuments} Total</span>
                          <span className="badge bg-warning">{learner.pendingDocuments} Pending</span>
                          <span className="badge bg-success">{learner.approvedDocuments} Approved</span>
                          <span className="badge bg-danger">{learner.declinedDocuments} Declined</span>
                        </div>
                      </div>
                    </div>
                    
                    {expandedLearners[learner.learnerId] && (
                      <div className="card-body">
                        {learner.filteredDocuments.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-hover mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Document Type</th>
                                  <th>File Name</th>
                                  <th>Upload Date</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {learner.filteredDocuments.map(document => (
                                  <tr key={document.id}>
                                    <td>
                                      <span className="fw-medium">{document.documentType}</span>
                                    </td>
                                    <td>
                                      <div>
                                        <div className="fw-medium">{document.fileName}</div>
                                        <small className="text-muted">
                                          {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </small>
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        <div>{new Date(document.uploadedAt).toLocaleDateString()}</div>
                                        <small className="text-muted">
                                          {new Date(document.uploadedAt).toLocaleTimeString()}
                                        </small>
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`badge ${
                                        document.approvalStatus === 'Approved' ? 'bg-success' :
                                        document.approvalStatus === 'Declined' ? 'bg-danger' :
                                        'bg-warning'
                                      }`}>
                                        {document.approvalStatus}
                                      </span>
                                      {document.approvalStatus === 'Declined' && document.declineReason && (
                                        <div className="small text-danger mt-1">
                                          <i className="fas fa-exclamation-triangle"></i> {document.declineReason}
                                        </div>
                                      )}
                                      {document.approvalStatus === 'Approved' && document.approvedAt && (
                                        <div className="small text-success mt-1">
                                          <i className="fas fa-check"></i> {new Date(document.approvedAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <div className="btn-group btn-group-sm">
                                        <button 
                                          className={`btn ${
                                            document.approvalStatus === 'Pending' ? 'btn-primary' : 'btn-outline-primary'
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            viewDocument(document.id);
                                          }}
                                          title={document.approvalStatus === 'Pending' ? 'Review Document' : 'View Document'}
                                        >
                                          <i className="fas fa-eye me-1"></i>
                                          {document.approvalStatus === 'Pending' ? 'Review' : 'View'}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted">
                            <i className="fas fa-file-invoice fa-3x mb-3 opacity-25"></i>
                            <p className="mb-0">No documents {documentFilterStatus !== 'All' ? `with status "${documentFilterStatus}"` : 'uploaded yet'}.</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-light shadow-sm" style={{ backgroundColor: '#4facfe' }}>
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 text-white">{managerInfo.icon} {managerInfo.title}</span>
          <div className="d-flex align-items-center">
            <span className="text-white me-3">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="btn btn-light btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid flex-grow-1 d-flex">
        <div className="row flex-grow-1 g-0">
          {/* Side Panel */}
          <div className="col-md-3 col-lg-2 shadow-sm d-flex flex-column" style={{ backgroundColor: '#4facfe' }}>
            <div className="p-3 flex-grow-1">
              <h6 className="text-white text-uppercase mb-4" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 600 }}>Navigation</h6>
              <div className="nav flex-column gap-2">
                {/* Overview - Visible for everyone except strictly Assessor/Moderator (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'overview' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'overview' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'overview' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('overview')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'overview') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'overview') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <span>Overview</span>
                  </button>
                )}

                {/* Projects - Visible for everyone except strictly Assessor/Moderator (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'projects' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'projects' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'projects' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('projects')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'projects') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'projects') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📁</span>
                    <span>{isLogistics ? 'Logistics & Sites' : 'Projects'}</span>
                  </button>
                )}

                {/* Team Management - Only for Managers/Admins */}
                {(isAdmin || isQATrainingManager) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'team' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'team' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'team' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('team')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'team') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'team') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>👥</span>
                    <span>Team</span>
                  </button>
                )}

                {/* Tasks - Visible for everyone except strictly Assessor/Moderator (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'tasks' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'tasks' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'tasks' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('tasks')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'tasks') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'tasks') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>✅</span>
                    <span>Tasks</span>
                  </button>
                )}

                {(isQA || isAssessor) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'marking' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'marking' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'marking' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('marking')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'marking') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'marking') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🧾</span>
                    <span>Marking</span>
                  </button>
                )}
                {(isQA || isAssessor) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'assessmentPlan' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'assessmentPlan' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'assessmentPlan' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => {
                      setActiveSection('assessmentPlan');
                      setShowAssessmentPlanForm(false);
                      setSelectedPlanUnitStandard(null);
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'assessmentPlan') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'assessmentPlan') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📝</span>
                    <span>Assessment plan</span>
                  </button>
                )}
                {(isQA || isAssessor) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'candidatePreparation' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'candidatePreparation' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'candidatePreparation' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => {
                      setActiveSection('candidatePreparation');
                      setShowPrepForm(false);
                      setSelectedPrepUnitStandard(null);
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'candidatePreparation') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'candidatePreparation') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🤝</span>
                    <span>Candidate Preparation</span>
                  </button>
                )}
                {(isQA) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'assessorReport' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'assessorReport' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'assessorReport' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => {
                      setActiveSection('assessorReport');
                      setSelectedReportProject(null);
                      setSelectedReportLearner(null);
                      setReportType('individual');
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'assessorReport') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'assessorReport') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <span>Assessor Report</span>
                  </button>
                )}
                {(isQA || isModerator) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'moderation' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'moderation' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'moderation' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('moderation')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'moderation') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'moderation') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>⚖️</span>
                    <span>Moderation</span>
                  </button>
                )}
                {/* Document Approvals - Visible for everyone except strictly Assessor/Moderator (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA)) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'documentApprovals' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'documentApprovals' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'documentApprovals' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('documentApprovals')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'documentApprovals') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'documentApprovals') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📋</span>
                    <span>Document Approvals</span>
                  </button>
                )}
                {/* Sick Notes - Only for Finance Managers and Administrator */}
                {(isAdmin || isFinance) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'sickNotes' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'sickNotes' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'sickNotes' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('sickNotes')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'sickNotes') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'sickNotes') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🤒</span>
                    <span>Sick Notes</span>
                  </button>
                )}
                {/* Attendance Tracking - Visible for everyone except strictly Assessor/Moderator (QA Managers can see it) */}
                {(!isAssessor && (!isModerator || isQA || isIT)) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'attendanceTracking' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'attendanceTracking' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'attendanceTracking' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('attendanceTracking')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'attendanceTracking') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'attendanceTracking') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <span>Attendance Tracking</span>
                  </button>
                )}

                {/* Reports - Only for Admin and QA Managers */}
                {(isAdmin || isQA) && (
                  <button
                    className={`nav-link text-start border-0 ${activeSection === 'reports' ? 'active' : ''}`}
                    style={{
                      color: '#ffffff',
                      backgroundColor: activeSection === 'reports' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === 'reports' ? 600 : 400,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onClick={() => setActiveSection('reports')}
                    onMouseEnter={(e) => {
                      if (activeSection !== 'reports') {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== 'reports') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📄</span>
                    <span>Reports & Certificates</span>
                  </button>
                )}

                {/* IT Specific Sections */}
                {isIT && (
                  <>
                    <button
                      className={`nav-link text-start border-0 ${activeSection === 'allUsers' ? 'active' : ''}`}
                      style={{
                        color: '#ffffff',
                        backgroundColor: activeSection === 'allUsers' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: activeSection === 'allUsers' ? 600 : 400,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      onClick={() => setActiveSection('allUsers')}
                    >
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                      <span>User Management</span>
                    </button>
                    <button
                      className={`nav-link text-start border-0 ${activeSection === 'systemLogs' ? 'active' : ''}`}
                      style={{
                        color: '#ffffff',
                        backgroundColor: activeSection === 'systemLogs' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: activeSection === 'systemLogs' ? 600 : 400,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      onClick={() => setActiveSection('systemLogs')}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📜</span>
                      <span>System Logs</span>
                    </button>
                  </>
                )}

                {/* Super User SDP Management Section */}
                {isSuperUser && (
                  <div className="mt-4 pt-4 border-top border-light border-opacity-25">
                    <h6 className="text-white text-uppercase mb-3" style={{ fontSize: '0.7rem', letterSpacing: '1px', fontWeight: 600, opacity: 0.8 }}>Organization Management</h6>
                    <button
                      className="nav-link text-start border-0 w-100 mb-2"
                      style={{
                        color: '#ffffff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      onClick={() => navigate('/sdp-dashboard')}
                    >
                      <span>👤</span>
                      <span>Add Dept Managers</span>
                    </button>
                    <button
                      className="nav-link text-start border-0 w-100"
                      style={{
                        color: '#ffffff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      onClick={() => navigate('/sdp-dashboard')}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🎓</span>
                      <span>SDP Organization</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9 col-lg-10 d-flex flex-column">
            <div className="p-4 flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 76px)', backgroundColor: '#ffffff' }}>
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'projects' && renderProjects()}
              {activeSection === 'team' && renderTeam()}
              {activeSection === 'tasks' && renderTasks()}
              {activeSection === 'marking' && renderMarking()}
              {activeSection === 'moderation' && renderMarking()}
              {activeSection === 'assessmentPlan' && renderAssessmentPlan()}
              {activeSection === 'candidatePreparation' && renderCandidatePreparation()}
              {activeSection === 'assessorReport' && renderAssessorReport()}
              {activeSection === 'reports' && (isAdmin || isQA) && <FunderReport token={localStorage.getItem('token') || ''} />}
              {activeSection === 'sickNotes' && (isAdmin || isFinance) && renderSickNotes()}
              {activeSection === 'attendanceTracking' && (!isAssessor && (!isModerator || isQA || isIT)) && renderAttendanceTracking()}
              {activeSection === 'documentApprovals' && (!isAssessor && (!isModerator || isQA)) && renderDocumentApprovals()}
              {activeSection === 'allUsers' && isIT && renderAllUsers()}
              {activeSection === 'systemLogs' && isIT && renderSystemLogs()}
            </div>
          </div>
        </div>
      </div>

      {/* Formative Assessment Modal */}
      {showFormativeModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">📝 Add Formative Assessment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => {
                  setShowFormativeModal(false);
                  setFormativeQuestions([]);
                }}></button>
              </div>
              <form onSubmit={handleAddFormativeAssessment}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date *</label>
                      <input 
                        type="date" 
                        className="form-control bg-secondary text-light border-0" 
                        value={formativeForm.startDate}
                        onChange={(e) => setFormativeForm({...formativeForm, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date *</label>
                      <input 
                        type="date" 
                        className="form-control bg-secondary text-light border-0" 
                        value={formativeForm.endDate}
                        onChange={(e) => setFormativeForm({...formativeForm, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Questions Section */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <label className="form-label mb-0">Assessment Questions</label>
                        {formativeQuestions.length > 0 && (
                          <div className="text-success small mt-1">
                            Total: {formativeQuestions.length} question{formativeQuestions.length !== 1 ? 's' : ''} | 
                            Total Marks: {formativeQuestions.reduce((sum, q) => sum + (parseFloat(q.allocatedMarks) || 0), 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          const nextNumber = formativeQuestions.length + 1;
                          setFormativeQuestions([...formativeQuestions, {
                            questionNumber: nextNumber,
                            questionText: '',
                            allocatedMarks: ''
                          }]);
                        }}
                      >
                        + Add Question
                      </button>
                    </div>
                    
                    {formativeQuestions.length === 0 && (
                      <div className="alert alert-info mb-0">
                        <small>📝 No questions added yet. Click "Add Question" to create assessment questions.</small>
                      </div>
                    )}
                    
                    {formativeQuestions.map((question, index) => (
                      <div key={index} className="card bg-secondary mb-2 p-3 border border-secondary">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <strong className="text-light">Question {question.questionNumber}</strong>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              const updated = formativeQuestions.filter((_, i) => i !== index);
                              // Renumber questions
                              updated.forEach((q, i) => q.questionNumber = i + 1);
                              setFormativeQuestions(updated);
                            }}
                            title="Remove question"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mb-2">
                          <label className="form-label small text-muted mb-1">Question Text *</label>
                          <textarea 
                            className="form-control form-control-sm bg-dark text-light border-0" 
                            placeholder="Enter the question that learners will answer..."
                            value={question.questionText}
                            onChange={(e) => {
                              const updated = [...formativeQuestions];
                              updated[index].questionText = e.target.value;
                              setFormativeQuestions(updated);
                            }}
                            rows={2}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label small text-muted mb-1">Marks Allocated *</label>
                          <input 
                            type="number" 
                            step="0.5"
                            min="0"
                            className="form-control form-control-sm bg-dark text-light border-0" 
                            placeholder="e.g., 10"
                            value={question.allocatedMarks}
                            onChange={(e) => {
                              const updated = [...formativeQuestions];
                              updated[index].allocatedMarks = e.target.value;
                              setFormativeQuestions(updated);
                            }}
                            required
                          />
                        </div>
                      </div>
                    ))}
                    
                    {formativeQuestions.length > 0 && (
                      <div className="alert alert-secondary mt-2 mb-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-light">
                            <strong>Summary:</strong> {formativeQuestions.length} question{formativeQuestions.length !== 1 ? 's' : ''} added
                          </small>
                          <small className="text-success">
                            <strong>Total Marks: {formativeQuestions.reduce((sum, q) => sum + (parseFloat(q.allocatedMarks) || 0), 0).toFixed(2)}</strong>
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowFormativeModal(false);
                    setFormativeQuestions([]);
                  }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Assessment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Summative Assessment Modal */}
      {showSummativeModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">✅ Add Summative Assessment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => {
                  setShowSummativeModal(false);
                  setSummativeQuestions([]);
                }}></button>
              </div>
              <form onSubmit={handleAddSummativeAssessment}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date *</label>
                      <input 
                        type="date" 
                        className="form-control bg-secondary text-light border-0" 
                        value={summativeForm.startDate}
                        onChange={(e) => setSummativeForm({...summativeForm, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date *</label>
                      <input 
                        type="date" 
                        className="form-control bg-secondary text-light border-0" 
                        value={summativeForm.endDate}
                        onChange={(e) => setSummativeForm({...summativeForm, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Questions Section */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <label className="form-label mb-0">Assessment Questions</label>
                        {summativeQuestions.length > 0 && (
                          <div className="text-success small mt-1">
                            Total: {summativeQuestions.length} question{summativeQuestions.length !== 1 ? 's' : ''} | 
                            Total Marks: {summativeQuestions.reduce((sum, q) => sum + (parseFloat(q.allocatedMarks) || 0), 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          const nextNumber = summativeQuestions.length + 1;
                          setSummativeQuestions([...summativeQuestions, {
                            questionNumber: nextNumber,
                            questionText: '',
                            allocatedMarks: ''
                          }]);
                        }}
                      >
                        + Add Question
                      </button>
                    </div>
                    
                    {summativeQuestions.length === 0 && (
                      <div className="alert alert-info mb-0">
                        <small>📝 No questions added yet. Click "Add Question" to create assessment questions.</small>
                      </div>
                    )}
                    
                    {summativeQuestions.map((question, index) => (
                      <div key={index} className="card bg-secondary mb-2 p-3 border border-secondary">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <strong className="text-light">Question {question.questionNumber}</strong>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              const updated = summativeQuestions.filter((_, i) => i !== index);
                              // Renumber questions
                              updated.forEach((q, i) => q.questionNumber = i + 1);
                              setSummativeQuestions(updated);
                            }}
                            title="Remove question"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mb-2">
                          <label className="form-label small text-muted mb-1">Question Text *</label>
                          <textarea 
                            className="form-control form-control-sm bg-dark text-light border-0" 
                            placeholder="Enter the question that learners will answer..."
                            value={question.questionText}
                            onChange={(e) => {
                              const updated = [...summativeQuestions];
                              updated[index].questionText = e.target.value;
                              setSummativeQuestions(updated);
                            }}
                            rows={2}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label small text-muted mb-1">Marks Allocated *</label>
                          <input 
                            type="number" 
                            step="0.5"
                            min="0"
                            className="form-control form-control-sm bg-dark text-light border-0" 
                            placeholder="e.g., 10"
                            value={question.allocatedMarks}
                            onChange={(e) => {
                              const updated = [...summativeQuestions];
                              updated[index].allocatedMarks = e.target.value;
                              setSummativeQuestions(updated);
                            }}
                            required
                          />
                        </div>
                      </div>
                    ))}
                    
                    {summativeQuestions.length > 0 && (
                      <div className="alert alert-secondary mt-2 mb-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-light">
                            <strong>Summary:</strong> {summativeQuestions.length} question{summativeQuestions.length !== 1 ? 's' : ''} added
                          </small>
                          <small className="text-success">
                            <strong>Total Marks: {summativeQuestions.reduce((sum, q) => sum + (parseFloat(q.allocatedMarks) || 0), 0).toFixed(2)}</strong>
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowSummativeModal(false);
                    setSummativeQuestions([]);
                  }}>Cancel</button>
                  <button type="submit" className="btn btn-success">Add Assessment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Logbook Entry Modal */}
      {showLogbookModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">📖 Add Logbook Entry</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogbookModal(false)}></button>
              </div>
              <form onSubmit={handleAddLogbookEntry}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date *</label>
                      <input 
                        type="date" 
                        className="form-control bg-secondary text-light border-0" 
                        value={logbookForm.startDate}
                        onChange={(e) => setLogbookForm({...logbookForm, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date *</label>
                      <input 
                        type="date" 
                        className="form-control bg-secondary text-light border-0" 
                        value={logbookForm.endDate}
                        onChange={(e) => setLogbookForm({...logbookForm, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Activity Description *</label>
                    <textarea 
                      className="form-control bg-secondary text-light border-0" 
                      rows={4}
                      value={logbookForm.activityDescription}
                      onChange={(e) => setLogbookForm({...logbookForm, activityDescription: e.target.value})}
                      required
                      placeholder="Describe the practical activity performed..."
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Hours Spent</label>
                    <input 
                      type="number" 
                      step="0.5"
                      className="form-control bg-secondary text-light border-0" 
                      value={logbookForm.hoursSpent}
                      onChange={(e) => setLogbookForm({...logbookForm, hoursSpent: e.target.value})}
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Supervisor Name</label>
                    <input 
                      type="text" 
                      className="form-control bg-secondary text-light border-0" 
                      value={logbookForm.supervisorName}
                      onChange={(e) => setLogbookForm({...logbookForm, supervisorName: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Comments</label>
                    <textarea 
                      className="form-control bg-secondary text-light border-0" 
                      rows={2}
                      value={logbookForm.comments}
                      onChange={(e) => setLogbookForm({...logbookForm, comments: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLogbookModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning text-dark">Add Entry</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Learner Marking Modal */}
      {showMarkingModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title">🧾 Assessment Marking</h5>
                  <small className="text-muted">
                    {markingAssessment ? `${markingAssessment.type} #${markingAssessment.id}` : ''}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowMarkingModal(false);
                    setMarkingAssessment(null);
                    setMarkingData(null);
                    setDraftMarks({});
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {markingLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-light" role="status"></div>
                    <div className="mt-2">Loading learner submissions...</div>
                  </div>
                ) : !markingData?.learners || markingData.learners.length === 0 ? (
                  <div className="alert alert-secondary mb-0">
                    No learner submissions found for this assessment yet.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {markingData.learners.map((learner: any) => (
                      <div key={learner.learnerId} className="card bg-secondary border-0">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <strong>{learner.learnerName || `Learner #${learner.learnerId}`}</strong>
                          <span className="badge bg-info text-dark">
                            Draft Total: {calculateLearnerTotal(learner).toFixed(2)}
                          </span>
                        </div>
                        <div className="card-body">
                          {(learner.answers || []).map((answer: any) => {
                            const markKey = `${learner.learnerId}-${answer.questionId}`;
                            const isMarked = answer.mark !== null && answer.mark !== undefined;
                            
                            return (
                              <div key={answer.answerId} className={`mb-3 p-3 rounded ${isMarked ? 'border border-success' : ''}`} style={{backgroundColor: '#1f2937'}}>
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div>
                                    <strong>Q{answer.questionNumber}:</strong> {answer.questionText || 'Question text not available'}
                                  </div>
                                  {isMarked && <span className="badge bg-success">Marked</span>}
                                </div>
                                <div className="mb-2 text-light">
                                  {answer.scannedDocumentName ? (
                                    <>
                                      <small>Uploaded answer: {answer.scannedDocumentName}</small>
                                      <br />
                                      <small className="text-muted">Submitted: {new Date(answer.scannedAt).toLocaleString()}</small>
                                    </>
                                  ) : (
                                    <div className="text-warning small d-flex align-items-center">
                                      <i className="fas fa-exclamation-triangle me-1"></i>
                                      No script uploaded - marking disabled
                                    </div>
                                  )}
                                </div>
                                <div className="row g-2 align-items-end">
                                  <div className="col-12 col-md-4">
                                    <label className="form-label mb-1">Mark</label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      pattern="[0-9]*[.,]?[0-9]*"
                                      min="0"
                                      className="form-control form-control-sm bg-dark text-light border-secondary"
                                      value={draftMarks[markKey] || ''}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(',', '.');
                                        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                                        const numValue = parseFloat(raw);
                                        if (answer.allocatedMarks && !isNaN(numValue) && numValue > answer.allocatedMarks) {
                                          setDraftMarks(prev => ({ ...prev, [markKey]: answer.allocatedMarks.toString() }));
                                          return;
                                        }
                                        setDraftMarks(prev => ({ ...prev, [markKey]: raw }));
                                      }}
                                      placeholder={isMarked ? `Score: ${answer.mark}` : (answer.scannedDocumentName ? "Enter mark" : "No script")}
                                      disabled={!answer.scannedDocumentName || isMarked}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-outline-light" onClick={saveMarkingDraft} disabled={markingSaving}>
                  Save Draft Marks
                </button>
                <button type="button" className="btn btn-primary" onClick={submitModalMarks} disabled={markingSaving}>
                  {markingSaving ? 'Submitting...' : 'Submit Marks to Server'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowMarkingModal(false);
                    setMarkingAssessment(null);
                    setMarkingData(null);
                    setDraftMarks({});
                  }}
                  disabled={markingSaving}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Site Modal - For Logistics Managers */}
      {showAddSiteModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title">🏢 Site Information</h5>
                  <small className="text-muted">Please fill in the details below to add a new site</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddSiteModal(false)}></button>
              </div>
              <form onSubmit={handleAddSite}>
                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                  {/* Basic Site Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📋 Basic Site Information</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Site Name *</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.siteName}
                          onChange={(e) => setAddSiteForm({...addSiteForm, siteName: e.target.value})}
                          required
                          placeholder="Enter site name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Category *</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addSiteForm.category}
                          onChange={(e) => setAddSiteForm({...addSiteForm, category: e.target.value})}
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Workplace">Workplace</option>
                          <option value="Institutional">Institutional</option>
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Beneficiaries</label>
                        <input 
                          type="number" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.capacity}
                          onChange={(e) => setAddSiteForm({...addSiteForm, capacity: e.target.value})}
                          placeholder="Number of beneficiaries"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📍 Coordinates</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Latitude</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.latitude}
                          onChange={(e) => setAddSiteForm({...addSiteForm, latitude: e.target.value})}
                          placeholder="e.g., -26.2041"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Longitude</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.longitude}
                          onChange={(e) => setAddSiteForm({...addSiteForm, longitude: e.target.value})}
                          placeholder="e.g., 28.0473"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Person Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">👤 Contact Person Information</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.contactFirstName}
                          onChange={(e) => setAddSiteForm({...addSiteForm, contactFirstName: e.target.value})}
                          placeholder="First name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.contactLastName}
                          onChange={(e) => setAddSiteForm({...addSiteForm, contactLastName: e.target.value})}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Cell Number</label>
                        <input 
                          type="tel" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.contactCellNumber}
                          onChange={(e) => setAddSiteForm({...addSiteForm, contactCellNumber: e.target.value})}
                          placeholder="0XX XXX XXXX"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email Address</label>
                        <input 
                          type="email" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.contactEmail}
                          onChange={(e) => setAddSiteForm({...addSiteForm, contactEmail: e.target.value})}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📍 Location Information</h6>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Province</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addSiteForm.province}
                          onChange={(e) => setAddSiteForm({...addSiteForm, province: e.target.value})}
                        >
                          <option value="">Select Province</option>
                          <option value="Eastern Cape">Eastern Cape</option>
                          <option value="Free State">Free State</option>
                          <option value="Gauteng">Gauteng</option>
                          <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                          <option value="Limpopo">Limpopo</option>
                          <option value="Mpumalanga">Mpumalanga</option>
                          <option value="Northern Cape">Northern Cape</option>
                          <option value="North West">North West</option>
                          <option value="Western Cape">Western Cape</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.city}
                          onChange={(e) => setAddSiteForm({...addSiteForm, city: e.target.value})}
                          placeholder="City"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addSiteForm.postalCode}
                          onChange={(e) => setAddSiteForm({...addSiteForm, postalCode: e.target.value})}
                          placeholder="0000"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <textarea 
                          className="form-control bg-secondary text-light border-0" 
                          rows={2}
                          value={addSiteForm.address}
                          onChange={(e) => setAddSiteForm({...addSiteForm, address: e.target.value})}
                          placeholder="Street address"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddSiteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Adding...
                      </>
                    ) : (
                      '🏢 Add Site'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Site Modal - For Logistics Managers */}
      {showEditSiteModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title">✏️ Update Site Information</h5>
                  <small className="text-muted">Modify the details below to update the site</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditSiteModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateSite}>
                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                  {/* Basic Site Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📋 Basic Site Information</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Site Name *</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.siteName}
                          onChange={(e) => setEditSiteForm({...editSiteForm, siteName: e.target.value})}
                          required
                          placeholder="Enter site name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Category *</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={editSiteForm.category}
                          onChange={(e) => setEditSiteForm({...editSiteForm, category: e.target.value})}
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Workplace">Workplace</option>
                          <option value="Institutional">Institutional</option>
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Beneficiaries</label>
                        <input 
                          type="number" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.capacity}
                          onChange={(e) => setEditSiteForm({...editSiteForm, capacity: e.target.value})}
                          placeholder="Number of beneficiaries"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📍 Coordinates</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Latitude</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.latitude}
                          onChange={(e) => setEditSiteForm({...editSiteForm, latitude: e.target.value})}
                          placeholder="e.g., -26.2041"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Longitude</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.longitude}
                          onChange={(e) => setEditSiteForm({...editSiteForm, longitude: e.target.value})}
                          placeholder="e.g., 28.0473"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Person Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">👤 Contact Person Information</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.contactFirstName}
                          onChange={(e) => setEditSiteForm({...editSiteForm, contactFirstName: e.target.value})}
                          placeholder="First name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.contactLastName}
                          onChange={(e) => setEditSiteForm({...editSiteForm, contactLastName: e.target.value})}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Cell Number</label>
                        <input 
                          type="tel" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.contactCellNumber}
                          onChange={(e) => setEditSiteForm({...editSiteForm, contactCellNumber: e.target.value})}
                          placeholder="0XX XXX XXXX"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email Address</label>
                        <input 
                          type="email" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.contactEmail}
                          onChange={(e) => setEditSiteForm({...editSiteForm, contactEmail: e.target.value})}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📍 Location Information</h6>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Province</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={editSiteForm.province}
                          onChange={(e) => setEditSiteForm({...editSiteForm, province: e.target.value})}
                        >
                          <option value="">Select Province</option>
                          <option value="Eastern Cape">Eastern Cape</option>
                          <option value="Free State">Free State</option>
                          <option value="Gauteng">Gauteng</option>
                          <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                          <option value="Limpopo">Limpopo</option>
                          <option value="Mpumalanga">Mpumalanga</option>
                          <option value="Northern Cape">Northern Cape</option>
                          <option value="North West">North West</option>
                          <option value="Western Cape">Western Cape</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.city}
                          onChange={(e) => setEditSiteForm({...editSiteForm, city: e.target.value})}
                          placeholder="City"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={editSiteForm.postalCode}
                          onChange={(e) => setEditSiteForm({...editSiteForm, postalCode: e.target.value})}
                          placeholder="0000"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <textarea 
                          className="form-control bg-secondary text-light border-0" 
                          rows={2}
                          value={editSiteForm.address}
                          onChange={(e) => setEditSiteForm({...editSiteForm, address: e.target.value})}
                          placeholder="Street address"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditSiteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Updating...
                      </>
                    ) : (
                      '💾 Update Site'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal - For Logistics Managers */}
      {showAddClassModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title">🎓 Class Information</h5>
                  <small className="text-muted">Please fill in the details below to add a new class</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddClassModal(false)}></button>
              </div>
              <form onSubmit={handleAddClass}>
                <div className="modal-body">
                  {/* Basic Class Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📋 Basic Class Information</h6>
                    <div className="mb-3">
                      <label className="form-label">Class Name *</label>
                      <input 
                        type="text" 
                        className="form-control bg-secondary text-light border-0" 
                        value={addClassForm.className}
                        onChange={(e) => setAddClassForm({...addClassForm, className: e.target.value})}
                        required
                        placeholder="Enter class name"
                        pattern="[a-zA-Z\s]+"
                        title="Only letters and spaces are allowed"
                      />
                      <small className="text-muted">Only letters and spaces are allowed.</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Maximum Learners *</label>
                      <input 
                        type="number" 
                        className="form-control bg-secondary text-light border-0" 
                        value={addClassForm.maxLearners}
                        onChange={(e) => setAddClassForm({...addClassForm, maxLearners: e.target.value})}
                        required
                        placeholder="Enter maximum number of learners"
                        min="1"
                      />
                      <small className="text-muted">Only positive numbers are allowed.</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddClassModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Adding...
                      </>
                    ) : (
                      '🎓 Add Class'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Learner Modal */}
      {showAddLearnerModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title">👨‍🎓 Learner Information</h5>
                  <small className="text-muted">Please fill in the learner details below</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={closeLearnerModal}></button>
              </div>
              <form onSubmit={handleAddLearner}>
                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                  {/* Personal Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📋 Personal Information</h6>
                    <div className="row g-3">
                      <div className="col-md-2">
                        <label className="form-label">Title *</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addLearnerForm.title}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, title: e.target.value})}
                          required
                        >
                          <option value="">Select Title</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Miss">Miss</option>
                          <option value="Sir">Sir</option>
                          <option value="Dr">Dr</option>
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label">Name *</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.firstName}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, firstName: e.target.value})}
                          required
                          placeholder="First name"
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label">Surname *</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.lastName}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, lastName: e.target.value})}
                          required
                          placeholder="Last name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">ID Number *</label>
                        <input 
                          type="text" 
                          className={`form-control bg-secondary text-light border-0 ${idNumberError ? 'border-danger border' : ''}`}
                          value={addLearnerForm.idNumber}
                          onChange={(e) => handleIdNumberChange(e.target.value)}
                          required
                          placeholder="13-digit SA ID number"
                          maxLength={13}
                          inputMode="numeric"
                        />
                        {idNumberError ? (
                          <small className="text-danger">⚠️ {idNumberError}</small>
                        ) : addLearnerForm.idNumber.length === 13 ? (
                          <small className="text-success">✓ Valid ID - DOB and gender auto-filled</small>
                        ) : (
                          <small className="text-muted">Enter 13-digit SA ID number (numbers only)</small>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Contact Number</label>
                        <input 
                          type="tel" 
                          className={`form-control bg-secondary text-light border-0 ${formErrors.contactNumber ? 'border-danger border' : ''}`}
                          value={addLearnerForm.contactNumber}
                          onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
                          placeholder="0821234567"
                          maxLength={10}
                          inputMode="numeric"
                        />
                        {formErrors.contactNumber ? (
                          <small className="text-danger">⚠️ {formErrors.contactNumber}</small>
                        ) : (
                          <small className="text-muted">10 digits starting with 0</small>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input 
                          type="email" 
                          className={`form-control bg-secondary text-light border-0 ${formErrors.email ? 'border-danger border' : ''}`}
                          value={addLearnerForm.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="email@example.com"
                        />
                        {formErrors.email && (
                          <small className="text-danger">⚠️ {formErrors.email}</small>
                        )}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Date of Birth</label>
                        <input 
                          type="date" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.dateOfBirth}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, dateOfBirth: e.target.value})}
                          readOnly
                          title="Auto-filled from ID number"
                        />
                        <small className="text-muted">Auto-filled from ID</small>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Age</label>
                        <input 
                          type="number" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.age}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, age: e.target.value})}
                          placeholder="Age"
                          min="0"
                          readOnly
                          title="Auto-calculated from ID number"
                        />
                        <small className="text-muted">Auto-calculated</small>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Gender *</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addLearnerForm.gender}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, gender: e.target.value})}
                          disabled={addLearnerForm.idNumber.length === 13}
                          title={addLearnerForm.idNumber.length === 13 ? "Auto-filled from ID number" : ""}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                        {addLearnerForm.idNumber.length === 13 && (
                          <small className="text-muted">Auto-filled from ID</small>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Race</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addLearnerForm.race}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, race: e.target.value})}
                        >
                          <option value="">Select Race</option>
                          <option value="Asian">Asian</option>
                          <option value="Black">Black</option>
                          <option value="Colored">Colored</option>
                          <option value="White">White</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Home Language</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addLearnerForm.homeLanguage}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, homeLanguage: e.target.value})}
                        >
                          <option value="">Select Language</option>
                          <option value="English">English</option>
                          <option value="IsiZulu">IsiZulu</option>
                          <option value="Sesotho">Sesotho</option>
                          <option value="IsiXhosa">IsiXhosa</option>
                          <option value="Tshonga">Tshonga</option>
                          <option value="Afrikaans">Afrikaans</option>
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Disability</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addLearnerForm.disability}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, disability: e.target.value})}
                        >
                          <option value="None">None</option>
                          <option value="Visual Impairment">Visual Impairment</option>
                          <option value="Hearing Impairment">Hearing Impairment</option>
                          <option value="Physical Disability">Physical Disability</option>
                          <option value="Mental Disability">Mental Disability</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">📍 Address Information</h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Address Line 1</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.addressLine1}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, addressLine1: e.target.value})}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address Line 2</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.addressLine2}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, addressLine2: e.target.value})}
                          placeholder="Suburb"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address Line 3</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.addressLine3}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, addressLine3: e.target.value})}
                          placeholder="City"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className={`form-control bg-secondary text-light border-0 ${formErrors.postalCode ? 'border-danger border' : ''}`}
                          value={addLearnerForm.postalCode}
                          onChange={(e) => handleFieldChange('postalCode', e.target.value.replace(/\D/g, ''))}
                          placeholder="0000"
                          maxLength={4}
                          inputMode="numeric"
                        />
                        {formErrors.postalCode ? (
                          <small className="text-danger">⚠️ {formErrors.postalCode}</small>
                        ) : (
                          <small className="text-muted">4 digits</small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Education Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">🎓 Education Information</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">High School Name</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.highSchoolName}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, highSchoolName: e.target.value})}
                          placeholder="School name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Year of Completion</label>
                        <input 
                          type="number" 
                          className={`form-control bg-secondary text-light border-0 ${formErrors.yearOfCompletion ? 'border-danger border' : ''}`}
                          value={addLearnerForm.yearOfCompletion}
                          onChange={(e) => handleFieldChange('yearOfCompletion', e.target.value)}
                          placeholder="YYYY"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                        {formErrors.yearOfCompletion ? (
                          <small className="text-danger">⚠️ {formErrors.yearOfCompletion}</small>
                        ) : (
                          <small className="text-muted">Between 1900 and {new Date().getFullYear()}</small>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">School Location</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.schoolLocation}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, schoolLocation: e.target.value})}
                          placeholder="City/Town"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Highest Grade Passed</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.highestGradePassed}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, highestGradePassed: e.target.value})}
                          placeholder="e.g., Grade 12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Next of Kin Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">👤 Next of Kin Information</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Name</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.nextOfKinName}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, nextOfKinName: e.target.value})}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Relation</label>
                        <input 
                          type="text" 
                          className="form-control bg-secondary text-light border-0" 
                          value={addLearnerForm.nextOfKinRelation}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, nextOfKinRelation: e.target.value})}
                          placeholder="e.g., Mother, Father, Spouse"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Contact Number</label>
                        <input 
                          type="tel" 
                          className={`form-control bg-secondary text-light border-0 ${formErrors.nextOfKinContactNumber ? 'border-danger border' : ''}`}
                          value={addLearnerForm.nextOfKinContactNumber}
                          onChange={(e) => handleFieldChange('nextOfKinContactNumber', e.target.value)}
                          placeholder="0821234567"
                          maxLength={10}
                          inputMode="numeric"
                        />
                        {formErrors.nextOfKinContactNumber && (
                          <small className="text-danger">⚠️ {formErrors.nextOfKinContactNumber}</small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bank Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">🏦 Bank Information</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Bank Name</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addLearnerForm.bankName}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, bankName: e.target.value})}
                        >
                          <option value="">Select Bank</option>
                          <option value="ABSA">ABSA</option>
                          <option value="Capitec">Capitec</option>
                          <option value="FNB">FNB</option>
                          <option value="Nedbank">Nedbank</option>
                          <option value="Standard Bank">Standard Bank</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Account Type</label>
                        <select 
                          className="form-select bg-secondary text-light border-0"
                          value={addLearnerForm.accountType}
                          onChange={(e) => setAddLearnerForm({...addLearnerForm, accountType: e.target.value})}
                        >
                          <option value="">Select Account Type</option>
                          <option value="Savings">Savings</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Transmission">Transmission</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Account Number</label>
                        <input 
                          type="text" 
                          className={`form-control bg-secondary text-light border-0 ${formErrors.accountNumber ? 'border-danger border' : ''}`}
                          value={addLearnerForm.accountNumber}
                          onChange={(e) => handleFieldChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                          placeholder="Account number"
                          maxLength={11}
                          inputMode="numeric"
                        />
                        {formErrors.accountNumber ? (
                          <small className="text-danger">⚠️ {formErrors.accountNumber}</small>
                        ) : (
                          <small className="text-muted">6-11 digits</small>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Branch Code</label>
                        <input 
                          type="text" 
                          className={`form-control bg-secondary text-light border-0 ${formErrors.branchCode ? 'border-danger border' : ''}`}
                          value={addLearnerForm.branchCode}
                          onChange={(e) => handleFieldChange('branchCode', e.target.value.replace(/\D/g, ''))}
                          placeholder="Branch code"
                          maxLength={6}
                          inputMode="numeric"
                        />
                        {formErrors.branchCode ? (
                          <small className="text-danger">⚠️ {formErrors.branchCode}</small>
                        ) : (
                          <small className="text-muted">6 digits</small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={closeLearnerModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Adding...
                      </>
                    ) : (
                      '👨‍🎓 Add Learner'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Learner Modal */}
      {showLearnerModal && selectedLearner && editLearnerForm && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title">👨‍🎓 {selectedLearner.firstName} {selectedLearner.lastName}</h5>
                  <small className="text-muted">ID: {selectedLearner.idNumber}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLearnerModal(false)}></button>
              </div>
              
              {/* Tabs */}
              <div className="modal-body p-0">
                <ul className="nav nav-tabs bg-secondary border-0">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${learnerModalTab === 'info' ? 'active bg-dark text-light' : 'text-light'}`}
                      onClick={() => setLearnerModalTab('info')}
                      style={{border: 'none'}}
                    >
                      📋 Learner Information
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${learnerModalTab === 'documents' ? 'active bg-dark text-light' : 'text-light'}`}
                      onClick={() => setLearnerModalTab('documents')}
                      style={{border: 'none'}}
                    >
                      📄 Documents
                    </button>
                  </li>
                </ul>

                {/* Tab Content */}
                <div className="p-4" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                  {learnerModalTab === 'info' ? (
                    <form onSubmit={handleUpdateLearner}>
                      {/* Personal Information */}
                      <div className="mb-4">
                        <h6 className="text-primary mb-3">📋 Personal Information</h6>
                        
                        {/* Profile Image */}
                        <div className="row mb-4">
                          <div className="col-12 d-flex justify-content-center">
                            <div className="text-center">
                              <div 
                                className="bg-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                                style={{
                                  width: '150px',
                                  height: '150px',
                                  border: '3px solid #6c757d',
                                  overflow: 'hidden'
                                }}
                              >
                                {selectedLearner?.profilePhotoPath ? (
                                  <>
                                    {console.log('🖼️ Displaying profile photo for:', selectedLearner.firstName, selectedLearner.lastName, 'Path:', selectedLearner.profilePhotoPath)}
                                    <img 
                                      src={`http://localhost:5213/api/Learners/${selectedLearner.id}/profile-photo`}
                                      alt={`${selectedLearner.firstName} ${selectedLearner.lastName}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                      onLoad={() => console.log('✅ Profile photo loaded successfully')}
                                      onError={(e) => {
                                        console.error('❌ Profile photo failed to load:', e);
                                        // Fallback to placeholder if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = `
                                          <div class="text-center">
                                            <div style="font-size: 3rem">👤</div>
                                            <small class="text-muted d-block" style="font-size: 0.7rem">Photo Load Failed</small>
                                          </div>
                                        `;
                                      }}
                                    />
                                  </>
                                ) : (
                                  <div className="text-center">
                                    <div style={{fontSize: '3rem'}}>👤</div>
                                    <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>No Photo</small>
                                  </div>
                                )}
                              </div>
                              <small className="text-muted d-block">
                                {selectedLearner?.profilePhotoPath ? '📸 Profile Photo' : '📸 Profile photo will be available in mobile app'}
                              </small>
                              <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>
                                {selectedLearner?.firstName} {selectedLearner?.lastName}
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="row g-3">
                          <div className="col-md-2">
                            <label className="form-label">Title *</label>
                            <select 
                              className="form-select bg-secondary text-light border-0"
                              value={editLearnerForm.title}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, title: e.target.value})}
                              required
                            >
                              <option value="">Select Title</option>
                              <option value="Mr">Mr</option>
                              <option value="Mrs">Mrs</option>
                              <option value="Miss">Miss</option>
                              <option value="Sir">Sir</option>
                              <option value="Dr">Dr</option>
                            </select>
                          </div>
                          <div className="col-md-5">
                            <label className="form-label">Name *</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.firstName}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, firstName: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-5">
                            <label className="form-label">Surname *</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.lastName}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, lastName: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">ID Number *</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.idNumber}
                              readOnly
                              title="ID number cannot be changed"
                            />
                            <small className="text-muted">ID number cannot be changed</small>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Contact Number</label>
                            <input 
                              type="tel" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.contactNumber}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, contactNumber: e.target.value.replace(/\D/g, '')})}
                              maxLength={10}
                              inputMode="numeric"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input 
                              type="email" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.email}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, email: e.target.value})}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Date of Birth</label>
                            <input 
                              type="date" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.dateOfBirth}
                              readOnly
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Age</label>
                            <input 
                              type="number" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.age}
                              readOnly
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Gender</label>
                            <select 
                              className="form-select bg-secondary text-light border-0"
                              value={editLearnerForm.gender}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, gender: e.target.value})}
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Race</label>
                            <select 
                              className="form-select bg-secondary text-light border-0"
                              value={editLearnerForm.race}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, race: e.target.value})}
                            >
                              <option value="">Select Race</option>
                              <option value="Asian">Asian</option>
                              <option value="Black">Black</option>
                              <option value="Colored">Colored</option>
                              <option value="White">White</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Home Language</label>
                            <select 
                              className="form-select bg-secondary text-light border-0"
                              value={editLearnerForm.homeLanguage}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, homeLanguage: e.target.value})}
                            >
                              <option value="">Select Language</option>
                              <option value="English">English</option>
                              <option value="IsiZulu">IsiZulu</option>
                              <option value="Sesotho">Sesotho</option>
                              <option value="IsiXhosa">IsiXhosa</option>
                              <option value="Tshonga">Tshonga</option>
                              <option value="Afrikaans">Afrikaans</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="mb-4">
                        <h6 className="text-primary mb-3">📍 Address Information</h6>
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label">Address Line 1</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.addressLine1}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, addressLine1: e.target.value})}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Address Line 2</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.addressLine2}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, addressLine2: e.target.value})}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Address Line 3</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.addressLine3}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, addressLine3: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Postal Code</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.postalCode}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, postalCode: e.target.value.replace(/\D/g, '')})}
                              maxLength={4}
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Education Information */}
                      <div className="mb-4">
                        <h6 className="text-primary mb-3">🎓 Education Information</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">High School Name</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.highSchoolName}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, highSchoolName: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Year of Completion</label>
                            <input 
                              type="number" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.yearOfCompletion}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, yearOfCompletion: e.target.value})}
                              min="1900"
                              max={new Date().getFullYear()}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">School Location</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.schoolLocation}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, schoolLocation: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Highest Grade Passed</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.highestGradePassed}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, highestGradePassed: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Next of Kin Information */}
                      <div className="mb-4">
                        <h6 className="text-primary mb-3">👤 Next of Kin Information</h6>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Name</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.nextOfKinName}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, nextOfKinName: e.target.value})}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Relation</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0" 
                              value={editLearnerForm.nextOfKinRelation}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, nextOfKinRelation: e.target.value})}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Contact Number</label>
                            <input 
                              type="tel" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.nextOfKinContactNumber}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, nextOfKinContactNumber: e.target.value.replace(/\D/g, '')})}
                              maxLength={10}
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bank Information */}
                      <div className="mb-4">
                        <h6 className="text-primary mb-3">🏦 Bank Information</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Bank Name</label>
                            <select 
                              className="form-select bg-secondary text-light border-0"
                              value={editLearnerForm.bankName}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, bankName: e.target.value})}
                            >
                              <option value="">Select Bank</option>
                              <option value="ABSA">ABSA</option>
                              <option value="Capitec">Capitec</option>
                              <option value="FNB">FNB</option>
                              <option value="Nedbank">Nedbank</option>
                              <option value="Standard Bank">Standard Bank</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Account Type</label>
                            <select 
                              className="form-select bg-secondary text-light border-0"
                              value={editLearnerForm.accountType}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, accountType: e.target.value})}
                            >
                              <option value="">Select Account Type</option>
                              <option value="Savings">Savings</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Transmission">Transmission</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Account Number</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.accountNumber}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, accountNumber: e.target.value.replace(/\D/g, '')})}
                              maxLength={11}
                              inputMode="numeric"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Branch Code</label>
                            <input 
                              type="text" 
                              className="form-control bg-secondary text-light border-0"
                              value={editLearnerForm.branchCode}
                              onChange={(e) => setEditLearnerForm({...editLearnerForm, branchCode: e.target.value.replace(/\D/g, '')})}
                              maxLength={6}
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowLearnerModal(false)}>
                          {isLogistics ? 'Close' : 'Cancel'}
                        </button>
                        {!isLogistics && (
                          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Updating...
                              </>
                            ) : (
                              '💾 Update Learner'
                            )}
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div>
                      {/* Documents Tab */}
                      {!isLogistics && (
                        <div className="mb-4">
                        <h6 className="text-primary mb-3">📄 Upload Document</h6>
                        <form onSubmit={handleUploadDocument}>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">Document Type *</label>
                              <select
                                className="form-select bg-secondary text-light border-0"
                                value={selectedDocumentType}
                                onChange={(e) => setSelectedDocumentType(e.target.value)}
                                required
                              >
                                <option value="">Select Type</option>
                                {documentTypes
                                  .filter(type => !learnerDocuments.some(doc => doc.documentType === type))
                                  .map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                              </select>
                              {documentTypes.filter(type => !learnerDocuments.some(doc => doc.documentType === type)).length === 0 && (
                                <small className="text-warning d-block mt-1">
                                  ⚠️ All document types have been uploaded
                                </small>
                              )}
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Select File * (PDF, JPG, PNG - Max 10MB)</label>
                              <input 
                                type="file" 
                                className="form-control bg-secondary text-light border-0"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                required
                              />
                            </div>
                            <div className="col-12">
                              <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={uploadingDocument || documentTypes.filter(type => !learnerDocuments.some(doc => doc.documentType === type)).length === 0}
                              >
                                {uploadingDocument ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Uploading...
                                  </>
                                ) : (
                                  '📤 Upload Document'
                                )}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                      )}
                      {/* Document Status Summary */}
                      <div className="mb-4 p-3 bg-secondary rounded">
                        <h6 className="text-light mb-2">📊 Document Status</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {documentTypes.map(type => {
                            const isUploaded = learnerDocuments.some(doc => doc.documentType === type);
                            return (
                              <span 
                                key={type}
                                className={`badge ${isUploaded ? 'bg-success' : 'bg-warning text-dark'}`}
                                title={isUploaded ? 'Uploaded' : 'Not uploaded'}
                              >
                                {isUploaded ? '✓' : '○'} {type}
                              </span>
                            );
                          })}
                        </div>
                        <small className="text-muted d-block mt-2">
                          {learnerDocuments.length} of {documentTypes.length} documents uploaded
                        </small>
                      </div>

                      {/* Documents List */}
                      <div>
                        <h6 className="text-primary mb-3">📋 Uploaded Documents</h6>
                        {learnerDocuments.length > 0 ? (
                          <div className="list-group">
                            {learnerDocuments.map((doc) => (
                              <div key={doc.id} className="list-group-item bg-secondary text-light border-0 mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="flex-grow-1">
                                    <h6 className="mb-1">📄 {doc.documentType}</h6>
                                    <small className="text-muted d-block">{doc.fileName}</small>
                                    <small className="text-muted d-block">
                                      Size: {(doc.fileSize / 1024).toFixed(2)} KB | 
                                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()} {new Date(doc.uploadedAt).toLocaleTimeString()}
                                      {doc.uploadedByUserName && ` by ${doc.uploadedByUserName}`}
                                    </small>
                                  </div>
                                  <div>
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleViewDocument(doc.id)}
                                      title="View document in new tab"
                                    >
                                      👁️ View
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-secondary rounded">
                            <p className="text-muted mb-2">📭 No documents uploaded yet</p>
                            <small className="text-muted">Upload documents using the form above</small>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Management Modal */}
      {showTeacherModal && selectedClassForTeacher && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{backgroundColor: '#1e293b', color: 'white'}}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title">👨‍🏫 Teachers for {selectedClassForTeacher.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTeacherModal(false)}></button>
              </div>
              <div className="modal-body">
                {teachersLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading teachers...</p>
                  </div>
                ) : classTeachers.length > 0 ? (
                  <div>
                    <h6 className="mb-3">Assigned Teachers:</h6>
                    {classTeachers.map((teacher) => (
                      <div key={teacher.id} className="card mb-2" style={{backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf6'}}>
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">
                                <i className="bi bi-person-fill me-2"></i>
                                {teacher.teacherName}
                              </h6>
                              <small className="text-white-50">
                                <i className="bi bi-envelope me-2"></i>
                                {teacher.teacherEmail}
                              </small>
                              <br />
                              <small className="text-white-50">
                                <i className="bi bi-calendar me-2"></i>
                                Assigned: {new Date(teacher.assignedDate).toLocaleDateString()}
                              </small>
                            </div>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveTeacher(teacher.id, teacher.teacherName)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <hr className="border-secondary my-3" />
                  </div>
                ) : (
                  <div className="alert alert-info">
                    No teachers assigned yet.
                  </div>
                )}

                {!showAddTeacherForm ? (
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setShowAddTeacherForm(true)}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Add Teacher
                  </button>
                ) : (
                  <div className="card" style={{backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    <div className="card-body">
                      <h6 className="mb-3">Create New Teacher</h6>
                      <div className="mb-3">
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          className={`form-control ${teacherFormErrors.firstName ? 'is-invalid' : ''}`}
                          value={newTeacherForm.firstName}
                          onChange={(e) => {
                            setNewTeacherForm({...newTeacherForm, firstName: e.target.value});
                            setTeacherFormErrors({...teacherFormErrors, firstName: ''});
                          }}
                          placeholder="Enter first name"
                        />
                        {teacherFormErrors.firstName && (
                          <div className="invalid-feedback">{teacherFormErrors.firstName}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          className={`form-control ${teacherFormErrors.lastName ? 'is-invalid' : ''}`}
                          value={newTeacherForm.lastName}
                          onChange={(e) => {
                            setNewTeacherForm({...newTeacherForm, lastName: e.target.value});
                            setTeacherFormErrors({...teacherFormErrors, lastName: ''});
                          }}
                          placeholder="Enter last name"
                        />
                        {teacherFormErrors.lastName && (
                          <div className="invalid-feedback">{teacherFormErrors.lastName}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className={`form-control ${teacherFormErrors.email ? 'is-invalid' : ''}`}
                          value={newTeacherForm.email}
                          onChange={(e) => {
                            setNewTeacherForm({...newTeacherForm, email: e.target.value});
                            setTeacherFormErrors({...teacherFormErrors, email: ''});
                          }}
                          placeholder="teacher@example.com"
                        />
                        {teacherFormErrors.email && (
                          <div className="invalid-feedback">{teacherFormErrors.email}</div>
                        )}
                      </div>
                      <small className="text-white-50 d-block mb-3">
                        <i className="bi bi-info-circle me-1"></i>
                        A system-generated password will be sent to the teacher's email.
                      </small>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-secondary flex-fill"
                          onClick={() => {
                            setShowAddTeacherForm(false);
                            setNewTeacherForm({firstName: '', lastName: '', email: ''});
                            setTeacherFormErrors({firstName: '', lastName: '', email: ''});
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary flex-fill"
                          onClick={handleCreateTeacher}
                        >
                          Create Teacher
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal with Approval Controls */}
      {showDocumentModal && selectedDocumentForView && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.8)'}}>
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <div className="d-flex align-items-center">
                  <i className="fas fa-file-alt me-2"></i>
                  <div>
                    <h5 className="modal-title mb-0">Document Review</h5>
                    <small className="opacity-75">
                      {selectedDocumentForView.learnerFirstName} {selectedDocumentForView.learnerLastName} - {selectedDocumentForView.documentType}
                    </small>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedDocumentForView(null);
                    if (documentPreviewUrl) {
                      window.URL.revokeObjectURL(documentPreviewUrl);
                      setDocumentPreviewUrl(null);
                    }
                  }}
                ></button>
              </div>
              
              <div className="modal-body p-0 d-flex" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Document Preview Area */}
                <div className="flex-grow-1 d-flex flex-column">
                  {previewLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p>Loading document...</p>
                      </div>
                    </div>
                  ) : documentPreviewUrl ? (
                    <div className="h-100">
                      {selectedDocumentForView.mimeType.startsWith('image/') ? (
                        <img 
                          src={documentPreviewUrl} 
                          alt={selectedDocumentForView.fileName}
                          className="w-100 h-100"
                          style={{ objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                        />
                      ) : selectedDocumentForView.mimeType === 'application/pdf' ? (
                        <iframe 
                          src={documentPreviewUrl}
                          className="w-100 h-100 border-0"
                          title={selectedDocumentForView.fileName}
                        />
                      ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 bg-light">
                          <div className="text-center">
                            <i className="fas fa-file fa-4x text-muted mb-3"></i>
                            <h5>Preview not available</h5>
                            <p className="text-muted">This file type cannot be previewed in the browser.</p>
                            <button 
                              className="btn btn-outline-primary"
                              onClick={() => window.open(documentPreviewUrl, '_blank')}
                            >
                              <i className="fas fa-external-link-alt me-2"></i>
                              Open in New Tab
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <div className="text-center text-muted">
                        <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
                        <h5>Failed to load document</h5>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Approval Controls Sidebar */}
                <div className="border-start bg-light" style={{ width: '350px', minWidth: '350px' }}>
                  <div className="p-4">
                    <h6 className="fw-bold mb-3">
                      <i className="fas fa-clipboard-check me-2 text-primary"></i>
                      Document Information
                    </h6>
                    
                    {/* Document Details */}
                    <div className="mb-4">
                      <div className="row g-2 small">
                        <div className="col-12">
                          <strong>Learner:</strong><br/>
                          {selectedDocumentForView.learnerFirstName} {selectedDocumentForView.learnerLastName}
                        </div>
                        <div className="col-12">
                          <strong>ID Number:</strong><br/>
                          {selectedDocumentForView.learnerIdNumber}
                        </div>
                        <div className="col-12">
                          <strong>Document Type:</strong><br/>
                          {selectedDocumentForView.documentType}
                        </div>
                        <div className="col-12">
                          <strong>File Name:</strong><br/>
                          {selectedDocumentForView.fileName}
                        </div>
                        <div className="col-12">
                          <strong>File Size:</strong><br/>
                          {(selectedDocumentForView.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div className="col-12">
                          <strong>Upload Date:</strong><br/>
                          {new Date(selectedDocumentForView.uploadedAt).toLocaleDateString()} at {new Date(selectedDocumentForView.uploadedAt).toLocaleTimeString()}
                        </div>
                        <div className="col-12">
                          <strong>Current Status:</strong><br/>
                          <span className={`badge ${
                            selectedDocumentForView.approvalStatus === 'Approved' ? 'bg-success' :
                            selectedDocumentForView.approvalStatus === 'Declined' ? 'bg-danger' :
                            'bg-warning'
                          }`}>
                            {selectedDocumentForView.approvalStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Approval Status */}
                    {selectedDocumentForView.approvalStatus === 'Approved' && (
                      <div className="alert alert-success">
                        <i className="fas fa-check-circle me-2"></i>
                        <strong>Approved</strong><br/>
                        <small>
                          {selectedDocumentForView.approvedAt && 
                            `Approved on ${new Date(selectedDocumentForView.approvedAt).toLocaleDateString()}`
                          }
                        </small>
                      </div>
                    )}

                    {selectedDocumentForView.approvalStatus === 'Declined' && (
                      <div className="alert alert-danger">
                        <i className="fas fa-times-circle me-2"></i>
                        <strong>Declined</strong><br/>
                        {selectedDocumentForView.declineReason && (
                          <small><strong>Reason:</strong> {selectedDocumentForView.declineReason}</small>
                        )}
                        <br/>
                        <small>
                          {selectedDocumentForView.approvedAt && 
                            `Declined on ${new Date(selectedDocumentForView.approvedAt).toLocaleDateString()}`
                          }
                        </small>
                      </div>
                    )}

                    {/* Approval Actions - Only show for pending documents */}
                    {selectedDocumentForView.approvalStatus === 'Pending' && (
                      <div className="mt-4">
                        <h6 className="fw-bold mb-3 text-primary">
                          <i className="fas fa-gavel me-2"></i>
                          Make Decision
                        </h6>
                        
                        <div className="d-grid gap-2">
                          <button 
                            className="btn btn-success btn-lg"
                            onClick={() => approveDocument(selectedDocumentForView.id)}
                          >
                            <i className="fas fa-check me-2"></i>
                            Approve Document
                          </button>
                          
                          <button 
                            className="btn btn-danger btn-lg"
                            onClick={() => {
                              setDocumentToDecline(selectedDocumentForView);
                              setShowDeclineModal(true);
                            }}
                          >
                            <i className="fas fa-times me-2"></i>
                            Decline Document
                          </button>
                        </div>
                        
                        <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
                          <small className="text-info">
                            <i className="fas fa-info-circle me-1"></i>
                            Review the document carefully before making your decision. 
                            Approved documents will be marked as verified, while declined documents will require resubmission.
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Document Modal */}
      {showDeclineModal && documentToDecline && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">❌ Decline Document</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineReason('');
                    setDocumentToDecline(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p><strong>Document:</strong> {documentToDecline.fileName}</p>
                  <p><strong>Type:</strong> {documentToDecline.documentType}</p>
                  <p><strong>Learner:</strong> {documentToDecline.learnerFirstName} {documentToDecline.learnerLastName}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason for Decline *</label>
                  <textarea 
                    className="form-control" 
                    rows={4}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Please provide a reason for declining this document..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineReason('');
                    setDocumentToDecline(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => {
                    if (declineReason.trim()) {
                      declineDocument(documentToDecline.id, declineReason.trim());
                    } else {
                      alert('Please provide a reason for declining the document.');
                    }
                  }}
                  disabled={!declineReason.trim()}
                >
                  Decline Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sick Note Decline Modal */}
      {showSickNoteDeclineModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">❌ Decline Sick Note</h5>
                <button type="button" className="btn-close" onClick={() => setShowSickNoteDeclineModal(false)}></button>
              </div>
              <form onSubmit={handleDeclineSickNote}>
                <div className="modal-body">
                  <p>Are you sure you want to decline the sick note for <strong>{sickNoteToDecline?.learnerName}</strong>?</p>
                  <div className="mb-3">
                    <label className="form-label">Reason for Decline *</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      value={sickNoteDeclineReason}
                      onChange={(e) => setSickNoteDeclineReason(e.target.value)}
                      placeholder="Please provide a reason for declining this sick note..."
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSickNoteDeclineModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger">Decline Sick Note</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SDPManagerDashboard;
