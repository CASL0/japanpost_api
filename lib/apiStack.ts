import {Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {AssetCode, Function, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {BucketDeployment, Source} from 'aws-cdk-lib/aws-s3-deployment';
import {Construct} from 'constructs';

export interface ApiProps extends StackProps {
  readonly stage: 'prod' | 'beta';
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: ApiProps) {
    super(scope, id, props);

    // 日本郵政のCSVをS3バケットに配置
    const bucket = new Bucket(this, 'Bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    new BucketDeployment(this, 'CsvDeployment', {
      sources: [Source.asset('./assets/utf_ken_all.zip')],
      destinationBucket: bucket,
    });

    // S3 Selectのラムダ
    const lambdaFunction = new Function(this, 'Lambda', {
      functionName: 'PostS3Select',
      handler: 'handler.handler',
      runtime: Runtime.NODEJS_16_X,
      code: new AssetCode('./src'),
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: {
        BUCKET: bucket.bucketName,
      },
    });
    // ラムダにバケットの読み取り権限を当てる
    bucket.grantRead(lambdaFunction);

    // API Gatewayを作成し、ラムダと統合
    const restApi = new RestApi(this, 'RestApi', {
      deployOptions: {
        stageName: props?.stage,
      },
    });
    restApi.root.addMethod('GET', new LambdaIntegration(lambdaFunction));
  }
}
