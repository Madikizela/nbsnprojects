import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.107.166:5213';
  late final Dio _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          // Only set application/json if not sending FormData
          if (options.data is! FormData &&
              options.headers['Content-Type'] == null) {
            options.headers['Content-Type'] = 'application/json';
          }

          return handler.next(options);
        },
      ),
    );
  }

  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Please try again.';
        case DioExceptionType.badResponse:
          if (error.response?.statusCode == 401) {
            return 'Unauthorized access. Please login again.';
          }
          if (error.response?.data != null && error.response?.data is Map) {
            return error.response?.data['message'] ??
                'Server error: ${error.response?.statusCode}';
          }
          return 'Server error: ${error.response?.statusCode}';
        case DioExceptionType.cancel:
          return 'Request cancelled.';
        case DioExceptionType.connectionError:
          return 'No internet connection or server unreachable.';
        default:
          return 'Network error occurred. Please try again.';
      }
    }
    return 'An unexpected error occurred.';
  }

  Future<Response> get(String path) => _dio.get(path);
  Future<Response> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);
  Future<Response> put(String path, {dynamic data}) =>
      _dio.put(path, data: data);
  Future<Response> delete(String path) => _dio.delete(path);

  Future<Response> uploadDocument({
    required int learnerId,
    required String documentType,
    required String filePath,
  }) async {
    final formData = FormData.fromMap({
      'LearnerId': learnerId,
      'DocumentType': documentType,
      'File': await MultipartFile.fromFile(filePath),
    });

    return _dio.post('/api/LearnerDocuments/upload', data: formData);
  }

  Future<Response> uploadProfilePhoto({
    required int learnerId,
    required String filePath,
  }) async {
    final formData = FormData.fromMap({
      'photo': await MultipartFile.fromFile(filePath),
    });

    return _dio.post('/api/Learners/$learnerId/profile-photo', data: formData);
  }

  Future<Response> uploadSignature({
    required int learnerId,
    required String filePath,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: 'signature.png'),
    });

    return _dio.post('/api/Learners/$learnerId/signature', data: formData);
  }

  Future<Response> uploadFaceEmbedding({
    required int learnerId,
    required List<double> embedding,
  }) async {
    return _dio.post(
      '/api/Learners/$learnerId/face-embedding',
      data: {'embedding': embedding},
    );
  }

  Future<Response> faceClockToggle({
    required int classId,
    required int teacherId,
    required List<double> embedding,
    double? latitude,
    double? longitude,
  }) async {
    return _dio.post(
      '/api/Attendance/face-clock-toggle',
      data: {
        'classId': classId,
        'teacherId': teacherId,
        'embedding': embedding,
        'latitude': latitude,
        'longitude': longitude,
      },
    );
  }
}
