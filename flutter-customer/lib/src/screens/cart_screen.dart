import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../state/auth_state.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  Map<String, dynamic>? cart;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await ApiClient.instance.dio.get('/api/customer/cart');
      setState(() => cart = r.data['data']);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    if (auth.user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cart')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Sign in to view your cart'),
              const SizedBox(height: 12),
              FilledButton(onPressed: () => context.go('/login'), child: const Text('Sign in')),
            ],
          ),
        ),
      );
    }
    if (cart == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final items = cart!['items'] as List;
    final subtotal = items.fold<num>(
      0,
      (s, i) => s + (i['productId']?['price'] ?? 0) * (i['quantity'] as num),
    );
    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: items.isEmpty
          ? const Center(child: Text('Cart is empty'))
          : ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final it = items[i];
                final p = it['productId'];
                return ListTile(
                  title: Text(p['name']),
                  subtitle: Text('₹${p['price']} x ${it['quantity']}'),
                  trailing: Text('₹${(p['price'] * it['quantity']).toString()}'),
                );
              },
            ),
      bottomNavigationBar: items.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Subtotal'),
                          Text('₹$subtotal', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    FilledButton(
                      onPressed: () => context.go('/checkout'),
                      child: const Text('Checkout'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
