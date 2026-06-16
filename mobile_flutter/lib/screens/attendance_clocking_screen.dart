import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:math' as math;
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/fingerprint_service.dart';
import '../services/offline_attendance_queue.dart';

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
  List<dynamic> learners = [];
  bool isLoading = true;
  bool isScanning = false;
  int _pendingQueueCount = 0;

  @override
  void initState() {
    super.initState();
    debugPrint('📍 [DEBUG] AttendanceClockingScreen initialized');
    debugPrint('📍 [DEBUG] Latitude from widget: ${widget.latitude}');
    debugPrint('📍 [DEBUG] Longitude from widget: ${widget.longitude}');
    _initQueue();
    fetchLearners();
  }

  Future<void> _initQueue() async {
    final queue = OfflineAttendanceQueue.instance;
    await queue.init();
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
      final apiService = context.read<ApiService>();
      final response =
          await apiService.get('/api/Learners/class/${widget.classId}');

      setState(() {
        learners = response.data ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load learners: $e')),
        );
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
        desiredAccuracy:
            LocationAccuracy.best, // Changed to best for more accuracy
        timeLimit: const Duration(seconds: 15), // Added timeout
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
      debugPrint('📍 [LOCATION] Distance: ${distanceInMeters.toStringAsFixed(2)}m');

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

    setState(() => isScanning = true);

    try {
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
                    border:
                        Border.all(color: const Color(0xFF8B5CF6), width: 3),
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
                            color: const Color(0xFF8B5CF6).withOpacity(0.5),
                            width: 2,
                          ),
                        ),
                        child: const CircularProgressIndicator(
                          color: Color(0xFF8B5CF6),
                          strokeWidth: 2,
                        ),
                      ),
                      // Fingerprint icon
                      const Icon(
                        Icons.fingerprint,
                        size: 60,
                        color: Color(0xFF8B5CF6),
                      ),
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

      // Call native method to capture fingerprint
      final result = await _fingerprintService.captureFingerprint();

      // Close scanning dialog
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

      // Process attendance with real fingerprint
      await _processAttendance(learner, result);
    } on PlatformException catch (e) {
      setState(() => isScanning = false);
      if (mounted) {
        Navigator.pop(context); // Close any open dialogs

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
                      style: TextStyle(color: Color(0xFF8B5CF6), fontSize: 16)),
                ),
              ],
            );
          },
        );
      }
    } catch (e) {
      setState(() => isScanning = false);
      if (mounted) {
        Navigator.pop(context); // Close any open dialogs
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
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

      final requestData = {
        'ClassId': widget.classId,
        'TeacherId': teacherId,
        'FingerprintTemplate': fingerprintTemplate,
      };

      // Debug logging
      debugPrint('🟢 === Smart Clock Toggle Request ===');
      debugPrint(
          '🟢 ClassId: ${widget.classId} (type: ${widget.classId.runtimeType})');
      debugPrint('🟢 TeacherId: $teacherId (type: ${teacherId.runtimeType})');
      debugPrint('🟢 FingerprintTemplate length: ${fingerprintTemplate.length}');
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
            const Text('Learner Clocking', style: TextStyle(fontSize: 20)),
            Text('${learners.length} Learners',
                style: const TextStyle(fontSize: 14, color: Color(0xFF0EA5E9))),
          ],
        ),
        actions: [
          if (_pendingQueueCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Tooltip(
                message:
                    '$_pendingQueueCount attendance record(s) queued offline — tap to sync',
                child: GestureDetector(
                  onTap: () async {
                    final apiService = context.read<ApiService>();
                    final synced = await OfflineAttendanceQueue.instance
                        .trySyncAll(apiService);
                    await _refreshQueueBadge();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
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
          : RefreshIndicator(
              onRefresh: fetchLearners,
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: learners.length,
                itemBuilder: (context, index) {
                  final learner = learners[index];
                  final firstName = (learner['firstName'] ?? '').toString();
                  final lastName = (learner['lastName'] ?? '').toString();

                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side:
                          const BorderSide(color: Color(0xFF8B5CF6), width: 2),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 25,
                            backgroundColor: const Color(0xFF8B5CF6),
                            child: Text(
                              getInitials(firstName, lastName),
                              style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$firstName $lastName',
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'ID: ${learner['idNumber'] ?? 'N/A'}',
                                  style: const TextStyle(
                                      fontSize: 12, color: Colors.white70),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: isScanning
                                ? null
                                : () => _scanFingerprint(learner),
                            icon: const Icon(Icons.fingerprint, size: 40),
                            color: const Color(0xFF8B5CF6),
                            disabledColor: Colors.grey,
                            tooltip: 'Scan Fingerprint',
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
