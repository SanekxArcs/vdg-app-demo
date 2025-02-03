import Link from "next/link";

export default function MainPage() {
  return (
    <main className="container mx-auto min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to My Project</h1>
      <p className="mb-8">Click the button below to get started.</p>
      <Link
        href="/dashboard"
        className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
