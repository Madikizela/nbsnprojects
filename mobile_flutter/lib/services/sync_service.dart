import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import 'local_database_service.dart';

/// Bidirectional sync service for offline-first architecture
/// Handles syncing local changes to server and pulling server updates
class SyncService {
  SyncService._();
  static final SyncService instance = SyncService._();

  final LocalDatabaseService _localDb = LocalDatabaseService.instance;
  StreamSubscription? _connectivitySub;
  bool _syncing = false;
  DateTime? _lastSyncTime;

  // Sync status callbacks
  final List<Function(SyncStatus)> _statusListeners = [];

  Future<void> init() async {
    debugPrint('🔄 Initializing sync service');

    // Auto-sync when network is restored
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final hasNetwork = results.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);

      if (hasNetwork) {
        debugPrint('📶 Network restored — starting auto-sync');
        syncAll();
      }
    });
  }

  void addStatusListener(Function(SyncStatus) listener) {
    _statusListeners.add(listener);
  }

  void removeStatusListener(Function(SyncStatus) listener) {
    _statusListeners.remove(listener);
  }

  void _notifyStatus(SyncStatus status) {
    for (final listener in _statusListeners) {
      listener(status);
    }
  }

  /// Full bidirectional sync: push local changes, pull server updates
  Future<SyncResult> syncAll({int? learnerId}) async {
    if (_syncing) {
      debugPrint('⚠️ Sync already in progress');
      return SyncResult(success: false, message: 'Sync already in progress');
    }

    _syncing = true;
    _notifyStatus(SyncStatus.syncing);

    final result = SyncResult(success: true, message: 'Sync completed');

    try {
      final apiService = ApiService();

      // Check connectivity
      final connectivity = await Connectivity().checkConnectivity();
      final isOnline = connectivity.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);

      if (!isOnline) {
        debugPrint('📵 No network connection — skipping sync');
        _notifyStatus(SyncStatus.offline);
        return SyncResult(success: false, message: 'No network connection');
      }

      debugPrint('🔄 Starting full sync...');

      // ── STEP 1: Push local changes to server ──────────────────────────────
      result.answersSynced = await _syncAnswersToServer(apiService);

      // ── STEP 2: Pull updates from server ──────────────────────────────────
      if (learnerId != null) {
        await _syncLearnerProfile(apiService, learnerId);
        await _syncClasses(apiService, learnerId);
        await _syncAssessments(apiService, learnerId);
        await _syncLearningMaterials(apiService, learnerId);
      }

      // ── STEP 3: Sync class learners for teacher attendance (if teacherId provided) ──
      // This will be called separately when teacher opens attendance screen

      _lastSyncTime = DateTime.now();
      result.success = true;
      result.message = 'Sync completed successfully';

      debugPrint('✅ Full sync completed');
      _notifyStatus(SyncStatus.success);

      return result;
    } catch (e) {
      debugPrint('❌ Sync error: $e');
      result.success = false;
      result.message = 'Sync failed: $e';
      _notifyStatus(SyncStatus.error);
      return result;
    } finally {
      _syncing = false;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PUSH LOCAL CHANGES TO SERVER
  // ═════════════════════════════════════════════════════════════════════════

  Future<int> _syncAnswersToServer(ApiService apiService) async {
    debugPrint('📤 Syncing learner answers to server...');

    final unsyncedAnswers = await _localDb.getUnsyncedAnswers();
    if (unsyncedAnswers.isEmpty) {
      debugPrint('✓ No answers to sync');
      return 0;
    }

    int synced = 0;
    final syncedIds = <int>[];

    for (final answer in unsyncedAnswers) {
      try {
        final response = await apiService.post(
          '/api/LearnerAnswers',
          data: {
            'learnerId': answer['learnerId'],
            'assessmentQuestionId': answer['assessmentQuestionId'],
            'answerText': answer['answerText'],
            'selectedOption': answer['selectedOption'],
            'answeredAt': answer['answeredAt'],
          },
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          syncedIds.add(answer['assessmentQuestionId'] as int);
          synced++;
        }
      } catch (e) {
        debugPrint(
            '⚠️ Failed to sync answer ${answer['assessmentQuestionId']}: $e');
      }
    }

    if (syncedIds.isNotEmpty) {
      await _localDb.markAnswersSynced(syncedIds);
    }

    debugPrint('✅ Synced $synced/${unsyncedAnswers.length} answers to server');
    return synced;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PULL SERVER UPDATES TO LOCAL
  // ═════════════════════════════════════════════════════════════════════════

  Future<void> _syncLearnerProfile(ApiService apiService, int learnerId) async {
    try {
      debugPrint('📥 Syncing learner profile from server...');
      final response = await apiService.get('/api/Learners/$learnerId');

      if (response.statusCode == 200 && response.data != null) {
        final profileData = response.data as Map<String, dynamic>;
        await _localDb.saveLearnerProfile(profileData);
        debugPrint('✅ Learner profile synced');
      }
    } catch (e) {
      debugPrint('⚠️ Failed to sync learner profile: $e');
    }
  }

  Future<void> _syncClasses(ApiService apiService, int learnerId) async {
    try {
      debugPrint('📥 Syncing classes from server...');

      // Get learner data with enrollments
      final response = await apiService.get('/api/Learners/$learnerId');

      if (response.statusCode == 200 && response.data != null) {
        final learnerData = response.data as Map<String, dynamic>;

        if (learnerData['classEnrollments'] != null) {
          final enrollments = learnerData['classEnrollments'] as List;
          final classes = <Map<String, dynamic>>[];

          for (final enrollment in enrollments) {
            final classId = enrollment['siteClassId'] ?? enrollment['classId'];
            if (classId != null) {
              try {
                final classResponse =
                    await apiService.get('/api/SiteClasses/$classId');
                if (classResponse.statusCode == 200 &&
                    classResponse.data != null) {
                  classes.add(classResponse.data as Map<String, dynamic>);
                }
              } catch (e) {
                debugPrint('⚠️ Failed to fetch class $classId: $e');
              }
            }
          }

          if (classes.isNotEmpty) {
            await _localDb.saveClasses(classes);
            debugPrint('✅ Synced ${classes.length} classes');
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ Failed to sync classes: $e');
    }
  }

  Future<void> _syncAssessments(ApiService apiService, int learnerId) async {
    try {
      debugPrint('📥 Syncing assessments from server...');

      // Get learner's assessments
      final response = await apiService.get('/api/Learners/$learnerId');

      if (response.statusCode == 200 && response.data != null) {
        final learnerData = response.data as Map<String, dynamic>;

        if (learnerData['classEnrollments'] != null) {
          final enrollments = learnerData['classEnrollments'] as List;
          final assessments = <Map<String, dynamic>>[];

          // For each enrollment, get qualification unit standards and assessments
          for (final enrollment in enrollments) {
            try {
              // This would require an endpoint to get assessments by class/qualification
              // For now, we'll get assessments directly if endpoint exists
              final assessmentsResponse =
                  await apiService.get('/api/AssessmentQuestions');

              if (assessmentsResponse.statusCode == 200 &&
                  assessmentsResponse.data != null) {
                final data = assessmentsResponse.data;
                if (data is List) {
                  for (final assessment in data) {
                    if (assessment is Map<String, dynamic>) {
                      assessments.add(assessment);
                    }
                  }
                }
              }
            } catch (e) {
              debugPrint('⚠️ Failed to fetch assessments: $e');
            }
          }

          if (assessments.isNotEmpty) {
            await _localDb.saveAssessments(assessments);
            debugPrint('✅ Synced ${assessments.length} assessments');
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ Failed to sync assessments: $e');
    }
  }

  Future<void> _syncLearningMaterials(
      ApiService apiService, int learnerId) async {
    try {
      debugPrint('📥 Syncing learning materials from server...');

      // Get learner's learning materials
      final response =
          await apiService.get('/api/LearningMaterials/learner/$learnerId');

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data is List) {
          final materials = data
              .where((item) => item is Map<String, dynamic>)
              .map((item) => item as Map<String, dynamic>)
              .toList();

          if (materials.isNotEmpty) {
            await _localDb.saveLearningMaterials(materials);
            debugPrint('✅ Synced ${materials.length} learning materials');
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ Failed to sync learning materials: $e');
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═════════════════════════════════════════════════════════════════════════

  /// Sync learners for a specific class (for attendance clocking)
  Future<void> syncClassLearners(ApiService apiService, int classId) async {
    try {
      debugPrint('📥 Syncing learners for class $classId...');

      final response = await apiService.get('/api/Learners/class/$classId');

      if (response.statusCode == 200 && response.data != null) {
        final learners = (response.data as List)
            .where((item) => item is Map<String, dynamic>)
            .map((item) => item as Map<String, dynamic>)
            .toList();

        if (learners.isNotEmpty) {
          await _localDb.saveClassLearners(classId, learners);
          debugPrint('✅ Synced ${learners.length} learners for class $classId');
        }
      }
    } catch (e) {
      debugPrint('⚠️ Failed to sync class learners: $e');
      rethrow;
    }
  }

  DateTime? get lastSyncTime => _lastSyncTime;

  bool get isSyncing => _syncing;

  Future<int> getPendingSyncCount() async {
    final answers = await _localDb.getUnsyncedAnswers();
    return answers.length;
  }

  void dispose() {
    _connectivitySub?.cancel();
    _statusListeners.clear();
  }
}

// ═════════════════════════════════════════════════════════════════════════
// DATA MODELS
// ═════════════════════════════════════════════════════════════════════════

enum SyncStatus {
  idle,
  syncing,
  success,
  error,
  offline,
}

class SyncResult {
  bool success;
  String message;
  int answersSynced = 0;
  int documentsSynced = 0;

  SyncResult({required this.success, required this.message});

  @override
  String toString() {
    return 'SyncResult(success: $success, message: $message, answers: $answersSynced, documents: $documentsSynced)';
  }
}
