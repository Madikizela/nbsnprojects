import 'dart:math';
import 'dart:typed_data';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

class FaceRecognitionService {
  late FaceDetector _faceDetector;
  Interpreter? _interpreter;

  FaceRecognitionService() {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        performanceMode: FaceDetectorMode.accurate,
        enableLandmarks: true,
      ),
    );
  }

  Future<void> initialize() async {
    try {
      _interpreter = await Interpreter.fromAsset('assets/models/mobile_facenet.tflite');
      print('FaceRecognitionService: TFLite model loaded successfully');
    } catch (e) {
      print('FaceRecognitionService: Error loading TFLite model: $e');
    }
  }

  Future<List<Face>> detectFaces(InputImage inputImage) async {
    return await _faceDetector.processImage(inputImage);
  }

  // Pre-process the face image for TFLite
  Float32List _preProcess(img.Image image) {
    // FaceNet models usually expect 112x112 or 160x160
    img.Image resized = img.copyResize(image, width: 112, height: 112);
    
    // Convert to Float32List and normalize (0-1 or -1 to 1 depending on model)
    var input = Float32List(1 * 112 * 112 * 3);
    var buffer = Float32List.view(input.buffer);
    
    int pixelIndex = 0;
    for (int y = 0; y < 112; y++) {
      for (int x = 0; x < 112; x++) {
        var pixel = resized.getPixel(x, y);
        // Normalize to [-1, 1]
        buffer[pixelIndex++] = (img.getRed(pixel) - 127.5) / 127.5;
        buffer[pixelIndex++] = (img.getGreen(pixel) - 127.5) / 127.5;
        buffer[pixelIndex++] = (img.getBlue(pixel) - 127.5) / 127.5;
      }
    }
    return input;
  }

  Future<List<double>?> getEmbedding(img.Image faceImage) async {
    if (_interpreter == null) return null;

    var input = _preProcess(faceImage);
    var output = List<double>.filled(192, 0).reshape([1, 192]); // FaceNet output is usually 128, 192, or 512

    try {
      _interpreter!.run(input, output);
      return List<double>.from(output[0]);
    } catch (e) {
      print('FaceRecognitionService: Inference error: $e');
      return null;
    }
  }

  // Calculate Euclidean Distance between two embeddings
  double compare(List<double> embedding1, List<double> embedding2) {
    double sum = 0;
    for (int i = 0; i < embedding1.length; i++) {
      sum += pow(embedding1[i] - embedding2[i], 2);
    }
    return sqrt(sum);
  }

  void dispose() {
    _faceDetector.close();
    _interpreter?.close();
  }
}
