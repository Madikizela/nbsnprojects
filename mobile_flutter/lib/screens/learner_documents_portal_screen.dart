import 'package:flutter/material.dart';
import 'package:cunning_document_scanner/cunning_document_scanner.dart';
import 'package:image_picker/image_picker.dart';
import '../services/learner_auth_service.dart';
import '../services/api_service.dart';

class LearnerDocumentsPortalScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerDocumentsPortalScreen({super.key, required this.authService});

  @override
  State<LearnerDocumentsPortalScreen> createState() =>
      _LearnerDocumentsPortalScreenState();
}

class _LearnerDocumentsPortalScreenState
    extends State<LearnerDocumentsPortalScreen> {
  final _api = ApiService();
  List<dynamic> _docs = [];
  bool _loading = true;
  bool _uploading = false;
  String _msg = '';
  String _docType = 'ID Document';

  final _docTypes = [
    'ID Document',
    'Proof of Residence',
    'Qualifications',
    'CV',
    'Bank Confirmation Letter',
  ];

  @override
  void initState() {
    super.initState();
    _loadDocs();
  }

  Future<void> _loadDocs() async {
    final id = widget.authService.learnerId;
    if (id == null) return;
    try {
      final r = await _api.get('/api/LearnerDocuments/learner/$id');
      if (mounted) {
        setState(() {
          _docs = r.data as List;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    final id = widget.authService.learnerId;
    if (id == null) return;
    setState(() {
      _uploading = true;
      _msg = '';
    });
    try {
      List<String> filePaths;

      if (source == ImageSource.camera) {
        // Use edge-detecting document scanner
        final scanned = await CunningDocumentScanner.getPictures(noOfPages: 5);
        if (scanned == null || scanned.isEmpty) {
          setState(() => _uploading = false);
          return;
        }
        filePaths = scanned;
      } else {
        // Gallery picker (multi-image)
        final picker = ImagePicker();
        final picked = await picker.pickMultiImage(imageQuality: 85);
        if (picked.isEmpty) {
          setState(() => _uploading = false);
          return;
        }
        filePaths = picked.map((x) => x.path).toList();
      }

      await _api.uploadDocument(
        learnerId: id,
        documentType: _docType,
        filePaths: filePaths,
      );
      setState(() => _msg = '✅ Document uploaded');
      await _loadDocs();
    } catch (e) {
      setState(
          () => _msg = '❌ Upload failed: ${ApiService.getErrorMessage(e)}');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _showUploadOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1e293b),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: DropdownButtonFormField<String>(
              initialValue: _docType,
              dropdownColor: const Color(0xFF1e293b),
              items: _docTypes
                  .map((t) => DropdownMenuItem(
                      value: t,
                      child:
                          Text(t, style: const TextStyle(color: Colors.white))))
                  .toList(),
              onChanged: (v) => setState(() => _docType = v ?? _docType),
              decoration: InputDecoration(
                labelText: 'Document Type',
                labelStyle: const TextStyle(color: Color(0xFF94a3b8)),
                filled: true,
                fillColor: const Color(0xFF0f172a),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF334155))),
              ),
              style: const TextStyle(color: Colors.white),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.document_scanner, color: Colors.white),
            title: const Text('Scan Document',
                style: TextStyle(color: Colors.white)),
            subtitle: const Text('Auto edge detection',
                style: TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
            onTap: () {
              Navigator.pop(context);
              _pickAndUpload(ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library, color: Colors.white),
            title: const Text('Choose from Gallery',
                style: TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
              _pickAndUpload(ImageSource.gallery);
            },
          ),
        ]),
      ),
    );
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'Approved':
        return Colors.green;
      case 'Declined':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('My Documents'),
        backgroundColor: const Color(0xFF1e293b),
        foregroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _uploading ? null : _showUploadOptions,
        backgroundColor: const Color(0xFF0EA5E9),
        icon: _uploading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.upload_file),
        label: Text(_uploading ? 'Uploading…' : 'Upload Document'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_msg.isNotEmpty)
                  Container(
                    width: double.infinity,
                    color: _msg.startsWith('✅')
                        ? Colors.green.shade900
                        : Colors.red.shade900,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    child:
                        Text(_msg, style: const TextStyle(color: Colors.white)),
                  ),
                Expanded(
                  child: _docs.isEmpty
                      ? const Center(
                          child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.folder_open,
                                    size: 64, color: Color(0xFF334155)),
                                SizedBox(height: 12),
                                Text('No documents yet',
                                    style: TextStyle(
                                        color: Color(0xFF64748b),
                                        fontSize: 16)),
                                SizedBox(height: 4),
                                Text('Tap the button below to upload',
                                    style: TextStyle(
                                        color: Color(0xFF475569),
                                        fontSize: 13)),
                              ]),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _docs.length,
                          itemBuilder: (_, i) {
                            final d = _docs[i] as Map<String, dynamic>;
                            final status =
                                d['approvalStatus'] as String? ?? 'Pending';
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1e293b),
                                borderRadius: BorderRadius.circular(10),
                                border:
                                    Border.all(color: const Color(0xFF334155)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.insert_drive_file,
                                      color: Color(0xFF0EA5E9), size: 32),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(d['documentType'] ?? 'Document',
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w600)),
                                        Text(d['fileName'] ?? '',
                                            style: const TextStyle(
                                                color: Color(0xFF94a3b8),
                                                fontSize: 12)),
                                        Text(
                                            '${((d['fileSize'] as int? ?? 0) / 1024).toStringAsFixed(0)} KB',
                                            style: const TextStyle(
                                                color: Color(0xFF64748b),
                                                fontSize: 11)),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(status)
                                          .withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                          color: _statusColor(status)),
                                    ),
                                    child: Text(status,
                                        style: TextStyle(
                                            color: _statusColor(status),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600)),
                                  ),
                                ],
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
