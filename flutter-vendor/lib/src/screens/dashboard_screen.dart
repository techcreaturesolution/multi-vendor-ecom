import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../state/auth_state.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? summary;
  Map<String, dynamic>? me;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final m = await ApiClient.instance.dio.get('/api/vendor/me');
      final s = await ApiClient.instance.dio.get('/api/vendor/earnings/summary');
      setState(() {
        me = m.data['data'];
        summary = s.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  Widget _tile(String label, num value) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 6),
            Text('₹${value.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vendor Dashboard'),
        actions: [
          IconButton(
            onPressed: () => auth.logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: loading
            ? ListView(children: const [
                SizedBox(height: 160),
                Center(child: CircularProgressIndicator()),
              ])
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (me != null)
                    Card(
                      child: ListTile(
                        title: Text(me!['businessName'] ?? ''),
                        subtitle: Text('Status: ${me!['status']}'),
                      ),
                    ),
                  const SizedBox(height: 12),
                  if (summary != null) ...[
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 2.2,
                      children: [
                        _tile('Gross sales', (summary!['grossSales'] ?? 0) as num),
                        _tile('Net earnings', (summary!['netEarnings'] ?? 0) as num),
                        _tile('Pending payout',
                            (summary!['pendingPayout'] ?? 0) as num),
                        _tile('Paid out', (summary!['paidOut'] ?? 0) as num),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Shipping: ₹${summary!['totalShipping']}  ·  Admin commission: ₹${summary!['totalCommission']}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                  const SizedBox(height: 20),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.icon(
                        onPressed: () => context.go('/products'),
                        icon: const Icon(Icons.inventory),
                        label: const Text('Products'),
                      ),
                      FilledButton.icon(
                        onPressed: () => context.go('/orders'),
                        icon: const Icon(Icons.shopping_bag),
                        label: const Text('Orders'),
                      ),
                      FilledButton.icon(
                        onPressed: () => context.go('/earnings'),
                        icon: const Icon(Icons.account_balance_wallet),
                        label: const Text('Earnings'),
                      ),
                    ],
                  ),
                ],
              ),
      ),
    );
  }
}
