import PageHeader from "@/components/PageHeader";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="設定" description="会社情報・アカウント設定" />

      <div className="max-w-2xl space-y-6">
        {/* 会社情報 */}
        <div className="card p-6">
          <h2 className="font-semibold mb-5 text-lg">会社情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">会社名</label>
              <input
                type="text"
                defaultValue="サンプル不動産管理"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">電話番号</label>
                <input
                  type="text"
                  defaultValue="03-1234-5678"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">メール</label>
                <input
                  type="email"
                  defaultValue="info@sample-estate.co.jp"
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">住所</label>
              <input
                type="text"
                defaultValue="東京都新宿区西新宿1-1-1"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* プラン */}
        <div className="card p-6">
          <h2 className="font-semibold mb-5 text-lg">プラン</h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary">
            <div>
              <p className="font-medium">フリープラン</p>
              <p className="text-sm text-text-muted mt-0.5">管理戸数 50戸まで</p>
            </div>
            <button className="btn-primary">
              プランを変更
            </button>
          </div>
        </div>

        {/* デフォルト設定 */}
        <div className="card p-6">
          <h2 className="font-semibold mb-5 text-lg">デフォルト設定</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">管理手数料率（%）</label>
                <input
                  type="number"
                  defaultValue="5.0"
                  step="0.1"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">家賃支払期限（毎月N日）</label>
                <input
                  type="number"
                  defaultValue="27"
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary px-8">
            保存
          </button>
        </div>
      </div>
    </>
  );
}
