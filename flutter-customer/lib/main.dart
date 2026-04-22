import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'src/state/auth_state.dart';
import 'src/screens/catalog_screen.dart';
import 'src/screens/product_screen.dart';
import 'src/screens/cart_screen.dart';
import 'src/screens/login_screen.dart';
import 'src/screens/signup_screen.dart';
import 'src/screens/orders_screen.dart';
import 'src/screens/checkout_screen.dart';

void main() {
  runApp(const MveCustomerApp());
}

class MveCustomerApp extends StatelessWidget {
  const MveCustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthState()..init(),
      child: Builder(
        builder: (context) {
          final router = GoRouter(
            routes: [
              GoRoute(path: '/', builder: (_, __) => const CatalogScreen()),
              GoRoute(path: '/p/:slug', builder: (_, s) => ProductScreen(slug: s.pathParameters['slug']!)),
              GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
              GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
              GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
              GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
              GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
            ],
          );
          return MaterialApp.router(
            title: 'MVE Shop',
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
