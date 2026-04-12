'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Account Information:</strong> Email address, name, and profile image (provided through Clerk authentication service)</li>
              <li><strong>SQL Files:</strong> SQL file content and titles that you upload to the service</li>
              <li><strong>Diagrams:</strong> Database schema diagrams you create, including table structures, relationships, and visual layouts</li>
              <li><strong>Comments:</strong> Comments and annotations you add to diagrams, including their position coordinates</li>
              <li><strong>Collaboration Data:</strong> Cursor positions and viewport information when you collaborate on diagrams</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and store your SQL files and diagrams</li>
              <li>Enable real-time collaboration features (presence indicators, cursor tracking)</li>
              <li>Manage sharing permissions and access control</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Storage and Security</h2>
            <p>
              Your data is stored in a PostgreSQL database. We implement appropriate technical and organizational measures to protect your personal information. Your SQL files and diagrams are stored securely and are only accessible to you unless you explicitly share them through our sharing features.
            </p>
            <p className="mt-4">
              <strong>Data Retention:</strong> When you delete content (SQL files, diagrams, or comments), we use a "soft delete" approach. This means the data is marked as deleted with a timestamp but may be retained in our database for backup and recovery purposes. Deleted content is not accessible through the application interface.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p>
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>
                <strong>Clerk:</strong> We use Clerk for user authentication and account management. Clerk processes your email address, name, and profile information. Clerk's privacy policy applies to how they handle your authentication data. You can learn more at <a href="https://clerk.com/privacy" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">clerk.com/privacy</a>.
              </li>
              <li>
                <strong>PostgreSQL Database:</strong> Your content (SQL files, diagrams, comments) is stored in a PostgreSQL database hosted by our infrastructure provider.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>With users you explicitly grant access to through our sharing features (diagram sharing, collaboration permissions)</li>
              <li>When you create a public share link, anyone with that link can access the diagram according to the permissions you set</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Access:</strong> View all your SQL files, diagrams, and comments through the application interface</li>
              <li><strong>Delete:</strong> Delete your SQL files, diagrams, and comments (soft delete - see Data Storage section)</li>
              <li><strong>Control Sharing:</strong> Manage who has access to your diagrams through our permission system</li>
              <li><strong>Account Management:</strong> Manage your account settings through Clerk's authentication interface</li>
            </ul>
            <p className="mt-4">
              <strong>Note:</strong> To delete your account or request permanent data deletion, please contact us at <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code>. Account deletion is handled through Clerk, and we can assist with removing your associated data from our database.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Authentication:</strong> Clerk uses cookies to maintain your authenticated session</li>
              <li><strong>Application Functionality:</strong> Cookies may be used to store your preferences and maintain application state</li>
            </ul>
            <p className="mt-4">
              We do not use third-party analytics or advertising cookies. You can instruct your browser to refuse all cookies, but this may limit your ability to use certain features of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Email: <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code></li>
              <li>Website: <a href="https://schemavis.gossorg.in" className="text-blue-400 hover:text-blue-300 underline">schemavis.gossorg.in</a></li>
              <li>Or through our <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">contact page</a></li>
            </ul>
          </section>

          <p className="text-sm text-slate-400 mt-8">
            Last updated: April 10, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
