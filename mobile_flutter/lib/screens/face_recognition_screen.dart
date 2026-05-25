import 'dart:io';
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
  int _selectedCameraIndex = 1; // Default to front camera
  String _status = 'Align your face in the frame';
  final FaceRecognitionService _faceService = FaceRecognitionService();

  Rect? _detectedFaceRect;
  bool _isLivenessChecked = false;
  bool _hasTurnedLeft = false;
  bool _hasTurnedRight = false;
  bool _hasSmiled = false;
  bool _isPositionCorrect = false;
  double _enrollmentProgress = 0.0;
  String _livenessStep =
      'centering'; // centering, turnLeft, turnRight, smiling, verified
  DateTime? _lastCaptureAttempt;

  Future<bool> _checkLocation() async {
    debugPrint('📍 [DEBUG] _checkLocation called');
    debugPrint('📍 [DEBUG] widget.latitude: ${widget.latitude}');
    debugPrint('📍 [DEBUG] widget.longitude: ${widget.longitude}');

    if (widget.mode == FaceMode.register) {
      return true; // No location check for registration
    }

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
        desiredAccuracy: LocationAccuracy.best,
        timeLimit: const Duration(seconds: 15),
      );

      // Calculate distance
      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        widget.latitude!,
        widget.longitude!,
      );

      print(
          '📍 [LOCATION] Current: ${position.latitude}, ${position.longitude}');
      print('📍 [LOCATION] Site: ${widget.latitude}, ${widget.longitude}');
      print('📍 [LOCATION] Distance: ${distanceInMeters.toStringAsFixed(2)}m');

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

  @override
  void initState() {
    super.initState();
    _initCamera();
    _faceService.initialize();
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) return;

      // Ensure index is within bounds
      if (_selectedCameraIndex >= _cameras.length) {
        _selectedCameraIndex = 0;
      }

      _controller = CameraController(
        _cameras[_selectedCameraIndex],
        ResolutionPreset.high, // Higher resolution for better detection
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.yuv420
            : ImageFormatGroup.bgra8888,
      );

      await _controller.initialize();
      _controller.startImageStream(_processCameraImage);

      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Camera init error: $e');
    }
  }

  Future<void> _toggleCamera() async {
    setState(() {
      _isInitialized = false;
      _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    });
    await _controller.dispose();
    await _initCamera();
  }

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing || _isLivenessChecked) return;
    _isProcessing = true;

    try {
      final inputImage = _convertCameraImage(image);
      if (inputImage == null) return;

      final faces = await _faceService.detectFaces(inputImage);

      if (faces.isNotEmpty) {
        final face = faces.first;
        final bool isCentered = _isFaceCentered(face, image);
        final guidance = _getCenteringGuidance(face, image);

        setState(() {
          _detectedFaceRect = face.boundingBox;
          _isPositionCorrect = guidance == 'Perfect! Hold still...';

          if (_livenessStep == 'centering') {
            _enrollmentProgress = 0.1;
            if (_isPositionCorrect) {
              _livenessStep = 'turnLeft';
              _status = 'Step 1: Turn your head slightly Left';
            } else {
              _status = guidance;
            }
          } else if (_livenessStep == 'turnLeft') {
            _enrollmentProgress = 0.3;
            if (face.headEulerAngleY != null) {
              // Y angle: positive is right, negative is left (or vice versa depending on camera)
              // For front camera, usually negative is left
              if (face.headEulerAngleY! < -15) {
                _hasTurnedLeft = true;
                _livenessStep = 'turnRight';
                _status = 'Step 2: Now turn slightly Right';
              }
            }
            if (!isCentered) {
              _livenessStep = 'centering';
              _hasTurnedLeft = false;
            }
          } else if (_livenessStep == 'turnRight') {
            _enrollmentProgress = 0.6;
            if (face.headEulerAngleY != null) {
              if (face.headEulerAngleY! > 15) {
                _hasTurnedRight = true;
                _livenessStep = 'smiling';
                _status = 'Step 3: Great! Now give us a big smile!';
              }
            }
            if (!isCentered) {
              _livenessStep = 'centering';
              _hasTurnedLeft = false;
              _hasTurnedRight = false;
            }
          } else if (_livenessStep == 'smiling') {
            _enrollmentProgress = 0.8;
            if (face.smilingProbability != null) {
              if (face.smilingProbability! > 0.7) {
                _hasSmiled = true;
                _enrollmentProgress = 1.0;
                _livenessStep = 'verified';
                _isLivenessChecked = true;
                _status = 'Success! Enrollment complete';
              }
            }
            if (!isCentered) {
              _livenessStep = 'centering';
              _hasTurnedLeft = false;
              _hasTurnedRight = false;
              _hasSmiled = false;
            }
          }
        });

        // Auto Capture if verified
        if (_isLivenessChecked) {
          if (_lastCaptureAttempt == null ||
              DateTime.now().difference(_lastCaptureAttempt!).inSeconds > 3) {
            _lastCaptureAttempt = DateTime.now();
            Future.delayed(const Duration(milliseconds: 500), _captureFace);
          }
        }
      } else {
        setState(() {
          _detectedFaceRect = null;
          _status = 'No face detected. Look at the camera';
          _livenessStep = 'centering';
          _isPositionCorrect = false;
          _enrollmentProgress = 0.0;
          _hasTurnedLeft = false;
          _hasTurnedRight = false;
          _hasSmiled = false;
        });
      }
    } catch (e) {
      print('Face processing error: $e');
    } finally {
      _isProcessing = false;
    }
  }

  String _getCenteringGuidance(Face face, CameraImage image) {
    final centerX = face.boundingBox.center.dx;
    final centerY = face.boundingBox.center.dy;
    final faceWidth = face.boundingBox.width;

    // Preview size in ML Kit coordinates (after rotation)
    final imgWidth = image.height; // Swapped
    final imgHeight = image.width;

    // 1. Check Distance (Size of face)
    // For a typical mobile preview, the face should be between 40% and 70% of the width
    final double faceSizeRatio = faceWidth / imgWidth;
    if (faceSizeRatio < 0.35) return 'Move closer to the camera';
    if (faceSizeRatio > 0.8) return 'Move a bit back';

    // 2. Check Horizontal Alignment (X axis)
    final double targetX = imgWidth / 2;
    final double xDiff = centerX - targetX;
    final double xThreshold = imgWidth * 0.15; // 15% tolerance

    if (xDiff > xThreshold) return 'Move slightly Left';
    if (xDiff < -xThreshold) return 'Move slightly Right';

    // 3. Check Vertical Alignment (Y axis)
    final double targetY = imgHeight / 2;
    final double yDiff = centerY - targetY;
    final double yThreshold = imgHeight * 0.15;

    if (yDiff > yThreshold) return 'Move slightly Down';
    if (yDiff < -yThreshold) return 'Move slightly Up';

    return 'Perfect! Hold still...';
  }

  bool _isFaceCentered(Face face, CameraImage image) {
    final centerX = face.boundingBox.center.dx;
    final centerY = face.boundingBox.center.dy;

    // Preview size in ML Kit coordinates (after rotation)
    // We want the face to be within the center 50% of the screen
    final imgWidth = image.height; // Swapped
    final imgHeight = image.width;

    final bool withinX =
        centerX > (imgWidth * 0.2) && centerX < (imgWidth * 0.8);
    final bool withinY =
        centerY > (imgHeight * 0.2) && centerY < (imgHeight * 0.8);

    return withinX && withinY;
  }

  InputImage? _convertCameraImage(CameraImage image) {
    try {
      final camera = _cameras[_selectedCameraIndex];
      final sensorOrientation = camera.sensorOrientation;
      InputImageRotation rotation = InputImageRotation.rotation0deg;

      if (Platform.isAndroid) {
        switch (sensorOrientation) {
          case 90:
            rotation = InputImageRotation.rotation90deg;
            break;
          case 180:
            rotation = InputImageRotation.rotation180deg;
            break;
          case 270:
            rotation = InputImageRotation.rotation270deg;
            break;
        }
      }

      // On Android, the most reliable way to pass YUV data to ML Kit is as NV21.
      // We manually interleave the U and V planes into the NV21 format.
      final Uint8List bytes;
      final InputImageFormat format;

      if (Platform.isAndroid) {
        // NV21 = Y plane + interleaved V and U planes
        final int width = image.width;
        final int height = image.height;
        final int uvRowStride = image.planes[1].bytesPerRow;
        final int uvPixelStride = image.planes[1].bytesPerPixel!;

        final yPlane = image.planes[0].bytes;
        final uPlane = image.planes[1].bytes;
        final vPlane = image.planes[2].bytes;

        final nv21 = Uint8List(width * height + (width * height / 2).toInt());

        // Copy Y plane
        nv21.setRange(0, yPlane.length, yPlane);

        // Interleave V and U
        int idy = yPlane.length;
        for (int row = 0; row < height / 2; row++) {
          for (int col = 0; col < width / 2; col++) {
            final int uvIndex = row * uvRowStride + col * uvPixelStride;
            nv21[idy++] = vPlane[uvIndex];
            nv21[idy++] = uPlane[uvIndex];
          }
        }
        bytes = nv21;
        format = InputImageFormat.nv21;
      } else {
        // iOS or other
        final WriteBuffer allBytes = WriteBuffer();
        for (final Plane plane in image.planes) {
          allBytes.putUint8List(plane.bytes);
        }
        bytes = allBytes.done().buffer.asUint8List();
        format = InputImageFormat.bgra8888; // iOS typically uses BGRA
      }

      return InputImage.fromBytes(
        bytes: bytes,
        metadata: InputImageMetadata(
          size: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: rotation,
          format: format,
          bytesPerRow: image.width, // For NV21/YUV, this is usually the width
        ),
      );
    } catch (e) {
      debugPrint('Error converting image: $e');
      return null;
    }
  }

  Future<void> _captureFace() async {
    if (!_isInitialized || !_isLivenessChecked) return;

    setState(() {
      _status = 'Success! Processing...';
    });

    try {
      final XFile file = await _controller.takePicture();
      final bytes = await File(file.path).readAsBytes();
      img.Image? originalImage = img.decodeImage(bytes);

      if (originalImage == null) {
        _resetLiveness();
        return;
      }

      List<double>? embedding = await _faceService.getEmbedding(originalImage);

      if (embedding != null) {
        if (widget.mode == FaceMode.register) {
          Navigator.pop(context, embedding);
        } else {
          // Verify mode - Clocking
          // Check location first
          final isInRange = await _checkLocation();
          if (!isInRange) {
            _resetLiveness();
            return;
          }

          await _handleFaceClocking(embedding);
        }
      } else {
        setState(() {
          _status = 'Error: Embedding failed';
        });
        _resetLiveness();
      }
    } catch (e, stackTrace) {
      debugPrint('❌ [CAPTURE] Error: $e');
      debugPrint('❌ [CAPTURE] StackTrace: $stackTrace');

      String errorMsg = e.toString();
      if (errorMsg.isEmpty || errorMsg == 'null') {
        errorMsg = 'Failed to capture or process face';
      }

      setState(() {
        _status = 'Error: $errorMsg';
      });
      _resetLiveness();
    }
  }

  Future<void> _handleFaceClocking(List<double> embedding) async {
    if (widget.classId == null) {
      setState(() => _status = 'Error: Class context missing');
      _resetLiveness();
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
        _resetLiveness();
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
            Navigator.pop(context);
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
            errorMsg = responseData['message']?.toString() ??
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
              'Error: ${errorMsg.length > 100 ? '${errorMsg.substring(0, 97)}...' : errorMsg}';
        });
        _resetLiveness();
      }
    }
  }

  void _resetLiveness() {
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isLivenessChecked = false;
          _hasTurnedLeft = false;
          _hasTurnedRight = false;
          _hasSmiled = false;
          _isPositionCorrect = false;
          _enrollmentProgress = 0.0;
          _livenessStep = 'centering';
          _status = 'Align your face in the frame';
        });
      }
    });
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
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: Colors.blue),
              const SizedBox(height: 16),
              const Text('Initializing Camera...',
                  style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
      );
    }

    final size = MediaQuery.of(context).size;
    final scale = 1 / (_controller.value.aspectRatio * size.aspectRatio);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Full Screen Camera Preview
          Transform.scale(
            scale: scale,
            alignment: Alignment.center,
            child: Center(
              child: CameraPreview(_controller),
            ),
          ),

          // 2. Modern Dark Overlay with cutout
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withOpacity(0.7),
              BlendMode.srcOut,
            ),
            child: Stack(
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    backgroundBlendMode: BlendMode.dstOut,
                  ),
                ),
                Center(
                  child: Container(
                    width: size.width * 0.7,
                    height: size.width * 0.7,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(size.width * 0.35),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 3. Animated Scanning Border with Progress
          Center(
            child: SizedBox(
              width: size.width * 0.74,
              height: size.width * 0.74,
              child: CustomPaint(
                painter: EnrollmentProgressPainter(
                  progress: _enrollmentProgress,
                  isPositionCorrect: _isPositionCorrect,
                  isVerified: _isLivenessChecked,
                ),
              ),
            ),
          ),

          // 4. Header UI
          Positioned(
            top: 40,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
                Text(
                  widget.mode == FaceMode.register
                      ? 'FACE ENROLLMENT'
                      : 'FACE VERIFICATION',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                  onPressed: _toggleCamera,
                ),
              ],
            ),
          ),

          // 5. Bottom Status and Controls
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _status.startsWith('Error')
                            ? Icons.error
                            : (_isLivenessChecked
                                ? Icons.check_circle
                                : (_isPositionCorrect
                                    ? Icons.check_circle_outline
                                    : Icons.info_outline)),
                        color: _status.startsWith('Error')
                            ? Colors.red
                            : (_isLivenessChecked
                                ? Colors.green
                                : (_isPositionCorrect
                                    ? Colors.green
                                    : Colors.blue)),
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Text(
                          _status,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 2,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
                GestureDetector(
                  onTap: (_detectedFaceRect != null && _isLivenessChecked)
                      ? _captureFace
                      : null,
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: (_detectedFaceRect != null && _isLivenessChecked)
                          ? Colors.blue
                          : Colors.white.withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: (_detectedFaceRect != null && _isLivenessChecked)
                            ? Colors.white
                            : Colors.white24,
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      widget.mode == FaceMode.register
                          ? Icons.add_a_photo
                          : Icons.verified_user,
                      color: Colors.white,
                      size: 40,
                    ),
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

class EnrollmentProgressPainter extends CustomPainter {
  final double progress;
  final bool isPositionCorrect;
  final bool isVerified;

  EnrollmentProgressPainter({
    required this.progress,
    required this.isPositionCorrect,
    required this.isVerified,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final strokeWidth = 8.0;

    // 1. Draw Background Ring (Very faint)
    final bgPaint = Paint()
      ..color = Colors.white10
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, bgPaint);

    // 2. Draw Progress Ring
    final progressPaint = Paint()
      ..color = isVerified
          ? Colors.green
          : (isPositionCorrect ? Colors.green : Colors.red)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -1.5708, // Start at top (-90 degrees)
      6.28318 * progress, // Full circle is 2*PI
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant EnrollmentProgressPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.isPositionCorrect != isPositionCorrect ||
        oldDelegate.isVerified != isVerified;
  }
}
