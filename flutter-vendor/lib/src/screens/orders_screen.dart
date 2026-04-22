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
  String? statusFilter;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final params = <String, dynamic>{'limit': 100};
      if (statusFilter != null) params['status'] = statusFilter;
      final r = await ApiClient.instance.dio
          .get('/api/vendor/orders', queryParameters: params);
      setState(() {
        items = r.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  Future<void> _ship(String id) async {
    final courierCtl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Ship order'),
        content: TextField(
          controller: courierCtl,
          decoration: const InputDecoration(
            labelText: 'Courier code (optional, e.g. DTDC, BLUEDART)',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Ship'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ApiClient.instance.dio.post(
        '/api/vendor/orders/$id/ship',
        data: {
          if (courierCtl.text.trim().isNotEmpty)
            'courierCode': courierCtl.text.trim(),
        },
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Shipped')));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final filters = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: const Text('All'),
                    selected: statusFilter == null,
                    onSelected: (_) {
                      setState(() => statusFilter = null);
                      _load();
                    },
                  ),
                ),
                ...filters.map(
                  (f) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(f),
                      selected: statusFilter == f,
                      onSelected: (_) {
                        setState(() => statusFilter = f);
                        _load();
                      },
                    ),
                  ),
                ),
              ],
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
                            Center(child: Text('No orders')),
                          ])
                        : ListView.separated(
                            itemCount: items.length,
                            separatorBuilder: (_, __) =>
                                const Divider(height: 1),
                            itemBuilder: (_, i) {
                              final o = items[i];
                              final canShip = o['paymentStatus'] == 'paid' &&
                                  (o['status'] == 'paid' ||
                                      o['status'] == 'processing');
                              return ListTile(
                                title: Text(o['orderNumber']),
                                subtitle: Text(
                                    '${o['status']} · ₹${o['grandTotal']}'),
                                trailing: canShip
                                    ? FilledButton(
                                        onPressed: () => _ship(o['_id']),
                                        child: const Text('Ship'),
                                      )
                                    : Text('${o['status']}'),
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
