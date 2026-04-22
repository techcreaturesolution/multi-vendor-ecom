import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config.dart';

class ApiClient {
  static final ApiClient instance = ApiClient._();
  final Dio dio;
  final _storage = const FlutterSecureStorage();

  ApiClient._() : dio = Dio(BaseOptions(baseUrl: Config.apiBaseUrl)) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'vendor_access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  Future<void> setTokens(String a, String r) async {
    await _storage.write(key: 'vendor_access_token', value: a);
    await _storage.write(key: 'vendor_refresh_token', value: r);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'vendor_access_token');
    await _storage.delete(key: 'vendor_refresh_token');
  }

  Future<String?> accessToken() => _storage.read(key: 'vendor_access_token');
}
