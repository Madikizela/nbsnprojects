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
  bool _hasLeftThumb = false;
  bool _hasRightThumb = false;
  bool _capturing = false;
  String? _currentCapture;
  bool _scannerConnected = false;

  @override
  void initState() {
    super.initState();
    _checkRegisteredFingerprints();
    _checkScannerConnection();
  }

  Future<void> _checkScannerConnection() async {
    final available = await _fingerprintService.isScannerAvailable();
    setState(() {
      _scannerConnected = available;
    });
  }

  Future<void> _checkRegisteredFingerprints() async {
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService
          .get('/api/Learners/${widget.learnerId}/fingerprints');

      if (response.statusCode == 200) {
        setState(() {
          _hasLeftThumb = response.data['hasLeftThumb'] ?? false;
          _hasRightThumb = response.data['hasRightThumb'] ?? false;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error checking fingerprints: $e');
      setState(() => _loading = false);
    }
  }

  Future<void> _captureFingerprint(String fingerprintType) async {
    // First check if scanner is connected
    final available = await _fingerprintService.isScannerAvailable();
    if (!available) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF1e293b),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.usb_off, color: Colors.red, size: 32),
                SizedBox(width: 12),
                Text('Scanner Not Connected',
                    style: TextStyle(color: Colors.white)),
              ],
            ),
            content: const Text(
              'Please connect the Futronic USB fingerprint scanner to your device via USB cable.\n\n'
              'Once connected, you will see a permission dialog. Click "OK" to allow access to the scanner.',
              style: TextStyle(color: Colors.white70),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK',
                    style: TextStyle(color: Color(0xFF0EA5E9))),
              ),
            ],
          ),
        );
      }
      return;
    }

    setState(() {
      _capturing = true;
      _currentCapture = fingerprintType;
    });

    // Show scanning dialog with fingerprint preview
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
              // Fingerprint scanner visual
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
                    // Animated scanning ring
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(50),
                        border: Border.all(
                          color: const Color(0xFF0EA5E9).withOpacity(0.5),
                          width: 2,
                        ),
                      ),
                      child: const CircularProgressIndicator(
                        color: Color(0xFF0EA5E9),
                        strokeWidth: 2,
                      ),
                    ),
                    // Fingerprint icon
                    const Icon(
                      Icons.fingerprint,
                      size: 60,
                      color: Color(0xFF0EA5E9),
                    ),
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
              const SizedBox(height: 12),
              const Text(
                'Place finger on scanner...',
                style: TextStyle(color: Colors.white70, fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Keep finger steady until capture is complete',
                style: TextStyle(color: Colors.white54, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      },
    );

    try {
      // Capture fingerprint - this will request permission if needed
      final template = await _fingerprintService.captureFingerprint(
        fingerType: fingerprintType,
      );

      // Close scanning dialog
      if (mounted) Navigator.pop(context);

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

      // Upload to backend
      final apiService = context.read<ApiService>();
      await apiService.post(
        '/api/Learners/${widget.learnerId}/fingerprint',
        data: {
          'FingerprintType': fingerprintType,
          'TemplateData': template,
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$fingerprintType registered successfully'),
            backgroundColor: const Color(0xFF10b981),
          ),
        );
        _checkRegisteredFingerprints();
      }
    } on PlatformException catch (e) {
      // Close scanning dialog if still open
      if (mounted) Navigator.pop(context);

      if (mounted) {
        String errorMessage = 'Scanner Error';
        String detailedMessage = '';

        // Handle specific error codes
        if (e.code == 'CAPTURE_ERROR') {
          if (e.message?.contains('87') == true) {
            errorMessage = 'Scanner Connection Error';
            detailedMessage =
                'The fingerprint scanner is not responding properly. Please:\n\n'
                '• Check USB connection\n'
                '• Disconnect and reconnect scanner\n'
                '• Try again';
          } else {
            errorMessage = 'Capture Failed';
            detailedMessage = e.message ?? 'Unknown capture error';
          }
        } else if (e.code == 'NO_DEVICE') {
          errorMessage = 'Scanner Not Found';
          detailedMessage = 'Please connect the fingerprint scanner via USB';
        } else if (e.code == 'USB_ERROR') {
          errorMessage = 'USB Connection Issue';
          detailedMessage = e.message ?? 'Scanner connection problem';
        } else if (e.code == 'PERMISSION_DENIED') {
          errorMessage = 'Permission Denied';
          detailedMessage = 'Please allow USB access for the scanner';
        } else {
          errorMessage = 'Scanner Error';
          detailedMessage = '${e.code}: ${e.message}';
        }

        // Show detailed error dialog
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1e293b),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  const Icon(Icons.error, color: Colors.red, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      errorMessage,
                      style: const TextStyle(color: Colors.white, fontSize: 18),
                    ),
                  ),
                ],
              ),
              content: Text(
                detailedMessage,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
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
    } catch (e) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fingerprint Registration'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
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
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Register fingerprints for biometric identification',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF94a3b8),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  // Instructions
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xff0ea5e920),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF0EA5E9)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: Color(0xFF0EA5E9)),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Place your thumb on the scanner when prompted. Keep it steady until capture is complete.',
                            style: TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Scanner Status
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _scannerConnected
                          ? const Color(0xff10b98120)
                          : const Color(0xffef444420),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _scannerConnected
                            ? const Color(0xFF10b981)
                            : const Color(0xFFef4444),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _scannerConnected ? Icons.usb : Icons.usb_off,
                          color: _scannerConnected
                              ? const Color(0xFF10b981)
                              : const Color(0xFFef4444),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _scannerConnected
                                    ? 'Scanner Connected'
                                    : 'Scanner Not Connected',
                                style: TextStyle(
                                  color: _scannerConnected
                                      ? const Color(0xFF10b981)
                                      : const Color(0xFFef4444),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _scannerConnected
                                    ? 'Ready to capture fingerprints'
                                    : 'Please connect USB fingerprint scanner',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.refresh, color: Colors.white),
                          onPressed: _checkScannerConnection,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  // Left Thumb
                  _buildFingerprintCard(
                    title: 'Left Thumb',
                    icon: Icons.fingerprint,
                    isRegistered: _hasLeftThumb,
                    isCapturing: _capturing && _currentCapture == 'LeftThumb',
                    onCapture: () => _captureFingerprint('LeftThumb'),
                  ),

                  const SizedBox(height: 20),

                  // Right Thumb
                  _buildFingerprintCard(
                    title: 'Right Thumb',
                    icon: Icons.fingerprint,
                    isRegistered: _hasRightThumb,
                    isCapturing: _capturing && _currentCapture == 'RightThumb',
                    onCapture: () => _captureFingerprint('RightThumb'),
                  ),

                  const SizedBox(height: 30),

                  // Status Summary
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
                          _hasLeftThumb,
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: const Color(0xFF334155),
                        ),
                        _buildStatusItem(
                          'Right Thumb',
                          _hasRightThumb,
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
    required IconData icon,
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
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isRegistered
                      ? const Color(0xff10b98120)
                      : const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  size: 40,
                  color: isRegistered ? const Color(0xFF10b981) : Colors.white,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
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
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: isCapturing ? null : onCapture,
              icon: isCapturing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(isRegistered ? Icons.refresh : Icons.fingerprint),
              label: Text(
                isCapturing
                    ? 'Capturing...'
                    : isRegistered
                        ? 'Re-register'
                        : 'Register',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0EA5E9),
                padding: const EdgeInsets.all(16),
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
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF94a3b8),
          ),
        ),
      ],
    );
  }
}
