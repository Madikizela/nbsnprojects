import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../services/face_recognition_service.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

enum FaceMode { register, verify }

class FaceRecognitionScreen extends StatefulWidget {
  final FaceMode mode;
  final String? learnerId;
  final int? classId;
  final double? latitude;
  final double? longitude;

  const FaceRecognitionScreen({
    super.key,
    required this.mode,
    this.learnerId,
    this.classId,
    this.latitude,
    this.longitude,
  });

  @override
  State<FaceRecognitionScreen> createState() => _FaceRecognitionScreenState();
}

class _FaceRecognitionScreenState extends State<FaceRecognitionScreen> {
  late CameraController _controller;
  late List<CameraDescription> _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  String _status = 'Align your face in the frame';
  final FaceRecognitionService _faceService = FaceRecognitionService();

  // For UI feedback
  Rect? _detectedFaceRect;

  @override
  void initState() {
    super.initState();
    _initCamera();
    _faceService.initialize();
  }

  Future<void> _initCamera() async {
    _cameras = await availableCameras();
    // Use front camera for face recognition
    final frontCamera = _cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => _cameras.first,
    );

    _controller = CameraController(
      frontCamera,
      ResolutionPreset.medium,
      enableAudio: false,
    );

    await _controller.initialize();

    // Start image stream for real-time detection
    _controller.startImageStream(_processCameraImage);

