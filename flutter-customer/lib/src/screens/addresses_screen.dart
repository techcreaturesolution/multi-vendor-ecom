import 'package:flutter/material.dart';
import '../api/api_client.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  List<dynamic> addresses = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await ApiClient.instance.dio.get('/api/customer/addresses');
      setState(() {
        addresses = r.data['data'];
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  Future<void> _add() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _AddAddressSheet(),
    );
    if (result == true) _load();
  }

  Future<void> _delete(String id) async {
    try {
      await ApiClient.instance.dio.delete('/api/customer/addresses/$id');
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Addresses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.add),
        label: const Text('Add'),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : addresses.isEmpty
              ? const Center(child: Text('No addresses yet'))
              : ListView.separated(
                  itemCount: addresses.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final a = addresses[i];
                    return ListTile(
                      title: Text('${a['fullName']} · ${a['phone']}'),
                      subtitle: Text(
                          '${a['line1']}${a['line2'] != null && a['line2'] != '' ? ', ' + a['line2'] : ''}\n${a['city']}, ${a['state']} - ${a['pincode']}'),
                      isThreeLine: true,
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                        onPressed: () => _delete(a['_id']),
                      ),
                    );
                  },
                ),
    );
  }
}

class _AddAddressSheet extends StatefulWidget {
  const _AddAddressSheet();
  @override
  State<_AddAddressSheet> createState() => _AddAddressSheetState();
}

class _AddAddressSheetState extends State<_AddAddressSheet> {
  final _form = GlobalKey<FormState>();
  final fullName = TextEditingController();
  final phone = TextEditingController();
  final line1 = TextEditingController();
  final line2 = TextEditingController();
  final city = TextEditingController();
  final state = TextEditingController();
  final pincode = TextEditingController();
  bool saving = false;

  @override
  void dispose() {
    for (final c in [fullName, phone, line1, line2, city, state, pincode]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_form.currentState?.validate() ?? false)) return;
    setState(() => saving = true);
    try {
      await ApiClient.instance.dio.post('/api/customer/addresses', data: {
        'fullName': fullName.text,
        'phone': phone.text,
        'line1': line1.text,
        'line2': line2.text.isEmpty ? null : line2.text,
        'city': city.text,
        'state': state.text,
        'pincode': pincode.text,
        'country': 'IN',
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Widget _field(String label, TextEditingController c,
      {int maxLines = 1, String? Function(String?)? validator, TextInputType? type}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: TextFormField(
        controller: c,
        maxLines: maxLines,
        keyboardType: type,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
        validator: validator ??
            (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Form(
        key: _form,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Add address',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              _field('Full name', fullName),
              _field('Phone', phone, type: TextInputType.phone),
              _field('Address line 1', line1),
              _field('Address line 2 (optional)', line2,
                  validator: (_) => null),
              Row(children: [
                Expanded(child: _field('City', city)),
                const SizedBox(width: 8),
                Expanded(child: _field('State', state)),
              ]),
              _field('Pincode', pincode, type: TextInputType.number),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: saving ? null : _save,
                  child: Text(saving ? 'Saving...' : 'Save address'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
