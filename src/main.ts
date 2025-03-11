import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebsiteConstruct } from './constructs/website-construct';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // Crear el sitio web con S3 y CloudFront
    const website = new WebsiteConstruct(this, 'WebsiteConstruct', {
      bucketName: `${id}-website-bucket`,
      websitePath: '../../frontend/dist',
    });

    // Outputs a nivel de stack
    new CfnOutput(this, 'WebsiteURLStack', {
      value: website.websiteUrl,
      description: 'URL del sitio web (Stack)',
    });

    new CfnOutput(this, 'BucketNameStack', {
      value: website.bucketName,
      description: 'Nombre del bucket S3 (Stack)',
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'cdk-projen-io-ts-dev', { env: devEnv });
// new MyStack(app, 'cdk-projen-io-ts-prod', { env: prodEnv });

app.synth();
