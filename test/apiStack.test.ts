import {Template} from 'aws-cdk-lib/assertions';
import {ApiStack} from '../lib/apiStack';
import {App} from 'aws-cdk-lib';

describe('ApiStackのテスト', () => {
  let template: Template;

  beforeAll(() => {
    const app = new App();

    template = Template.fromStack(
      new ApiStack(app, 'ApiStack', {
        stage: 'beta',
      })
    );
  });

  test('S3のバケットを作成していること', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('lambdaが作成されていること', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'JapanPost_S3_Select',
      Handler: 'handler.handler',
      Runtime: 'nodejs16.x',
      MemorySize: 512,
      Timeout: 10,
    });
  });

  test('API Gatewayが作成されていること', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);

    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: '郵便番号検索API',
    });

    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'beta',
    });
  });
});
