import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cunning_document_scanner/cunning_document_scanner.dart';
import 'package:image_picker/image_picker.dart';
import '../services/learner_auth_service.dart';
import '../services/api_service.dart';

class LearnerAssessmentsPortalScreen extends StatefulWidget {
  final LearnerAuthService authService;
  const LearnerAssessmentsPortalScreen({super.key, required this.authService});

  @override
  State<LearnerAssessmentsPortalScreen> createState() =>
      _LearnerAssessmentsPortalScreenState();
}

class _LearnerAssessmentsPortalScreenState
    extends State<LearnerAssessmentsPortalScreen> {
  final _api = ApiService();
  List<Map<String, dynamic>> _unitStandards = [];
  List<Map<String, dynamic>> _progress = [];
  bool _loading = true;

  // Navigation state
  Map<String, dynamic>? _selectedUS;
  Map<String, dynamic>? _selectedAssessment;
  List<dynamic> _questions = [];

  // Answers: questionId -> {text?, file?}
  final Map<int, _Answer> _answers = {};
  bool _submitting = false;
  String _msg = '';

  @override
  void initState() {
    super.initState();
    _loadUnitStandards();
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  Map<String, dynamic>? _getProgress(int usId) {
    try {
      return _progress.firstWhere(
        (p) => p['projectQualificationUnitStandardId'] == usId,
      );
    } catch (_) {
      return null;
    }
  }

  // A unit standard is unlocked when the previous one has both formative AND summative completed
  bool _isUSUnlocked(int index) {
    if (index == 0) return true;
    final prev = _unitStandards[index - 1];
    final p = _getProgress(prev['id'] as int);
    return p != null &&
        p['formativeCompleted'] == true &&
        p['summativeCompleted'] == true;
  }

  // Summative is locked until formative is completed for this unit standard
  bool _isSummativeLocked(int usId) {
    final p = _getProgress(usId);
    return p == null || p['formativeCompleted'] != true;
  }

  Future<void> _loadUnitStandards() async {
    final id = widget.authService.learnerId;
    if (id == null) return;
    try {
      // Step 1: Get learner record with embedded classEnrollments
      final learnerR = await _api.get('/api/Learners/$id');
      final learner = learnerR.data as Map<String, dynamic>? ?? {};

      final enrollments = learner['classEnrollments'] as List? ?? [];
      if (enrollments.isEmpty) {
        setState(() => _loading = false);
        return;
      }

      // Step 2: Use the first active enrollment's siteClassId
      final active = enrollments.firstWhere(
        (e) => e['status'] == 'Active',
        orElse: () => enrollments[0],
      );
      final classId = active['siteClassId'] ?? active['siteClass']?['id'];
      if (classId == null) {
        setState(() => _loading = false);
        return;
      }

      // Step 3: Get site class -> projectSiteId
      final classR = await _api.get('/api/SiteClasses/$classId');
      final siteId = classR.data['projectSiteId'];
      if (siteId == null) {
        setState(() => _loading = false);
        return;
      }

      // Step 4: Get project site -> projectId
      final siteR = await _api.get('/api/ProjectSites/$siteId');
      final projectId = siteR.data['projectId'];
      if (projectId == null) {
        setState(() => _loading = false);
        return;
      }

      // Step 5: Load project details and progress in parallel
      final results = await Future.wait([
        _api.get('/api/Projects/$projectId/details'),
        _api.get('/api/LearnerAssessmentAnswers/learner/$id/progress'),
      ]);

      final projR = results[0];
      final progR = results[1];

      final List<Map<String, dynamic>> uss = [];
      final pathways = projR.data['learningPathways'] as List? ?? [];
      for (final p in pathways) {
        final quals = (p['qualifications'] as List? ?? []);
        for (final q in quals) {
          final qualName = q['occupationalQualification']?['name'] ??
              q['legacyQualification']?['name'] ??
              q['qualificationType']?['name'] ??
              'Unknown Qualification';
          for (final us in (q['unitStandards'] as List? ?? [])) {
            if (us == null) continue;
            uss.add({
              ...Map<String, dynamic>.from(us as Map),
              'qualificationName': qualName,
            });
          }
        }
      }

      final List<Map<String, dynamic>> prog =
          (progR.data as List?)?.cast<Map<String, dynamic>>() ?? [];

      if (mounted) {
        setState(() {
          _unitStandards = uss;
          _progress = prog;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading unit standards: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reloadProgress() async {
    final id = widget.authService.learnerId;
    if (id == null) return;
    try {
      final r =
          await _api.get('/api/LearnerAssessmentAnswers/learner/$id/progress');
      final prog = (r.data as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (mounted) setState(() => _progress = prog);
    } catch (e) {
      debugPrint('Error reloading progress: $e');
    }
  }

  Future<void> _openAssessment(Map<String, dynamic> a, String type) async {
    final id = widget.authService.learnerId;
    if (id == null) return;

    setState(() {
      _selectedAssessment = {...a, 'type': type};
      _questions = [];
      _answers.clear();
      _msg = '';
    });

    try {
      // Step 1: Load questions
      final questionsPath = type == 'Formative'
          ? '/api/Assessments/formative/${a['id']}/questions'
          : '/api/Assessments/summative/${a['id']}/questions';
      final questionsR = await _api.get(questionsPath);
      final questions = questionsR.data as List;

      // Step 2: Check for existing submissions
      final answersPath =
          '/api/LearnerAssessmentAnswers/learner/$id/assessment/${a['id']}/$type';
      final answersR = await _api.get(answersPath);
      final submittedAnswers = answersR.data as List? ?? [];

      if (mounted) {
        setState(() {
          _questions = questions;
          // Store submitted answers with their marks/feedback
          for (final ans in submittedAnswers) {
            final qId = ans['questionId'] as int?;
            if (qId != null) {
              _answers[qId] = _Answer(
                text: null, // No text for submitted (scanned) answers
                file: null,
                submitted: ans, // Store the entire submission data
              );
            }
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading assessment: $e');
    }
  }

  Future<void> _submitAnswers() async {
    final id = widget.authService.learnerId;
    if (id == null || _selectedAssessment == null) return;
    setState(() {
      _submitting = true;
      _msg = '';
    });
    try {
      for (final q in _questions) {
        final qId = q['id'] as int;
        final ans = _answers[qId];
        if (ans == null) continue;

        if (ans.file != null) {
          await _api.uploadAssessmentAnswers(
            learnerId: id,
            assessmentId: _selectedAssessment!['id'] as int,
            assessmentType: _selectedAssessment!['type'] as String,
            filePaths: [ans.file!.path],
          );
        } else if (ans.text != null && ans.text!.isNotEmpty) {
          // Write text to a temp file then upload
          final tmp = File(
              '${Directory.systemTemp.path}/q${q['questionNumber']}_answer.txt');
          await tmp.writeAsString(ans.text!);
          await _api.uploadAssessmentAnswers(
            learnerId: id,
            assessmentId: _selectedAssessment!['id'] as int,
            assessmentType: _selectedAssessment!['type'] as String,
            filePaths: [tmp.path],
          );
        }
      }
      setState(() => _msg = '✅ Answers submitted successfully!');
      _answers.clear();
      // Reload progress to update locks immediately
      await _reloadProgress();
    } catch (_) {
      setState(() => _msg = '❌ Submission failed. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _pickFile(int questionId, ImageSource source) async {
    try {
      if (source == ImageSource.camera) {
        // Use edge-detecting document scanner for answer sheets
        final scanned = await CunningDocumentScanner.getPictures(noOfPages: 1);
        if (scanned == null || scanned.isEmpty) return;
        setState(
            () => _answers[questionId] = _Answer(file: File(scanned.first)));
      } else {
        final picker = ImagePicker();
        final picked = await picker.pickImage(source: source, imageQuality: 85);
        if (picked == null) return;
        setState(() => _answers[questionId] = _Answer(file: File(picked.path)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error capturing image: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedAssessment != null && _questions.isNotEmpty) {
      return _buildAnswerPage(context);
    }
    if (_selectedUS != null) {
      return _buildAssessmentListPage(context);
    }
    return _buildUnitStandardListPage(context);
  }

  Widget _buildUnitStandardListPage(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('My Assessments'),
        backgroundColor: const Color(0xFF1e293b),
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _unitStandards.isEmpty
              ? const Center(
                  child: Text(
                      'No unit standards found.\nContact your facilitator.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF64748b), fontSize: 15)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _unitStandards.length,
                  itemBuilder: (_, i) {
                    final us = _unitStandards[i];
                    final unlocked = _isUSUnlocked(i);
                    final p = _getProgress(us['id'] as int);
                    final done = p != null &&
                        p['formativeCompleted'] == true &&
                        p['summativeCompleted'] == true;

                    return _card(
                      onTap: unlocked
                          ? () => setState(() {
                                _selectedUS = us;
                                _selectedAssessment = null;
                              })
                          : null, // Disable tap for locked items
                      child: Opacity(
                        opacity: unlocked ? 1.0 : 0.45,
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                            '${unlocked ? '' : '🔒 '}${us['unitStandardName'] ?? 'Unit Standard'}',
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15)),
                                        const SizedBox(height: 4),
                                        Text(
                                            'ID: ${us['unitStandardId']} · Credits: ${us['credits']} · Level: ${us['level']}',
                                            style: const TextStyle(
                                                color: Color(0xFF94a3b8),
                                                fontSize: 12)),
                                        if (us['qualificationName'] !=
                                            null) ...[
                                          const SizedBox(height: 2),
                                          Text(us['qualificationName'],
                                              style: const TextStyle(
                                                  color: Color(0xFF64748b),
                                                  fontSize: 11)),
                                        ],
                                      ],
                                    ),
                                  ),
                                  // Status badge
                                  Container(
                                    margin: const EdgeInsets.only(left: 8),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: done
                                          ? const Color(0x2010b981)
                                          : unlocked
                                              ? const Color(0x200EA5E9)
                                              : const Color(0x40334155),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: done
                                            ? const Color(0xFF10b981)
                                            : unlocked
                                                ? const Color(0xFF0EA5E9)
                                                : const Color(0xFF475569),
                                        width: 1,
                                      ),
                                    ),
                                    child: Text(
                                      done
                                          ? '✓ Complete'
                                          : unlocked
                                              ? (i == 0
                                                  ? 'Start here'
                                                  : 'Unlocked')
                                              : 'Locked',
                                      style: TextStyle(
                                        color: done
                                            ? const Color(0xFF10b981)
                                            : unlocked
                                                ? const Color(0xFF0EA5E9)
                                                : const Color(0xFF64748b),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              // Mini progress indicators
                              if (unlocked) ...[
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: p?['formativeCompleted'] == true
                                            ? const Color(0x3010b981)
                                            : const Color(0x60334155),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '${p?['formativeCompleted'] == true ? '✓' : '○'} Formative',
                                        style: TextStyle(
                                          color:
                                              p?['formativeCompleted'] == true
                                                  ? const Color(0xFF10b981)
                                                  : const Color(0xFF64748b),
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: p?['summativeCompleted'] == true
                                            ? const Color(0x3010b981)
                                            : const Color(0x60334155),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '${p?['summativeCompleted'] == true ? '✓' : '○'} Summative',
                                        style: TextStyle(
                                          color:
                                              p?['summativeCompleted'] == true
                                                  ? const Color(0xFF10b981)
                                                  : const Color(0xFF64748b),
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ]),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildAssessmentListPage(BuildContext context) {
    final usProgress = _getProgress(_selectedUS!['id'] as int);
    final summativeLocked = _isSummativeLocked(_selectedUS!['id'] as int);

    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_selectedUS?['unitStandardName'] ?? 'Assessments',
                style: const TextStyle(fontSize: 15)),
            if (_selectedUS?['qualificationName'] != null)
              Text(_selectedUS!['qualificationName'],
                  style:
                      const TextStyle(fontSize: 11, color: Color(0xFF94a3b8))),
          ],
        ),
        backgroundColor: const Color(0xFF1e293b),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _selectedUS = null),
        ),
      ),
      body: Column(
        children: [
          // Progress indicators at the top
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: usProgress?['formativeCompleted'] == true
                        ? const Color(0x2010b981)
                        : const Color(0x40334155),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: usProgress?['formativeCompleted'] == true
                          ? const Color(0xFF10b981)
                          : const Color(0xFF475569),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    '${usProgress?['formativeCompleted'] == true ? '✓' : '○'} Formative',
                    style: TextStyle(
                      color: usProgress?['formativeCompleted'] == true
                          ? const Color(0xFF10b981)
                          : const Color(0xFF94a3b8),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: usProgress?['summativeCompleted'] == true
                        ? const Color(0x2010b981)
                        : const Color(0x40334155),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: usProgress?['summativeCompleted'] == true
                          ? const Color(0xFF10b981)
                          : const Color(0xFF475569),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    '${usProgress?['summativeCompleted'] == true ? '✓' : '○'} Summative',
                    style: TextStyle(
                      color: usProgress?['summativeCompleted'] == true
                          ? const Color(0xFF10b981)
                          : const Color(0xFF94a3b8),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<List<dynamic>>>(
              future: Future.wait([
                _api
                    .get(
                        '/api/assessments/formative/unit-standard/${_selectedUS!['id']}')
                    .then((r) => r.data as List? ?? []),
                _api
                    .get(
                        '/api/assessments/summative/unit-standard/${_selectedUS!['id']}')
                    .then((r) => r.data as List? ?? []),
              ]),
              builder: (_, snap) {
                if (!snap.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                final formatives = snap.data![0];
                final summatives = snap.data![1];
                if (formatives.isEmpty && summatives.isEmpty) {
                  return const Center(
                      child: Text(
                          'No assessments found for this unit standard.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFF64748b))));
                }
                return ListView(padding: const EdgeInsets.all(16), children: [
                  if (formatives.isNotEmpty) ...[
                    const Text('📘 Formative Assessments',
                        style: TextStyle(
                            color: Color(0xFF94a3b8),
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    ...formatives.map((a) => _card(
                          onTap: () => _openAssessment(
                              Map<String, dynamic>.from(a as Map), 'Formative'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Formative Assessment #${a['id']}',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold)),
                              if (a['assessmentMethod'] != null)
                                Text(a['assessmentMethod'],
                                    style: const TextStyle(
                                        color: Color(0xFF94a3b8),
                                        fontSize: 12)),
                              if (usProgress?['formativeCompleted'] ==
                                  true) ...[
                                const SizedBox(height: 4),
                                const Text('✓ Submitted',
                                    style: TextStyle(
                                        color: Color(0xFF10b981),
                                        fontSize: 12)),
                              ],
                              const SizedBox(height: 8),
                              Text(
                                  usProgress?['formativeCompleted'] == true
                                      ? 'View / Re-submit →'
                                      : 'Open →',
                                  style: const TextStyle(
                                      color: Color(0xFF0EA5E9), fontSize: 13)),
                            ],
                          ),
                        )),
                  ],
                  if (summatives.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text('📗 Summative Assessments',
                        style: TextStyle(
                            color: Color(0xFF94a3b8),
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    ...summatives.map((a) => Opacity(
                          opacity: summativeLocked ? 0.45 : 1.0,
                          child: _card(
                            onTap: summativeLocked
                                ? null
                                : () => _openAssessment(
                                    Map<String, dynamic>.from(a as Map),
                                    'Summative'),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Summative Assessment #${a['id']}',
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold)),
                                if (a['assessmentMethod'] != null)
                                  Text(a['assessmentMethod'],
                                      style: const TextStyle(
                                          color: Color(0xFF94a3b8),
                                          fontSize: 12)),
                                const SizedBox(height: 4),
                                if (summativeLocked)
                                  const Text(
                                      '🔒 Complete the Formative assessment first',
                                      style: TextStyle(
                                          color: Color(0xFFf59e0b),
                                          fontSize: 12))
                                else if (usProgress?['summativeCompleted'] ==
                                    true)
                                  const Text('✓ Submitted',
                                      style: TextStyle(
                                          color: Color(0xFF10b981),
                                          fontSize: 12)),
                                if (!summativeLocked) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                      usProgress?['summativeCompleted'] == true
                                          ? 'View / Re-submit →'
                                          : 'Open →',
                                      style: const TextStyle(
                                          color: Color(0xFF10b981),
                                          fontSize: 13)),
                                ],
                              ],
                            ),
                          ),
                        )),
                  ],
                ]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnswerPage(BuildContext context) {
    // Check if this assessment has been submitted (any answer has submission data)
    final hasSubmissions = _answers.values.any((ans) => ans.submitted != null);

    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: Text(
            '${_selectedAssessment!['type']} #${_selectedAssessment!['id']}'),
        backgroundColor: const Color(0xFF1e293b),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() {
            _selectedAssessment = null;
            _questions = [];
            _answers.clear();
            _msg = '';
          }),
        ),
      ),
      body: Column(
        children: [
          // Show status banner if submitted
          if (hasSubmissions)
            Container(
              width: double.infinity,
              color: const Color(0xFF10b981).withValues(alpha: 0.2),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  const Icon(Icons.check_circle,
                      color: Color(0xFF10b981), size: 20),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                        '✓ Submitted - View your answers and results below',
                        style:
                            TextStyle(color: Color(0xFF10b981), fontSize: 13)),
                  ),
                ],
              ),
            ),

          if (_msg.isNotEmpty)
            Container(
              width: double.infinity,
              color: _msg.startsWith('✅')
                  ? Colors.green.shade900
                  : Colors.red.shade900,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Text(_msg, style: const TextStyle(color: Colors.white)),
            ),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _questions.length,
              itemBuilder: (_, i) {
                final q = _questions[i] as Map<String, dynamic>;
                final qId = q['id'] as int;
                final ans = _answers[qId];
                final submitted = ans?.submitted;
                final isMarked = submitted?['mark'] != null;

                return _card(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Q${q['questionNumber']}:',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold)),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                    color: const Color(0xFF334155),
                                    borderRadius: BorderRadius.circular(6)),
                                child: Text('${q['allocatedMarks']} marks',
                                    style: const TextStyle(
                                        color: Color(0xFF94a3b8),
                                        fontSize: 11)),
                              ),
                            ]),
                        const SizedBox(height: 6),
                        Text(q['questionText'] ?? '',
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 14)),
                        const SizedBox(height: 12),

                        // If submitted, show read-only view
                        if (submitted != null) ...[
                          // Submitted answer info
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1e293b),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: const Color(0xFF334155), width: 1),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.check_circle_outline,
                                        color: Color(0xFF10b981), size: 16),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Submitted: ${submitted['scannedDocumentName'] ?? 'Answer file'}',
                                      style: const TextStyle(
                                          color: Color(0xFF10b981),
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                                if (submitted['scannedAt'] != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    'Date: ${DateTime.parse(submitted['scannedAt']).toLocal().toString().split('.')[0]}',
                                    style: const TextStyle(
                                        color: Color(0xFF64748b), fontSize: 11),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // Mark and feedback (if available)
                          if (isMarked) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0EA5E9)
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                    color: const Color(0xFF0EA5E9), width: 1),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('📊 Mark',
                                          style: TextStyle(
                                              color: Color(0xFF0EA5E9),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13)),
                                      Text(
                                        '${submitted['mark']} / ${q['allocatedMarks']}',
                                        style: const TextStyle(
                                            color: Color(0xFF0EA5E9),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16),
                                      ),
                                    ],
                                  ),
                                  if (submitted['assessorComments'] != null &&
                                      submitted['assessorComments']
                                          .toString()
                                          .isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    const Text('Assessor Feedback:',
                                        style: TextStyle(
                                            color: Color(0xFF94a3b8),
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 4),
                                    Text(
                                      submitted['assessorComments'],
                                      style: const TextStyle(
                                          color: Colors.white70, fontSize: 13),
                                    ),
                                  ],
                                  if (submitted['moderatedMark'] != null) ...[
                                    const Divider(
                                        color: Color(0xFF334155), height: 20),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text('📋 Moderated Mark',
                                            style: TextStyle(
                                                color: Color(0xFFf59e0b),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12)),
                                        Text(
                                          '${submitted['moderatedMark']} / ${q['allocatedMarks']}',
                                          style: const TextStyle(
                                              color: Color(0xFFf59e0b),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14),
                                        ),
                                      ],
                                    ),
                                    if (submitted['moderatorComments'] !=
                                            null &&
                                        submitted['moderatorComments']
                                            .toString()
                                            .isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      const Text('Moderator Comments:',
                                          style: TextStyle(
                                              color: Color(0xFF94a3b8),
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 2),
                                      Text(
                                        submitted['moderatorComments'],
                                        style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 12),
                                      ),
                                    ],
                                  ],
                                ],
                              ),
                            ),
                          ] else ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFf59e0b)
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                    color: const Color(0xFFf59e0b), width: 1),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.pending,
                                      color: Color(0xFFf59e0b), size: 16),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Pending marking by assessor',
                                      style: TextStyle(
                                          color: Color(0xFFf59e0b),
                                          fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ] else ...[
                          // Not submitted yet - show answer input
                          Row(children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => setState(() => _answers[qId] =
                                    _Answer(text: ans?.text ?? '')),
                                icon: const Icon(Icons.edit, size: 14),
                                label: const Text('Type',
                                    style: TextStyle(fontSize: 13)),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: ans?.text != null
                                      ? Colors.white
                                      : const Color(0xFF94a3b8),
                                  side: BorderSide(
                                      color: ans?.text != null
                                          ? const Color(0xFF0EA5E9)
                                          : const Color(0xFF334155)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _showScanOptions(qId),
                                icon: const Icon(Icons.camera_alt, size: 14),
                                label: const Text('Scan',
                                    style: TextStyle(fontSize: 13)),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: ans?.file != null
                                      ? Colors.white
                                      : const Color(0xFF94a3b8),
                                  side: BorderSide(
                                      color: ans?.file != null
                                          ? const Color(0xFF10b981)
                                          : const Color(0xFF334155)),
                                ),
                              ),
                            ),
                          ]),

                          if (ans?.text != null) ...[
                            const SizedBox(height: 10),
                            TextFormField(
                              initialValue: ans!.text,
                              maxLines: 4,
                              style: const TextStyle(color: Colors.white),
                              onChanged: (v) =>
                                  _answers[qId] = _Answer(text: v),
                              decoration: InputDecoration(
                                hintText: 'Type your answer here…',
                                hintStyle:
                                    const TextStyle(color: Color(0xFF475569)),
                                filled: true,
                                fillColor: const Color(0xFF0f172a),
                                border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: const BorderSide(
                                        color: Color(0xFF334155))),
                              ),
                            ),
                          ],

                          if (ans?.file != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Row(children: [
                                const Icon(Icons.check_circle,
                                    color: Colors.green, size: 16),
                                const SizedBox(width: 6),
                                Expanded(
                                    child: Text(ans!.file!.path.split('/').last,
                                        style: const TextStyle(
                                            color: Colors.green, fontSize: 12),
                                        overflow: TextOverflow.ellipsis)),
                              ]),
                            ),
                        ],
                      ]),
                );
              },
            ),
          ),

          // Only show submit button if not submitted
          if (!hasSubmissions)
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: _submitting ? null : _submitAnswers,
                icon: _submitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send),
                label:
                    Text(_submitting ? 'Submitting…' : '📤 Submit All Answers'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10b981),
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showScanOptions(int questionId) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1e293b),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.camera_alt, color: Colors.white),
            title: const Text('Scan Answer',
                style: TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
              _pickFile(questionId, ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library, color: Colors.white),
            title: const Text('Choose from Gallery',
                style: TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
              _pickFile(questionId, ImageSource.gallery);
            },
          ),
        ]),
      ),
    );
  }

  Widget _card({required Widget child, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1e293b),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: child,
      ),
    );
  }
}

class _Answer {
  final String? text;
  final File? file;
  final Map<String, dynamic>?
      submitted; // Holds submitted answer data with marks
  _Answer({this.text, this.file, this.submitted});
}
