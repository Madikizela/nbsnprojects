import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:cunning_document_scanner/cunning_document_scanner.dart';
import 'package:dio/dio.dart';
import '../services/api_service.dart';

class SickNoteUploadScreen extends StatefulWidget {
  final int classId;

  const SickNoteUploadScreen({super.key, required this.classId});

  @override
  State<SickNoteUploadScreen> createState() => _SickNoteUploadScreenState();
}

class _SickNoteUploadScreenState extends State<SickNoteUploadScreen> {
  final _formKey = GlobalKey<FormState>();
  List<dynamic> learners = [];
  int? selectedLearnerId;
  String medicalFacility = '';
  String practitionerName = '';
  DateTime startDate = DateTime.now();
  DateTime endDate = DateTime.now();
  DateTime issuedDate = DateTime.now();
  String? scannedFilePath;
  bool isLoading = true;
  bool isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _fetchLearners();
  }

  Future<void> _fetchLearners() async {
    try {
      final apiService = context.read<ApiService>();
      final response =
          await apiService.get('/api/Learners/class/${widget.classId}');
      setState(() {
        learners = response.data ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiService.getErrorMessage(e))),
        );
      }
    }
  }

  Future<void> _scanDocument() async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      List<String>? pictures = await CunningDocumentScanner.getPictures();
      if (pictures != null && pictures.isNotEmpty) {
        setState(() {
          scannedFilePath = pictures.first;
        });
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text('Error scanning document: $e')),
        );
      }
    }
  }

  Future<void> _submitSickNote() async {
    if (!_formKey.currentState!.validate() ||
        scannedFilePath == null ||
        selectedLearnerId == null) {
      if (scannedFilePath == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please scan the sick note document')),
        );
      }
      return;
    }

    _formKey.currentState!.save();
    setState(() => isSubmitting = true);

    final apiService = context.read<ApiService>();
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

    try {
      FormData formData = FormData.fromMap({
        'LearnerId': selectedLearnerId,
        'MedicalFacility': medicalFacility,
        'PractitionerName': practitionerName,
        'StartDate': startDate.toIso8601String(),
        'EndDate': endDate.toIso8601String(),
        'IssuedDate': issuedDate.toIso8601String(),
        'File': await MultipartFile.fromFile(scannedFilePath!,
            filename: 'sicknote.jpg'),
      });

      final response =
          await apiService.post('/api/SickNote/upload', data: formData);

      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(
              content: Text(
                  'Sick note uploaded successfully! It will be reviewed by finance.')),
        );
        nav.pop();
      }
    } catch (e) {
      setState(() => isSubmitting = false);
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text(ApiService.getErrorMessage(e))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Sick Note'),
        backgroundColor: const Color(0xFF1e293b),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sick Note Details',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white),
                    ),
                    const SizedBox(height: 20),

                    // Learner Selection
                    DropdownButtonFormField<int>(
                      dropdownColor: const Color(0xFF1e293b),
                      decoration:
                          _inputDecoration('Select Learner', Icons.person),
                      items: learners.map((l) {
                        return DropdownMenuItem<int>(
                          value: l['id'],
                          child: Text('${l['firstName']} ${l['lastName']}',
                              style: const TextStyle(color: Colors.white)),
                        );
                      }).toList(),
                      onChanged: (val) =>
                          setState(() => selectedLearnerId = val),
                      validator: (val) =>
                          val == null ? 'Please select a learner' : null,
                    ),
                    const SizedBox(height: 16),

                    // Medical Facility
                    TextFormField(
                      decoration: _inputDecoration(
                          'Medical Facility Name', Icons.local_hospital),
                      style: const TextStyle(color: Colors.white),
                      onSaved: (val) => medicalFacility = val ?? '',
                      validator: (val) => val == null || val.isEmpty
                          ? 'Enter facility name'
                          : null,
                    ),
                    const SizedBox(height: 16),

                    // Practitioner Name
                    TextFormField(
                      decoration:
                          _inputDecoration('Doctor/Nurse Name', Icons.badge),
                      style: const TextStyle(color: Colors.white),
                      onSaved: (val) => practitionerName = val ?? '',
                      validator: (val) => val == null || val.isEmpty
                          ? 'Enter practitioner name'
                          : null,
                    ),
                    const SizedBox(height: 16),

                    // Date Selection
                    _buildDateTile('Issued Date', issuedDate,
                        (date) => setState(() => issuedDate = date)),
                    _buildDateTile('Start Date', startDate,
                        (date) => setState(() => startDate = date)),
                    _buildDateTile('End Date', endDate,
                        (date) => setState(() => endDate = date)),

                    const SizedBox(height: 24),

                    // Document Scan Section
                    const Text(
                      'Evidence Scan',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: _scanDocument,
                      child: Container(
                        height: 150,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFF334155),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: const Color(0xFF8B5CF6),
                              width: 2,
                              style: BorderStyle.solid),
                        ),
                        child: scannedFilePath == null
                            ? const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.camera_alt,
                                      color: Color(0xFF8B5CF6), size: 48),
                                  SizedBox(height: 8),
                                  Text('Tap to Scan Sick Note',
                                      style: TextStyle(color: Colors.white70)),
                                ],
                              )
                            : ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.file(File(scannedFilePath!),
                                    fit: BoxFit.cover),
                              ),
                      ),
                    ),
                    if (scannedFilePath != null)
                      TextButton.icon(
                        onPressed: _scanDocument,
                        icon:
                            const Icon(Icons.refresh, color: Color(0xFF8B5CF6)),
                        label: const Text('Rescan Document',
                            style: TextStyle(color: Color(0xFF8B5CF6))),
                      ),

                    const SizedBox(height: 32),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: isSubmitting ? null : _submitSickNote,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B5CF6),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: isSubmitting
                            ? const CircularProgressIndicator(
                                color: Colors.white)
                            : const Text('Submit for Approval',
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white70),
      prefixIcon: Icon(icon, color: const Color(0xFF8B5CF6)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.white24),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
      ),
    );
  }

  Widget _buildDateTile(
      String label, DateTime date, Function(DateTime) onDateSelected) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label,
          style: const TextStyle(color: Colors.white70, fontSize: 14)),
      subtitle: Text(DateFormat('yyyy-MM-dd').format(date),
          style: const TextStyle(
              color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      trailing: const Icon(Icons.calendar_today, color: Color(0xFF8B5CF6)),
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date,
          firstDate: DateTime(2000),
          lastDate: DateTime(2101),
        );
        if (picked != null) onDateSelected(picked);
      },
    );
  }
}
