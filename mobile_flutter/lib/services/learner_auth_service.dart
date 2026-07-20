import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:convert';
import 'api_service.dart';
import 'local_database_service.dart';
import 'sync_service.dart';

class LearnerAuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  Map<String, dynamic>? _learner;
  bool _isOfflineMode = false;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get learner => _learner;
  String? get token => _token;
  bool get isOfflineMode => _isOfflineMode;

  final LocalDatabaseService _localDb = LocalDatabaseService.instance;
  final SyncService _syncService = SyncService.instance;

  LearnerAuthService() {
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('learner_token');
    final stored = prefs.getString('learner_user');
    _isOfflineMode = prefs.getBool('is_offline_mode') ?? false;

    if (_token != null && stored != null) {
      try {
        _learner = jsonDecode(stored) as Map<String, dynamic>;
        _isAuthenticated = true;
      } catch (e) {
        debugPrint('⚠️ Failed to parse stored user data: $e');
      }
    }
    notifyListeners();
  }

  Future<bool> learnerLogin(String loginId, String password) async {
    try {
      debugPrint('🎓 Learner login attempt: $loginId');

      // Check network connectivity
      final connectivity = await Connectivity().checkConnectivity();
      final isOnline = connectivity.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);

      if (isOnline) {
        // Online login - authenticate with server
        return await _onlineLogin(loginId, password);
      } else {
        // Offline login - check cached credentials
        return await _offlineLogin(loginId, password);
      }
    } catch (e) {
      debugPrint('❌ Learner login error: $e');
      // If online login fails, try offline as fallback
      return await _offlineLogin(loginId, password);
    }
  }

  Future<bool> _onlineLogin(String loginId, String password) async {
    debugPrint('🌐 Attempting online login...');
    final apiService = ApiService();

    try {
      final response = await apiService.post('/api/Auth/learner-login', data: {
        'login': loginId,
        'password': password,
      });

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        _token = data['token'] as String?;
        _learner = data['user'] as Map<String, dynamic>?;

        if (_token == null || _learner == null) return false;

        // Save to SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('learner_token', _token!);
        await prefs.setString('learner_user', jsonEncode(_learner!));
        await prefs.setBool('is_offline_mode', false);

        // Cache credentials for offline login
        final learnerId = _learner!['id'] as int;
        await _localDb.cacheCredentials(
          learnerId: learnerId,
          loginId: loginId,
          password: password,
          token: _token,
        );

        // Save learner profile locally
        await _localDb.saveLearnerProfile(_learner!);

        // Start background sync
        _syncService.syncAll(learnerId: learnerId);

        _isAuthenticated = true;
        _isOfflineMode = false;
        notifyListeners();

        debugPrint('✅ Online login success: ${_learner!['name']}');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('⚠️ Online login failed, will try offline: $e');
      rethrow;
    }
  }

  Future<bool> _offlineLogin(String loginId, String password) async {
    debugPrint('📵 Attempting offline login...');

    final result = await _localDb.verifyOfflineCredentials(loginId, password);

    if (result == null) {
      debugPrint('❌ No cached credentials found or expired');
      return false;
    }

    _token = result['token'] as String?;
    _learner = result['user'] as Map<String, dynamic>?;
    _isOfflineMode = true;

    if (_learner == null) return false;

    // Save offline mode state
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('learner_user', jsonEncode(_learner!));
    await prefs.setBool('is_offline_mode', true);

    _isAuthenticated = true;
    notifyListeners();

    debugPrint('✅ Offline login success: ${_learner!['name']}');
    return true;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('learner_token');
    await prefs.remove('learner_user');
    await prefs.remove('is_offline_mode');
    _token = null;
    _learner = null;
    _isAuthenticated = false;
    _isOfflineMode = false;
    notifyListeners();
  }

  /// Try to sync with server when connectivity is restored
  Future<void> trySync() async {
    if (_isOfflineMode && _learner != null) {
      final learnerId = _learner!['id'] as int;
      final result = await _syncService.syncAll(learnerId: learnerId);

      if (result.success) {
        // Successfully synced, we're now online
        _isOfflineMode = false;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('is_offline_mode', false);
        notifyListeners();
        debugPrint('✅ Synced and switched to online mode');
      }
    }
  }

  bool get mustChangePassword {
    return _learner?['mustChangePassword'] == true;
  }

  int? get learnerId {
    final id = _learner?['id'];
    if (id is int) return id;
    if (id is String) return int.tryParse(id);
    return null;
  }

  String get learnerName {
    final name = _learner?['name'] ?? '';
    final surname = _learner?['surname'] ?? '';
    if (surname.isNotEmpty) {
      return '$name $surname';
    }
    return name.isNotEmpty ? name : 'Learner';
  }
}
