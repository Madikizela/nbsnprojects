import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/learner_auth_service.dart';
import '../services/api_service.dart';

class LearnerProfilePortalScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerProfilePortalScreen({super.key, required this.authService});

  @override
  State<LearnerProfilePortalScreen> createState() =>
      _LearnerProfilePortalScreenState();
}

class _LearnerProfilePortalScreenState
    extends State<LearnerProfilePortalScreen> {
  final _api = ApiService();
  Map<String, dynamic>? _profile;
  bool _loading = true;
  bool _saving = false;
  String _msg = '';

  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _addr1Ctrl = TextEditingController();
  final _addr2Ctrl = TextEditingController();
  final _postalCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    for (final c in [
      _firstNameCtrl,
      _lastNameCtrl,
      _emailCtrl,
      _contactCtrl,
      _addr1Ctrl,
      _addr2Ctrl,
      _postalCtrl
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadProfile() async {
    final id = widget.authService.learnerId;
    if (id == null) return;
    try {
      final r = await _api.get('/api/Learners/$id');
      final p = r.data as Map<String, dynamic>;
      setState(() {
        _profile = p;
        _firstNameCtrl.text = p['firstName'] ?? '';
        _lastNameCtrl.text = p['lastName'] ?? '';
        _emailCtrl.text = p['email'] ?? '';
        _contactCtrl.text = p['contactNumber'] ?? '';
        _addr1Ctrl.text = p['addressLine1'] ?? '';
        _addr2Ctrl.text = p['addressLine2'] ?? '';
        _postalCtrl.text = p['postalCode'] ?? '';
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _saveProfile() async {
    final id = widget.authService.learnerId;
    if (id == null || _profile == null) return;
    setState(() {
      _saving = true;
      _msg = '';
    });
    try {
      final updated = {
        ..._profile!,
        'firstName': _firstNameCtrl.text,
        'lastName': _lastNameCtrl.text,
        'email': _emailCtrl.text,
        'contactNumber': _contactCtrl.text,
        'addressLine1': _addr1Ctrl.text,
        'addressLine2': _addr2Ctrl.text,
        'postalCode': _postalCtrl.text,
      };
      await _api.put('/api/Learners/$id', data: updated);
      setState(() => _msg = '✅ Profile saved');
    } catch (_) {
      setState(() => _msg = '❌ Save failed');
    } finally {
      setState(() => _saving = false);
    }
  }

  Future<void> _pickAndUploadPhoto(ImageSource source) async {
    final id = widget.authService.learnerId;
    if (id == null) return;
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source, imageQuality: 80);
      if (picked == null) return;

      await _api.uploadProfilePhoto(learnerId: id, filePath: picked.path);
      setState(() => _msg = '✅ Photo updated');
      await _loadProfile();
    } catch (_) {
      setState(() => _msg = '❌ Photo upload failed');
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1e293b),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.camera_alt, color: Colors.white),
            title: const Text('Take Photo / Face Registration',
                style: TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
              _pickAndUploadPhoto(ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library, color: Colors.white),
            title: const Text('Choose from Gallery',
                style: TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
              _pickAndUploadPhoto(ImageSource.gallery);
            },
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('My Profile'),
        backgroundColor: const Color(0xFF1e293b),
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Photo
                  GestureDetector(
                    onTap: _showPhotoOptions,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 52,
                          backgroundColor: const Color(0xFF334155),
                          backgroundImage:
                              (_profile?['profilePhotoPath'] != null &&
                                      _profile!['profilePhotoPath']
                                          .toString()
                                          .isNotEmpty)
                                  ? NetworkImage(
                                      '${_api.baseUrl}/${_profile!['profilePhotoPath']}',
                                    ) as ImageProvider
                                  : null,
                          child: (_profile?['profilePhotoPath'] == null ||
                                  _profile!['profilePhotoPath']
                                      .toString()
                                      .isEmpty)
                              ? const Icon(Icons.account_circle,
                                  size: 80, color: Color(0xFF94a3b8))
                              : null,
                          onBackgroundImageError: (exception, stackTrace) {
                            // Handle image load errors silently - default icon will show
                            debugPrint('Profile photo load error: $exception');
                          },
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF10b981),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFF0f172a),
                                width: 2,
                              ),
                            ),
                            child: const Icon(
                              Icons.camera_alt,
                              size: 20,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: _showPhotoOptions,
                    icon:
                        const Icon(Icons.camera_alt, color: Color(0xFF10b981)),
                    label: const Text('Update Photo / Face',
                        style: TextStyle(color: Color(0xFF10b981))),
                  ),
                  if (_msg.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(_msg,
                          style: TextStyle(
                              color: _msg.startsWith('✅')
                                  ? Colors.green
                                  : Colors.red)),
                    ),
                  const SizedBox(height: 16),

                  _section('Personal Information', [
                    _field('First Name', _firstNameCtrl),
                    _field('Last Name', _lastNameCtrl),
                    _field('Email', _emailCtrl,
                        type: TextInputType.emailAddress),
                    _field('Contact Number', _contactCtrl,
                        type: TextInputType.phone),
                  ]),
                  const SizedBox(height: 16),
                  _section('Address', [
                    _field('Address Line 1', _addr1Ctrl),
                    _field('Address Line 2', _addr2Ctrl),
                    _field('Postal Code', _postalCtrl,
                        type: TextInputType.number),
                  ]),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10b981),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _saving
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('💾 Save Profile',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: Color(0xFF10b981), fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl,
      {TextInputType? type}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
          const SizedBox(height: 4),
          TextFormField(
            controller: ctrl,
            keyboardType: type,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF0f172a),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF334155))),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF334155))),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
        ],
      ),
    );
  }
}
