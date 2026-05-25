import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;

  AuthService() {
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _isAuthenticated = _token != null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      debugPrint('🔐 Attempting login for: $email');
      debugPrint('📡 API URL: ${ApiService.baseUrl}');
      
      final apiService = ApiService();
      final response = await apiService.post('/api/Auth/login', data: {
        'Email': email,
        'Password': password,
      });

      debugPrint('✅ Login response status: ${response.statusCode}');
      debugPrint('📦 Response data: ${response.data}');

      if (response.statusCode == 200 && response.data != null) {
        // Backend returns lowercase 'token' and 'user'
        final responseData = response.data as Map<String, dynamic>;
        _token = responseData['token'] as String?;
        _user = responseData['user'] as Map<String, dynamic>?;
        
        if (_token == null || _user == null) {
          debugPrint('❌ Missing token or user in response');
          return false;
        }
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        
        _isAuthenticated = true;
        notifyListeners();
        
        debugPrint('✅ Login successful! User: ${_user!['name']}');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Login error: $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    _token = null;
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
