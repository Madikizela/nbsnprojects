import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:math' as math;
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/fingerprint_service.dart';
import '../services/offline_attendance_queue.dart';
import '../services/local_database_service.dart';
import '../services/sync_service.dart';

/// The three supported clocking methods
enum ClockingMethod { mobileBiometric, futronic, zkteco }

class AttendanceClockingScreen extends StatefulWidget {
  final int classId;
  final double? latitude;
  final double? longitude;

  const AttendanceClockingScreen({
    super.key,
    required this.classId,
    this.latitude,
    this.longitude,
  });

  @override
  State<AttendanceClockingScreen> createState() =>
      _AttendanceClockingScreenState();
}

class _AttendanceClockingScreenState extends State<AttendanceClockingScreen> {
  final FingerprintService _fingerprintService = FingerprintService();
  final LocalDatabaseService _localDb = LocalDatabaseService.instance;
  final SyncService _syncService = SyncService.instance;

  List<dynamic> learners = [];
  bool isLoading = true;
  bool isScanning = false;
  bool _isOfflineMode = false;
  int _pendingQueueCount = 0;
  ScannerType _connectedScanner = ScannerType.none;
  ClockingMethod _selectedMethod = ClockingMethod.mobileBiometric;

  @override
  void initState() {
    super.initState();
    debugPrint('📍 [DEBUG] AttendanceClockingScreen initialized');
    _initQueue();
    _detectScanner();
    fetchLearners();
  }

  Future<void> _detectScanner() async {
    final type = await _fingerprintService.getScannerType();
    if (mounted) {
      setState(() {
        _connectedScanner = type;
        // Auto-select the most appropriate method
        if (type == ScannerType.zkteco) {
          _selectedMethod = ClockingMethod.zkteco;
        } else if (type == ScannerType.futronic) {
          _selectedMethod = ClockingMethod.futronic;
        } else {
          _selectedMethod = ClockingMethod.mobileBiometric;
        }
      });
    }
  }

