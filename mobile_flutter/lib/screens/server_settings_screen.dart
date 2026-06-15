import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../services/api_service.dart';
import '../services/server_config_service.dart';

class ServerSettingsScreen extends StatefulWidget {
  const ServerSettingsScreen({super.key});

  @override
  State<ServerSettingsScreen> createState() => _ServerSettingsScreenState();
}

class _ServerSettingsScreenState extends State<ServerSettingsScreen> {
  final _urlController = TextEditingController();
  bool _isTesting = false;
  bool _isSaving = false;
  String? _testResult;
  bool _testSuccess = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentUrl();
  }

  Future<void> _loadCurrentUrl() async {
    final url = await ServerConfigService.getServerUrl();
    _urlController.text = url;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  String _normaliseUrl(String raw) {
    var url = raw.trim().replaceAll(RegExp(r'/+$'), '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://$url';
    }
    return url;
  }

  Future<void> _testConnection() async {
    final url = _normaliseUrl(_urlController.text);
    if (url.isEmpty) return;

    setState(() {
      _isTesting = true;
      _testResult = null;
    });

    try {
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 8),
      ));
      await dio.get('$url/api/LearnerAssessmentAnswers/ping');
      setState(() {
        _testSuccess = true;
        _testResult = '✅ Connected successfully to $url';
      });
    } on DioException catch (e) {
      // A 401/404 still means the server is reachable
      if (e.response != null) {
        setState(() {
          _testSuccess = true;
          _testResult =
              '✅ Server reachable at $url (status ${e.response?.statusCode})';
        });
      } else {
        setState(() {
          _testSuccess = false;
          _testResult = '❌ Cannot reach server: ${e.message}';
        });
      }
    } catch (e) {
      setState(() {
        _testSuccess = false;
        _testResult = '❌ Error: $e';
      });
    } finally {
      setState(() => _isTesting = false);
    }
  }

  Future<void> _saveUrl() async {
    final url = _normaliseUrl(_urlController.text);
    if (url.isEmpty) return;

    setState(() => _isSaving = true);

    await ServerConfigService.saveServerUrl(url);

    // Update the running ApiService instance
    if (mounted) {
      context.read<ApiService>().updateBaseUrl(url);
    }

    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Server URL saved. All requests will now use the new address.'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.of(context).pop();
    }
  }

  Future<void> _resetToDefault() async {
    await ServerConfigService.resetToDefault();
    final defaultUrl = ServerConfigService.defaultServerUrl;
    _urlController.text = defaultUrl;

    if (mounted) {
      context.read<ApiService>().updateBaseUrl(defaultUrl);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Reset to default: $defaultUrl'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('Server Settings'),
        backgroundColor: const Color(0xFF1e293b),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1e293b),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Color(0xFF0EA5E9), size: 20),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Enter the IP address and port of the backend server running on your PC. '
                      'Make sure your phone and PC are on the same WiFi network.',
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            const Text(
              'Server URL',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),

            // URL input
            TextFormField(
              controller: _urlController,
              style: const TextStyle(color: Colors.white),
              keyboardType: TextInputType.url,
              autocorrect: false,
              decoration: InputDecoration(
                hintText: 'e.g. http://192.168.1.100:5213',
                hintStyle: const TextStyle(color: Color(0xFF475569)),
                filled: true,
                fillColor: const Color(0xFF1e293b),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF0EA5E9)),
                ),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear, color: Color(0xFF475569)),
                  onPressed: () => _urlController.clear(),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Test result banner
            if (_testResult != null)
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: _testSuccess
                      ? Colors.green.withValues(alpha: 0.15)
                      : Colors.red.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _testSuccess ? Colors.green : Colors.red,
                  ),
                ),
                child: Text(
                  _testResult!,
                  style: TextStyle(
                    color: _testSuccess ? Colors.green : Colors.red,
                    fontSize: 13,
                  ),
                ),
              ),

            if (_testResult != null) const SizedBox(height: 12),

            // Test button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _isTesting ? null : _testConnection,
                icon: _isTesting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFF0EA5E9),
                        ),
                      )
                    : const Icon(Icons.wifi_find, color: Color(0xFF0EA5E9)),
                label: Text(
                  _isTesting ? 'Testing...' : 'Test Connection',
                  style: const TextStyle(color: Color(0xFF0EA5E9)),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF0EA5E9)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Save button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveUrl,
                icon: _isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.save),
                label: Text(_isSaving ? 'Saving...' : 'Save & Apply'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0EA5E9),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Reset to default
            Center(
              child: TextButton(
                onPressed: _resetToDefault,
                child: const Text(
                  'Reset to Default',
                  style: TextStyle(color: Color(0xFF64748b)),
                ),
              ),
            ),

            const Spacer(),

            // Current default info
            Center(
              child: Text(
                'Default: ${ServerConfigService.defaultServerUrl}',
                style: const TextStyle(color: Color(0xFF475569), fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
