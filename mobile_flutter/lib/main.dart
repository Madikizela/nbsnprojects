import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/learner_auth_service.dart';
import 'services/offline_attendance_queue.dart';
import 'services/local_database_service.dart';
import 'services/sync_service.dart';
import 'screens/login_screen.dart';
import 'screens/learner_login_screen.dart';
import 'screens/learner_dashboard_screen.dart';
import 'screens/learner_profile_screen_portal.dart';
import 'screens/learner_documents_portal_screen.dart';
import 'screens/learner_assessments_portal_screen.dart';
import 'screens/learner_study_materials_screen.dart';
import 'screens/learner_change_password_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/sites_screen.dart';
import 'screens/classes_screen.dart';
import 'screens/learners_screen.dart';
import 'screens/attendance_clocking_screen.dart';
import 'screens/attendance_history_screen.dart';
import 'screens/add_learner_screen.dart';
import 'screens/scan_document_screen.dart';
import 'screens/learner_detail_screen.dart';
import 'screens/fingerprint_registration_screen.dart';
import 'screens/teacher_dashboard_screen.dart';
import 'screens/teacher_profile_screen.dart';
import 'screens/learner_evidence_screen.dart';
import 'screens/logistics_dashboard_screen.dart';
import 'screens/qualifications_screen.dart';
import 'screens/unit_standards_screen.dart';
import 'screens/assessments_screen.dart';
import 'screens/questions_screen.dart';
import 'screens/scan_question_answer_screen.dart';
import 'screens/scan_answers_screen.dart';
import 'screens/logbook_screen.dart';
import 'screens/logbook_entries_screen.dart';
import 'screens/add_logbook_entry_screen.dart';
import 'screens/server_settings_screen.dart';
import 'screens/notice_board_screen.dart';
import 'screens/learner_noticeboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize offline services
  await OfflineAttendanceQueue.instance.init();
  await LocalDatabaseService.instance.database; // Initialize DB
  await SyncService.instance.init(); // Initialize sync service

  runApp(const MyApp());
}

