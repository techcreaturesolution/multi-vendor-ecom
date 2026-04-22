import 'package:flutter/foundation.dart';
import '../api/api_client.dart';

class AuthUser {
  final String id;
  final String name;
  final String email;
  final String role;
  AuthUser({required this.id, required this.name, required this.email, required this.role});
  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: j['id'] ?? j['_id'],
        name: j['name'],
        email: j['email'],
        role: j['role'],
      );
}

class AuthState extends ChangeNotifier {
  AuthUser? user;
  bool loading = false;

  Future<void> init() async {
    final token = await ApiClient.instance.accessToken();
    if (token != null) {
      try {
        final r = await ApiClient.instance.dio.get('/api/auth/me');
        user = AuthUser.fromJson(r.data['user']);
        notifyListeners();
      } catch (_) {
        await ApiClient.instance.clearTokens();
      }
    }
  }

  Future<void> login(String email, String password) async {
    loading = true;
    notifyListeners();
    try {
      final r = await ApiClient.instance.dio.post(
        '/api/auth/login',
        data: {'email': email, 'password': password},
      );
      if (r.data['user']['role'] != 'vendor') {
        throw Exception('This app is for vendors only');
      }
      await ApiClient.instance.setTokens(r.data['accessToken'], r.data['refreshToken']);
      user = AuthUser.fromJson(r.data['user']);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await ApiClient.instance.clearTokens();
    user = null;
    notifyListeners();
  }
}
