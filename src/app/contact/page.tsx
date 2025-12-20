'use client';

import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
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

        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. General Inquiries</h2>
            <p>For general questions about SchemaVis, please contact:</p>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 mt-4">
              <Mail className="size-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Email:</p>
                <a 
                  href="mailto:inquiry.akshatkotpalliwar@gmail.com" 
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  inquiry.akshatkotpalliwar@gmail.com
                </a>
              </div>
            </div>
            <ul className="list-disc list-inside mt-4 space-y-1 ml-4">
              <li><strong>Response Time:</strong> Within 2-3 business days</li>
              <li><strong>Website:</strong> <a href="https://schemavis.gossorg.in" className="text-blue-400 hover:text-blue-300 underline">schemavis.gossorg.in</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Technical Support</h2>
            <p>For technical issues, bug reports, or feature requests:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Email:</strong> <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code></li>
              <li><strong>Include:</strong> Browser version, operating system, steps to reproduce the issue, and screenshots if applicable</li>
              <li><strong>Response Time:</strong> Within 24-48 hours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Source Code Access Requests (AGPL Compliance)</h2>
            <p>
              In compliance with the GNU Affero General Public License v3.0, we provide source code access to all users of our network service.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.1. Request Process</h3>
            <ol className="list-decimal list-inside mt-2 space-y-2 ml-4">
              <li>
                <strong>Submit Request:</strong> Email <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code> with:
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Your full name and email address</li>
                  <li>Statement of purpose (personal use, modification, etc.)</li>
                  <li>Contact information for verification</li>
                </ul>
              </li>
              <li>
                <strong>Verification:</strong> We will verify your request within 2 business days
              </li>
              <li>
                <strong>Source Code Delivery:</strong> Upon verification, you will receive:
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>A secure download link for the complete source code archive</li>
                  <li>Verification code for download access</li>
                  <li>Documentation on building and running the software</li>
                  <li>Full text of the AGPL-3.0 license</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.2. Processing Fee</h3>
            <p>While the source code itself is provided free of charge as required by the AGPL-3.0, we may charge a reasonable administrative fee (not exceeding $25 USD) to cover processing costs. This fee helps offset:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Verification of requester identity</li>
              <li>Preparation of source code archives</li>
              <li>Bandwidth and storage costs for distribution</li>
              <li>Maintenance of compliance records</li>
            </ul>
            <p className="mt-4">
              This fee structure complies with Section 6 of the AGPL-3.0, which permits charging a reasonable fee for physical distribution of source code.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. What to Include in Your Email</h2>
            <p>When contacting us, please include:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Your name and email address</li>
              <li>A clear description of your inquiry or request</li>
              <li>For source code requests: your intended use case</li>
              <li>Any relevant details that will help us assist you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Important Notices</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.1. Source Code Availability</h3>
            <p>We make the Corresponding Source available to all users of our network service as required by Section 13 of the GNU Affero General Public License v3.0. This source code includes all components necessary to build, install, and run SchemaVis.</p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.2. License Compliance</h3>
            <p>If you believe SchemaVis is not in compliance with its licensing obligations, please contact us at <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code> with specific details of your concern. We take license compliance seriously and will investigate all reports promptly.</p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.3. Third-Party Components</h3>
            <p>SchemaVis incorporates various third-party libraries and components, each with their own license terms. Upon source code request, you will receive a complete list of all third-party components and their respective licenses.</p>
          </section>

          <p className="text-sm text-slate-400 mt-8">
            Last Updated: December 20, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
