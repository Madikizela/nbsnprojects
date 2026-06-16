import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:signature/signature.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../services/api_service.dart';
import 'face_recognition_screen.dart';

class LearnerDetailScreen extends StatefulWidget {
  final int learnerId;

  const LearnerDetailScreen({
    super.key,
    required this.learnerId,
  });

  @override
  State<LearnerDetailScreen> createState() => _LearnerDetailScreenState();
}

class _LearnerDetailScreenState extends State<LearnerDetailScreen> {
  bool _loading = true;
  bool _editing = false;
  bool _saving = false;
  Map<String, dynamic>? _learner;
  String? _profilePhotoUrl;
  String? _signatureUrl;

  // Form controllers
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _idNumberController;
  late TextEditingController _contactNumberController;
  late TextEditingController _emailController;
  late TextEditingController _addressLine1Controller;
  late TextEditingController _addressLine2Controller;
  late TextEditingController _addressLine3Controller;
  late TextEditingController _postalCodeController;
  late TextEditingController _highSchoolNameController;
  late TextEditingController _yearOfCompletionController;
  late TextEditingController _schoolLocationController;
  late TextEditingController _nextOfKinNameController;
  late TextEditingController _nextOfKinContactController;
  late TextEditingController _accountNumberController;
  late TextEditingController _branchCodeController;

  String? _gender;
  String? _race;
  String? _homeLanguage;
  String? _disability;
  String? _highestGradePassed;
  String? _nextOfKinRelation;
  String? _bankName;
  String? _accountType;

  @override
  void initState() {
    super.initState();
    _initializeControllers();
    _fetchLearnerDetails();
  }

  void _initializeControllers() {
    _titleController = TextEditingController();
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _idNumberController = TextEditingController();
    _contactNumberController = TextEditingController();
    _emailController = TextEditingController();
    _addressLine1Controller = TextEditingController();
    _addressLine2Controller = TextEditingController();
    _addressLine3Controller = TextEditingController();
    _postalCodeController = TextEditingController();
    _highSchoolNameController = TextEditingController();
    _yearOfCompletionController = TextEditingController();
    _schoolLocationController = TextEditingController();
    _nextOfKinNameController = TextEditingController();
    _nextOfKinContactController = TextEditingController();
    _accountNumberController = TextEditingController();
    _branchCodeController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _idNumberController.dispose();
    _contactNumberController.dispose();
    _emailController.dispose();
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _addressLine3Controller.dispose();
    _postalCodeController.dispose();
    _highSchoolNameController.dispose();
    _yearOfCompletionController.dispose();
    _schoolLocationController.dispose();
    _nextOfKinNameController.dispose();
    _nextOfKinContactController.dispose();
    _accountNumberController.dispose();
    _branchCodeController.dispose();
    super.dispose();
  }

  Future<void> _fetchLearnerDetails() async {
    try {
      final apiService = context.read<ApiService>();
      final response =
          await apiService.get('/api/Learners/${widget.learnerId}');

      if (response.statusCode == 200) {
        setState(() {
          _learner = response.data;
          _populateForm();
          _loading = false;
        });

        // Try to load profile photo and signature
        _loadProfilePhoto();
        _loadSignature();
      }
    } catch (e) {
      debugPrint('Error fetching learner: $e');
      setState(() => _loading = false);
    }
  }

