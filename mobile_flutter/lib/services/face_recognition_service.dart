import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

/// Face recognition service using MobileFaceNet with ArcFace-style processing.
///
/// Key improvements over the original setup:
/// 1. ArcFace preprocessing: normalise pixels to [0, 1] (divide by 255)
///    instead of [-1, 1]. This matches the ArcFace training convention and
///    gives better cross-device consistency.
/// 2. L2 normalisation of output embeddings before storage/comparison so
///    that dot-product == cosine similarity.
/// 3. Cosine similarity distance metric instead of raw Euclidean distance.
///    Cosine similarity is invariant to embedding scale and is the standard
///    metric for ArcFace / InsightFace models.
/// 4. Stricter match threshold: 0.50 cosine similarity (higher = same person).
class FaceRecognitionService {
  late FaceDetector _faceDetector;
  Interpreter? _interpreter;

  Interpreter? get interpreter => _interpreter;

  /// Cosine similarity threshold for a positive match.
  /// Values above this mean "same person".
  /// - 0.50 → balanced (recommended default)
  /// - 0.40 → more permissive (fewer false rejections, more false accepts)
  /// - 0.60 → more strict  (fewer false accepts, more false rejections)
  static const double matchThreshold = 0.50;

  FaceRecognitionService() {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        performanceMode: FaceDetectorMode.accurate,
        enableLandmarks: true,
        enableClassification: true,
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
      debugPrint('FaceRecognitionService: TFLite model loaded');
      debugPrint('  Input:  ${_interpreter!.getInputTensors().first}');
      debugPrint('  Output: ${_interpreter!.getOutputTensors().first}');
    } catch (e) {
      debugPrint('FaceRecognitionService: Error loading model: $e');
    }
  }

  Future<List<Face>> detectFaces(InputImage inputImage) async {
    return await _faceDetector.processImage(inputImage);
  }

  /// Pre-process a face image for TFLite inference.
  ///
  /// ArcFace preprocessing:
  ///   - Resize to 112 × 112
  ///   - Normalise each channel to [0, 1] by dividing by 255
  ///
  /// This replaces the old MobileFaceNet normalization of (pixel − 127.5) / 127.5
  /// which maps to [−1, 1]. The [0, 1] range matches the ArcFace training
  /// convention and typically produces better recognition accuracy.
  Float32List _preProcess(img.Image image) {
    final resized = img.copyResize(image, width: 112, height: 112);

    final input = Float32List(1 * 112 * 112 * 3);
    final buffer = Float32List.view(input.buffer);

    int idx = 0;
    for (var y = 0; y < 112; y++) {
      for (var x = 0; x < 112; x++) {
        final pixel = resized.getPixel(x, y);
        // ArcFace normalization: divide by 255 → [0, 1]
        buffer[idx++] = pixel.r / 255.0;
        buffer[idx++] = pixel.g / 255.0;
        buffer[idx++] = pixel.b / 255.0;
      }
    }
    return input;
  }

  /// L2-normalise an embedding vector so its magnitude = 1.
  ///
  /// After L2 normalisation, cosine similarity == dot product, which is
  /// the standard comparison used by ArcFace / InsightFace.
  List<double> _l2Normalize(List<double> embedding) {
    double norm = 0.0;
    for (final v in embedding) {
      norm += v * v;
    }
    norm = sqrt(norm);
    if (norm < 1e-10) return embedding; // avoid division by zero
    return embedding.map((v) => v / norm).toList();
  }

  /// Run inference and return the L2-normalised 512-d face embedding.
  ///
  /// Returns `null` if the model is not loaded or inference fails.
  Future<List<double>?> getEmbedding(img.Image faceImage) async {
    if (_interpreter == null) {
      debugPrint('FaceRecognitionService: interpreter not loaded');
      return null;
    }

    try {
      final input = _preProcess(faceImage);
      final inputReshaped = input.reshape([1, 112, 112, 3]);

      final outputShape = _interpreter!.getOutputTensors().first.shape;
      final outputSize = outputShape.reduce((a, b) => a * b);
      final output =
          List<double>.filled(outputSize, 0).reshape([1, outputSize]);

      _interpreter!.run(inputReshaped, output);

      // L2-normalise before returning — this is what ArcFace expects
      final raw = List<double>.from(output[0]);
      return _l2Normalize(raw);
    } catch (e) {
      debugPrint('FaceRecognitionService: inference error: $e');
      return null;
    }
  }

  // ── Distance / similarity ─────────────────────────────────────────────────

  /// Cosine similarity between two L2-normalised embeddings.
  ///
  /// Returns a value in [−1, 1]:
  ///   1.0  → identical face
  ///   0.0  → unrelated
  ///  −1.0  → opposite (theoretically impossible for face embeddings)
  ///
  /// For L2-normalised vectors, this equals the dot product.
  double cosineSimilarity(List<double> a, List<double> b) {
    assert(a.length == b.length,
        'Embedding dimension mismatch: ${a.length} vs ${b.length}');
    double dot = 0.0;
    for (int i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }

  /// Returns `true` if two embeddings belong to the same person.
  ///
  /// Uses cosine similarity with [matchThreshold].
  bool isSamePerson(List<double> a, List<double> b) {
    return cosineSimilarity(a, b) >= matchThreshold;
  }

  /// Euclidean distance — kept for backward compatibility with any code
  /// that still uses the old metric. Prefer [cosineSimilarity] for new code.
  @Deprecated(
      'Use cosineSimilarity() instead — it is more accurate for ArcFace embeddings')
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
