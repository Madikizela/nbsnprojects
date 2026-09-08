import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';

/// Pending attendance record stored locally when the device is offline.
class PendingAttendanceRecord {
  final int id;
  final int classId;
  final int teacherId;
  final List<double> embedding;
  final String? fingerprintTemplate; // for clock-toggle endpoint
  final String? scannerType; // 'FUTRONIC' | 'ZKTECO'
  final String clockType; // 'face' | 'fingerprint'
  final double? latitude;
  final double? longitude;
  final DateTime queuedAt;
  final int retryCount;

  const PendingAttendanceRecord({
    required this.id,
    required this.classId,
    required this.teacherId,
    required this.embedding,
    this.fingerprintTemplate,
    this.scannerType,
    this.clockType = 'face',
    this.latitude,
    this.longitude,
    required this.queuedAt,
    required this.retryCount,
  });
}

/// SQLite-backed offline queue for attendance clock requests.
/// Supports both face-embedding (faceClockToggle) and fingerprint (clockToggle) types.
class OfflineAttendanceQueue {
  OfflineAttendanceQueue._();
  static final OfflineAttendanceQueue instance = OfflineAttendanceQueue._();

  Database? _db;
  StreamSubscription? _connectivitySub;
  bool _syncing = false;

  // Callback set by the screen so the connectivity listener can trigger sync
  ApiService? _apiService;

  void setApiService(ApiService service) {
    _apiService = service;
  }

  // ── Initialisation ───────────────────────────────────────────────────────

