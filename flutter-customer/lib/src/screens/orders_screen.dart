import 'package:flutter/material.dart';
import '../api/api_client.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<dynamic> orders = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await ApiClient.instance.dio.get('/api/customer/orders', queryParameters: {'limit': 50});
      setState(() {
        orders = r.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : orders.isEmpty
              ? const Center(child: Text('No orders yet'))
              : ListView.separated(
                  itemCount: orders.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final o = orders[i];
                    return ListTile(
                      title: Text(o['orderNumber']),
                      subtitle: Text('${o['status']} · ${o['paymentStatus']}'),
                      trailing: Text('₹${o['grandTotal']}'),
                    );
                  },
                ),
    );
  }
}
