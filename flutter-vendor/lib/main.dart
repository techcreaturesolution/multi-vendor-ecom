import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'src/state/auth_state.dart';
import 'src/screens/login_screen.dart';
import 'src/screens/dashboard_screen.dart';
import 'src/screens/products_screen.dart';
import 'src/screens/orders_screen.dart';
import 'src/screens/earnings_screen.dart';

void main() {
  runApp(const MveVendorApp());
}

class MveVendorApp extends StatelessWidget {
  const MveVendorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthState()..init(),
      child: Builder(
        builder: (context) {
          final auth = context.watch<AuthState>();
          final router = GoRouter(
            redirect: (_, state) {
              final loggedIn = auth.user != null;
              if (!loggedIn && state.matchedLocation != '/login') return '/login';
              if (loggedIn && state.matchedLocation == '/login') return '/';
              return null;
            },
            routes: [
              GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
              GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
              GoRoute(path: '/products', builder: (_, __) => const ProductsScreen()),
              GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
              GoRoute(path: '/earnings', builder: (_, __) => const EarningsScreen()),
            ],
          );
          return MaterialApp.router(
            title: 'MVE Vendor',
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
              useMaterial3: true,
            ),
            routerConfig: router,
          );
        },
      ),
    );
  }
}
