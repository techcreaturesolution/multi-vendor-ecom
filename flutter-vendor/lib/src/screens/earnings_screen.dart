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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Earnings')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (summary != null)
                  ...['pending', 'processing', 'paid'].map(
                    (k) => Card(
                      child: ListTile(
                        title: Text(k.toUpperCase()),
                        subtitle: Text(
                          '${summary![k]['count']} orders · gross ₹${summary![k]['gross']}',
                        ),
                        trailing: Text('₹${summary![k]['net']}'),
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                const Text('Payout history', style: TextStyle(fontWeight: FontWeight.bold)),
                if (payouts.isEmpty) const Padding(padding: EdgeInsets.all(8), child: Text('No payouts yet')),
                for (final p in payouts)
                  Card(
                    child: ListTile(
                      title: Text('₹${p['netPayable']}'),
                      subtitle: Text('${p['status']} · ${p['periodStart']}'),
                      trailing: p['utrNumber'] != null ? Text(p['utrNumber']) : null,
                    ),
                  ),
              ],
            ),
    );
  }
}
