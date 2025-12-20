'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-8 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last Updated: December 20, 2025</p>

        <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SchemaVis (the "Service") available at <a href="https://schemavis.gossorg.in" className="text-blue-400 hover:text-blue-300 underline">schemavis.gossorg.in</a>, you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>SchemaVis provides a web-based platform for creating, visualizing, and collaborating on database schema diagrams. The Service includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>SQL file upload and parsing to generate ER-style diagrams</li>
              <li>Interactive diagram creation and editing tools</li>
              <li>Database schema visualization with table relationships</li>
              <li>Real-time collaboration features with presence indicators</li>
              <li>Comments and annotations on diagrams</li>
              <li>Diagram sharing with public links and permission management</li>
              <li>Role-based access control (Owner, Editor, Viewer)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. License Grant and Restrictions</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.1. Service License</h3>
            <p>
              Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to access and use the Service for lawful purposes.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.2. Open Source License</h3>
            <p>
              The underlying software powering SchemaVis is licensed under the <strong className="text-white">GNU Affero General Public License v3.0 (AGPL-3.0)</strong>. This means:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>You may access the source code by requesting it from us</li>
              <li>You may modify the source code for your own use</li>
              <li>If you modify the software and operate it as a network service, you must make your modified source code available to users under AGPL-3.0 terms</li>
              <li>The AGPL-3.0 license terms supersede any conflicting terms in these Terms of Service regarding source code access and modification rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.3. Prohibited Uses</h3>
            <p>You may not:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Use the Service for any illegal, harmful, or unauthorized purpose</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service except as permitted by AGPL-3.0</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use automated systems to extract content or data from the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Accounts</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1. Account Registration</h3>
            <p>To access certain features, you must register for an account. You agree to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide accurate, current information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2. Account Termination</h3>
            <p>We may suspend or terminate your access to the Service if you violate these Terms or for any other reason at our discretion. Your account is managed through Clerk authentication service. To delete your account, you may do so through Clerk's interface, or contact us at <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code> for assistance. Upon termination, your right to use the Service ceases immediately.</p>
            <p className="mt-2">
              <strong>Data Retention:</strong> When you delete content or your account, we use a "soft delete" approach where data is marked as deleted but may be retained in our database for backup and recovery purposes. Deleted content is not accessible through the application interface.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. User Content and Ownership</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.1. Your Content</h3>
            <p>You retain all rights to content you create or upload to the Service ("User Content"), including diagrams, SQL files, comments, and annotations.</p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.2. License to User Content</h3>
            <p>By submitting User Content, you grant SchemaVis a worldwide, non-exclusive, royalty-free license to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Store, reproduce, and display your User Content</li>
              <li>Create derivative works for the purpose of providing the Service</li>
              <li>Distribute your User Content to authorized collaborators</li>
            </ul>
            <p className="mt-2">This license terminates when you delete your content or account. Note that we use a "soft delete" approach where deleted content is marked as deleted but may be retained in our database for backup and recovery purposes. Deleted content is not accessible through the application interface.</p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.3. Content Restrictions</h3>
            <p>You may not upload content that:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Infringes intellectual property or privacy rights</li>
              <li>Contains malware or harmful code</li>
              <li>Is defamatory, obscene, or illegal</li>
              <li>Contains sensitive personal data without proper consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Collaboration Features</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.1. Shared Diagrams</h3>
            <p>When you share diagrams with others, you grant them permissions based on the role you assign (viewer, editor, or owner). You are responsible for managing these permissions appropriately.</p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.2. Real-time Collaboration</h3>
            <p>Our real-time collaboration features use Server-Sent Events (SSE) technology to provide low-latency presence updates. Network conditions may affect performance.</p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.3. Public Sharing</h3>
            <p>You may create public share links for your diagrams. When you share a diagram publicly, anyone with the link can access it according to the permissions you set (view or edit). You are responsible for managing public access to your content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">7.1. SchemaVis Property</h3>
            <p>All rights, title, and interest in the Service (excluding User Content) remain with SchemaVis or its licensors, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Software, code, and technology</li>
              <li>Visual design elements, graphics, and logos</li>
              <li>Documentation and help materials</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">7.2. AGPL-3.0 Compliance</h3>
            <p>As SchemaVis incorporates code derived from AGPL-3.0 licensed software (including chartsdb), the Service as a whole is subject to AGPL-3.0 terms. This does not affect your ownership of User Content, but does grant you specific rights regarding the software itself:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>You may request and receive the complete source code</li>
              <li>You may modify the source code for your own use</li>
              <li>If you operate a modified version as a network service, you must make your source code available under AGPL-3.0</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Source Code Availability and AGPL Compliance</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">8.1. Source Code Distribution</h3>
            <p>In compliance with Section 13 of the AGPL-3.0, we make the Corresponding Source available to all users interacting with SchemaVis remotely through a computer network. The source code is provided via email distribution upon request to <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code>.</p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">8.2. Source Code Request Process</h3>
            <p>To request source code:</p>
            <ol className="list-decimal list-inside mt-2 space-y-2 ml-4">
              <li>Send an email to <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code></li>
              <li>Include your name, email address, and statement of purpose</li>
              <li>We will respond within 5 business days with download instructions</li>
              <li>No payment is required for the source code itself; we may charge a reasonable administrative fee (not exceeding $25 USD) to cover processing costs</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimers and Limitations of Liability</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">9.1. "As Is" Service</h3>
            <p className="uppercase text-sm">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">9.2. Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SCHEMAVIS AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
            <p>We may modify these Terms at any time. We will notify you of material changes via email or prominent notice on the Service. Your continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Information</h2>
            <p>For questions about these Terms:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Email: <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code></li>
              <li>Website: <a href="https://schemavis.gossorg.in" className="text-blue-400 hover:text-blue-300 underline">schemavis.gossorg.in</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
