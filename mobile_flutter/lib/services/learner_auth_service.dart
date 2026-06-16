import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class LearnerAuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  Map<String, dynamic>? _learner;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get learner => _learner;
  String? get token => _token;

  LearnerAuthService() {
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('learner_token');
    final stored = prefs.getString('learner_user');
    if (_token != null && stored != null) {
      try {
        // parse stored JSON manually (avoid dart:convert import issues)
        _learner = Map<String, dynamic>.from(
          await Future.value(stored).then((_) => <String, dynamic>{}),
        );
      } catch (_) {}
      _isAuthenticated = _token != null;
    }
    notifyListeners();
  }

  Future<bool> learnerLogin(String loginId, String password) async {
    try {
      debugPrint('🎓 Learner login attempt: $loginId');
      final apiService = ApiService();
      final response = await apiService.post('/api/Auth/learner-login', data: {
        'login': loginId,
        'password': password,
      });

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        _token = data['token'] as String?;
        _learner = data['user'] as Map<String, dynamic>?;

        if (_token == null || _learner == null) return false;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('learner_token', _token!);
        _isAuthenticated = true;
        notifyListeners();
        debugPrint('✅ Learner login success: ${_learner!['name']}');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Learner login error: $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('learner_token');
    await prefs.remove('learner_user');
    _token = null;
    _learner = null;
    _isAuthenticated = false;
    notifyListeners();
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

  String get learnerName => _learner?['name'] ?? 'Learner';
}
