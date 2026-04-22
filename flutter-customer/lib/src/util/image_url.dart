import '../config.dart';

/// Backend returns image URLs either as absolute http(s) or as relative
/// `/uploads/...` paths (from our own upload endpoint). Prefix the relative
/// ones with the backend base URL so `Image.network` can load them.
String imageUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return '${Config.apiBaseUrl}$url';
  return url;
}
