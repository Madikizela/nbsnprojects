import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import 'local_database_service.dart';

class AuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  Map<String, dynamic>? _user;
  bool _isOfflineMode = false;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isOfflineMode => _isOfflineMode;

  final LocalDatabaseService _localDb = LocalDatabaseService.instance;

  AuthService() {
    _loadSession();
  }

  /// Restore session from SharedPreferences on cold start.
  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _isOfflineMode = prefs.getBool('staff_offline_mode') ?? false;

    final stored = prefs.getString('staff_user');
    if (_token != null && stored != null) {
      try {
        _user = jsonDecode(stored) as Map<String, dynamic>;
        _isAuthenticated = true;
        debugPrint('✅ Session restored for: ${_user!['name']}');
      } catch (e) {
        debugPrint('⚠️ Failed to restore session: $e');
        _isAuthenticated = false;
      }
    } else {
      _isAuthenticated = _token != null;
    }
    notifyListeners();
  }

  /// Login — automatically falls back to offline if no internet.
  Future<bool> login(String email, String password) async {
    try {
      // Check connectivity
      final connectivity = await Connectivity().checkConnectivity();
      final isOnline = connectivity.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);

      if (isOnline) {
        return await _onlineLogin(email, password);
      } else {
        debugPrint('📵 No internet — attempting offline login');
        return await _offlineLogin(email, password);
      }
    } catch (e) {
      debugPrint('⚠️ Online login failed, trying offline: $e');
      // Network error — fall back to cached credentials
      return await _offlineLogin(email, password);
    }
  }

  Future<bool> _onlineLogin(String email, String password) async {
    debugPrint('🌐 Online login: $email');
    final apiService = ApiService();

    final response = await apiService.post('/api/Auth/login', data: {
      'Email': email,
      'Password': password,
    });

    if (response.statusCode == 200 && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      _token = data['token'] as String?;
      _user = data['user'] as Map<String, dynamic>?;

      if (_token == null || _user == null) {
        debugPrint('❌ Missing token or user in response');
        return false;
      }

      // Persist token and full user object
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('staff_user', jsonEncode(_user!));
      await prefs.setBool('staff_offline_mode', false);

      // Cache credentials for offline login (30-day validity)
      try {
        final userId = _user!['id'];
        final id = userId is int ? userId : int.tryParse(userId.toString()) ?? 0;
        await _localDb.cacheStaffCredentials(
          userId: id,
          email: email,
          password: password,
          token: _token,
          userJson: jsonEncode(_user!),
        );
        debugPrint('🔐 Staff credentials cached for offline use');
      } catch (e) {
        debugPrint('⚠️ Could not cache credentials: $e');
      }

      _isAuthenticated = true;
      _isOfflineMode = false;
      notifyListeners();

      debugPrint('✅ Online login success: ${_user!['name']}');
      return true;
    }
    return false;
  }

  Future<bool> _offlineLogin(String email, String password) async {
    debugPrint('📵 Offline login attempt: $email');

    final result = await _localDb.verifyStaffCredentials(email, password);
    if (result == null) {
      debugPrint('❌ No cached credentials found for: $email');
      return false;
    }

    _token = result['token'] as String?;
    _user = result['user'] as Map<String, dynamic>?;
    _isOfflineMode = true;

    if (_user == null) return false;

    final prefs = await SharedPreferences.getInstance();
    if (_token != null) await prefs.setString('token', _token!);
    await prefs.setString('staff_user', jsonEncode(_user!));
    await prefs.setBool('staff_offline_mode', true);

    _isAuthenticated = true;
    notifyListeners();

    debugPrint('✅ Offline login success: ${_user!['name']}');
    return true;
  }

  /// Try to re-authenticate online after coming back from offline mode.
  Future<void> tryGoOnline(String email, String password) async {
    try {
      final connectivity = await Connectivity().checkConnectivity();
      final isOnline = connectivity.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);

      if (isOnline && _isOfflineMode) {
        final success = await _onlineLogin(email, password);
        if (success) {
          debugPrint('✅ Switched from offline to online mode');
        }
      }
    } catch (_) {}
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('staff_user');
    await prefs.remove('staff_offline_mode');
    _token = null;
    _user = null;
    _isAuthenticated = false;
    _isOfflineMode = false;
    notifyListeners();
  }
}
