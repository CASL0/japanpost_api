# japanpost_api

[日本郵政の郵便番号データ](https://www.post.japanpost.jp/zipcode/dl/utf-zip.html)を使用した郵便番号検索APIの構築をします。

## Getting Started

以下の環境変数を設定してください。

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_DEFAULT_REGION

VSCode で本プロジェクトを開き、コマンドパレット（Ctrl+Shift+P）から[Dev Containers: Reopen in Container...]を実行し、下記コマンドを実行してください。

```sh
tsc src/handler.ts
npx cdk deploy
```

デプロイ完了です。

## 構成

API Gateway を Lambda と統合し、Lambda から S3 Select を呼び出して CSV から住所検索をします。

- API Gateway
- Lambda
- S3

![infra](https://github.com/CASL0/japanpost_api/assets/28913760/bc33b472-fd01-47e7-941e-b415ac532a77)

### 詳細

1. 日本郵政の Web サイトから CSV をダウンロードします。

   - https://www.post.japanpost.jp/zipcode/dl/utf/zip/utf_ken_all.zip

1. S3 のバケットを作成し、上記でダウンロードした CSV を配置します。
1. ラムダを作成し、aws-sdk を使って、S3 Select による住所検索をします。
   - 512 MiB
   - Node 16
1. 先に作成したバケットの読み取り権限をラムダに付与します。
1. API Gateway を作成し、上記のラムダと統合します。
