'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LicensePage() {
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

        <h1 className="text-4xl font-bold mb-8">GNU Affero General Public License v3.0</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. License Grant</h2>
            <p>
              SchemaVis is licensed under the <strong className="text-white">GNU Affero General Public License v3.0 (AGPL-3.0)</strong> or any later version at your option. This is a strong copyleft license that ensures all users have the freedom to run, study, modify, and distribute the software.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Origin of License Obligations</h2>
            <p>
              SchemaVis incorporates code derived from chartsdb, which is licensed under the AGPL-3.0. Under Section 5 of the AGPL-3.0, any work based on AGPL-licensed software must be distributed under the same license terms. Therefore, SchemaVis as a whole is subject to the AGPL-3.0 license.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Your Rights Under AGPL-3.0</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Run SchemaVis for any purpose</li>
              <li>Study how SchemaVis works and access its source code</li>
              <li>Modify SchemaVis to suit your needs</li>
              <li>Distribute original or modified versions of SchemaVis</li>
              <li>Run SchemaVis as a network service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Source Code Availability (Section 13 Compliance)</h2>
            <p>
              Pursuant to Section 13 of the AGPL-3.0, we provide Corresponding Source to all users interacting with SchemaVis remotely through a computer network. The source code is made available through the following mechanisms:
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1. Corresponding Source Definition</h3>
            <p>The "Corresponding Source" for SchemaVis includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>All source code files necessary to generate, install, and run SchemaVis</li>
              <li>Build scripts and installation scripts</li>
              <li>Configuration files required for operation</li>
              <li>Documentation necessary to understand and modify the software</li>
              <li>Dependency specifications and third-party libraries with their respective licenses</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2. Source Code Access Methods</h3>
            <p>We provide Corresponding Source through the following standard and customary means:</p>
            <ol className="list-decimal list-inside mt-2 space-y-2 ml-4">
              <li>
                <strong>Email Distribution:</strong> Upon request to <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code>, we will provide a complete source code archive containing all Corresponding Source. This method is our primary distribution mechanism and satisfies Section 13's requirement for "standard or customary means of facilitating copying of software."
              </li>
              <li>
                <strong>Source Code Notice:</strong> This license notice and our contact information for source code requests are prominently displayed on our website at <a href="https://schemavis.gossorg.in" className="text-blue-400 hover:text-blue-300 underline">schemavis.gossorg.in</a>, ensuring users are aware of their rights to obtain the source code.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Source Code Request Process</h2>
            <p>To request the source code:</p>
            <ol className="list-decimal list-inside mt-2 space-y-2 ml-4">
              <li>Contact us at <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code></li>
              <li>Include your name, email address, and a statement of your interest in the source code</li>
              <li>We will respond within 5 business days with a secure download link and verification code</li>
              <li>No payment is required for the source code itself. We may charge a reasonable administrative fee (not exceeding $25 USD) to cover processing costs, as permitted under AGPL Section 6.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Obligations When Distributing or Modifying</h2>
            <p>If you distribute modified versions of SchemaVis or run modified versions as a network service:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>You must license your modifications under AGPL-3.0 or later</li>
              <li>You must provide notice of your modifications</li>
              <li>You must make your modified source code available to users under the same terms</li>
              <li>You must preserve all copyright notices and license information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. No Warranty</h2>
            <p className="uppercase text-sm">
              SCHEMAVIS IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Full License Text</h2>
            <p>
              The complete text of the GNU Affero General Public License v3.0 is available at: <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">https://www.gnu.org/licenses/agpl-3.0.html</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Information</h2>
            <p>For questions regarding this license or source code access:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Email: <code className="bg-white/10 px-2 py-1 rounded">inquiry.akshatkotpalliwar@gmail.com</code></li>
              <li>Website: <a href="https://schemavis.gossorg.in" className="text-blue-400 hover:text-blue-300 underline">schemavis.gossorg.in</a></li>
            </ul>
          </section>

          <p className="text-sm text-slate-400 mt-8">
            Last Updated: December 20, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
