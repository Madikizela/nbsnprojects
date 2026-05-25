import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class AddLearnerScreen extends StatefulWidget {
  final int classId;

  const AddLearnerScreen({super.key, required this.classId});

  @override
  State<AddLearnerScreen> createState() => _AddLearnerScreenState();
}

class _AddLearnerScreenState extends State<AddLearnerScreen> {
  final _formKey = GlobalKey<FormState>();
  bool isLoading = false;
  String idError = '';

  final Map<String, TextEditingController> controllers = {
    'title': TextEditingController(),
    'firstName': TextEditingController(),
    'lastName': TextEditingController(),
    'idNumber': TextEditingController(),
    'contactNumber': TextEditingController(),
    'email': TextEditingController(),
    'dateOfBirth': TextEditingController(),
    'age': TextEditingController(),
    'gender': TextEditingController(),
    'race': TextEditingController(),
    'homeLanguage': TextEditingController(),
    'disability': TextEditingController(text: 'None'),
    'addressLine1': TextEditingController(),
    'addressLine2': TextEditingController(),
    'addressLine3': TextEditingController(),
    'postalCode': TextEditingController(),
    'highSchoolName': TextEditingController(),
    'yearOfCompletion': TextEditingController(),
    'schoolLocation': TextEditingController(),
    'highestGradePassed': TextEditingController(),
    'nextOfKinName': TextEditingController(),
    'nextOfKinRelation': TextEditingController(),
    'nextOfKinContactNumber': TextEditingController(),
    'bankName': TextEditingController(),
    'accountType': TextEditingController(),
    'accountNumber': TextEditingController(),
    'branchCode': TextEditingController(),
  };

  // Dropdown Options
  final List<String> titles = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'];
  final List<String> genders = ['Male', 'Female', 'Other'];
  final List<String> disabilities = [
    'None',
    'Physical',
    'Visual',
    'Hearing',
    'Mental',
    'Other'
  ];
  final List<String> races = [
    'African',
    'Coloured',
    'Indian',
    'White',
    'Other'
  ];
  final List<String> languages = [
    'English',
    'Afrikaans',
    'isiZulu',
    'isiXhosa',
    'Sepedi',
    'Sesotho',
    'Setswana',
    'siSwati',
    'Tshivenda',
    'Xitsonga',
    'isiNdebele'
  ];
  final List<String> banks = [
    'Absa',
    'Capitec',
    'FNB',
    'Nedbank',
    'Standard Bank',
    'African Bank',
    'Bidvest Bank',
    'Discovery Bank',
    'Investec',
    'TymeBank'
  ];