    if (mounted) {
      setState(() {
        _isInitialized = true;
      });
    }
  }

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final inputImage = _convertCameraImage(image);
      final faces = await _faceService.detectFaces(inputImage);

      if (faces.isNotEmpty) {
        setState(() {
          _detectedFaceRect = faces.first.boundingBox;
        });

        // If we found a face and it's centered, we could automatically capture
        // For now, let's wait for user to press button or just show "Face Detected"
        setState(() {
          _status = 'Face detected. Hold still...';
        });
      } else {
        setState(() {
          _detectedFaceRect = null;
          _status = 'No face detected';
        });
      }
    } catch (e) {
      print('Error processing camera image: $e');
    } finally {
      _isProcessing = false;
    }
  }

  Future<bool> _checkLocation() async {
    debugPrint('📍 [DEBUG] _checkLocation called');
    debugPrint('📍 [DEBUG] widget.latitude: ${widget.latitude}');
    debugPrint('📍 [DEBUG] widget.longitude: ${widget.longitude}');

    if (widget.mode == FaceMode.register) return true;

    if (widget.latitude == null || widget.longitude == null) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF1e293b),
            title: const Text(
              'Missing Site Location',
              style: TextStyle(color: Colors.white),
            ),
            content: const Text(
              'This site does not have GPS coordinates set. Please contact your administrator to set the site location.',
              style: TextStyle(color: Colors.white70),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'OK',
                  style: TextStyle(color: Color(0xFF8B5CF6)),
                ),
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
              content: Text('Location permissions are permanently denied'),
            ),
          );
        }
        return false;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      // Calculate distance
      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        widget.latitude!,
        widget.longitude!,
      );

      debugPrint(
        '📍 [LOCATION] Distance: ${distanceInMeters.toStringAsFixed(2)}m',
      );

      if (distanceInMeters > 50) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              backgroundColor: const Color(0xFF1e293b),
              title: const Text(
                'Out of Range',
                style: TextStyle(color: Colors.white),
              ),
              content: Text(
                'You are ${distanceInMeters.toStringAsFixed(0)} meters away from the site. You must be within 50 meters to clock in or out.',
                style: const TextStyle(color: Colors.white70),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'OK',
                    style: TextStyle(color: Color(0xFF8B5CF6)),
                  ),
                ),
              ],
            ),
          );
        }
        return false;
      }

      return true;
    } catch (e) {
      debugPrint('Error checking location: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error checking location: $e')));
      }
      return false;
    }
  }

  // Convert CameraImage to ML Kit InputImage
  InputImage _convertCameraImage(CameraImage image) {
    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    final Size imageSize = Size(
      image.width.toDouble(),
      image.height.toDouble(),
    );
    final InputImageRotation rotation =
        InputImageRotation.rotation270deg; // Front camera usually needs 270
    final InputImageFormat format = InputImageFormat.yuv420;

    final metadata = InputImageMetadata(
      size: imageSize,
      rotation: rotation,
      format: format,
      bytesPerRow: image.planes[0].bytesPerRow,
    );

    return InputImage.fromBytes(bytes: bytes, metadata: metadata);
  }

  Future<void> _captureFace() async {
    if (!_isInitialized || _detectedFaceRect == null) return;

    setState(() {
      _status = 'Capturing face...';
    });

    try {
      final XFile file = await _controller.takePicture();
      final bytes = await File(file.path).readAsBytes();
      img.Image? originalImage = img.decodeImage(bytes);

      if (originalImage == null) return;

      List<double>? embedding;

      // Deterministic mock logic
      if (_faceService.interpreter == null) {
        final seed =
            _detectedFaceRect!.width.toInt() +
            _detectedFaceRect!.height.toInt();
        final random = math.Random(seed);
        embedding = List<double>.generate(192, (index) => random.nextDouble());
      } else {
        embedding = await _faceService.getEmbedding(originalImage);
      }

      if (embedding != null) {
        if (widget.mode == FaceMode.register) {
          _handleRegistration(embedding);
        } else {
          // Check location first for clocking
          final isInRange = await _checkLocation();
          if (!isInRange) {
            setState(() {
              _status = 'Align your face in the frame';
            });
            return;
          }
          _handleVerification(embedding);
        }
      }
    } catch (e) {
      setState(() {
        _status = 'Error: $e';
      });
    }
  }

  void _handleRegistration(List<double> embedding) {
    // In a real app, you'd send this list to your backend
    print('Face Registered for ${widget.learnerId}: $embedding');

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Face Registered Successfully!'),
        backgroundColor: Colors.green,
      ),
    );
    Navigator.pop(context, embedding);
  }

  Future<void> _handleFaceClocking(List<double> embedding) async {
    if (widget.classId == null) {
      setState(() => _status = 'Error: Class context missing');
      return;
    }

    try {
      final apiService = context.read<ApiService>();
      final authService = context.read<AuthService>();
      final rawTeacherId = authService.user?['id'];

      // Safely parse teacherId to int
      final int? teacherId = rawTeacherId is int
          ? rawTeacherId
          : (rawTeacherId != null
                ? int.tryParse(rawTeacherId.toString())
                : null);

      if (teacherId == null) {
        setState(() => _status = 'Error: Teacher session expired');
        return;
      }

      // Get current position for the API call
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 5),
        );
      } catch (e) {
        debugPrint('Warning: Could not get precise location for API: $e');
      }

      final response = await apiService.faceClockToggle(
        classId: widget.classId!,
        teacherId: teacherId,
        embedding: embedding,
        latitude: position?.latitude,
        longitude: position?.longitude,
      );

      if (mounted) {
        final data = response.data;
        // Use toString() to ensure we don't get type mismatch if backend returns int
        final String action = data['action']?.toString() ?? 'Clocked';
        final String name = data['learnerName']?.toString() ?? 'Learner';

        setState(() {
          _status = '$action successful: $name';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$action successful for $name'),
            backgroundColor: action == 'ClockIn' ? Colors.green : Colors.blue,
          ),
        );

        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pop(context, true);
          }
        });
      }
    } catch (e, stackTrace) {
      debugPrint('❌ [FACE CLOCK] Raw Error: $e');
      debugPrint('❌ [FACE CLOCK] StackTrace: $stackTrace');

      String errorMsg = '';

      if (e is DioException) {
        final dynamic responseData = e.response?.data;
        if (responseData != null) {
          if (responseData is Map) {
            errorMsg =
                responseData['message']?.toString() ??
                'Server error (${e.response?.statusCode})';
          } else {
            errorMsg = responseData.toString();
          }
        } else {
          errorMsg =
              e.message ?? e.error?.toString() ?? 'Network connection failed';
        }
      } else {
        errorMsg = e.toString();
      }

      // Final safety check to ensure we don't show "Error:" with no text
      if (errorMsg.trim().isEmpty || errorMsg == 'null') {
        errorMsg = 'Unknown error during verification';
      }

      if (mounted) {
        setState(() {
          _status =
              'Error: ${errorMsg.length > 60 ? '${errorMsg.substring(0, 57)}...' : errorMsg}';
        });
      }
    }
  }

  void _handleVerification(List<double> embedding) {
    _handleFaceClocking(embedding);
  }

  @override
  void dispose() {
    _controller.dispose();
    _faceService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(
          widget.mode == FaceMode.register
              ? 'Register Face'
              : 'Verify Identity',
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
        children: [
          // Camera Preview
          Center(
            child: AspectRatio(
              aspectRatio: 1 / _controller.value.aspectRatio,
              child: CameraPreview(_controller),
            ),
          ),

          // Face Frame Overlay
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: _detectedFaceRect != null
                      ? Colors.green
                      : Colors.white,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(125),
              ),
            ),
          ),

          // UI Feedback
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Text(
                  _status,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 30),
                FloatingActionButton.large(
                  onPressed: _detectedFaceRect != null ? _captureFace : null,
                  backgroundColor: _detectedFaceRect != null
                      ? Colors.blue
                      : Colors.grey,
                  child: Icon(
                    widget.mode == FaceMode.register
                        ? Icons.person_add
                        : Icons.face,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
