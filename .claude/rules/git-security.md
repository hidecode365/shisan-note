## Git衛生・セキュリティ

- `.claude/settings.local.json` はローカル権限設定。絶対にコミットしない（`.gitignore`で除外済み）
- `docs/.claude/`・`docs/.claudian/`・`docs/.obsidian/` はツール内部状態。実装作業では読み込み対象外（`.claudeignore`で除外済み）。ルート側とdocs側のCLAUDE.mdは役割を分離し内容を重複させない
- `permissions.allow` にルールを追加する際、`C:\Users\<username>\` のような絶対パスをコマンド文字列に埋め込まない。環境変数や相対パスを優先する
- `git add` 前に `git status` で意図しないファイルが混入していないか確認する（特に `.claude/`・`docs/.claudian/`・`docs/.obsidian/` 配下）
- 機密情報を誤ってpushした場合は `git-filter-repo` で履歴除去しforce pushで対応する