  Future<void> _initQueue() async {
    final queue = OfflineAttendanceQueue.instance;
    await queue.init();
    if (!mounted) return;
    // Attempt to drain any records queued while offline
    final apiService = context.read<ApiService>();
    final synced = await queue.trySyncAll(apiService);
    if (synced > 0 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ Synced $synced offline attendance record(s)'),
          backgroundColor: const Color(0xFF10b981),
        ),
      );
    }
    _refreshQueueBadge();
  }

  Future<void> _refreshQueueBadge() async {
    final count = await OfflineAttendanceQueue.instance.pendingCount();
    if (mounted) setState(() => _pendingQueueCount = count);
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> fetchLearners() async {
    setState(() => isLoading = true);

    try {
      // Check connectivity
      final connectivity = await Connectivity().checkConnectivity();
      final isOnline = connectivity.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);

      if (isOnline) {
        // Online: Fetch from server and cache locally
        final apiService = context.read<ApiService>();
        final response =
            await apiService.get('/api/Learners/class/${widget.classId}');

        final learnersData = response.data ?? [];

        // Cache learners locally for offline use
        if (learnersData is List && learnersData.isNotEmpty) {
          await _localDb.saveClassLearners(
            widget.classId,
            learnersData.cast<Map<String, dynamic>>(),
          );
        }

        setState(() {
          learners = learnersData;
          _isOfflineMode = false;
          isLoading = false;
        });

        debugPrint('✅ Fetched ${learners.length} learners online');
      } else {
        // Offline: Load from local database
        final cachedLearners = await _localDb.getClassLearners(widget.classId);

        setState(() {
          learners = cachedLearners;
          _isOfflineMode = true;
          isLoading = false;
        });

        if (cachedLearners.isEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                    '⚠️ No cached learners found. Connect to internet to sync.'),
                backgroundColor: Colors.orange,
              ),
            );
          }
        } else {
          debugPrint('✅ Loaded ${learners.length} learners from cache');
        }
      }
    } catch (e) {
      debugPrint('❌ Error fetching learners: $e');
      // Fallback to cached data on error
      try {
        final cachedLearners = await _localDb.getClassLearners(widget.classId);
        setState(() {
          learners = cachedLearners;
          _isOfflineMode = true;
          isLoading = false;
        });

        if (mounted && cachedLearners.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  '⚠️ Using cached data (${cachedLearners.length} learners)'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } catch (cacheError) {
        setState(() => isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to load learners: $e')),
          );
        }
      }
    }
  }

  Future<bool> _checkLocation() async {
    debugPrint('📍 [DEBUG] _checkLocation called');
    debugPrint('📍 [DEBUG] widget.latitude: ${widget.latitude}');
    debugPrint('📍 [DEBUG] widget.longitude: ${widget.longitude}');

    if (widget.latitude == null || widget.longitude == null) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF1e293b),
            title: const Text('Missing Site Location',
                style: TextStyle(color: Colors.white)),
            content: const Text(
              'This site does not have GPS coordinates set. Please contact your administrator to set the site location.',
              style: TextStyle(color: Colors.white70),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK',
                    style: TextStyle(color: Color(0xFF8B5CF6))),
              ),
            ],
          ),
        );
      }
      return false;
    }

    try {
      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Location permissions are denied')),
            );
          }
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Location permissions are permanently denied')),
          );
        }
        return false;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          timeLimit: Duration(seconds: 15),
        ),
      );

      // Calculate distance
      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        widget.latitude!,
        widget.longitude!,
      );

      debugPrint(
          '📍 [LOCATION] Current: ${position.latitude}, ${position.longitude}');
      debugPrint('📍 [LOCATION] Site: ${widget.latitude}, ${widget.longitude}');
      debugPrint(
          '📍 [LOCATION] Distance: ${distanceInMeters.toStringAsFixed(2)}m');

      if (distanceInMeters > 50) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              backgroundColor: const Color(0xFF1e293b),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.location_off, color: Colors.red),
                  SizedBox(width: 10),
                  Text('Out of Range', style: TextStyle(color: Colors.white)),
                ],
              ),
              content: Text(
                'You are ${distanceInMeters.toStringAsFixed(0)} meters away from the site. '
                'You must be within 50 meters to clock in or out.',
                style: const TextStyle(color: Colors.white70),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('OK',
                      style: TextStyle(color: Color(0xFF8B5CF6))),
                ),
              ],
            ),
          );
        }
        return false;
      }

      return true;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error getting location: $e')),
        );
      }
      return false;
    }
  }

  Future<void> _scanFingerprint(dynamic learner) async {
    if (isScanning) return;

    // Check location first
    final isInRange = await _checkLocation();
    if (!isInRange) return;

    // Route to correct clocking method
    switch (_selectedMethod) {
      case ClockingMethod.mobileBiometric:
        await _clockWithMobileBiometric(learner);
        break;
      case ClockingMethod.futronic:
        await _clockWithExternalScanner(learner, ScannerType.futronic);
        break;
      case ClockingMethod.zkteco:
        await _clockWithExternalScanner(learner, ScannerType.zkteco);
        break;
    }
  }

  Future<void> _clockWithMobileBiometric(dynamic learner) async {
    // Mobile biometric — show fingerprint dialog (uses phone's built-in sensor conceptually;
    // in practice we still route through the external scanner if one is plugged in,
    // otherwise show a placeholder for phone-based flow)
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Mobile biometric clocking — use phone sensor or face recognition'),
          backgroundColor: Color(0xFF0EA5E9),
        ),
      );
    }
  }

  Future<void> _clockWithExternalScanner(
      dynamic learner, ScannerType expectedType) async {
    // Re-detect to confirm scanner is still connected
    final actual = await _fingerprintService.getScannerType();
    setState(() => _connectedScanner = actual);

    if (actual == ScannerType.none) {
      if (mounted) {
        _showNoScannerDialog();
      }
      return;
    }

    if (actual != expectedType) {
      // Wrong scanner connected — inform user
      final expected =
          expectedType == ScannerType.zkteco ? 'ZKTeco' : 'Futronic';
      final connected = actual == ScannerType.zkteco ? 'ZKTeco' : 'Futronic';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Expected $expected scanner but found $connected. Switching method.'),
            backgroundColor: const Color(0xFFf59e0b),
          ),
        );
        setState(() {
          _selectedMethod = actual == ScannerType.zkteco
              ? ClockingMethod.zkteco
              : ClockingMethod.futronic;
        });
      }
    }

    setState(() => isScanning = true);

    _showScanningDialog(learner);

    try {
      final result = await _fingerprintService.captureFingerprint();

      if (mounted) Navigator.pop(context);

      if (result == null || result.isEmpty) {
        setState(() => isScanning = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to capture fingerprint'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      await _processAttendance(learner, result);
    } on PlatformException catch (e) {
      setState(() => isScanning = false);
      if (mounted) {
        try {
          Navigator.pop(context);
        } catch (_) {}
        _showScannerError(e);
      }
    } catch (e) {
      setState(() => isScanning = false);
      if (mounted) {
        try {
          Navigator.pop(context);
        } catch (_) {}
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showNoScannerDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1e293b),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.usb_off, color: Colors.red, size: 28),
            SizedBox(width: 10),
            Text('Scanner Not Connected',
                style: TextStyle(color: Colors.white)),
          ],
        ),
        content: const Text(
          'Please connect a Futronic or ZKTeco USB fingerprint scanner, then tap Refresh.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _detectScanner();
            },
            child: const Text('Refresh',
                style: TextStyle(color: Color(0xFF0EA5E9))),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
        ],
      ),
    );
  }

  void _showScannerError(PlatformException e) {
    String title = 'Scanner Error';
    String message = e.message ?? 'Unknown error';

    if (e.code == 'CAPTURE_ERROR' && e.message?.contains('87') == true) {
      title = 'Scanner Connection Error';
      message =
          'Scanner not responding. Disconnect and reconnect it, then try again.';
    } else if (e.code == 'NO_DEVICE') {
      title = 'Scanner Not Found';
      message = 'Please connect a Futronic or ZKTeco USB scanner.';
    } else if (e.code == 'PERMISSION_DENIED') {
      title = 'Permission Denied';
      message = 'Tap OK when the USB permission dialog appears.';
    } else if (e.code == 'USB_ERROR') {
      title = 'USB Connection Issue';
      message = e.message ?? 'Scanner connection problem. Try reconnecting.';
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1e293b),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.error, color: Colors.red, size: 28),
            const SizedBox(width: 10),
            Expanded(
              child: Text(title,
                  style: const TextStyle(color: Colors.white, fontSize: 17)),
            ),
          ],
        ),
        content: Text(message, style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Color(0xFF8B5CF6))),
          ),
        ],
      ),
    );
  }

  void _showScanningDialog(dynamic learner) {
    final color = _selectedMethod == ClockingMethod.zkteco
        ? const Color(0xFF8B5CF6)
        : const Color(0xFF0EA5E9);

    final methodLabel = _selectedMethod == ClockingMethod.zkteco
        ? 'ZKTeco Scanner'
        : 'Futronic Scanner';

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
                  border: Border.all(color: color, width: 3),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: CircularProgressIndicator(
                          color: color, strokeWidth: 2),
                    ),
                    Icon(Icons.fingerprint, size: 60, color: color),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                '${learner['firstName']} ${learner['lastName']}',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                methodLabel,
                style: TextStyle(
                    color: color, fontSize: 13, fontWeight: FontWeight.w600),
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

  Future<void> _processAttendance(
      dynamic learner, String fingerprintTemplate) async {
    debugPrint('🔵 [ATTENDANCE] Starting _processAttendance');
    debugPrint(
        '🔵 [ATTENDANCE] Learner: ${learner['firstName']} ${learner['lastName']}');

    try {
      debugPrint('🔵 [ATTENDANCE] Getting services...');
      final apiService = context.read<ApiService>();
      final authService = context.read<AuthService>();
      final teacherId = authService.user?['id'] ?? 0;

      debugPrint('🔵 [ATTENDANCE] TeacherId from auth: $teacherId');
      debugPrint('🔵 [ATTENDANCE] ClassId from widget: ${widget.classId}');

      final scannerType =
          _selectedMethod == ClockingMethod.zkteco ? 'ZKTECO' : 'FUTRONIC';
      final requestData = {
        'ClassId': widget.classId,
        'TeacherId': teacherId,
        'FingerprintTemplate': fingerprintTemplate,
        'ScannerType': scannerType,
      };

      // Debug logging
      debugPrint('🟢 === Smart Clock Toggle Request ===');
      debugPrint(
          '🟢 ClassId: ${widget.classId} (type: ${widget.classId.runtimeType})');
      debugPrint('🟢 TeacherId: $teacherId (type: ${teacherId.runtimeType})');
      debugPrint(
          '🟢 FingerprintTemplate length: ${fingerprintTemplate.length}');
      debugPrint(
          '🟢 FingerprintTemplate preview: ${fingerprintTemplate.substring(0, math.min(50, fingerprintTemplate.length))}...');
      debugPrint('🟢 Request data: $requestData');

      setState(() => isScanning = false);
      debugPrint('🔵 [ATTENDANCE] Set isScanning = false');

      // Use the smart clock-toggle endpoint
      debugPrint(
          '🔵 [ATTENDANCE] Calling API endpoint: /api/Attendance/clock-toggle');

      try {
        final response = await apiService.post('/api/Attendance/clock-toggle',
            data: requestData);
        debugPrint('✅ [ATTENDANCE] Clock-toggle successful!');
        debugPrint('🟢 Response status: ${response.statusCode}');

        if (mounted && response.statusCode == 200) {
          final action = response.data['action'] ?? 'Unknown';
          debugPrint('✅ [ATTENDANCE] Action performed: $action');

          if (action == 'ClockIn') {
            _showSuccessDialog(learner, response.data, 'ClockIn');
          } else if (action == 'ClockOut') {
            _showSuccessDialog(learner, response.data, 'ClockOut');
          }

          fetchLearners(); // Refresh list
        }
      } on DioException catch (clockToggleError) {
        debugPrint('❌ [ATTENDANCE] Clock-toggle failed: $clockToggleError');

        // Check if it was a network / connectivity error — queue for later
        final isNetworkError =
            clockToggleError.type == DioExceptionType.connectionError ||
                clockToggleError.type == DioExceptionType.connectionTimeout ||
                clockToggleError.type == DioExceptionType.sendTimeout ||
                clockToggleError.type == DioExceptionType.receiveTimeout ||
                clockToggleError.response == null;

        if (isNetworkError) {
          // Queue the record for later sync
          await OfflineAttendanceQueue.instance.enqueue(
            classId: widget.classId,
            teacherId: teacherId is int
                ? teacherId
                : int.tryParse(teacherId.toString()) ?? 0,
            embedding: [], // fingerprint-based flow stores template, not embedding; queue for manual sync
            latitude: widget.latitude,
            longitude: widget.longitude,
          );
          await _refreshQueueBadge();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                    '📶 No connection — attendance queued and will sync automatically when online'),
                backgroundColor: Color(0xFFf59e0b),
                duration: Duration(seconds: 4),
              ),
            );
          }
        } else {
          if (mounted) {
            final errorMessage =
                clockToggleError.response?.data?['message']?.toString() ??
                    'Failed to process attendance';
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text(errorMessage), backgroundColor: Colors.red),
            );
          }
        }
      }
    } catch (e, stackTrace) {
      debugPrint('❌ [ATTENDANCE] Unexpected exception: $e');
      debugPrint('❌ [ATTENDANCE] Stack trace: $stackTrace');
      setState(() => isScanning = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }

    debugPrint('🔵 [ATTENDANCE] _processAttendance completed');
  }

  void _showSuccessDialog(
      dynamic learner, Map<String, dynamic> data, String action) {
    final contactTime = data['contactTime'];
    String contactTimeFormatted = 'N/A';

    // Handle contactTime being either a Map or a String
    if (contactTime != null) {
      if (contactTime is Map) {
        contactTimeFormatted = contactTime['formatted']?.toString() ?? 'N/A';
      } else {
        contactTimeFormatted = contactTime.toString();
      }
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1e293b),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(
                action == 'ClockIn' ? Icons.login : Icons.logout,
                color: action == 'ClockIn'
                    ? const Color(0xFF10b981)
                    : const Color(0xFFef4444),
                size: 32,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  action == 'ClockIn' ? 'Clocked In' : 'Clocked Out',
                  style: const TextStyle(color: Colors.white, fontSize: 20),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                data['learnerName'] ?? 'Learner',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              if (action == 'ClockIn')
                _buildInfoRow(
                    'Clock In Time', _formatTime(data['clockInTime'])),
              if (action == 'ClockOut') ...[
                _buildInfoRow(
                    'Clock In Time', _formatTime(data['clockInTime'])),
                _buildInfoRow(
                    'Clock Out Time', _formatTime(data['clockOutTime'])),
                const Divider(color: Colors.white24, height: 24),
                _buildInfoRow('Contact Time', contactTimeFormatted,
                    highlight: true),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK',
                  style: TextStyle(color: Color(0xFF8B5CF6), fontSize: 16)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildInfoRow(String label, String value, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          Text(
            value,
            style: TextStyle(
              color: highlight ? const Color(0xFF10b981) : Colors.white,
              fontSize: highlight ? 18 : 14,
              fontWeight: highlight ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(dynamic time) {
    if (time == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(time.toString());
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'N/A';
    }
  }

  String getInitials(String firstName, String lastName) {
    String firstInitial = '';
    String lastInitial = '';

    if (firstName.isNotEmpty) {
      firstInitial = firstName.substring(0, 1);
    }
    if (lastName.isNotEmpty) {
      lastInitial = lastName.substring(0, 1);
    }

    return '$firstInitial$lastInitial'.toUpperCase();
  }

  Color _methodColor(ClockingMethod method) {
    switch (method) {
      case ClockingMethod.mobileBiometric:
        return const Color(0xFF0EA5E9);
      case ClockingMethod.futronic:
        return const Color(0xFF10b981);
      case ClockingMethod.zkteco:
        return const Color(0xFF8B5CF6);
    }
  }

  String _methodShortLabel(ClockingMethod method) {
    switch (method) {
      case ClockingMethod.mobileBiometric:
        return 'Mobile';
      case ClockingMethod.futronic:
        return 'Futronic';
      case ClockingMethod.zkteco:
        return 'ZKTeco';
    }
  }

  Widget _buildMethodChip({
    required ClockingMethod method,
    required String label,
    required IconData icon,
    required Color color,
    bool disabled = false,
  }) {
    final selected = _selectedMethod == method;
    return GestureDetector(
      onTap: disabled
          ? () {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text(
                    '$label scanner not connected. Connect it and tap the USB refresh icon.'),
                backgroundColor: const Color(0xFFf59e0b),
                duration: const Duration(seconds: 2),
              ));
            }
          : () => setState(() => _selectedMethod = method),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color:
              selected ? color.withValues(alpha: 0.2) : const Color(0xFF1e293b),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: disabled
                ? Colors.white24
                : selected
                    ? color
                    : Colors.white38,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 16,
                color: disabled
                    ? Colors.white38
                    : selected
                        ? color
                        : Colors.white70),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: disabled
                    ? Colors.white38
                    : selected
                        ? color
                        : Colors.white70,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (disabled) ...[
              const SizedBox(width: 4),
              const Icon(Icons.link_off, size: 12, color: Colors.white38),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Learner Clocking')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('Learner Clocking', style: TextStyle(fontSize: 20)),
                if (_isOfflineMode) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: Colors.orange, width: 1),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.wifi_off, size: 12, color: Colors.orange),
                        SizedBox(width: 4),
                        Text('Offline',
                            style:
                                TextStyle(color: Colors.orange, fontSize: 10)),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            Text('${learners.length} Learners',
                style: const TextStyle(fontSize: 14, color: Color(0xFF0EA5E9))),
          ],
        ),
        actions: [
          // Scanner refresh
          IconButton(
            icon: const Icon(Icons.usb),
            tooltip: 'Detect scanner',
            onPressed: _detectScanner,
          ),
          if (_pendingQueueCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Tooltip(
                message:
                    '$_pendingQueueCount attendance record(s) queued offline — tap to sync',
                child: GestureDetector(
                  onTap: () async {
                    final apiService = context.read<ApiService>();
                    final messenger = ScaffoldMessenger.of(context);
                    final synced = await OfflineAttendanceQueue.instance
                        .trySyncAll(apiService);
                    await _refreshQueueBadge();
                    if (mounted) {
                      messenger.showSnackBar(SnackBar(
                        content: Text(synced > 0
                            ? '✅ Synced $synced record(s)'
                            : '⚠️ Still offline — $_pendingQueueCount record(s) pending'),
                        backgroundColor: synced > 0
                            ? const Color(0xFF10b981)
                            : const Color(0xFFf59e0b),
                      ));
                    }
                  },
                  child: Stack(
                    alignment: Alignment.topRight,
                    children: [
                      const Icon(Icons.cloud_upload_outlined,
                          color: Color(0xFFf59e0b), size: 28),
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                            color: Colors.red, shape: BoxShape.circle),
                        child: Text('$_pendingQueueCount',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      body: learners.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.fingerprint, size: 64, color: Colors.white54),
                  SizedBox(height: 16),
                  Text('No Learners Found',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                  SizedBox(height: 8),
                  Text('No learners enrolled in this class yet',
                      style: TextStyle(fontSize: 14, color: Colors.white70),
                      textAlign: TextAlign.center),
                ],
              ),
            )
          : Column(
              children: [
                // ── Clocking method selector ──────────────────────────────
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Scanner status bar
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: _connectedScanner == ScannerType.none
                              ? const Color(0xFFef4444).withValues(alpha: 0.08)
                              : const Color(0xFF10b981).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: _connectedScanner == ScannerType.none
                                ? const Color(0xFFef4444)
                                : const Color(0xFF10b981),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _connectedScanner == ScannerType.none
                                  ? Icons.usb_off
                                  : Icons.usb,
                              size: 18,
                              color: _connectedScanner == ScannerType.none
                                  ? const Color(0xFFef4444)
                                  : const Color(0xFF10b981),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _connectedScanner == ScannerType.zkteco
                                    ? 'ZKTeco scanner connected'
                                    : _connectedScanner == ScannerType.futronic
                                        ? 'Futronic scanner connected'
                                        : 'No USB scanner connected',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _connectedScanner == ScannerType.none
                                      ? const Color(0xFFef4444)
                                      : const Color(0xFF10b981),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: _detectScanner,
                              child: const Icon(Icons.refresh,
                                  size: 16, color: Colors.white54),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Method selector chips
                      const Text('Clocking Method',
                          style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildMethodChip(
                              method: ClockingMethod.mobileBiometric,
                              label: 'Mobile Biometric',
                              icon: Icons.phone_android,
                              color: const Color(0xFF0EA5E9),
                            ),
                            const SizedBox(width: 8),
                            _buildMethodChip(
                              method: ClockingMethod.futronic,
                              label: 'Futronic',
                              icon: Icons.fingerprint,
                              color: const Color(0xFF10b981),
                              disabled:
                                  _connectedScanner != ScannerType.futronic,
                            ),
                            const SizedBox(width: 8),
                            _buildMethodChip(
                              method: ClockingMethod.zkteco,
                              label: 'ZKTeco',
                              icon: Icons.fingerprint,
                              color: const Color(0xFF8B5CF6),
                              disabled: _connectedScanner != ScannerType.zkteco,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),

                // ── Learner list ──────────────────────────────────────────
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: fetchLearners,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                      itemCount: learners.length,
                      itemBuilder: (context, index) {
                        final learner = learners[index];
                        final firstName =
                            (learner['firstName'] ?? '').toString();
                        final lastName = (learner['lastName'] ?? '').toString();

                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: _methodColor(_selectedMethod),
                              width: 2,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor:
                                      _methodColor(_selectedMethod),
                                  child: Text(
                                    getInitials(firstName, lastName),
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '$firstName $lastName',
                                        style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        'ID: ${learner['idNumber'] ?? 'N/A'}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.white70),
                                      ),
                                    ],
                                  ),
                                ),
                                // Clock button
                                Column(
                                  children: [
                                    IconButton(
                                      onPressed: isScanning
                                          ? null
                                          : () => _scanFingerprint(learner),
                                      icon: Icon(
                                        _selectedMethod ==
                                                ClockingMethod.mobileBiometric
                                            ? Icons.phone_android
                                            : Icons.fingerprint,
                                        size: 36,
                                      ),
                                      color: _methodColor(_selectedMethod),
                                      disabledColor: Colors.grey,
                                      tooltip: 'Clock In/Out',
                                    ),
                                    Text(
                                      _methodShortLabel(_selectedMethod),
                                      style: TextStyle(
                                        fontSize: 9,
                                        color: _methodColor(_selectedMethod),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
