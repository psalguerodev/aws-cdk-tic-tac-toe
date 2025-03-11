import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MyStack } from '../src/main';

jest.mock('aws-cdk-lib/aws-s3-deployment', () => ({
  BucketDeployment: jest.fn().mockImplementation(() => ({})),
  Source: {
    asset: jest.fn().mockImplementation(() => ({})),
  },
}));

describe('MyStack', () => {
  let app: App;
  let stack: MyStack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new MyStack(app, 'test');
    template = Template.fromStack(stack);
  });

  test('crea el bucket S3 para el sitio web con la configuración correcta', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: Match.objectLike({
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html',
      }),
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      }),
    });
  });

  test('crea los outputs del stack', () => {
    template.hasOutput('WebsiteURLStack', {
      Description: 'URL del sitio web (Stack)',
    });

    template.hasOutput('BucketNameStack', {
      Description: 'Nombre del bucket S3 (Stack)',
    });
  });

  test('el bucket tiene la configuración CORS correcta', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      CorsConfiguration: Match.objectLike({
        CorsRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET'],
            AllowedOrigins: ['*'],
          },
        ],
      }),
    });
  });

  test('snapshot del stack', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });
});