  Future<void> init() async {
    final dbPath = p.join(await getDatabasesPath(), 'attendance_queue.db');
    _db = await openDatabase(
      dbPath,
      version: 2,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE pending_attendance (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id             INTEGER NOT NULL,
            teacher_id           INTEGER NOT NULL,
            embedding            TEXT    NOT NULL DEFAULT '[]',
            fingerprint_template TEXT,
            scanner_type         TEXT,
            clock_type           TEXT    NOT NULL DEFAULT 'face',
            latitude             REAL,
            longitude            REAL,
            queued_at            TEXT    NOT NULL,
            retry_count          INTEGER NOT NULL DEFAULT 0
          )
        ''');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          // Add new columns to existing DB
          await db.execute(
              'ALTER TABLE pending_attendance ADD COLUMN fingerprint_template TEXT');
          await db.execute(
              'ALTER TABLE pending_attendance ADD COLUMN scanner_type TEXT');
          await db.execute(
              "ALTER TABLE pending_attendance ADD COLUMN clock_type TEXT NOT NULL DEFAULT 'face'");
          debugPrint('✅ attendance_queue.db upgraded to v2');
        }
      },
    );

    // Auto-sync whenever network comes back
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final hasNetwork = results.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);
      if (hasNetwork && _apiService != null) {
        debugPrint('📶 Network restored — auto-syncing offline attendance');
        trySyncAll(_apiService!);
      }
    });
  }

  void dispose() {
    _connectivitySub?.cancel();
    _db?.close();
  }

  // ── Queue operations ─────────────────────────────────────────────────────

  /// Enqueue a face-embedding clock record (faceClockToggle endpoint).
  Future<void> enqueue({
    required int classId,
    required int teacherId,
    required List<double> embedding,
    double? latitude,
    double? longitude,
  }) async {
    await _db!.insert('pending_attendance', {
      'class_id': classId,
      'teacher_id': teacherId,
      'embedding': jsonEncode(embedding),
      'clock_type': 'face',
      'latitude': latitude,
      'longitude': longitude,
      'queued_at': DateTime.now().toIso8601String(),
      'retry_count': 0,
    });
    debugPrint('📥 Queued face attendance for class $classId');
  }

  /// Enqueue a fingerprint clock record (clock-toggle endpoint).
  Future<void> enqueueFingerprint({
    required int classId,
    required int teacherId,
    required String fingerprintTemplate,
    required String scannerType,
    double? latitude,
    double? longitude,
  }) async {
    await _db!.insert('pending_attendance', {
      'class_id': classId,
      'teacher_id': teacherId,
      'embedding': '[]',
      'fingerprint_template': fingerprintTemplate,
      'scanner_type': scannerType,
      'clock_type': 'fingerprint',
      'latitude': latitude,
      'longitude': longitude,
      'queued_at': DateTime.now().toIso8601String(),
      'retry_count': 0,
    });
    debugPrint('📥 Queued fingerprint attendance for class $classId');
  }

  Future<int> pendingCount() async {
    final result =
        await _db!.rawQuery('SELECT COUNT(*) as c FROM pending_attendance');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<List<PendingAttendanceRecord>> _getPending() async {
    final rows = await _db!.query(
      'pending_attendance',
      orderBy: 'queued_at ASC',
      limit: 50,
    );
    return rows
        .map((r) => PendingAttendanceRecord(
              id: r['id'] as int,
              classId: r['class_id'] as int,
              teacherId: r['teacher_id'] as int,
              embedding: List<double>.from(
                  jsonDecode(r['embedding'] as String) as List),
              fingerprintTemplate: r['fingerprint_template'] as String?,
              scannerType: r['scanner_type'] as String?,
              clockType: (r['clock_type'] as String?) ?? 'face',
              latitude: r['latitude'] as double?,
              longitude: r['longitude'] as double?,
              queuedAt: DateTime.parse(r['queued_at'] as String),
              retryCount: r['retry_count'] as int,
            ))
        .toList();
  }

  Future<void> _delete(int id) async {
    await _db!.delete('pending_attendance', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> _incrementRetry(int id) async {
    await _db!.rawUpdate(
        'UPDATE pending_attendance SET retry_count = retry_count + 1 WHERE id = ?',
        [id]);
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  /// Attempts to send all queued records to the server.
  /// Safe to call concurrently — guards with _syncing flag.
  /// Returns the number of successfully synced records.
  Future<int> trySyncAll(ApiService apiService) async {
    if (_syncing) return 0;
    _syncing = true;
    int synced = 0;

    try {
      final pending = await _getPending();
      if (pending.isEmpty) return 0;

      debugPrint('🔄 Syncing ${pending.length} queued attendance records…');

      for (final record in pending) {
        // Drop records that have failed too many times (> 10 retries)
        if (record.retryCount >= 10) {
          debugPrint('🗑️ Dropping stale record ${record.id} after 10 retries');
          await _delete(record.id);
          continue;
        }

        try {
          bool success = false;

          if (record.clockType == 'fingerprint' &&
              record.fingerprintTemplate != null) {
            // Fingerprint record — use clock-toggle endpoint
            final response = await apiService.post(
              '/api/Attendance/clock-toggle',
              data: {
                'ClassId': record.classId,
                'TeacherId': record.teacherId,
                'FingerprintTemplate': record.fingerprintTemplate,
                'ScannerType': record.scannerType ?? 'FUTRONIC',
              },
            );
            success = response.statusCode == 200 || response.statusCode == 201;
          } else {
            // Face record — use faceClockToggle endpoint
            final response = await apiService.faceClockToggle(
              classId: record.classId,
              teacherId: record.teacherId,
              embedding: record.embedding,
              latitude: record.latitude,
              longitude: record.longitude,
            );
            success = response.statusCode == 200 || response.statusCode == 201;
          }

          if (success) {
            await _delete(record.id);
            synced++;
            debugPrint('✅ Synced queued record ${record.id}');
          } else {
            await _incrementRetry(record.id);
          }
        } catch (e) {
          debugPrint('⚠️ Sync failed for record ${record.id}: $e');
          await _incrementRetry(record.id);
        }
      }

      debugPrint('✅ Sync complete — $synced/${pending.length} records sent');
    } finally {
      _syncing = false;
    }

    return synced;
  }
}
