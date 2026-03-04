import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

type SignInProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: SignInProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  const oauthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Sign in to CalConnect</h1>
      <p className="text-sm text-zinc-600">
        Use your campus Google account to access admin and provider tools.
      </p>
      {oauthConfigured ? (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Continue with Google SSO
          </button>
        </form>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Google SSO is not configured yet.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            An administrator needs to set <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_SECRET</code> in the <code className="rounded bg-amber-100 px-1">.env</code> file.
          </p>
        </div>
      )}
    </main>
  );
}
