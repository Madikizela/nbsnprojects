import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:flutter/foundation.dart';

/// Local SQLite database for offline-first data storage
/// Stores learner profile, classes, assessments, documents, learning materials
class LocalDatabaseService {
  LocalDatabaseService._();
  static final LocalDatabaseService instance = LocalDatabaseService._();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDatabase();
    return _db!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = p.join(await getDatabasesPath(), 'nbsn_offline.db');
    debugPrint('📦 Initializing local database: $dbPath');

    return await openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, version) async {
        // Learner profile cache
        await db.execute('''
          CREATE TABLE learner_profile (
            id INTEGER PRIMARY KEY,
            id_number TEXT,
            name TEXT NOT NULL,
            surname TEXT NOT NULL,
            email TEXT,
            contact_number TEXT,
            gender TEXT,
            date_of_birth TEXT,
            profile_photo TEXT,
            data_json TEXT NOT NULL,
            last_synced_at TEXT NOT NULL,
            is_dirty INTEGER DEFAULT 0
          )
        ''');

        // Cached credentials for offline login
        await db.execute('''
          CREATE TABLE cached_credentials (
            learner_id INTEGER PRIMARY KEY,
            login_id TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            token TEXT,
            last_login_at TEXT NOT NULL,
            expires_at TEXT
          )
        ''');

        // Classes & enrollments
        await db.execute('''
          CREATE TABLE classes (
            id INTEGER PRIMARY KEY,
            class_name TEXT NOT NULL,
            site_name TEXT,
            video_conference_link TEXT,
            video_conference_type TEXT,
            video_conference_description TEXT,
            video_conference_start_time TEXT,
            data_json TEXT NOT NULL,
            last_synced_at TEXT NOT NULL
          )
        ''');

        // Learners in each class (for attendance clocking)
        await db.execute('''
          CREATE TABLE class_learners (
            id INTEGER PRIMARY KEY,
            learner_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            learner_name TEXT NOT NULL,
            learner_surname TEXT NOT NULL,
            id_number TEXT,
            face_embedding TEXT,
            left_thumb_template TEXT,
            right_thumb_template TEXT,
            zk_left_thumb_template TEXT,
            zk_right_thumb_template TEXT,
            data_json TEXT NOT NULL,
            last_synced_at TEXT NOT NULL,
            UNIQUE(learner_id, class_id)
          )
        ''');

        // Assessments & questions
        await db.execute('''
          CREATE TABLE assessments (
            id INTEGER PRIMARY KEY,
            qualification_unit_standard_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            data_json TEXT NOT NULL,
            last_synced_at TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE assessment_questions (
            id INTEGER PRIMARY KEY,
            assessment_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            question_type TEXT NOT NULL,
            options_json TEXT,
            data_json TEXT NOT NULL,
            FOREIGN KEY (assessment_id) REFERENCES assessments(id)
          )
        ''');

        // Learner answers (offline & pending sync)
        await db.execute('''
          CREATE TABLE learner_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learner_id INTEGER NOT NULL,
            assessment_question_id INTEGER NOT NULL,
            answer_text TEXT,
            selected_option TEXT,
            answered_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            data_json TEXT NOT NULL
          )
        ''');

        // Documents (metadata only, files stored in app directory)
        await db.execute('''
          CREATE TABLE documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learner_id INTEGER NOT NULL,
            document_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            uploaded_at TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            server_id INTEGER,
            data_json TEXT
          )
        ''');

        // Learning materials
        await db.execute('''
          CREATE TABLE learning_materials (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            material_type TEXT NOT NULL,
            file_path TEXT,
            external_link TEXT,
            qualification_unit_standard_id INTEGER,
            uploaded_by_user_id INTEGER,
            data_json TEXT NOT NULL,
            last_synced_at TEXT NOT NULL
          )
        ''');

        // Sync queue for pending operations
        await db.execute('''
          CREATE TABLE sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_type TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0,
            last_error TEXT
          )
        ''');

        // Create indexes for better query performance
        await db.execute(
            'CREATE INDEX idx_class_learners_class ON class_learners(class_id)');
        await db.execute(
            'CREATE INDEX idx_class_learners_learner ON class_learners(learner_id)');
        await db.execute(
            'CREATE INDEX idx_learner_answers_learner ON learner_answers(learner_id)');
        await db.execute(
            'CREATE INDEX idx_learner_answers_synced ON learner_answers(synced)');
        await db.execute(
            'CREATE INDEX idx_documents_learner ON documents(learner_id)');
        await db
            .execute('CREATE INDEX idx_documents_synced ON documents(synced)');
        await db.execute(
            'CREATE INDEX idx_sync_queue_type ON sync_queue(operation_type, entity_type)');

        debugPrint('✅ Local database created successfully');
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LEARNER PROFILE OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> saveLearnerProfile(Map<String, dynamic> learnerData) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();

    // Split name if surname is null
    String name = learnerData['name'] ?? '';
    String surname = learnerData['surname'] ?? '';

    if (surname.isEmpty && name.contains(' ')) {
      final parts = name.split(' ');
      name = parts.first;
      surname = parts.sublist(1).join(' ');
    }

    await db.insert(
      'learner_profile',
      {
        'id': learnerData['id'],
        'id_number': learnerData['idNumber'],
        'name': name,
        'surname': surname.isEmpty ? name : surname, // Use name as fallback
        'email': learnerData['email'],
        'contact_number': learnerData['contactNumber'],
        'gender': learnerData['gender'],
        'date_of_birth': learnerData['dateOfBirth'],
        'profile_photo': learnerData['profilePhoto'],
        'data_json': jsonEncode(learnerData),
        'last_synced_at': now,
        'is_dirty': 0,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    debugPrint('💾 Saved learner profile locally: ${learnerData['id']}');
  }

  Future<Map<String, dynamic>?> getLearnerProfile(int learnerId) async {
    final db = await database;
    final results = await db.query(
      'learner_profile',
      where: 'id = ?',
      whereArgs: [learnerId],
      limit: 1,
    );

    if (results.isEmpty) return null;

    final row = results.first;
    return jsonDecode(row['data_json'] as String) as Map<String, dynamic>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OFFLINE AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> cacheCredentials({
    required int learnerId,
    required String loginId,
    required String password,
    String? token,
  }) async {
    final db = await database;
    final passwordHash = _hashPassword(password);
    final now = DateTime.now().toIso8601String();
    final expiresAt =
        DateTime.now().add(const Duration(days: 30)).toIso8601String();

    await db.insert(
      'cached_credentials',
      {
        'learner_id': learnerId,
        'login_id': loginId,
        'password_hash': passwordHash,
        'token': token,
        'last_login_at': now,
        'expires_at': expiresAt,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    debugPrint('🔐 Cached credentials for offline login: $loginId');
  }

  Future<Map<String, dynamic>?> verifyOfflineCredentials(
      String loginId, String password) async {
    final db = await database;
    final passwordHash = _hashPassword(password);

    final results = await db.query(
      'cached_credentials',
      where: 'login_id = ? AND password_hash = ?',
      whereArgs: [loginId, passwordHash],
      limit: 1,
    );

    if (results.isEmpty) return null;

    final row = results.first;
    final expiresAt = DateTime.parse(row['expires_at'] as String);

    // Check if credentials are expired (30 days)
    if (DateTime.now().isAfter(expiresAt)) {
      debugPrint('⚠️ Cached credentials expired for: $loginId');
      return null;
    }

    final learnerId = row['learner_id'] as int;
    final profile = await getLearnerProfile(learnerId);

    if (profile == null) return null;

    debugPrint('✅ Offline login successful: $loginId');
    return {
      'token': row['token'] ?? '',
      'user': profile,
      'isOffline': true,
    };
  }

  String _hashPassword(String password) {
    // Simple hash for demo - in production use crypto package with salt
    return password.hashCode.toString();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLASSES OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> saveClasses(List<Map<String, dynamic>> classes) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();

    final batch = db.batch();
    for (final classData in classes) {
      batch.insert(
        'classes',
        {
          'id': classData['id'],
          'class_name': classData['className'],
          'site_name': classData['siteName'],
          'video_conference_link': classData['videoConferenceLink'],
          'video_conference_type': classData['videoConferenceType'],
          'video_conference_description':
              classData['videoConferenceDescription'],
          'video_conference_start_time': classData['videoConferenceStartTime'],
          'data_json': jsonEncode(classData),
          'last_synced_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
    debugPrint('💾 Saved ${classes.length} classes locally');
  }

  Future<List<Map<String, dynamic>>> getClassesWithVideoConference() async {
    final db = await database;
    final results = await db.query(
      'classes',
      where: 'video_conference_link IS NOT NULL AND video_conference_link != ?',
      whereArgs: [''],
    );

    return results
        .map((row) =>
            jsonDecode(row['data_json'] as String) as Map<String, dynamic>)
        .toList();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ASSESSMENTS OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> saveAssessments(List<Map<String, dynamic>> assessments) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();

    final batch = db.batch();
    for (final assessment in assessments) {
      batch.insert(
        'assessments',
        {
          'id': assessment['id'],
          'qualification_unit_standard_id':
              assessment['qualificationUnitStandardId'],
          'title': assessment['title'],
          'description': assessment['description'],
          'data_json': jsonEncode(assessment),
          'last_synced_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Save questions
      if (assessment['questions'] != null) {
        final questions = assessment['questions'] as List;
        for (final question in questions) {
          batch.insert(
            'assessment_questions',
            {
              'id': question['id'],
              'assessment_id': assessment['id'],
              'question_text': question['questionText'],
              'question_type': question['questionType'],
              'options_json': question['options'] != null
                  ? jsonEncode(question['options'])
                  : null,
              'data_json': jsonEncode(question),
            },
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        }
      }
    }
    await batch.commit(noResult: true);
    debugPrint('💾 Saved ${assessments.length} assessments locally');
  }

  Future<List<Map<String, dynamic>>> getAssessments() async {
    final db = await database;
    final results = await db.query('assessments');

    final assessments = <Map<String, dynamic>>[];
    for (final row in results) {
      final assessment =
          jsonDecode(row['data_json'] as String) as Map<String, dynamic>;

      // Load questions
      final questions = await db.query(
        'assessment_questions',
        where: 'assessment_id = ?',
        whereArgs: [row['id']],
      );

      assessment['questions'] = questions
          .map((q) =>
              jsonDecode(q['data_json'] as String) as Map<String, dynamic>)
          .toList();

      assessments.add(assessment);
    }

    return assessments;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LEARNER ANSWERS (OFFLINE SUBMISSION)
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> saveLearnerAnswer({
    required int learnerId,
    required int assessmentQuestionId,
    String? answerText,
    String? selectedOption,
  }) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();

    final data = {
      'learnerId': learnerId,
      'assessmentQuestionId': assessmentQuestionId,
      'answerText': answerText,
      'selectedOption': selectedOption,
      'answeredAt': now,
    };

    await db.insert('learner_answers', {
      'learner_id': learnerId,
      'assessment_question_id': assessmentQuestionId,
      'answer_text': answerText,
      'selected_option': selectedOption,
      'answered_at': now,
      'synced': 0,
      'data_json': jsonEncode(data),
    });

    debugPrint('💾 Saved learner answer offline: Q$assessmentQuestionId');
  }

  Future<List<Map<String, dynamic>>> getUnsyncedAnswers() async {
    final db = await database;
    final results = await db.query(
      'learner_answers',
      where: 'synced = 0',
      orderBy: 'answered_at ASC',
    );

    return results
        .map((row) =>
            jsonDecode(row['data_json'] as String) as Map<String, dynamic>)
        .toList();
  }

  Future<void> markAnswersSynced(List<int> answerIds) async {
    final db = await database;
    if (answerIds.isEmpty) return;

    await db.update(
      'learner_answers',
      {'synced': 1},
      where: 'id IN (${answerIds.join(',')})',
    );
    debugPrint('✅ Marked ${answerIds.length} answers as synced');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LEARNING MATERIALS
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> saveLearningMaterials(
      List<Map<String, dynamic>> materials) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();

    final batch = db.batch();
    for (final material in materials) {
      batch.insert(
        'learning_materials',
        {
          'id': material['id'],
          'title': material['title'],
          'description': material['description'],
          'material_type': material['materialType'],
          'file_path': material['filePath'],
          'external_link': material['externalLink'],
          'qualification_unit_standard_id':
              material['qualificationUnitStandardId'],
          'uploaded_by_user_id': material['uploadedByUserId'],
          'data_json': jsonEncode(material),
          'last_synced_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
    debugPrint('💾 Saved ${materials.length} learning materials locally');
  }

  Future<List<Map<String, dynamic>>> getLearningMaterials() async {
    final db = await database;
    final results = await db.query('learning_materials');

    return results
        .map((row) =>
            jsonDecode(row['data_json'] as String) as Map<String, dynamic>)
        .toList();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLASS LEARNERS (FOR OFFLINE ATTENDANCE CLOCKING)
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> saveClassLearners(
      int classId, List<Map<String, dynamic>> learners) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();

    final batch = db.batch();
    for (final learner in learners) {
      batch.insert(
        'class_learners',
        {
          'id': learner['id'],
          'learner_id': learner['id'],
          'class_id': classId,
          'learner_name': learner['name'] ?? '',
          'learner_surname': learner['surname'] ?? '',
          'id_number': learner['idNumber'],
          'face_embedding': learner['faceEmbedding'] != null
              ? jsonEncode(learner['faceEmbedding'])
              : null,
          'left_thumb_template': learner['leftThumbTemplate'],
          'right_thumb_template': learner['rightThumbTemplate'],
          'zk_left_thumb_template': learner['zkLeftThumbTemplate'],
          'zk_right_thumb_template': learner['zkRightThumbTemplate'],
          'data_json': jsonEncode(learner),
          'last_synced_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
    debugPrint(
        '💾 Saved ${learners.length} learners for class $classId locally');
  }

  Future<List<Map<String, dynamic>>> getClassLearners(int classId) async {
    final db = await database;
    final results = await db.query(
      'class_learners',
      where: 'class_id = ?',
      whereArgs: [classId],
      orderBy: 'learner_name ASC',
    );

    return results
        .map((row) =>
            jsonDecode(row['data_json'] as String) as Map<String, dynamic>)
        .toList();
  }

  Future<Map<String, dynamic>?> getLearnerByIdNumber(
      int classId, String idNumber) async {
    final db = await database;
    final results = await db.query(
      'class_learners',
      where: 'class_id = ? AND id_number = ?',
      whereArgs: [classId, idNumber],
      limit: 1,
    );

    if (results.isEmpty) return null;
    return jsonDecode(results.first['data_json'] as String)
        as Map<String, dynamic>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SYNC QUEUE
  // ─────────────────────────────────────────────────────────────────────────

  Future<int> getPendingSyncCount() async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as c FROM sync_queue');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<void> clearOldData() async {
    final db = await database;
    final cutoff =
        DateTime.now().subtract(const Duration(days: 90)).toIso8601String();

    await db.delete(
      'learner_answers',
      where: 'synced = 1 AND answered_at < ?',
      whereArgs: [cutoff],
    );

    debugPrint('🗑️ Cleared old synced data');
  }

  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}
