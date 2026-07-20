import 'package:flutter/material.dart';
import 'package:signature/signature.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class TeacherProfileScreen extends StatefulWidget {
  const TeacherProfileScreen({super.key});

  @override
  State<TeacherProfileScreen> createState() => _TeacherProfileScreenState();
}

class _TeacherProfileScreenState extends State<TeacherProfileScreen> {
  bool _isLoading = true;
  bool _isEditing = false;
  bool _isSaving = false;

  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressLine1Controller = TextEditingController();
  final _addressLine2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _provinceController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _practiceNumberController = TextEditingController();

  String? _signatureBase64;
  int? _teacherId;

  @override
  void initState() {
    super.initState();
    _loadTeacherProfile();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _provinceController.dispose();
    _postalCodeController.dispose();
    _practiceNumberController.dispose();
    super.dispose();
  }

  Future<void> _loadTeacherProfile() async {
    setState(() => _isLoading = true);

    try {
      final authService = context.read<AuthService>();
      final user = authService.user;
      if (user == null) throw Exception('User not found');

      _teacherId = user['id'];

      final apiService = context.read<ApiService>();
      final response = await apiService.get('/api/TeacherProfile/$_teacherId');

      if (response.statusCode == 200) {
        final profile = response.data;
        setState(() {
          _firstNameController.text = profile['firstName'] ?? '';
          _lastNameController.text = profile['lastName'] ?? '';
          _emailController.text = profile['email'] ?? '';
          _phoneController.text = profile['phoneNumber'] ?? '';
          _addressLine1Controller.text = profile['addressLine1'] ?? '';
          _addressLine2Controller.text = profile['addressLine2'] ?? '';
          _cityController.text = profile['city'] ?? '';
          _provinceController.text = profile['province'] ?? '';
          _postalCodeController.text = profile['postalCode'] ?? '';
          _practiceNumberController.text = profile['practiceNumber'] ?? '';
          _signatureBase64 = profile['signature'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading profile: $e')),
        );
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    try {
      final data = {
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'email': _emailController.text.trim(),
        'phoneNumber': _phoneController.text.trim(),
        'addressLine1': _addressLine1Controller.text.trim(),
        'addressLine2': _addressLine2Controller.text.trim(),
        'city': _cityController.text.trim(),
        'province': _provinceController.text.trim(),
        'postalCode': _postalCodeController.text.trim(),
        'practiceNumber': _practiceNumberController.text.trim(),
        if (_signatureBase64 != null) 'signature': _signatureBase64,
      };

      final apiService = context.read<ApiService>();
      final response =
          await apiService.put('/api/TeacherProfile/$_teacherId', data: data);

      if (response.statusCode == 200) {
        setState(() {
          _isEditing = false;
          _isSaving = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Profile updated successfully'),
                backgroundColor: Colors.green),
          );
        }
      }
    } catch (e) {
      setState(() => _isSaving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Error saving profile: $e'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _showSignatureDialog() async {
    final SignatureController controller = SignatureController(
      penStrokeWidth: 3,
      penColor: Colors.black,
      exportBackgroundColor: Colors.white,
    );

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Signature'),
        content: SizedBox(
          width: 300,
          height: 200,
          child: Column(
            children: [
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Signature(
                    controller: controller, backgroundColor: Colors.white),
              ),
              const SizedBox(height: 10),
              TextButton.icon(
                onPressed: () => controller.clear(),
                icon: const Icon(Icons.clear),
                label: const Text('Clear'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (controller.isNotEmpty) {
                final nav = Navigator.of(context);
                final signature = await controller.toPngBytes();
                if (signature != null) {
                  setState(() => _signatureBase64 = base64Encode(signature));
                  if (mounted) nav.pop();
                }
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Teacher Profile'),
        actions: [
          if (!_isEditing && !_isLoading)
            IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => setState(() => _isEditing = true)),
          if (_isEditing)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                setState(() => _isEditing = false);
                _loadTeacherProfile();
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSection('Personal Information', [
                      _buildTextField(
                          controller: _firstNameController,
                          label: 'First Name',
                          enabled: _isEditing,
                          required: true),
                      _buildTextField(
                          controller: _lastNameController,
                          label: 'Last Name',
                          enabled: _isEditing,
                          required: true),
                      _buildTextField(
                          controller: _emailController,
                          label: 'Email',
                          enabled: _isEditing,
                          required: true,
                          keyboardType: TextInputType.emailAddress),
                    ]),
                    const SizedBox(height: 20),
                    _buildSection('Contact Information', [
                      _buildTextField(
                          controller: _phoneController,
                          label: 'Phone Number',
                          enabled: _isEditing,
                          keyboardType: TextInputType.phone),
                      _buildTextField(
                          controller: _practiceNumberController,
                          label: 'Practice Number',
                          enabled: _isEditing),
                    ]),
                    const SizedBox(height: 20),
                    _buildSection('Address', [
                      _buildTextField(
                          controller: _addressLine1Controller,
                          label: 'Address Line 1',
                          enabled: _isEditing),
                      _buildTextField(
                          controller: _addressLine2Controller,
                          label: 'Address Line 2',
                          enabled: _isEditing),
                      _buildTextField(
                          controller: _cityController,
                          label: 'City',
                          enabled: _isEditing),
                      _buildTextField(
                          controller: _provinceController,
                          label: 'Province',
                          enabled: _isEditing),
                      _buildTextField(
                          controller: _postalCodeController,
                          label: 'Postal Code',
                          enabled: _isEditing),
                    ]),
                    const SizedBox(height: 20),
                    _buildSection('Signature', [
                      if (_signatureBase64 != null)
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(8)),
                          child: Image.memory(base64Decode(_signatureBase64!),
                              height: 100, fit: BoxFit.contain),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(8)),
                          child: const Center(
                              child: Text('No signature added',
                                  style: TextStyle(color: Colors.grey))),
                        ),
                      if (_isEditing)
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: ElevatedButton.icon(
                            onPressed: _showSignatureDialog,
                            icon: const Icon(Icons.edit),
                            label: Text(_signatureBase64 == null
                                ? 'Add Signature'
                                : 'Update Signature'),
                          ),
                        ),
                    ]),
                    if (_isEditing) ...[
                      const SizedBox(height: 30),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _saveProfile,
                          style: ElevatedButton.styleFrom(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 16)),
                          child: _isSaving
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Save Profile'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF8B5CF6))),
        const SizedBox(height: 10),
        ...children,
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required bool enabled,
    bool required = false,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        enabled: enabled,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          filled: !enabled,
          fillColor: enabled ? null : Colors.grey[800],
        ),
        validator: required
            ? (value) => (value == null || value.trim().isEmpty)
                ? '$label is required'
                : null
            : null,
      ),
    );
  }
}
