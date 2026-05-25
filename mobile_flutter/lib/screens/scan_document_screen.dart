import 'package:flutter/material.dart';
import 'package:cunning_document_scanner/cunning_document_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../services/api_service.dart';

class ScanDocumentScreen extends StatefulWidget {
  final int learnerId;
  final String learnerName;

  const ScanDocumentScreen({
    super.key,
    required this.learnerId,
    required this.learnerName,
  });

  @override
  State<ScanDocumentScreen> createState() => _ScanDocumentScreenState();
}

class _ScanDocumentScreenState extends State<ScanDocumentScreen> {
  final List<String> _documentTypes = [
    'ID Document',
    'Qualifications',
    'Bank Confirmation Letter',
    'CV',
    'Proof of Residence',
  ];

  List<Map<String, dynamic>> _documents = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchDocuments();
  }

  Future<void> _fetchDocuments() async {
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService
          .get('/api/LearnerDocuments/learner/${widget.learnerId}');

      if (response.statusCode == 200) {
        setState(() {
          _documents = List<Map<String, dynamic>>.from(response.data ?? []);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching documents: $e');
      setState(() => _loading = false);
    }
  }

  Future<void> _scanDocument() async {
    try {
      // Use cunning_document_scanner for automatic edge detection
      final pictures = await CunningDocumentScanner.getPictures(
        noOfPages: 10, // Allow up to 10 pages
      );

      if (pictures != null && pictures.isNotEmpty) {
        await _showDocumentTypeDialog(pictures);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error scanning document: $e')),
        );
      }
    }
  }

  Future<void> _pickFromGallery() async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage();

    if (images.isNotEmpty) {
      await _showDocumentTypeDialog(images.map((img) => img.path).toList());
    }
  }

  Future<void> _showDocumentTypeDialog(List<String> imagePaths) async {
    final uploadedTypes = _documents.map((d) => d['documentType']).toList();
    final availableTypes =
        _documentTypes.where((type) => !uploadedTypes.contains(type)).toList();

    if (availableTypes.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('All document types have been uploaded')),
        );
      }
      return;
    }

    String? selectedType;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Select Document Type'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: availableTypes.map((type) {
              return RadioListTile<String>(
                title: Text(type),
                value: type,
                groupValue: selectedType,
                onChanged: (value) {
                  setDialogState(() => selectedType = value);
                },
              );
            }).toList(),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: selectedType == null
                  ? null
                  : () {
                      Navigator.pop(context);
                      _uploadDocument(imagePaths, selectedType!);
                    },
              child: const Text('Upload'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _uploadDocument(
      List<String> imagePaths, String documentType) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final apiService = context.read<ApiService>();
      await apiService.uploadDocument(
        learnerId: widget.learnerId,
        documentType: documentType,
        filePaths: imagePaths,
      );

      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document uploaded successfully')),
        );
        _fetchDocuments();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.learnerName),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  color: const Color(0xFF1e293b),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.learnerName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_documents.length} of ${_documentTypes.length} documents uploaded',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF94a3b8),
                        ),
                      ),
                    ],
                  ),
                ),

                // Action Buttons
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _scanDocument,
                          icon: const Icon(Icons.document_scanner),
                          label: const Column(
                            children: [
                              Text('Scan Document'),
                              Text(
                                'Auto edge detection',
                                style: TextStyle(fontSize: 11),
                              ),
                            ],
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0EA5E9),
                            padding: const EdgeInsets.all(16),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _pickFromGallery,
                          icon: const Icon(Icons.photo_library),
                          label: const Column(
                            children: [
                              Text('From Gallery'),
                              Text(
                                'Choose existing photo',
                                style: TextStyle(fontSize: 11),
                              ),
                            ],
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF334155),
                            padding: const EdgeInsets.all(16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Document Status
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Document Status',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _documentTypes.map((type) {
                          final isUploaded =
                              _documents.any((d) => d['documentType'] == type);
                          return Chip(
                            label: Text(
                              '${isUploaded ? '✓' : '○'} $type',
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.white),
                            ),
                            backgroundColor: isUploaded
                                ? const Color(0xff10b98120)
                                : const Color(0xff64748b20),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Documents List
                Expanded(
                  child: _documents.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.description,
                                  size: 64, color: Colors.grey),
                              SizedBox(height: 16),
                              Text(
                                'No Documents Yet',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Scan or upload documents using the buttons above',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF94a3b8),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(20),
                          itemCount: _documents.length,
                          itemBuilder: (context, index) {
                            final doc = _documents[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                leading: const CircleAvatar(
                                  backgroundColor: Color(0xFF334155),
                                  child: Icon(Icons.description,
                                      color: Colors.white),
                                ),
                                title: Text(
                                  doc['documentType'],
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                subtitle: Text(
                                  doc['fileName'] ?? '',
                                  style:
                                      const TextStyle(color: Color(0xFF94a3b8)),
                                ),
                                trailing: const CircleAvatar(
                                  backgroundColor: Color(0xFF10b981),
                                  radius: 15,
                                  child: Icon(Icons.check,
                                      color: Colors.white, size: 18),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
