import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';

class ProductScreen extends StatefulWidget {
  final String slug;
  const ProductScreen({super.key, required this.slug});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  Map<String, dynamic>? product;
  int qty = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await ApiClient.instance.dio.get('/api/customer/products/${widget.slug}');
    setState(() => product = r.data['data']['product']);
  }

  Future<void> _addToCart() async {
    try {
      await ApiClient.instance.dio.post(
        '/api/customer/cart/items',
        data: {'productId': product!['_id'], 'quantity': qty},
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to cart')));
      context.go('/cart');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (product == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final p = product!;
    return Scaffold(
      appBar: AppBar(title: Text(p['name'])),
      body: ListView(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Container(
              color: Colors.grey[100],
              child: (p['images'] as List).isNotEmpty
                  ? Image.network(p['images'][0], fit: BoxFit.cover)
                  : const Icon(Icons.image_outlined, size: 80, color: Colors.grey),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p['vendorId']?['businessName'] ?? '', style: const TextStyle(color: Colors.grey)),
                Text(p['name'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('₹${p['price']}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                Text(p['description'] ?? ''),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(border: Border.all(color: Colors.grey)),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove),
                    onPressed: qty > 1 ? () => setState(() => qty--) : null,
                  ),
                  Text('$qty'),
                  IconButton(icon: const Icon(Icons.add), onPressed: () => setState(() => qty++)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: _addToCart,
                child: const Text('Add to cart'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
