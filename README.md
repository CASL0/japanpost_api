# japanpost_api

[![Test](https://github.com/CASL0/japanpost_api/actions/workflows/test.yaml/badge.svg)](https://github.com/CASL0/japanpost_api/actions/workflows/test.yaml)
[![Lint](https://github.com/CASL0/japanpost_api/actions/workflows/lint.yaml/badge.svg)](https://github.com/CASL0/japanpost_api/actions/workflows/lint.yaml)
[![TypeScript Style Guide](https://img.shields.io/badge/code%20style-google-8A2BE2)](https://github.com/google/gts)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[日本郵政の郵便番号データ](https://www.post.japanpost.jp/zipcode/dl/utf-zip.html)を使用した郵便番号検索APIの構築をします。

## Requirements

以下の環境変数を設定してください。

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_DEFAULT_REGION

## Getting Started

VSCode で本プロジェクトを開き、コマンドパレット（Ctrl+Shift+P）から[Dev Containers: Reopen in Container...]を実行し、下記コマンドを実行してください。

```sh
yarn compile src/handler.ts
yarn cdk deploy
```

デプロイ完了です。

API Gatewayのサービスエンドポイントを確認し、APIをリクエストしてください。

```sh
curl http://example.com?zipcode=1010065
```

以下のレスポンスが返ってきます。

```json
[
  {
    "jisCode": "13101",
    "oldZipCode": "101  ",
    "zipCode": "1010065",
    "prefectureKatakana": "トウキョウト",
    "cityKatakana": "チヨダク",
    "townKatakana": "ニシカンダ",
    "prefecture": "東京都",
    "city": "千代田区",
    "town": "西神田"
  }
]
```

## 構成

API Gateway を Lambda と統合し、Lambda から S3 Select を呼び出して CSV から住所検索をします。

- API Gateway
- Lambda
- S3

![infra](https://github.com/CASL0/japanpost_api/assets/28913760/bc33b472-fd01-47e7-941e-b415ac532a77)

### 詳細

1. 日本郵政の Web サイトから CSV をダウンロードします。

   - <https://www.post.japanpost.jp/zipcode/dl/utf/zip/utf_ken_all.zip>

1. S3 のバケットを作成し、上記でダウンロードした CSV を配置します。
1. ラムダを作成し、aws-sdk を使って、S3 Select による住所検索をします。
   - 512 MiB
   - Node 16
1. 先に作成したバケットの読み取り権限をラムダに付与します。
1. API Gateway を作成し、上記のラムダと統合します。
