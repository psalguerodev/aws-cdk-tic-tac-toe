import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { WebsiteConstruct } from '../../src/constructs/website-construct';

describe('WebsiteConstruct', () => {
  let app: App;
  let stack: Stack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
    new WebsiteConstruct(stack, 'TestWebsite', {
      bucketName: 'test-bucket',
      websitePath: '../../frontend/dist',
    });
    template = Template.fromStack(stack);
  });

  test('crea un bucket S3 con la configuración correcta', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html',
      },
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      }),
    });
  });

  test('crea una distribución CloudFront', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
          CachePolicyId: Match.anyValue(),
          Compress: true,
        }),
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
      }),
    });
  });

  test('crea un Origin Access Control', () => {
    template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: Match.objectLike({
        Name: Match.anyValue(),
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      }),
    });
  });

  test('configura el bucket deployment', () => {
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      DestinationBucketName: Match.anyValue(),
      DistributionPaths: ['/*'],
    });
  });
});