  Future<void> _registerFace() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FaceRecognitionScreen(
          mode: FaceMode.register,
          learnerId: widget.learnerId.toString(),
        ),
      ),
    );

    if (result != null && result is List<double>) {
      try {
        setState(() => _saving = true);
        final apiService = context.read<ApiService>();
        await apiService.uploadFaceEmbedding(
          learnerId: widget.learnerId,
          embedding: result,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Face registered and saved successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to save face: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _saving = false);
      }
    }
  }

  Future<void> _loadProfilePhoto() async {
    if (!mounted) return;
    setState(() {
      _profilePhotoUrl =
          '${ApiService.staticBaseUrl}/api/Learners/${widget.learnerId}/profile-photo?t=${DateTime.now().millisecondsSinceEpoch}';
    });
  }

  Future<void> _loadSignature() async {
    if (!mounted) return;
    setState(() {
      _signatureUrl =
          '${ApiService.staticBaseUrl}/api/Learners/${widget.learnerId}/signature?t=${DateTime.now().millisecondsSinceEpoch}';
    });
  }

  void _populateForm() {
    if (_learner == null) return;

    _titleController.text = _learner!['title'] ?? '';
    _firstNameController.text = _learner!['firstName'] ?? '';
    _lastNameController.text = _learner!['lastName'] ?? '';
    _idNumberController.text = _learner!['idNumber'] ?? '';
    _contactNumberController.text = _learner!['contactNumber'] ?? '';
    _emailController.text = _learner!['email'] ?? '';
    _addressLine1Controller.text = _learner!['addressLine1'] ?? '';
    _addressLine2Controller.text = _learner!['addressLine2'] ?? '';
    _addressLine3Controller.text = _learner!['addressLine3'] ?? '';
    _postalCodeController.text = _learner!['postalCode'] ?? '';
    _highSchoolNameController.text = _learner!['highSchoolName'] ?? '';
    _yearOfCompletionController.text =
        _learner!['yearOfCompletion']?.toString() ?? '';
    _schoolLocationController.text = _learner!['schoolLocation'] ?? '';
    _nextOfKinNameController.text = _learner!['nextOfKinName'] ?? '';
    _nextOfKinContactController.text =
        _learner!['nextOfKinContactNumber'] ?? '';
    _accountNumberController.text = _learner!['accountNumber'] ?? '';
    _branchCodeController.text = _learner!['branchCode'] ?? '';

    _gender = _learner!['gender'];
    _race = _learner!['race'];
    _homeLanguage = _learner!['homeLanguage'];
    _disability = _learner!['disability'];
    _highestGradePassed = _learner!['highestGradePassed'];
    _nextOfKinRelation = _learner!['nextOfKinRelation'];
    _bankName = _learner!['bankName'];
    _accountType = _learner!['accountType'];
  }

  Future<void> _capturePhoto() async {
    final picker = ImagePicker();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Take Photo'),
        content: const Text('Choose photo source'),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final image = await picker.pickImage(
                source: ImageSource.camera,
                maxWidth: 800,
                maxHeight: 800,
                imageQuality: 85,
              );
              if (image != null) {
                await _uploadPhoto(image.path);
              }
            },
            child: const Text('Camera'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final image = await picker.pickImage(
                source: ImageSource.gallery,
                maxWidth: 800,
                maxHeight: 800,
                imageQuality: 85,
              );
              if (image != null) {
                await _uploadPhoto(image.path);
              }
            },
            child: const Text('Gallery'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadPhoto(String imagePath) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final apiService = context.read<ApiService>();
      await apiService.uploadProfilePhoto(
        learnerId: widget.learnerId,
        filePath: imagePath,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo uploaded successfully')),
        );
        _loadProfilePhoto();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    }
  }

  Future<void> _showSignaturePad() async {
    final SignatureController controller = SignatureController(
      penStrokeWidth: 3,
      penColor: Colors.black,
      exportBackgroundColor: Colors.white,
    );

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Learner Signature'),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                ),
                child: Signature(
                  controller: controller,
                  height: 200,
                  width: MediaQuery.of(context).size.width * 0.7,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Please sign inside the box above',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              controller.clear();
            },
            child: const Text('Clear'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.isNotEmpty) {
                final signature = await controller.toPngBytes();
                if (signature != null) {
                  final tempDir = await getTemporaryDirectory();
                  final file =
                      await File('${tempDir.path}/signature.png').create();
                  await file.writeAsBytes(signature);
                  await _uploadSignature(file.path);
                  if (mounted) Navigator.pop(context);
                }
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();
  }

  Future<void> _uploadSignature(String filePath) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final apiService = context.read<ApiService>();
      await apiService.uploadSignature(
        learnerId: widget.learnerId,
        filePath: filePath,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Signature saved successfully')),
        );
        _loadSignature();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save signature: $e')),
        );
      }
    }
  }

  Future<void> _saveLearner() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    try {
      final apiService = context.read<ApiService>();

      final data = {
        'Title': _titleController.text,
        'FirstName': _firstNameController.text,
        'LastName': _lastNameController.text,
        'IdNumber': _idNumberController.text,
        'ContactNumber': _contactNumberController.text,
        'Email': _emailController.text,
        'Gender': _gender,
        'Race': _race,
        'HomeLanguage': _homeLanguage,
        'Disability': _disability,
        'AddressLine1': _addressLine1Controller.text,
        'AddressLine2': _addressLine2Controller.text,
        'AddressLine3': _addressLine3Controller.text,
        'PostalCode': _postalCodeController.text,
        'HighSchoolName': _highSchoolNameController.text,
        'YearOfCompletion': _yearOfCompletionController.text.isEmpty
            ? null
            : int.tryParse(_yearOfCompletionController.text),
        'SchoolLocation': _schoolLocationController.text,
        'HighestGradePassed': _highestGradePassed,
        'NextOfKinName': _nextOfKinNameController.text,
        'NextOfKinRelation': _nextOfKinRelation,
        'NextOfKinContactNumber': _nextOfKinContactController.text,
        'BankName': _bankName,
        'AccountType': _accountType,
        'AccountNumber': _accountNumberController.text,
        'BranchCode': _branchCodeController.text,
      };

      await apiService.put('/api/Learners/${widget.learnerId}', data: data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Learner updated successfully')),
        );
        setState(() {
          _editing = false;
          _saving = false;
        });
        _fetchLearnerDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update failed: $e')),
        );
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Learner Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_learner == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Learner Details')),
        body: const Center(child: Text('Learner not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('${_learner!['firstName']} ${_learner!['lastName']}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.face),
            onPressed: _registerFace,
            tooltip: 'Register Face',
          ),
          IconButton(
            icon: const Icon(Icons.fingerprint),
            onPressed: () {
              context.push(
                '/learners/${widget.learnerId}/fingerprints?name=${Uri.encodeComponent('${_learner!['firstName']} ${_learner!['lastName']}')}',
              );
            },
            tooltip: 'Register Fingerprints',
          ),
          IconButton(
            icon: const Icon(Icons.gesture),
            onPressed: _showSignaturePad,
            tooltip: 'Learner Signature',
          ),
          if (!_editing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => setState(() => _editing = true),
            ),
          if (_editing)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                setState(() => _editing = false);
                _populateForm();
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Profile Photo
              GestureDetector(
                onTap: _editing ? _capturePhoto : null,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 60,
                      backgroundColor: const Color(0xFF334155),
                      backgroundImage: _profilePhotoUrl != null
                          ? NetworkImage(_profilePhotoUrl!)
                          : null,
                      child: _profilePhotoUrl == null
                          ? const Icon(Icons.person,
                              size: 60, color: Colors.white)
                          : null,
                    ),
                    if (_editing)
                      const Positioned(
                        bottom: 0,
                        right: 0,
                        child: CircleAvatar(
                          backgroundColor: Color(0xFF0EA5E9),
                          radius: 20,
                          child: Icon(Icons.camera_alt,
                              size: 20, color: Colors.white),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // Form fields
              _buildTextField('Title', _titleController, enabled: _editing),
              _buildTextField('First Name', _firstNameController,
                  enabled: _editing, required: true),
              _buildTextField('Last Name', _lastNameController,
                  enabled: _editing, required: true),
              _buildTextField('ID Number', _idNumberController,
                  enabled: _editing, required: true),
              _buildTextField('Contact Number', _contactNumberController,
                  enabled: _editing),
              _buildTextField('Email', _emailController, enabled: _editing),

              _buildDropdown('Gender', _gender, ['Male', 'Female', 'Other'],
                  (val) => setState(() => _gender = val),
                  enabled: _editing),
              _buildDropdown(
                  'Race',
                  _race,
                  ['Asian', 'Black', 'Colored', 'White', 'Other'],
                  (val) => setState(() => _race = val),
                  enabled: _editing),
              _buildDropdown(
                  'Home Language',
                  _homeLanguage,
                  [
                    'English',
                    'IsiZulu',
                    'Sesotho',
                    'IsiXhosa',
                    'Tshonga',
                    'Afrikaans'
                  ],
                  (val) => setState(() => _homeLanguage = val),
                  enabled: _editing),
              _buildDropdown(
                  'Disability',
                  _disability,
                  [
                    'None',
                    'Visual Impairment',
                    'Hearing Impairment',
                    'Physical Disability',
                    'Mental Disability',
                    'Other'
                  ],
                  (val) => setState(() => _disability = val),
                  enabled: _editing),

              const SizedBox(height: 20),
              const Text('Address',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 10),
              _buildTextField('Address Line 1', _addressLine1Controller,
                  enabled: _editing),
              _buildTextField('Address Line 2', _addressLine2Controller,
                  enabled: _editing),
              _buildTextField('Address Line 3', _addressLine3Controller,
                  enabled: _editing),
              _buildTextField('Postal Code', _postalCodeController,
                  enabled: _editing),

              const SizedBox(height: 20),
              const Text('Education',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 10),
              _buildTextField('High School Name', _highSchoolNameController,
                  enabled: _editing),
              _buildTextField('Year of Completion', _yearOfCompletionController,
                  enabled: _editing),
              _buildTextField('School Location', _schoolLocationController,
                  enabled: _editing),
              _buildDropdown(
                  'Highest Grade Passed',
                  _highestGradePassed,
                  [
                    'Grade 9',
                    'Grade 10',
                    'Grade 11',
                    'Grade 12',
                    'N1',
                    'N2',
                    'N3',
                    'N4',
                    'N5',
                    'N6'
                  ],
                  (val) => setState(() => _highestGradePassed = val),
                  enabled: _editing),

              const SizedBox(height: 20),
              const Text('Next of Kin',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 10),
              _buildTextField('Next of Kin Name', _nextOfKinNameController,
                  enabled: _editing),
              _buildDropdown(
                  'Relation',
                  _nextOfKinRelation,
                  ['Parent', 'Sibling', 'Spouse', 'Child', 'Friend', 'Other'],
                  (val) => setState(() => _nextOfKinRelation = val),
                  enabled: _editing),
              _buildTextField(
                  'Next of Kin Contact', _nextOfKinContactController,
                  enabled: _editing),

              const SizedBox(height: 20),
              const Text('Banking',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 10),
              _buildDropdown(
                  'Bank Name',
                  _bankName,
                  [
                    'ABSA',
                    'Capitec',
                    'FNB',
                    'Nedbank',
                    'Standard Bank',
                    'Other'
                  ],
                  (val) => setState(() => _bankName = val),
                  enabled: _editing),
              _buildDropdown(
                  'Account Type',
                  _accountType,
                  ['Savings', 'Cheque', 'Transmission', 'Other'],
                  (val) => setState(() => _accountType = val),
                  enabled: _editing),
              _buildTextField('Account Number', _accountNumberController,
                  enabled: _editing),
              _buildTextField('Branch Code', _branchCodeController,
                  enabled: _editing),

              const SizedBox(height: 20),
              const Text('Learner Signature',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                height: 150,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: _signatureUrl != null
                    ? Image.network(
                        _signatureUrl!,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) =>
                            const Center(
                                child: Text('No signature recorded',
                                    style: TextStyle(color: Colors.grey))),
                      )
                    : const Center(
                        child: Text('No signature recorded',
                            style: TextStyle(color: Colors.grey))),
              ),

              const SizedBox(height: 30),

              if (_editing)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _saveLearner,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0EA5E9),
                      padding: const EdgeInsets.all(16),
                    ),
                    child: _saving
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Save Changes',
                            style: TextStyle(fontSize: 16)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller,
      {bool enabled = true, bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        readOnly: !enabled,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label + (required ? ' *' : ''),
          labelStyle: const TextStyle(color: Color(0xFF94a3b8)),
          filled: true,
          fillColor:
              enabled ? const Color(0xFF1e293b) : const Color(0xFF0f172a),
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
            borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 2),
          ),
        ),
        validator: required
            ? (value) => value?.isEmpty ?? true ? '$label is required' : null
            : null,
      ),
    );
  }

  Widget _buildDropdown(String label, String? value, List<String> items,
      Function(String?) onChanged,
      {bool enabled = true}) {
    // Ensure value is either null or exists in items list
    final validValue = (value != null && items.contains(value)) ? value : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DropdownButtonFormField<String>(
        initialValue: validValue,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Color(0xFF94a3b8)),
          filled: true,
          fillColor:
              enabled ? const Color(0xFF1e293b) : const Color(0xFF0f172a),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
        ),
        disabledHint: validValue != null
            ? Text(validValue, style: const TextStyle(color: Colors.white))
            : null,
        dropdownColor: const Color(0xFF1e293b),
        style: const TextStyle(color: Colors.white),
        items: items.map((item) {
          return DropdownMenuItem(
              value: item,
              child: Text(item, style: const TextStyle(color: Colors.white)));
        }).toList(),
        onChanged: enabled ? onChanged : null,
      ),
    );
  }
}
