import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

class FaceRecognitionService {
  late FaceDetector _faceDetector;
  Interpreter? _interpreter;

  Interpreter? get interpreter => _interpreter;

  FaceRecognitionService() {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        performanceMode: FaceDetectorMode.accurate,
        enableLandmarks: true,
        enableClassification: true, // Required for blink/smile detection
      ),
    );
  }

  Future<void> initialize() async {
    try {
      final options = InterpreterOptions();
      if (Platform.isAndroid) {
        options.addDelegate(XNNPackDelegate());
      }
      _interpreter = await Interpreter.fromAsset(
        'assets/models/mobilefacenet.tflite',
        options: options,
      );
      print('FaceRecognitionService: TFLite model loaded successfully');
      print('Input tensors: ${_interpreter!.getInputTensors()}');
      print('Output tensors: ${_interpreter!.getOutputTensors()}');
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

    // Convert to Float32List and normalize (-1 to 1)
    var input = Float32List(1 * 112 * 112 * 3);
    var buffer = Float32List.view(input.buffer);

    int pixelIndex = 0;
    for (var y = 0; y < 112; y++) {
      for (var x = 0; x < 112; x++) {
        final pixel = resized.getPixel(x, y);
        // In image 4.x, pixel values are usually 0-255 for standard images
        // Normalize to [-1, 1]
        buffer[pixelIndex++] = (pixel.r - 127.5) / 127.5;
        buffer[pixelIndex++] = (pixel.g - 127.5) / 127.5;
        buffer[pixelIndex++] = (pixel.b - 127.5) / 127.5;
      }
    }
    return input;
  }

  Future<List<double>?> getEmbedding(img.Image faceImage) async {
    if (_interpreter == null) {
      print(
          'FaceRecognitionService: Cannot get embedding - interpreter is null');
      return null;
    }

    try {
      var input = _preProcess(faceImage);
      // Reshape to [1, 112, 112, 3] which is the standard input for this model
      var inputReshaped = input.reshape([1, 112, 112, 3]);

      // Most MobileFaceNet models output 192, but some are 128.
      // We dynamically check the output tensor size.
      final outputShape = _interpreter!.getOutputTensors().first.shape;
      final outputSize = outputShape.reduce((a, b) => a * b);

      var output = List<double>.filled(outputSize, 0).reshape([1, outputSize]);

      _interpreter!.run(inputReshaped, output);
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
