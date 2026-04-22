import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../api/api_client.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late Razorpay _razorpay;
  List<dynamic> addresses = [];
  String? selectedId;
  String? currentOrderId;
  bool placing = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _onError);
    _loadAddresses();
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _loadAddresses() async {
    final r = await ApiClient.instance.dio.get('/api/customer/addresses');
    setState(() {
      addresses = r.data['data'];
      if (addresses.isNotEmpty) selectedId = addresses.first['_id'];
    });
  }

  Future<void> _placeOrder() async {
    if (selectedId == null) return;
    setState(() => placing = true);
    try {
      final r = await ApiClient.instance.dio.post(
        '/api/customer/checkout/orders',
        data: {'addressId': selectedId},
      );
      final data = r.data['data'];
      currentOrderId = data['order']['_id'];
      _razorpay.open({
        'key': data['razorpay']['keyId'],
        'amount': data['razorpay']['amount'],
        'currency': data['razorpay']['currency'],
        'order_id': data['razorpay']['orderId'],
        'name': 'MVE Shop',
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    } finally {
      setState(() => placing = false);
    }
  }

  Future<void> _onSuccess(PaymentSuccessResponse r) async {
    try {
      await ApiClient.instance.dio.post(
        '/api/customer/checkout/verify',
        data: {
          'orderId': currentOrderId,
          'razorpayOrderId': r.orderId,
          'razorpayPaymentId': r.paymentId,
          'razorpaySignature': r.signature,
        },
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment successful')));
      context.go('/orders');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Verify failed: $e')));
    }
  }

  void _onError(PaymentFailureResponse r) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Payment failed: ${r.message}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Ship to', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (addresses.isEmpty)
            const Text('No saved addresses. Add one from the web portal for now.')
          else
            ...addresses.map(
              (a) => RadioListTile<String>(
                value: a['_id'],
                groupValue: selectedId,
                onChanged: (v) => setState(() => selectedId = v),
                title: Text('${a['fullName']} · ${a['phone']}'),
                subtitle: Text('${a['line1']}, ${a['city']}, ${a['state']} - ${a['pincode']}'),
              ),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: placing || selectedId == null ? null : _placeOrder,
            child: Text(placing ? 'Preparing...' : 'Pay with Razorpay'),
          ),
        ),
      ),
    );
  }
}
