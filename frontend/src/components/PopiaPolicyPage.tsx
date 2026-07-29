/**
 * PopiaPolicyPage.tsx
 * Full standalone POPIA Privacy Policy page accessible at /popia-policy
 * Can be viewed by anyone (unauthenticated) for transparency.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const PopiaPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      background: '#f8fafc', 
      fontFamily: "'Segoe UI', system-ui, sans-serif", 
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Sticky Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', 
        padding: '24px 40px', 
        color: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 20,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>🛡️ POPIA Privacy Policy</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 14 }}>
            SDP Portal — Protection of Personal Information Act 4 of 2013
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 32px', width: '100%', flex: 1 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', lineHeight: 1.8, color: '#334155' }}>

          <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 12, padding: '16px 20px', marginBottom: 36, fontSize: 14 }}>
            <strong>Version 1.0</strong> | Effective: January 2025 | Last Reviewed: July 2026
            <br />
            For queries: <a href="mailto:popia@SDP Portal.co.za" style={{ color: '#0d9488' }}>popia@SDP Portal.co.za</a>
          </div>

          <PolicySection title="1. Introduction">
            <p>
              SDP Portal (<strong>"SDP Portal"</strong>) is a responsible party as
              defined in the Protection of Personal Information Act 4 of 2013 (<strong>POPIA</strong>).
              We are committed to protecting the personal information of all individuals whose data
              we process, including learners, employees, contractors, and system users.
            </p>
            <p>
              This policy describes how we collect, use, store, share, and protect personal
              information, and explains your rights under POPIA.
            </p>
          </PolicySection>

          <PolicySection title="2. Information Officer">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {[
                  ['Information Officer', 'SDP Portal Compliance Officer'],
                  ['Organisation', 'SDP Portal'],
                  ['Email', 'popia@SDP Portal.co.za'],
                  ['Website', 'www.SDP Portal.co.za'],
                  ['Jurisdiction', 'Republic of South Africa'],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 0', fontWeight: 600, color: '#475569', width: 220 }}>{k}</td>
                    <td style={{ padding: '10px 0' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PolicySection>

          <PolicySection title="3. Personal Information Collected">
            <p>We collect and process the following categories:</p>
            <ul>
              <li><strong>Identity:</strong> Full name, ID/passport number, date of birth, gender.</li>
              <li><strong>Contact:</strong> Email, phone number, physical and postal address.</li>
              <li><strong>Biometric (Special PI):</strong> Fingerprints and facial recognition data for attendance verification only.</li>
              <li><strong>Training Records:</strong> Qualifications, assessments, attendance, logbooks, certifications.</li>
              <li><strong>Financial:</strong> Banking details for stipends, bursaries, or expense claims.</li>
              <li><strong>System Usage:</strong> Login times, IP addresses, activity logs.</li>
              <li><strong>Documents:</strong> Uploaded compliance documents (ID copies, proof of residence, qualifications).</li>
            </ul>
            <p>
              <strong>Biometric data</strong> is Special Personal Information under POPIA Section 26
              and is only processed with your explicit consent for attendance verification.
            </p>
          </PolicySection>

          <PolicySection title="4. Lawful Basis for Processing">
            <ul>
              <li><strong>Consent</strong> — including your acceptance of this policy on first login.</li>
              <li><strong>Contractual necessity</strong> — to fulfil learnership/skills programme obligations.</li>
              <li><strong>Legal obligation</strong> — Skills Development Act, SETA requirements, DHET reporting.</li>
              <li><strong>Legitimate interest</strong> — security monitoring, fraud prevention, audit trails.</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Purpose of Processing">
            <ul>
              <li>Learner enrolment, programme management, and reporting.</li>
              <li>Attendance recording and verification (biometric and manual).</li>
              <li>Assessment, moderation, and certification processes.</li>
              <li>SETA, DHET, and statutory body reporting.</li>
              <li>Stipend, bursary, and expense claim processing.</li>
              <li>System security and access-control auditing.</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Information Sharing">
            <p>We do not sell personal information. We may share it with:</p>
            <ul>
              <li><strong>SETAs and DHET</strong> — mandatory statutory reporting.</li>
              <li><strong>Accredited Assessment Bodies</strong> — quality assurance and certification.</li>
              <li><strong>Technology Service Providers</strong> — cloud hosting under data-processing agreements.</li>
              <li><strong>Law Enforcement</strong> — where required by law or court order.</li>
            </ul>
            <p>All third parties are bound by POPIA-compliant data-processing agreements.</p>
          </PolicySection>

          <PolicySection title="7. Data Retention">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f0fdfa' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Category</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '0 8px 0 0' }}>Retention Period</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Learner records', '5 years after programme completion (SETA requirement)'],
                  ['Financial records', '7 years (SARS requirement)'],
                  ['Biometric data', '30 days after programme completion or consent withdrawal'],
                  ['System logs', '90 days rolling'],
                  ['Consent records', 'Duration of account plus 3 years'],
                ].map(([cat, ret]) => (
                  <tr key={cat} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{cat}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{ret}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PolicySection>

          <PolicySection title="8. Security Measures">
            <ul>
              <li>TLS/HTTPS encryption for all data in transit.</li>
              <li>AES-256 encryption for sensitive data at rest.</li>
              <li>Role-based access control (RBAC) — least-privilege principle.</li>
              <li>JWT authentication with 30-minute inactivity auto-logout.</li>
              <li>Regular automated security scans (Snyk, OWASP, CodeQL).</li>
              <li>Full audit trail for all data access and modifications.</li>
            </ul>
          </PolicySection>

          <PolicySection title="9. Your Rights (POPIA Section 5)">
            <ul>
              <li><strong>Access</strong> — obtain a copy of your personal information.</li>
              <li><strong>Correction</strong> — request correction of inaccurate information.</li>
              <li><strong>Deletion</strong> — request erasure where no lawful retention basis exists.</li>
              <li><strong>Objection</strong> — object to processing in certain circumstances.</li>
              <li><strong>Withdrawal of Consent</strong> — withdraw at any time by contacting the Information Officer. Note: withdrawal may affect your ability to use certain system features.</li>
              <li>
                <strong>Complaint</strong> — lodge a complaint with the Information Regulator of South Africa:
                <br />
                <a href="https://www.inforegulator.org.za" target="_blank" rel="noopener noreferrer" style={{ color: '#0d9488' }}>www.inforegulator.org.za</a> | inforeg@justice.gov.za
              </li>
            </ul>
            <p>Submit requests to <a href="mailto:popia@SDP Portal.co.za" style={{ color: '#0d9488' }}>popia@SDP Portal.co.za</a>. We respond within 30 days.</p>
          </PolicySection>

          <PolicySection title="10. Cross-Border Transfers">
            <p>
              Your personal information is stored on servers located within South Africa. Should
              any transfer outside the Republic become necessary, we will ensure it is subject to
              conditions that are substantially similar to the conditions in POPIA, as required by
              Section 72.
            </p>
          </PolicySection>

          <PolicySection title="11. Changes to This Policy">
            <p>
              We may update this policy to reflect legislative changes or updates to our practices.
              Material changes will require renewed consent on your next login. This page always
              reflects the current version.
            </p>
          </PolicySection>

          <div style={{ marginTop: 40, padding: '20px 24px', background: '#f0fdfa', borderRadius: 12, border: '1px solid #99f6e4', fontSize: 13, color: '#475569' }}>
            <strong>Questions or concerns?</strong> Contact our Information Officer at{' '}
            <a href="mailto:popia@SDP Portal.co.za" style={{ color: '#0d9488' }}>popia@SDP Portal.co.za</a>
            {' '}or write to SDP Portal Head Office, South Africa.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13 }}>
        © {new Date().getFullYear()} SDP Portal. All rights reserved.
      </div>
    </div>
  );
};

const PolicySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0d9488', margin: '0 0 14px', paddingBottom: 8, borderBottom: '2px solid #e0fdfa' }}>
      {title}
    </h2>
    {children}
  </div>
);

export default PopiaPolicyPage;
