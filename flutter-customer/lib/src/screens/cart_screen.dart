import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../state/auth_state.dart';
import '../util/image_url.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  Map<String, dynamic>? cart;
  bool mutating = false;

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

  Future<void> _updateQty(String productId, int qty) async {
    setState(() => mutating = true);
    try {
      await ApiClient.instance.dio.patch(
        '/api/customer/cart/items/$productId',
        data: {'quantity': qty},
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => mutating = false);
    }
  }

  Future<void> _remove(String productId) async {
    setState(() => mutating = true);
    try {
      await ApiClient.instance.dio
          .delete('/api/customer/cart/items/$productId');
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => mutating = false);
    }
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
              FilledButton(
                onPressed: () => context.go('/login'),
                child: const Text('Sign in'),
              ),
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
                final p = it['productId'] as Map<String, dynamic>;
                final qty = (it['quantity'] as num).toInt();
                final imgs = (p['images'] as List? ?? []);
                return ListTile(
                  leading: SizedBox(
                    width: 48,
                    height: 48,
                    child: imgs.isNotEmpty
                        ? Image.network(
                            imageUrl(imgs[0]),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                                color: Colors.grey[200],
                                child: const Icon(Icons.image_outlined)),
                          )
                        : Container(
                            color: Colors.grey[200],
                            child: const Icon(Icons.image_outlined)),
                  ),
                  title: Text(p['name']),
                  subtitle: Text('₹${p['price']} each'),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₹${(p['price'] * qty).toString()}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.remove_circle_outline,
                                size: 20),
                            onPressed: mutating || qty <= 1
                                ? null
                                : () => _updateQty(p['_id'], qty - 1),
                          ),
                          Text('$qty'),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.add_circle_outline, size: 20),
                            onPressed: mutating
                                ? null
                                : () => _updateQty(p['_id'], qty + 1),
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.delete_outline,
                                size: 20, color: Colors.red),
                            onPressed:
                                mutating ? null : () => _remove(p['_id']),
                          ),
                        ],
                      ),
                    ],
                  ),
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
                          Text('₹$subtotal',
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold)),
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
