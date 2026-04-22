import 'package:flutter/material.dart';
import '../api/api_client.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<dynamic> items = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await ApiClient.instance.dio.get('/api/vendor/orders', queryParameters: {'limit': 100});
      setState(() {
        items = r.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  Future<void> _ship(String id) async {
    try {
      await ApiClient.instance.dio.post('/api/vendor/orders/$id/ship');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Shipped')));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : items.isEmpty
              ? const Center(child: Text('No orders yet'))
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final o = items[i];
                    final canShip = o['paymentStatus'] == 'paid' &&
                        (o['status'] == 'paid' || o['status'] == 'processing');
                    return ListTile(
                      title: Text(o['orderNumber']),
                      subtitle: Text('${o['status']} · ₹${o['grandTotal']}'),
                      trailing: canShip
                          ? FilledButton(onPressed: () => _ship(o['_id']), child: const Text('Ship'))
                          : null,
                    );
                  },
                ),
    );
  }
}
