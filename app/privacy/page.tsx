export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 2026</p>

      <section className="flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">
        <div>
          <h2 className="font-medium text-gray-900 mb-1">1. Overview</h2>
          <p>
            Personal Monthly Budget is a personal finance tracking application. This policy explains
            how the app handles your data.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">2. Data We Access</h2>
          <p>
            This app requests access to your Google Sheets in order to read and write your budget
            data. We do not access any other Google services or personal files beyond the
            spreadsheet you authorize.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">3. Data Storage</h2>
          <p>
            All budget data is stored directly in your own Google Sheets account. This app does not
            store your financial data on any external server. Your Google access token is held
            temporarily in your browser session only.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">4. Data Sharing</h2>
          <p>
            We do not sell, share, or disclose your personal data or financial information to any
            third parties.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-1">5. Google OAuth</h2>
          <p>
            Sign-in is handled via Google OAuth 2.0. We only request the minimum scope required
            (Google Sheets read/write access). You can revoke access at any time from your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1D9E75] underline"
            >
              Google Account permissions
            </a>
            .
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
