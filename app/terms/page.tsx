export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 2026</p>

      <section className="flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">
        <div>
          <h2 className="font-medium text-gray-900 mb-1">1. Acceptance</h2>
          <p>
            By using Personal Monthly Budget, you agree to these terms. This is a personal-use
            application intended for individual budget tracking.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">2. Use of the App</h2>
          <p>
            This app is provided for personal financial tracking purposes only. You are responsible
            for the accuracy of data you enter and for maintaining access to your Google account.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">3. Google Services</h2>
          <p>
            This app connects to Google Sheets via your authorized Google account. Your use of
            Google services is also subject to{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1D9E75] underline"
            >
              Google's Terms of Service
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">4. No Warranty</h2>
          <p>
            This app is provided "as is" without warranty of any kind. We are not liable for any
            data loss, inaccuracies, or financial decisions made based on information displayed in
            the app.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">5. Changes</h2>
          <p>
            These terms may be updated at any time. Continued use of the app constitutes acceptance
            of the updated terms.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">6. Contact</h2>
          <p>
            For any questions, contact:{" "}
            <a href="mailto:pornpichit.jit@gmail.com" className="text-[#1D9E75] underline">
              pornpichit.jit@gmail.com
            </a>
          </p>
        </div>
      </section>

      <div className="mt-10 pt-6 border-t border-gray-100">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back to app
        </a>
      </div>
    </main>
  );
}
