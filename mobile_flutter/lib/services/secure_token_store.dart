import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Wraps flutter_secure_storage to store JWT tokens in the platform's
/// secure enclave (Android Keystore / iOS Keychain).
///
/// Usage:
///   await SecureTokenStore.write('token', value);
///   final token = await SecureTokenStore.read('token');
///   await SecureTokenStore.delete('token');
///   await SecureTokenStore.deleteAll();
class SecureTokenStore {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  static Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      debugPrint('⚠️ SecureTokenStore.write error: $e');
    }
  }

  static Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      debugPrint('⚠️ SecureTokenStore.read error: $e');
      return null;
    }
  }

  static Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      debugPrint('⚠️ SecureTokenStore.delete error: $e');
    }
  }

  static Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      debugPrint('⚠️ SecureTokenStore.deleteAll error: $e');
    }
  }
}
