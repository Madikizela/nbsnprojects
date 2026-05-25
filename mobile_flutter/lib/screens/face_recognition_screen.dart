import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import '../services/face_recognition_service.dart';

enum FaceMode { register, verify }

class FaceRecognitionScreen extends StatefulWidget {
  final FaceMode mode;
  final String? learnerId;

  const FaceRecognitionScreen({
    super.key, 
    required this.mode, 
    this.learnerId,
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
  
  Rect? _detectedFaceRect;

  @override
  void initState() {
    super.initState();
    _initCamera();
    _faceService.initialize();
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
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

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final inputImage = _convertCameraImage(image);
      final faces = await _faceService.detectFaces(inputImage);

      if (faces.isNotEmpty) {
        setState(() {
          _detectedFaceRect = faces.first.boundingBox;
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

  InputImage _convertCameraImage(CameraImage image) {
    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    final Size imageSize = Size(image.width.toDouble(), image.height.toDouble());
    final InputImageRotation rotation = InputImageRotation.rotation270deg; 
    final InputImageFormat format = InputImageFormat.yuv420;

    final planeData = image.planes.map(
      (Plane plane) {
        return InputImagePlaneMetadata(
          bytesPerRow: plane.bytesPerRow,
          height: plane.height,
          width: plane.width,
        );
      },
    ).toList();

    final inputImageData = InputImageData(
      size: imageSize,
      imageRotation: rotation,
      inputImageFormat: format,
      planeData: planeData,
    );

    return InputImage.fromBytes(bytes: bytes, inputImageData: inputImageData);
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

      final embedding = await _faceService.getEmbedding(originalImage);
      
      if (embedding != null) {
        Navigator.pop(context, embedding);
      } else {
        setState(() {
          _status = 'Could not generate embedding';
        });
      }
    } catch (e) {
      setState(() {
        _status = 'Error: $e';
      });
    }
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
        title: Text(widget.mode == FaceMode.register ? 'Register Face' : 'Verify Identity'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
        children: [
          Center(
            child: AspectRatio(
              aspectRatio: 1 / _controller.value.aspectRatio,
              child: CameraPreview(_controller),
            ),
          ),
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: _detectedFaceRect != null ? Colors.green : Colors.white,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(125),
              ),
            ),
          ),
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Text(
                  _status,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 30),
                FloatingActionButton.large(
                  onPressed: _detectedFaceRect != null ? _captureFace : null,
                  backgroundColor: _detectedFaceRect != null ? Colors.blue : Colors.grey,
                  child: Icon(
                    widget.mode == FaceMode.register ? Icons.person_add : Icons.face,
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
