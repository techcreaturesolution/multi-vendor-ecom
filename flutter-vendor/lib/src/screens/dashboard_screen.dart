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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final m = await ApiClient.instance.dio.get('/api/vendor/me');
      setState(() => me = m.data['data']);
      final s = await ApiClient.instance.dio.get('/api/vendor/earnings/summary');
      setState(() => summary = s.data['data']);
    } catch (_) {}
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
      body: ListView(
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
          if (summary != null)
            for (final k in ['pending', 'processing', 'paid'])
              Card(
                child: ListTile(
                  title: Text(k.toUpperCase()),
                  subtitle: Text('${summary![k]['count']} orders · gross ₹${summary![k]['gross']}'),
                  trailing: Text('₹${summary![k]['net']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
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
    );
  }
}