String _getInitialRoute(AuthService authService) {
  final user = authService.user;
  if (user != null) {
    debugPrint('DEBUG: User found in AuthService: $user');
    final role = user['role'] as String?;
    if (role == 'Teacher') {
      return '/teacher-dashboard';
    } else if (role == 'LogisticsSupport') {
      return '/logistics-dashboard';
    }
  } else {
    debugPrint('DEBUG: No user found in AuthService');
  }
  return '/projects';
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/teacher-dashboard',
          builder: (context, state) => const TeacherDashboardScreen(),
        ),
        GoRoute(
          path: '/teacher-profile',
          builder: (context, state) => const TeacherProfileScreen(),
        ),
        GoRoute(
          path: '/projects',
          builder: (context, state) => const ProjectsScreen(),
        ),
        GoRoute(
          path: '/projects/:projectId/sites',
          builder: (context, state) => SitesScreen(
            projectId: int.parse(state.pathParameters['projectId']!),
            projectName: state.uri.queryParameters['name'] ?? 'Project',
          ),
        ),
        GoRoute(
          path: '/projects/:projectId/sites/:siteId/classes',
          builder: (context, state) => ClassesScreen(
            siteId: int.parse(state.pathParameters['siteId']!),
          ),
        ),
        GoRoute(
          path: '/classes/:classId/learners',
          builder: (context, state) => LearnersScreen(
            classId: int.parse(state.pathParameters['classId']!),
          ),
        ),
        GoRoute(
          path: '/classes/:classId/attendance-clocking',
          builder: (context, state) => AttendanceClockingScreen(
            classId: int.parse(state.pathParameters['classId']!),
            latitude:
                double.tryParse(state.uri.queryParameters['lat']?.trim() ?? ''),
            longitude:
                double.tryParse(state.uri.queryParameters['lng']?.trim() ?? ''),
          ),
        ),
        GoRoute(
          path: '/classes/:classId/attendance-history',
          builder: (context, state) => AttendanceHistoryScreen(
            classId: int.parse(state.pathParameters['classId']!),
            className: state.uri.queryParameters['className'] ?? 'Class',
          ),
        ),
        GoRoute(
          path: '/classes/:classId/add-learner',
          builder: (context, state) => AddLearnerScreen(
            classId: int.parse(state.pathParameters['classId']!),
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/scan-documents',
          builder: (context, state) => ScanDocumentScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            learnerName: state.uri.queryParameters['name'] ?? '',
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/details',
          builder: (context, state) => LearnerDetailScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/fingerprints',
          builder: (context, state) => FingerprintRegistrationScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            learnerName: state.uri.queryParameters['name'] ?? '',
          ),
        ),
        GoRoute(
          path: '/classes/:classId/learner-evidence',
          builder: (context, state) => LearnerEvidenceScreen(
            classId: int.parse(state.pathParameters['classId']!),
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/qualifications',
          builder: (context, state) => QualificationsScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            classId: int.parse(state.uri.queryParameters['classId']!),
          ),
        ),
        GoRoute(
          path:
              '/learners/:learnerId/qualifications/:qualificationId/unit-standards',
          builder: (context, state) => UnitStandardsScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            qualificationId:
                int.parse(state.pathParameters['qualificationId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            qualificationName:
                state.uri.queryParameters['qualificationName'] ?? '',
            qualificationType: state.uri.queryParameters['qualificationType'] ??
                'occupational',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
          ),
        ),
        GoRoute(
          path:
              '/learners/:learnerId/unit-standards/:unitStandardId/assessments',
          builder: (context, state) => AssessmentsScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            unitStandardId: int.parse(state.pathParameters['unitStandardId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            unitStandardName:
                state.uri.queryParameters['unitStandardName'] ?? '',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/assessments/:assessmentId/questions',
          builder: (context, state) => QuestionsScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            assessmentId: int.parse(state.pathParameters['assessmentId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            assessmentName: state.uri.queryParameters['assessmentName'] ?? '',
            assessmentType: state.uri.queryParameters['assessmentType'] ?? '',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
          ),
        ),
        GoRoute(
          path:
              '/learners/:learnerId/assessments/:assessmentId/questions/:questionId/scan',
          builder: (context, state) => ScanQuestionAnswerScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            assessmentId: int.parse(state.pathParameters['assessmentId']!),
            questionId: int.parse(state.pathParameters['questionId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            assessmentName: state.uri.queryParameters['assessmentName'] ?? '',
            assessmentType: state.uri.queryParameters['assessmentType'] ?? '',
            questionNumber: int.tryParse(
                    state.uri.queryParameters['questionNumber'] ?? '1') ??
                1,
            questionText: state.uri.queryParameters['questionText'] ?? '',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
            isRemedial: state.uri.queryParameters['isRemedial'] == 'true',
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/assessments/:assessmentId/scan-answers',
          builder: (context, state) => ScanAnswersScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            assessmentId: int.parse(state.pathParameters['assessmentId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            assessmentName: state.uri.queryParameters['assessmentName'] ?? '',
            assessmentType: state.uri.queryParameters['assessmentType'] ?? '',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
          ),
        ),
        // Logbook routes
        GoRoute(
          path: '/learners/:learnerId/logbook',
          builder: (context, state) => LogbookScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/logbook/:unitStandardId/entries',
          builder: (context, state) => LogbookEntriesScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            unitStandardId: int.parse(state.pathParameters['unitStandardId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            unitStandardName:
                state.uri.queryParameters['unitStandardName'] ?? '',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
          ),
        ),
        GoRoute(
          path: '/logistics-dashboard',
          builder: (context, state) => const LogisticsDashboardScreen(),
        ),
        GoRoute(
          path: '/settings/server',
          builder: (context, state) => const ServerSettingsScreen(),
        ),
        // ── Notice Board ──────────────────────────────────────────────────
        GoRoute(
          path: '/classes/:classId/notice-board',
          builder: (context, state) => NoticeBoardScreen(
            classId: int.parse(state.pathParameters['classId']!),
            className: state.uri.queryParameters['className'] ?? 'Class',
          ),
        ),
        GoRoute(
          path: '/learner/noticeboard',
          builder: (context, state) => LearnerNoticeboardScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        // ── Learner Portal routes ──────────────────────────────────────────
        GoRoute(
          path: '/learner/login',
          builder: (context, state) => LearnerLoginScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        GoRoute(
          path: '/learner/dashboard',
          builder: (context, state) => LearnerDashboardScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        GoRoute(
          path: '/learner/profile',
          builder: (context, state) => LearnerProfilePortalScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        GoRoute(
          path: '/learner/documents',
          builder: (context, state) => LearnerDocumentsPortalScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        GoRoute(
          path: '/learner/assessments',
          builder: (context, state) => LearnerAssessmentsPortalScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        GoRoute(
          path: '/learner/study-materials',
          builder: (context, state) => LearnerStudyMaterialsScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        GoRoute(
          path: '/learner/change-password',
          builder: (context, state) => LearnerChangePasswordScreen(
            authService: context.read<LearnerAuthService>(),
          ),
        ),
        GoRoute(
          path: '/learners/:learnerId/logbook/:unitStandardId/add',
          builder: (context, state) => AddLogbookEntryScreen(
            learnerId: int.parse(state.pathParameters['learnerId']!),
            unitStandardId: int.parse(state.pathParameters['unitStandardId']!),
            learnerName: state.uri.queryParameters['learnerName'] ?? '',
            unitStandardName:
                state.uri.queryParameters['unitStandardName'] ?? '',
            classId: state.uri.queryParameters['classId'] != null
                ? int.tryParse(state.uri.queryParameters['classId']!)
                : null,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => LearnerAuthService()),
        Provider(create: (_) => ApiService()),
      ],
      child: MaterialApp.router(
        title: 'NBSN Mobile',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          scaffoldBackgroundColor: const Color(0xFF0f172a),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF1e293b),
            foregroundColor: Colors.white,
          ),
          cardTheme: const CardThemeData(
            color: Color(0xFF1e293b),
          ),
          textTheme: const TextTheme(
            bodyLarge: TextStyle(color: Colors.white),
            bodyMedium: TextStyle(color: Colors.white70),
          ),
        ),
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
