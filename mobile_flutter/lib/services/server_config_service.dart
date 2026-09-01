import 'package:shared_preferences/shared_preferences.dart';

class ServerConfigService {
  static const String _keyServerUrl = 'server_url';
  static const String defaultServerUrl =
      'https://api.nbsnprojects.co.za';

  /// Returns the saved server URL, or the default if none is saved.
  static Future<String> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_keyServerUrl);
    // Reset any old local IP addresses to the production URL
    if (saved != null &&
        (saved.contains('192.168.') ||
            saved.contains('10.24.') ||
            saved.contains('localhost') ||
            saved.contains('127.0.0.1'))) {
      await prefs.remove(_keyServerUrl);
      return defaultServerUrl;
    }
    return saved ?? defaultServerUrl;
  }

  /// Persists a new server URL.
  static Future<void> saveServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _keyServerUrl, url.trimRight().replaceAll(RegExp(r'/+$'), ''));
  }

  /// Clears the saved URL, reverting to the default.
  static Future<void> resetToDefault() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyServerUrl);
  }
}