  @override
  void dispose() {
    for (var controller in controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Map<String, dynamic>? parseSouthAfricanID(String idNumber) {
    if (idNumber.length != 13 || !RegExp(r'^\d{13}$').hasMatch(idNumber)) {
      return {'valid': false, 'error': 'ID must be 13 digits'};
    }

    final year = int.parse(idNumber.substring(0, 2));
    final month = int.parse(idNumber.substring(2, 4));
    final day = int.parse(idNumber.substring(4, 6));
    final genderCode = int.parse(idNumber.substring(6, 10));

    if (month < 1 || month > 12) {
      return {'valid': false, 'error': 'Invalid month'};
    }
    if (day < 1 || day > 31) return {'valid': false, 'error': 'Invalid day'};

    final currentYear = DateTime.now().year % 100;
    final fullYear = year <= currentYear + 10 ? 2000 + year : 1900 + year;
    final dateOfBirth =
        '$fullYear-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';

    final birthDate = DateTime.parse(dateOfBirth);
    final today = DateTime.now();
    int age = today.year - birthDate.year;
    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }

    final gender = genderCode < 5000 ? 'Female' : 'Male';

    return {
      'valid': true,
      'dateOfBirth': dateOfBirth,
      'age': age,
      'gender': gender
    };
  }

  void handleIdNumberChange(String value) {
    final digitsOnly = value
        .replaceAll(RegExp(r'\D'), '')
        .substring(0, value.length > 13 ? 13 : value.length);
    controllers['idNumber']!.text = digitsOnly;

    if (digitsOnly.length == 13) {
      final result = parseSouthAfricanID(digitsOnly);
      if (result!['valid']) {
        setState(() {
          idError = '';
          controllers['dateOfBirth']!.text = result['dateOfBirth'];
          controllers['age']!.text = result['age'].toString();
          controllers['gender']!.text = result['gender'];
        });
      } else {
        setState(() => idError = result['error']);
      }
    } else {
      setState(() => idError = '');
    }
  }

  Future<void> handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (idError.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fix ID number errors')),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      final apiService = context.read<ApiService>();
      final payload = {
        'siteClassId': widget.classId,
        'title': controllers['title']!.text,
        'firstName': controllers['firstName']!.text,
        'lastName': controllers['lastName']!.text,
        'idNumber': controllers['idNumber']!.text,
        'contactNumber': controllers['contactNumber']!.text,
        'email': controllers['email']!.text,
        'dateOfBirth': controllers['dateOfBirth']!.text,
        'age': int.tryParse(controllers['age']!.text) ?? 0,
        'gender': controllers['gender']!.text,
        'race': controllers['race']!.text,
        'homeLanguage': controllers['homeLanguage']!.text,
        'disability': controllers['disability']!.text,
        'addressLine1': controllers['addressLine1']!.text,
        'addressLine2': controllers['addressLine2']!.text,
        'addressLine3': controllers['addressLine3']!.text,
        'postalCode': controllers['postalCode']!.text,
        'highSchoolName': controllers['highSchoolName']!.text,
        'yearOfCompletion': int.tryParse(controllers['yearOfCompletion']!.text),
        'schoolLocation': controllers['schoolLocation']!.text,
        'highestGradePassed': controllers['highestGradePassed']!.text,
        'nextOfKinName': controllers['nextOfKinName']!.text,
        'nextOfKinRelation': controllers['nextOfKinRelation']!.text,
        'nextOfKinContactNumber': controllers['nextOfKinContactNumber']!.text,
        'bankName': controllers['bankName']!.text,
        'accountType': controllers['accountType']!.text,
        'accountNumber': controllers['accountNumber']!.text,
        'branchCode': controllers['branchCode']!.text,
      };

      await apiService.post('/api/learners', data: payload);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Learner added successfully')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add learner: $e')),
        );
      }
    } finally {
      setState(() => isLoading = false);
    }
  }

  Widget buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0EA5E9))),
        const SizedBox(height: 16),
        ...children,
        const SizedBox(height: 24),
      ],
    );
  }

  Widget buildDropdownField(String label, String key, List<String> options,
      {bool required = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label${required ? ' *' : ''}',
            style: const TextStyle(fontSize: 14, color: Colors.white70)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: controllers[key]!.text.isEmpty
              ? null
              : (options.contains(controllers[key]!.text)
                  ? controllers[key]!.text
                  : null),
          dropdownColor: const Color(0xFF1e293b),
          items: options.map((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(value, style: const TextStyle(color: Colors.white)),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              controllers[key]!.text = value ?? '';
            });
          },
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
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
          ),
          validator: required
              ? (value) => value == null || value.isEmpty ? 'Required' : null
              : null,
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget buildTextField(String label, String key,
      {bool required = false, TextInputType? keyboardType, int? maxLength}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label${required ? ' *' : ''}',
            style: const TextStyle(fontSize: 14, color: Colors.white70)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controllers[key],
          keyboardType: keyboardType,
          maxLength: maxLength,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
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
            counterText: '',
          ),
          validator: required
              ? (value) => value?.isEmpty ?? true ? 'Required' : null
              : null,
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Learner')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            buildSection('👤 Basic Information', [
              buildDropdownField('Title', 'title', titles, required: true),
              buildTextField('First Name', 'firstName', required: true),
              buildTextField('Last Name', 'lastName', required: true),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('SA ID Number * (13 digits)',
                      style: TextStyle(fontSize: 14, color: Colors.white70)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: controllers['idNumber'],
                    keyboardType: TextInputType.number,
                    maxLength: 13,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFF1e293b),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(
                            color: idError.isNotEmpty
                                ? Colors.red
                                : const Color(0xFF334155)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(
                            color: idError.isNotEmpty
                                ? Colors.red
                                : const Color(0xFF334155)),
                      ),
                      counterText: '',
                    ),
                    onChanged: handleIdNumberChange,
                    validator: (value) =>
                        value?.isEmpty ?? true ? 'Required' : null,
                  ),
                  if (idError.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(idError,
                          style:
                              const TextStyle(fontSize: 12, color: Colors.red)),
                    ),
                  if (controllers['dateOfBirth']!.text.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0x2010b981),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '✓ DOB: ${controllers['dateOfBirth']!.text} | Age: ${controllers['age']!.text} | Gender: ${controllers['gender']!.text}',
                        style: const TextStyle(
                            color: Color(0xFF10b981), fontSize: 14),
                      ),
                    ),
                  const SizedBox(height: 16),
                ],
              ),
              buildTextField('Contact Number', 'contactNumber',
                  keyboardType: TextInputType.phone, maxLength: 10),
              buildTextField('Email', 'email',
                  keyboardType: TextInputType.emailAddress),
              buildDropdownField('Gender', 'gender', genders, required: true),
              buildDropdownField('Race', 'race', races, required: true),
              buildDropdownField('Home Language', 'homeLanguage', languages,
                  required: true),
              buildDropdownField('Disability', 'disability', disabilities,
                  required: true),
            ]),
            buildSection('🏠 Address Information', [
              buildTextField('Address Line 1', 'addressLine1'),
              buildTextField('Address Line 2', 'addressLine2'),
              buildTextField('Address Line 3', 'addressLine3'),
              buildTextField('Postal Code', 'postalCode',
                  keyboardType: TextInputType.number, maxLength: 4),
            ]),
            buildSection('🎓 Education Information', [
              buildTextField('High School Name', 'highSchoolName'),
              buildTextField('School Location', 'schoolLocation'),
              buildTextField('Highest Grade Passed', 'highestGradePassed'),
              buildTextField('Year of Completion', 'yearOfCompletion',
                  keyboardType: TextInputType.number, maxLength: 4),
            ]),
            buildSection('👨‍👩‍👧 Next of Kin', [
              buildTextField('Next of Kin Name', 'nextOfKinName'),
              buildTextField('Relation', 'nextOfKinRelation'),
              buildTextField(
                  'Next of Kin Contact Number', 'nextOfKinContactNumber',
                  keyboardType: TextInputType.phone, maxLength: 10),
            ]),
            buildSection('🏦 Banking Information', [
              buildDropdownField('Bank Name', 'bankName', banks,
                  required: true),
              buildTextField('Account Type', 'accountType'),
              buildTextField('Account Number', 'accountNumber',
                  keyboardType: TextInputType.number, maxLength: 11),
              buildTextField('Branch Code', 'branchCode',
                  keyboardType: TextInputType.number, maxLength: 6),
            ]),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading ? null : handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0EA5E9),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('💾 Add Learner',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
