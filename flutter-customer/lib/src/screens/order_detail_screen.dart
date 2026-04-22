import 'package:flutter/material.dart';
import '../api/api_client.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Map<String, dynamic>? order;
  List<dynamic> shipments = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await ApiClient.instance.dio
          .get('/api/customer/orders/${widget.orderId}');
      setState(() {
        order = r.data['data']['order'];
        shipments = r.data['data']['shipments'] ?? [];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (order == null) {
      return const Scaffold(body: Center(child: Text('Order not found')));
    }
    final o = order!;
    final items = (o['items'] as List? ?? []);
    return Scaffold(
      appBar: AppBar(title: Text('Order ${o['orderNumber']}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: Text('Status: ${o['status']}'),
              subtitle: Text('Payment: ${o['paymentStatus']}'),
              trailing: Text('₹${o['grandTotal']}',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Items',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          for (final it in items)
            Card(
              child: ListTile(
                title: Text(it['name'] ?? ''),
                subtitle: Text('Qty ${it['quantity']}'),
                trailing: Text('₹${it['totalPrice'] ?? it['unitPrice']}'),
              ),
            ),
          const SizedBox(height: 16),
          const Text('Shipments & tracking',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          if (shipments.isEmpty)
            const Padding(
              padding: EdgeInsets.all(8),
              child: Text('No shipments yet. You\'ll see tracking once the vendor ships.'),
            )
          else
            for (final s in shipments)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.local_shipping, size: 18),
                          const SizedBox(width: 6),
                          Text(s['courierName'] ?? 'Courier',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold)),
                          const Spacer(),
                          Chip(label: Text('${s['status']}')),
                        ],
                      ),
                      if (s['awbNumber'] != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('AWB: ${s['awbNumber']}',
                              style: const TextStyle(color: Colors.grey)),
                        ),
                      const SizedBox(height: 8),
                      ...((s['trackingEvents'] as List? ?? []).map(
                        (e) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.circle, size: 8, color: Colors.grey),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(e['status'] ?? ''),
                                    if (e['description'] != null)
                                      Text(e['description'],
                                          style: const TextStyle(
                                              color: Colors.grey, fontSize: 12)),
                                  ],
                                ),
                              ),
                              if (e['timestamp'] != null)
                                Text(
                                  e['timestamp']
                                      .toString()
                                      .replaceAll('T', ' ')
                                      .substring(0, 16),
                                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                            ],
                          ),
                        ),
                      )),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}
