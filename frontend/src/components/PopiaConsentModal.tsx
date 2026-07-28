/**
 * PopiaConsentModal.tsx
 *
 * Displays a POPIA (Protection of Personal Information Act 4 of 2013)
 * consent overlay. The user must scroll to the bottom and click
 * "I Accept" before they can proceed into any protected area of the system.
 *
 * Consent is persisted in localStorage under the key `popia_consent_v1`
 * so returning users are not prompted every session.
 */

import React, { useRef, useState } from 'react';

export const POPIA_CONSENT_KEY = 'popia_consent_v1';

interface PopiaConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const PopiaConsentModal: React.FC<PopiaConsentModalProps> = ({ onAccept, onDecline }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (atBottom) setHasScrolled(true);
  };

  const handleAccept = () => {
    if (!accepted) return;
    localStorage.setItem(POPIA_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }));
    onAccept();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="popia-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
            padding: '24px 32px 20px',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <span style={{ fontSize: 32 }}>🛡️</span>
            <div>
              <h2
                id="popia-title"
                style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 0.3 }}
              >
                POPIA Privacy Notice
              </h2>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
                Protection of Personal Information Act 4 of 2013
              </p>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              marginTop: 10,
            }}
          >
            ⚠️ Please read this notice carefully. You must accept it before accessing the system.
            Scroll to the bottom to enable the Accept button.
          </div>
        </div>

        {/* ── SCROLLABLE POLICY CONTENT ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
            fontSize: 14,
            lineHeight: 1.75,
            color: '#334155',
          }}
        >
          <Section title="1. Introduction and Purpose">
            <p>
              NBSN Projects (<strong>"NBSN Projects"</strong>, <strong>"we"</strong>,{' '}
              <strong>"us"</strong>, or <strong>"our"</strong>) is committed to protecting your
              personal information in accordance with the{' '}
              <strong>Protection of Personal Information Act 4 of 2013 (POPIA)</strong> and all
              applicable South African data-protection legislation.
            </p>
            <p>
              This Privacy Notice explains what personal information we collect, why we collect it,
              how we use and protect it, and your rights as a Data Subject under POPIA.
            </p>
          </Section>

          <Section title="2. Information Officer">
            <InfoRow label="Information Officer" value="NBSN Compliance Officer" />
            <InfoRow label="Organisation" value="NBSN Projects" />
            <InfoRow label="Email" value="popia@nbsn.co.za" />
            <InfoRow label="Postal Address" value="NBSN Head Office, South Africa" />
            <p style={{ marginTop: 12 }}>
              You may direct any POPIA-related enquiries, objections, or access requests to the
              Information Officer above.
            </p>
          </Section>

          <Section title="3. Personal Information We Collect">
            <p>We may collect the following categories of personal information:</p>
            <ul>
              <li>
                <strong>Identity Information:</strong> Full name, national ID / passport number,
                date of birth, gender.
              </li>
              <li>
                <strong>Contact Information:</strong> Email address, telephone number, physical and
                postal address.
              </li>
              <li>
                <strong>Biometric Information:</strong> Fingerprints and/or facial recognition data
                used for attendance verification. <em>This is Special Personal Information under
                POPIA Section 26.</em>
              </li>
              <li>
                <strong>Employment and Training Information:</strong> Qualifications, skills
                development records, assessment results, attendance records, and project
                participation.
              </li>
              <li>
                <strong>Financial Information:</strong> Banking details where bursaries, stipends,
                or expense claims are processed.
              </li>
              <li>
                <strong>System Usage Data:</strong> Login timestamps, IP addresses, and activity
                logs for security auditing purposes.
              </li>
              <li>
                <strong>Documents:</strong> Certified copies of ID, qualifications, proof of
                residence, and other compliance documents uploaded to the portal.
              </li>
            </ul>
          </Section>

          <Section title="4. Lawful Basis for Processing">
            <p>We process your personal information on one or more of the following lawful grounds:</p>
            <ul>
              <li>
                <strong>Consent:</strong> Where you have given voluntary, specific, and informed
                consent (including this acceptance).
              </li>
              <li>
                <strong>Contractual necessity:</strong> To fulfil obligations under a learnerships,
                skills programme, or employment contract.
              </li>
              <li>
                <strong>Legal obligation:</strong> To comply with the Skills Development Act,
                Employment Equity Act, SETA requirements, and DHET reporting obligations.
              </li>
              <li>
                <strong>Legitimate interest:</strong> For system security, fraud prevention, and
                audit trail purposes.
              </li>
            </ul>
            <p>
              <strong>Special Personal Information (biometric data)</strong> is processed only with
              your explicit consent and for the specific purpose of attendance verification, as
              permitted under POPIA Section 27(1)(a).
            </p>
          </Section>

          <Section title="5. Purpose of Processing">
            <p>Your personal information is used for:</p>
            <ul>
              <li>Registering and managing learner enrolments.</li>
              <li>Recording and verifying attendance via biometric or manual clocking.</li>
              <li>Conducting and recording assessments, moderation, and certification.</li>
              <li>Generating reports for SETA, DHET, and other statutory bodies.</li>
              <li>Processing bursaries, stipends, and expense claims.</li>
              <li>Communicating programme updates, results, and documents.</li>
              <li>Security monitoring and access-control auditing.</li>
              <li>Legal, regulatory, and compliance obligations.</li>
            </ul>
          </Section>

          <Section title="6. Sharing of Information">
            <p>
              We do not sell your personal information. We may share it with the following categories
              of third parties, strictly for the purposes described in Section 5:
            </p>
            <ul>
              <li>
                <strong>SETAs and DHET:</strong> For mandatory skills-development reporting (e.g.
                SETA annual reports, learnership registrations).
              </li>
              <li>
                <strong>Accredited Assessment Bodies:</strong> For quality-assurance and
                certification purposes.
              </li>
              <li>
                <strong>Technology Service Providers:</strong> Cloud hosting and database providers
                (operating under data-processing agreements that include POPIA-compliant safeguards).
              </li>
              <li>
                <strong>Law-Enforcement Agencies:</strong> Where required by law or court order.
              </li>
            </ul>
            <p>
              All third-party operators are required to process your information only on our
              instructions and in compliance with POPIA.
            </p>
          </Section>

          <Section title="7. Retention of Information">
            <p>
              We retain personal information only for as long as necessary to fulfil the purpose for
              which it was collected, or as required by applicable law:
            </p>
            <ul>
              <li>
                <strong>Learner records:</strong> Minimum 5 years after programme completion (SETA
                requirement).
              </li>
              <li>
                <strong>Financial records:</strong> 7 years (South African Revenue Service
                requirement).
              </li>
              <li>
                <strong>Biometric data:</strong> Deleted within 30 days of programme completion or
                consent withdrawal, whichever is earlier.
              </li>
              <li>
                <strong>System logs:</strong> 90 days rolling retention.
              </li>
            </ul>
            <p>
              Upon expiry, information is securely destroyed in accordance with our Data Retention
              and Destruction Policy.
            </p>
          </Section>

          <Section title="8. Security Measures">
            <p>
              We implement appropriate technical and organisational measures to protect your personal
              information against unauthorised access, loss, alteration, or destruction, including:
            </p>
            <ul>
              <li>TLS/HTTPS encryption for all data in transit.</li>
              <li>AES-256 encryption for sensitive data at rest.</li>
              <li>Role-based access control (RBAC) — users access only the data required for their role.</li>
              <li>JWT token authentication with automatic session expiry.</li>
              <li>Multi-factor authentication for administrative accounts.</li>
              <li>Regular security audits (Snyk, OWASP Dependency-Check, CodeQL).</li>
              <li>Audit trails for all data access and modifications.</li>
            </ul>
          </Section>

          <Section title="9. Your Rights as a Data Subject">
            <p>Under POPIA, you have the right to:</p>
            <ul>
              <li>
                <strong>Access:</strong> Request confirmation of whether we hold your personal
                information and obtain a copy of it.
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate, irrelevant, or
                out-of-date information.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of information we no longer have a lawful
                basis to process (subject to legal retention requirements).
              </li>
              <li>
                <strong>Objection:</strong> Object to the processing of your personal information in
                certain circumstances.
              </li>
              <li>
                <strong>Withdrawal of Consent:</strong> Withdraw consent at any time. Withdrawal does
                not affect processing that occurred before withdrawal, and may result in the inability
                to use certain system features.
              </li>
              <li>
                <strong>Complaint:</strong> Lodge a complaint with the{' '}
                <strong>Information Regulator of South Africa</strong>:
                <br />
                Website:{' '}
                <a
                  href="https://www.inforegulator.org.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0d9488' }}
                >
                  www.inforegulator.org.za
                </a>
                <br />
                Email: inforeg@justice.gov.za
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact our Information Officer (see Section 2).
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="10. Cookies and Session Storage">
            <p>
              This portal uses <strong>localStorage</strong> (browser storage) to maintain your
              authenticated session and store your consent record. No tracking cookies are used. Your
              session is automatically terminated after 30 minutes of inactivity for security
              purposes.
            </p>
          </Section>

          <Section title="11. Changes to This Notice">
            <p>
              We may update this Privacy Notice periodically to reflect changes in legislation or our
              practices. Material changes will require renewed consent. The current version is always
              accessible via the <em>POPIA Policy</em> link in the system footer.
            </p>
          </Section>

          <Section title="12. Consent Declaration">
            <p>
              By accepting this notice, you confirm that:
            </p>
            <ul>
              <li>
                You have read and understood this Privacy Notice in full.
              </li>
              <li>
                You voluntarily consent to the collection, processing, and use of your personal
                information as described above.
              </li>
              <li>
                If you are enrolling or managing learners, you confirm you have lawful authority to
                provide their personal information and have informed them of this notice.
              </li>
              <li>
                You understand you may withdraw consent at any time by contacting the Information
                Officer, subject to the consequences described in Section 9.
              </li>
            </ul>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>
              <strong>Version 1.0</strong> | Effective date: January 2025 | Last reviewed: July 2026
            </p>
          </Section>
        </div>

        {/* ── FOOTER / ACCEPTANCE ── */}
        <div
          style={{
            padding: '20px 32px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            flexShrink: 0,
          }}
        >
          {!hasScrolled && (
            <p style={{ color: '#f59e0b', fontSize: 13, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⬇️</span> Please scroll to the bottom to read the full notice before accepting.
            </p>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 16,
              cursor: hasScrolled ? 'pointer' : 'not-allowed',
              opacity: hasScrolled ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              disabled={!hasScrolled}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: '#0d9488' }}
            />
            <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
              I have read and understood the POPIA Privacy Notice, and I consent to the collection
              and processing of my personal information as described.
            </span>
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              style={{
                flex: 1,
                padding: '13px',
                background: accepted
                  ? 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)'
                  : '#e2e8f0',
                color: accepted ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                cursor: accepted ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              ✅ I Accept — Continue to System
            </button>
            <button
              onClick={onDecline}
              style={{
                padding: '13px 24px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                background: '#fff',
                color: '#64748b',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
            >
              Decline
            </button>
          </div>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, margin: '12px 0 0' }}>
            Declining will log you out. This consent is required to use the NBSN Projects Portal.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Small helpers for layout inside the policy text ── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h3
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: '#0d9488',
        margin: '0 0 10px',
        paddingBottom: 6,
        borderBottom: '2px solid #e0fdfa',
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
    <span style={{ fontWeight: 600, minWidth: 170, color: '#475569' }}>{label}:</span>
    <span>{value}</span>
  </div>
);

export default PopiaConsentModal;
