import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/fingerprint_service.dart';
import '../services/api_service.dart';

class FingerprintRegistrationScreen extends StatefulWidget {
  final int learnerId;
  final String learnerName;

  const FingerprintRegistrationScreen({
    super.key,
    required this.learnerId,
    required this.learnerName,
  });

  @override
  State<FingerprintRegistrationScreen> createState() =>
      _FingerprintRegistrationScreenState();
}

class _FingerprintRegistrationScreenState
    extends State<FingerprintRegistrationScreen> {
  final FingerprintService _fingerprintService = FingerprintService();
  bool _loading = true;
  bool _hasLeftThumbFutronic = false;
  bool _hasRightThumbFutronic = false;
  bool _hasLeftThumbZkteco = false;
  bool _hasRightThumbZkteco = false;
  bool _capturing = false;
  String? _currentCapture;
  bool _scannerConnected = false;
  ScannerType _scannerType = ScannerType.none;

  @override
  void initState() {
    super.initState();
    _checkRegisteredFingerprints();
    _detectScanner();
  }

  Future<void> _detectScanner() async {
    final type = await _fingerprintService.getScannerType();
    if (mounted) {
      setState(() => _scannerType = type);
    }
  }

  Future<void> _checkRegisteredFingerprints() async {
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService
          .get('/api/Learners/${widget.learnerId}/fingerprints');
      if (response.statusCode == 200) {
        setState(() {
          _hasLeftThumbFutronic =
              response.data['hasLeftThumbFutronic'] ?? false;
          _hasRightThumbFutronic =
              response.data['hasRightThumbFutronic'] ?? false;
          _hasLeftThumbZkteco = response.data['hasLeftThumbZkteco'] ?? false;
          _hasRightThumbZkteco = response.data['hasRightThumbZkteco'] ?? false;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error checking fingerprints: $e');
      setState(() => _loading = false);
    }
  }

  String get _scannerLabel {
    switch (_scannerType) {
      case ScannerType.futronic:
        return 'Futronic Scanner Connected';
      case ScannerType.zkteco:
        return 'ZKTeco Scanner Connected';
      case ScannerType.none:
        return 'No Scanner Connected';
    }
  }

  Color get _scannerColor {
    return _scannerType == ScannerType.none
        ? const Color(0xFFef4444)
        : const Color(0xFF10b981);
  }

  IconData get _scannerIcon {
    return _scannerType == ScannerType.none ? Icons.usb_off : Icons.usb;
  }

  Future<void> _captureFingerprint(String fingerprintType) async {
    // Refresh scanner detection first
    await _detectScanner();

    if (_scannerType == ScannerType.none) {
      if (mounted) {
        _showErrorDialog(
          'No Scanner Connected',
          'Please connect a Futronic or ZKTeco USB fingerprint scanner to your device.\n\n'
              'Once connected, tap the refresh button and try again.',
          icon: Icons.usb_off,
        );
      }
      return;
    }

    setState(() {
      _capturing = true;
      _currentCapture = fingerprintType;
    });

    _showScanningDialog(fingerprintType);

    try {
      final template = await _fingerprintService.captureFingerprint(
        fingerType: fingerprintType,
      );

      if (mounted) Navigator.pop(context); // close scanning dialog

      if (template == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content:
                    Text('Failed to capture fingerprint. Please try again.')),
          );
        }
        setState(() {
          _capturing = false;
          _currentCapture = null;
        });
        return;
      }

      // Upload to backend — include which scanner was used so backend can tag it
      if (!mounted) return;
      final apiService = context.read<ApiService>();
      await apiService.post(
        '/api/Learners/${widget.learnerId}/fingerprint',
        data: {
          'FingerprintType': fingerprintType,
          'TemplateData': template,
          'ScannerType':
              _scannerType == ScannerType.zkteco ? 'ZKTECO' : 'Futronic',
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '$fingerprintType registered successfully (${_scannerType == ScannerType.zkteco ? "ZKTeco" : "Futronic"})'),
            backgroundColor: const Color(0xFF10b981),
          ),
        );
        _checkRegisteredFingerprints();
      }
    } on PlatformException catch (e) {
      if (mounted) {
        try {
          Navigator.pop(context);
        } catch (_) {}
      }
      if (mounted) {
        _showErrorDialog(
          _mapErrorCode(e.code),
          _mapErrorMessage(e),
        );
      }
    } catch (e) {
      if (mounted) {
        try {
          Navigator.pop(context);
        } catch (_) {}
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration failed: $e')),
        );
      }
    } finally {
      setState(() {
        _capturing = false;
        _currentCapture = null;
      });
    }
  }

  void _showScanningDialog(String fingerprintType) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: const Color(0xFF374151),
                  borderRadius: BorderRadius.circular(60),
                  border: Border.all(color: const Color(0xFF0EA5E9), width: 3),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: CircularProgressIndicator(
                        color: _scannerType == ScannerType.zkteco
                            ? const Color(0xFF8B5CF6)
                            : const Color(0xFF0EA5E9),
                        strokeWidth: 2,
                      ),
                    ),
                    const Icon(Icons.fingerprint,
                        size: 60, color: Color(0xFF0EA5E9)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Registering $fingerprintType',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                _scannerType == ScannerType.zkteco
                    ? 'Using ZKTeco scanner...'
                    : 'Using Futronic scanner...',
                style: TextStyle(
                  color: _scannerType == ScannerType.zkteco
                      ? const Color(0xFF8B5CF6)
                      : const Color(0xFF0EA5E9),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Place finger on scanner and keep steady',
                style: TextStyle(color: Colors.white70, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      },
    );
  }

  void _showErrorDialog(String title, String message,
      {IconData icon = Icons.error}) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(icon, color: Colors.red, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Text(title,
                    style: const TextStyle(color: Colors.white, fontSize: 17)),
              ),
            ],
          ),
          content: Text(message,
              style: const TextStyle(color: Colors.white70, fontSize: 14)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK',
                  style: TextStyle(color: Color(0xFF0EA5E9), fontSize: 16)),
            ),
          ],
        );
      },
    );
  }

  String _mapErrorCode(String code) {
    switch (code) {
      case 'NO_DEVICE':
        return 'Scanner Not Found';
      case 'PERMISSION_DENIED':
        return 'Permission Denied';
      case 'USB_ERROR':
        return 'USB Connection Issue';
      case 'CAPTURE_ERROR':
        return 'Capture Failed';
      default:
        return 'Scanner Error';
    }
  }

  String _mapErrorMessage(PlatformException e) {
    if (e.code == 'CAPTURE_ERROR' && e.message?.contains('87') == true) {
      return 'Scanner not responding. Disconnect and reconnect it, then try again.';
    }
    if (e.code == 'NO_DEVICE') {
      return 'Please connect a Futronic or ZKTeco USB scanner.';
    }
    if (e.code == 'PERMISSION_DENIED') {
      return 'USB access denied. When the permission dialog appears, tap OK.';
    }
    return e.message ?? 'Unknown error — please try again.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fingerprint Registration'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Re-detect scanner',
            onPressed: _detectScanner,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Learner header
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1e293b),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.learnerName,
                          style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Register fingerprints for biometric attendance',
                          style:
                              TextStyle(fontSize: 13, color: Color(0xFF94a3b8)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Scanner status — auto-detected
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _scannerType == ScannerType.none
                          ? const Color(0xFFef4444).withValues(alpha: 0.13)
                          : const Color(0xFF10b981).withValues(alpha: 0.13),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: _scannerColor),
                    ),
                    child: Row(
                      children: [
                        Icon(_scannerIcon, color: _scannerColor, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _scannerLabel,
                                style: TextStyle(
                                    color: _scannerColor,
                                    fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                _scannerType == ScannerType.none
                                    ? 'Connect a Futronic or ZKTeco USB scanner'
                                    : _scannerType == ScannerType.zkteco
                                        ? 'ZKTeco biometric reader detected'
                                        : 'Futronic FS80H/FS88H detected',
                                style: const TextStyle(
                                    color: Colors.white70, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon:
                              const Icon(Icons.refresh, color: Colors.white70),
                          tooltip: 'Refresh',
                          onPressed: _detectScanner,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Info banner
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0EA5E9).withValues(alpha: 0.13),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF0EA5E9)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: Color(0xFF0EA5E9)),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Both Futronic and ZKTeco scanners are supported. '
                            'The app auto-detects which scanner is plugged in.',
                            style: TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Left Thumb
                  _buildFingerprintCard(
                    title: 'Left Thumb',
                    isRegistered: _scannerType == ScannerType.zkteco
                        ? _hasLeftThumbZkteco
                        : _hasLeftThumbFutronic,
                    isCapturing: _capturing && _currentCapture == 'LeftThumb',
                    onCapture: () => _captureFingerprint('LeftThumb'),
                  ),

                  const SizedBox(height: 16),

                  // Right Thumb
                  _buildFingerprintCard(
                    title: 'Right Thumb',
                    isRegistered: _scannerType == ScannerType.zkteco
                        ? _hasRightThumbZkteco
                        : _hasRightThumbFutronic,
                    isCapturing: _capturing && _currentCapture == 'RightThumb',
                    onCapture: () => _captureFingerprint('RightThumb'),
                  ),

                  const SizedBox(height: 24),

                  // Status summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1e293b),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatusItem(
                          'Left Thumb',
                          _scannerType == ScannerType.zkteco
                              ? _hasLeftThumbZkteco
                              : _hasLeftThumbFutronic,
                        ),
                        Container(
                            width: 1,
                            height: 40,
                            color: const Color(0xFF334155)),
                        _buildStatusItem(
                          'Right Thumb',
                          _scannerType == ScannerType.zkteco
                              ? _hasRightThumbZkteco
                              : _hasRightThumbFutronic,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildFingerprintCard({
    required String title,
    required bool isRegistered,
    required bool isCapturing,
    required VoidCallback onCapture,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color:
              isRegistered ? const Color(0xFF10b981) : const Color(0xFF334155),
          width: 2,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isRegistered
                      ? const Color(0xFF10b981).withValues(alpha: 0.13)
                      : const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.fingerprint,
                  size: 40,
                  color: isRegistered ? const Color(0xFF10b981) : Colors.white,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white)),
                    const SizedBox(height: 4),
                    Text(
                      isRegistered ? 'Registered ✓' : 'Not registered',
                      style: TextStyle(
                        fontSize: 14,
                        color: isRegistered
                            ? const Color(0xFF10b981)
                            : const Color(0xFF94a3b8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: (_capturing || _scannerType == ScannerType.none)
                  ? null
                  : onCapture,
              icon: isCapturing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.fingerprint),
              label: Text(
                isCapturing
                    ? 'Capturing...'
                    : isRegistered
                        ? 'Re-register'
                        : 'Register',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _scannerType == ScannerType.zkteco
                    ? const Color(0xFF8B5CF6)
                    : const Color(0xFF0EA5E9),
                disabledBackgroundColor: const Color(0xFF334155),
                padding: const EdgeInsets.all(14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusItem(String label, bool isRegistered) {
    return Column(
      children: [
        Icon(
          isRegistered ? Icons.check_circle : Icons.cancel,
          color:
              isRegistered ? const Color(0xFF10b981) : const Color(0xFF64748b),
          size: 32,
        ),
        const SizedBox(height: 6),
        Text(label,
            style: const TextStyle(fontSize: 12, color: Color(0xFF94a3b8))),
      ],
    );
  }
}
