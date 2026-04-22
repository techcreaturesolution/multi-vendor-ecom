import 'package:flutter/material.dart';
import '../api/api_client.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});
  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<dynamic> items = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await ApiClient.instance.dio.get('/api/vendor/products', queryParameters: {'limit': 100});
      setState(() {
        items = r.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Products')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : items.isEmpty
              ? const Center(child: Text('No products yet'))
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final p = items[i];
                    return ListTile(
                      title: Text(p['name']),
                      subtitle: Text('SKU: ${p['sku']} · Stock: ${p['stock']}'),
                      trailing: Text('₹${p['price']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    );
                  },
                ),
    );
  }
}
