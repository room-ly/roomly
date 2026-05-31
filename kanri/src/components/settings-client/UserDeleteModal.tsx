"use client";

type User = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function UserDeleteModal({
  target,
  deleting,
  error,
  onClose,
  onConfirm,
}: {
  target: User | null;
  deleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h2 className="text-[15px] font-semibold mb-3">ユーザーを削除</h2>
        <p className="text-[13px] text-ink-2 mb-1">
          <span className="font-medium">{target.name}</span>（{target.email}）を削除しますか？
        </p>
        <p className="text-[12px] text-ink-3 mb-4">
          削除されたユーザーはログインできなくなります。
        </p>

        {error && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="bg-danger text-white rounded-lg px-4 py-2 text-sm hover:bg-danger/90 transition-colors disabled:opacity-50"
          >
            {deleting ? "削除中..." : "削除する"}
          </button>
        </div>
      </div>
    </div>
  );
}
