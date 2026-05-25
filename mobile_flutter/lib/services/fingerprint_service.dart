import 'package:flutter/services.dart';

class FingerprintService {
  static const platform = MethodChannel('com.example.nbsn_mobile/fingerprint');

  /// Capture fingerprint and return ANSI template as base64 string
  Future<String?> captureFingerprint({String? fingerType}) async {
    try {
      final String? template = await platform.invokeMethod('captureFingerprint', {
        'fingerType': fingerType,
      });
      return template;
    } on PlatformException catch (e) {
      print('Failed to capture fingerprint: ${e.code} - ${e.message}');
      rethrow;
    }
  }

  /// Verify fingerprint against stored template
  Future<bool> verifyFingerprint(String storedTemplate) async {
    try {
      final bool result = await platform.invokeMethod('verifyFingerprint', {
        'template': storedTemplate,
      });
      return result;
    } on PlatformException catch (e) {
      print('Failed to verify fingerprint: ${e.code} - ${e.message}');
      rethrow;
    }
  }

  /// Check if fingerprint scanner is available
  Future<bool> isScannerAvailable() async {
    try {
      final bool available = await platform.invokeMethod('isScannerAvailable');
      return available;
    } on PlatformException catch (e) {
      print('Failed to check scanner: ${e.code} - ${e.message}');
      // For scanner availability, return false instead of throwing
      return false;
    }
  }
}
