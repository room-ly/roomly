import Link from "next/link";

export const metadata = {
  title: "アクセス権限がありません",
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">アクセス権限がありません</h1>
        <p className="text-sm text-ink-3 mb-6">
          このアカウントには Roomly Admin の閲覧権限がありません。
          別のアカウントでログインしてください。
        </p>
        <Link
          href="/login"
          className="btn btn-primary text-sm inline-block"
        >
          ログインし直す
        </Link>
      </div>
    </div>
  );
}
