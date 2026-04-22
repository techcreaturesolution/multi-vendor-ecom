class Config {
  // Change this to your backend URL. For local development pointing to a Mac/PC
  // running the backend on port 5000, use 10.0.2.2:5000 on Android emulator.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );

  // Razorpay key_id is returned by the backend with each order; this constant
  // is a fallback used only for test flows.
  static const String razorpayKeyId = String.fromEnvironment(
    'RAZORPAY_KEY_ID',
    defaultValue: '',
  );
}
