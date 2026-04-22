import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../util/image_url.dart';

class ProductScreen extends StatefulWidget {
  final String slug;
  const ProductScreen({super.key, required this.slug});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  Map<String, dynamic>? product;
  int qty = 1;
  int imageIndex = 0;
  final _pageCtl = PageController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pageCtl.dispose();
    super.dispose();
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
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Added to cart')));
      context.go('/cart');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (product == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final p = product!;
    final images = (p['images'] as List? ?? []).cast<String>();
    final stock = (p['stock'] as num?)?.toInt() ?? 0;
    final outOfStock = stock <= 0;

    return Scaffold(
      appBar: AppBar(title: Text(p['name'])),
      body: ListView(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Container(
              color: Colors.grey[100],
              child: images.isEmpty
                  ? const Center(
                      child: Icon(Icons.image_outlined,
                          size: 80, color: Colors.grey))
                  : Stack(
                      children: [
                        PageView.builder(
                          controller: _pageCtl,
                          itemCount: images.length,
                          onPageChanged: (i) => setState(() => imageIndex = i),
                          itemBuilder: (_, i) => Image.network(
                            imageUrl(images[i]),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                                Icons.image_outlined,
                                size: 80,
                                color: Colors.grey),
                          ),
                        ),
                        if (images.length > 1)
                          Positioned(
                            bottom: 8,
                            left: 0,
                            right: 0,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                for (var i = 0; i < images.length; i++)
                                  Container(
                                    margin: const EdgeInsets.symmetric(
                                        horizontal: 3),
                                    width: imageIndex == i ? 10 : 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: imageIndex == i
                                          ? Colors.black87
                                          : Colors.black26,
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                      ],
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p['vendorId']?['businessName'] ?? '',
                    style: const TextStyle(color: Colors.grey)),
                Text(p['name'],
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text('₹${p['price']}',
                        style: const TextStyle(
                            fontSize: 22, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 10),
                    if (outOfStock)
                      const Chip(
                        label: Text('Out of stock'),
                        backgroundColor: Color(0xFFFEE2E2),
                        labelStyle: TextStyle(color: Color(0xFF991B1B)),
                      )
                    else if (stock <= 5)
                      Chip(
                        label: Text('Only $stock left'),
                        backgroundColor: const Color(0xFFFEF3C7),
                        labelStyle:
                            const TextStyle(color: Color(0xFF92400E)),
                      ),
                  ],
                ),
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
              decoration:
                  BoxDecoration(border: Border.all(color: Colors.grey)),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove),
                    onPressed: qty > 1 ? () => setState(() => qty--) : null,
                  ),
                  Text('$qty'),
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: qty < stock ? () => setState(() => qty++) : null,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: outOfStock ? null : _addToCart,
                child: Text(outOfStock ? 'Out of stock' : 'Add to cart'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
