import 'package:flutter/material.dart';
import '../api/api_client.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});
  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  List<dynamic> payouts = [];
  Map<String, dynamic>? summary;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final s = await ApiClient.instance.dio.get('/api/vendor/earnings/summary');
      final p = await ApiClient.instance.dio.get('/api/vendor/earnings/payouts');
      setState(() {
        summary = s.data['data'];
        payouts = p.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  Widget _kv(String k, dynamic v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          children: [
            Expanded(child: Text(k, style: const TextStyle(color: Colors.grey))),
            Text('₹${v ?? 0}'),
          ],
        ),
      );

  Widget _bucket(String label, Map<String, dynamic>? b) {
    b ??= {'count': 0, 'gross': 0, 'net': 0};
    return Card(
      child: ListTile(
        title: Text(label.toUpperCase()),
        subtitle: Text('${b['count']} orders · gross ₹${b['gross']}'),
        trailing: Text('₹${b['net']}',
            style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Earnings')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (summary != null) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Summary',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          _kv('Gross sales', summary!['grossSales']),
                          _kv('Shipping', summary!['totalShipping']),
                          _kv('Admin commission', summary!['totalCommission']),
                          const Divider(),
                          _kv('Net earnings', summary!['netEarnings']),
                          _kv('Pending payout', summary!['pendingPayout']),
                          _kv('Paid out', summary!['paidOut']),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('By status',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  _bucket('pending',
                      (summary!['buckets'] ?? {})['pending'] as Map<String, dynamic>?),
                  _bucket('processing',
                      (summary!['buckets'] ?? {})['processing'] as Map<String, dynamic>?),
                  _bucket('paid',
                      (summary!['buckets'] ?? {})['paid'] as Map<String, dynamic>?),
                ],
                const SizedBox(height: 16),
                const Text('Payout history',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                if (payouts.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(8),
                    child: Text('No payouts yet'),
                  ),
                for (final p in payouts)
                  Card(
                    child: ListTile(
                      title: Text('₹${p['netPayable']}'),
                      subtitle: Text('${p['status']} · ${p['periodStart']}'),
                      trailing:
                          p['utrNumber'] != null ? Text(p['utrNumber']) : null,
                    ),
                  ),
              ],
            ),
    );
  }
}
