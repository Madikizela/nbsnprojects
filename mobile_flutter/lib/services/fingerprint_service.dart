import 'package:flutter/services.dart';

enum ScannerType { futronic, zkteco, none }

class FingerprintService {
  static const platform = MethodChannel('com.example.nbsn_mobile/fingerprint');

  /// Capture fingerprint and return ANSI/ZK template as base64 string
  Future<String?> captureFingerprint({String? fingerType}) async {
    try {
      final String? template =
          await platform.invokeMethod('captureFingerprint', {
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

  /// Check if any supported fingerprint scanner is connected
  Future<bool> isScannerAvailable() async {
    try {
      final bool available = await platform.invokeMethod('isScannerAvailable');
      return available;
    } on PlatformException catch (e) {
      print('Failed to check scanner: ${e.code} - ${e.message}');
      return false;
    }
  }

  /// Returns which scanner is currently connected: futronic, zkteco, or none
  Future<ScannerType> getScannerType() async {
    try {
      final String type = await platform.invokeMethod('getScannerType');
      switch (type) {
        case 'futronic':
          return ScannerType.futronic;
        case 'zkteco':
          return ScannerType.zkteco;
        default:
          return ScannerType.none;
      }
    } on PlatformException catch (e) {
      print('Failed to get scanner type: ${e.code} - ${e.message}');
      return ScannerType.none;
    }
  }
}
