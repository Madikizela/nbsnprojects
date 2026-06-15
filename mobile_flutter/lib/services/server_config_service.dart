import 'package:shared_preferences/shared_preferences.dart';

class ServerConfigService {
  static const String _keyServerUrl = 'server_url';
  static const String defaultServerUrl = 'http://192.168.148.166:5213';

  /// Returns the saved server URL, or the default if none is saved.
  static Future<String> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyServerUrl) ?? defaultServerUrl;
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
