import {S3} from 'aws-sdk';

const BUCKET_NAME = process.env.BUCKET;
const S3_SELECT_OUTPUT_RECORD_DELIMITER = '\n';

/**
 * レスポンス型
 */
interface PostResponse {
  /**
   * 全国地方公共団体コード（JIS X0401、X0402）
   */
  jisCode: string;
  /**
   * （旧）郵便番号（5桁）
   */
  oldZipCode: string;
  /**
   * 郵便番号（7桁）
   */
  zipCode: string;
  /**
   * 都道府県名（漢字）
   */
  prefecture: string;
  /**
   * 都道府県名（全角カタカナ）
   */
  prefectureKatakana: string;
  /**
   * 市区町村名（漢字）
   */
  city: string;
  /**
   * 市区町村名（全角カタカナ）
   */
  cityKatakana: string;
  /**
   * 町域名（漢字）
   */
  town: string;
  /**
   * 町域名（全角カタカナ）
   */
  townKatakana: string;
}

/**
 * ラムダのソース
 * @param event
 * @returns
 */
const handler = async function (event: {
  httpMethod: string;
  path: string;
  queryStringParameters: {
    zipcode?: string;
  };
}) {
  const s3Client = new S3();
  try {
    if (BUCKET_NAME === undefined) {
      return {
        statusCode: 500,
        headers: {},
        body: JSON.stringify({
          description: 'S3 Bucket undefined',
        }),
      };
    }

    if (event.queryStringParameters.zipcode === undefined) {
      return {
        statusCode: 400,
        headers: {},
        body: JSON.stringify({
          description: 'Invalid parameter',
        }),
      };
    }

    if (event.httpMethod === 'GET') {
      if (event.path === '/') {
        const data = await s3Client
          .selectObjectContent({
            Bucket: BUCKET_NAME,
            Key: 'utf_ken_all.csv',
            ExpressionType: 'SQL',
            Expression: `SELECT * FROM s3object s WHERE s._3 = '${event.queryStringParameters.zipcode}';`,
            InputSerialization: {
              CSV: {
                FileHeaderInfo: 'NONE',
                RecordDelimiter: '\r\n',
                FieldDelimiter: ',',
              },
            },
            OutputSerialization: {
              JSON: {
                RecordDelimiter: S3_SELECT_OUTPUT_RECORD_DELIMITER,
              },
            },
          })
          .promise();

        const eventStream = data.Payload;
        if (eventStream === undefined) {
          return {
            statusCode: 500,
            headers: {},
            body: JSON.stringify({
              description: 'Failed in s3 select',
            }),
          };
        }

        let payload = '';
        for await (const chunk of eventStream) {
          if (typeof chunk === 'string' || chunk instanceof Buffer) {
            continue;
          }
          if (chunk.Records?.Payload !== undefined) {
            payload += chunk.Records.Payload.toString();
          } else if (chunk.Stats?.Details !== undefined) {
            console.info(
              `Processed ${chunk.Stats.Details.BytesProcessed} bytes`
            );
          } else if (chunk.End) {
            console.info('SelectObjectContent completed');
          }
        }

        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(convertResponse(payload), null, '\t'),
        };
      }
    }

    return {
      statusCode: 400,
      headers: {},
      body: 'Invalid Request Method',
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        statusCode: 400,
        headers: {},
        body: JSON.stringify(error.stack),
      };
    } else {
      const body = JSON.stringify(error, null, 2);
      return {
        statusCode: 400,
        headers: {},
        body: JSON.stringify(body),
      };
    }
  }
};

/**
 * S3 Selectの結果を{@link PostResponse}に変換します
 * @param payload S3 Selectの結果
 * @returns {@link PostResponse}
 */
function convertResponse(payload: string): PostResponse[] {
  return (
    payload
      // 先頭と末尾の{}を削除
      .substring(1, payload.length - 2)
      // 1行1レコード
      .split(S3_SELECT_OUTPUT_RECORD_DELIMITER)
      .map(e => {
        const record = e.split(',');
        return {
          jisCode: record[0].split(':')[1],
          oldZipCode: record[1].split(':')[1],
          zipCode: record[2].split(':')[1],
          prefectureKatakana: record[3].split(':')[1],
          cityKatakana: record[4].split(':')[1],
          townKatakana: record[5].split(':')[1],
          prefecture: record[6].split(':')[1],
          city: record[7].split(':')[1],
          town: record[8].split(':')[1],
        };
      })
  );
}

export {handler};
