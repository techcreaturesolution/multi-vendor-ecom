import 'dart:async';
import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../util/image_url.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});
  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<dynamic> items = [];
  bool loading = true;
  String query = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final params = <String, dynamic>{'limit': 100};
      if (query.isNotEmpty) params['q'] = query;
      final r = await ApiClient.instance.dio
          .get('/api/vendor/products', queryParameters: params);
      setState(() {
        items = r.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  void _onSearchChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      setState(() => query = v);
      _load();
    });
  }

  Future<void> _toggleActive(Map<String, dynamic> p) async {
    try {
      await ApiClient.instance.dio
          .patch('/api/vendor/products/${p['_id']}', data: {
        'isActive': !(p['isActive'] as bool),
      });
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _edit(Map<String, dynamic> p) async {
    final priceCtl = TextEditingController(text: '${p['price']}');
    final stockCtl = TextEditingController(text: '${p['stock']}');
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Edit ${p['name']}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: priceCtl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Price'),
            ),
            TextField(
              controller: stockCtl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Stock'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (ok == true) {
      try {
        await ApiClient.instance.dio
            .patch('/api/vendor/products/${p['_id']}', data: {
          'price': num.tryParse(priceCtl.text) ?? p['price'],
          'stock': int.tryParse(stockCtl.text) ?? p['stock'],
        });
        _load();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Products')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search products',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: items.isEmpty
                        ? ListView(children: const [
                            SizedBox(height: 120),
                            Center(child: Text('No products')),
                          ])
                        : ListView.separated(
                            itemCount: items.length,
                            separatorBuilder: (_, __) =>
                                const Divider(height: 1),
                            itemBuilder: (_, i) {
                              final p = items[i] as Map<String, dynamic>;
                              final imgs = (p['images'] as List? ?? []);
                              return ListTile(
                                leading: SizedBox(
                                  width: 48,
                                  height: 48,
                                  child: imgs.isNotEmpty
                                      ? Image.network(
                                          imageUrl(imgs[0]),
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) =>
                                              Container(
                                            color: Colors.grey[200],
                                            child: const Icon(
                                                Icons.image_outlined),
                                          ),
                                        )
                                      : Container(
                                          color: Colors.grey[200],
                                          child:
                                              const Icon(Icons.image_outlined)),
                                ),
                                title: Text(p['name']),
                                subtitle: Text(
                                    'SKU: ${p['sku']} · Stock: ${p['stock']}'),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('₹${p['price']}',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold)),
                                    Switch(
                                      value: p['isActive'] as bool,
                                      onChanged: (_) => _toggleActive(p),
                                    ),
                                  ],
                                ),
                                onTap: () => _edit(p),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
