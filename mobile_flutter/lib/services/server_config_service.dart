import 'package:shared_preferences/shared_preferences.dart';

class ServerConfigService {
  static const String _keyServerUrl = 'server_url';
  static const String defaultServerUrl =
      'http://192.168.0.68:5213'; // Updated to current PC IP address

  /// Returns the saved server URL, or the default if none is saved.
  static Future<String> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_keyServerUrl);
    // If saved URL still points to old subnet, reset it
    if (saved != null &&
        (saved.contains('192.168.4.') || saved.contains('192.168.148.'))) {
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
