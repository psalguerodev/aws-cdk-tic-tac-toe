import * as path from 'path';
import { CfnOutput } from 'aws-cdk-lib';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface WebsiteConstructProps {
  bucketName: string;
  websitePath: string;
}

export class WebsiteConstruct extends Construct {
  public readonly bucket: Bucket;
  public readonly websiteUrl: string;
  public readonly bucketName: string;
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: WebsiteConstructProps) {
    super(scope, id);

    // 1. Crear el bucket para el sitio web
    this.bucket = new Bucket(this, props.bucketName, {
      bucketName: props.bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [HttpMethods.GET],
          allowedOrigins: ['*'],
        },
      ],
    });

    // 3. Crear la distribución de CloudFront
    this.distribution = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // 4. Desplegar el contenido del frontend con invalidación de CloudFront
    new BucketDeployment(this, `${id}-deployment`, {
      sources: [Source.asset(path.join(__dirname, props.websitePath))],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });

    // Guardar las propiedades
    this.websiteUrl = this.bucket.bucketWebsiteUrl;
    this.bucketName = this.bucket.bucketName;

    // Outputs
    new CfnOutput(this, 'CloudFrontURL', {
      value: this.distribution.distributionDomainName,
      description: 'URL de CloudFront',
    });

    new CfnOutput(this, 'BucketName', {
      value: this.bucketName,
      description: 'Nombre del bucket S3',
    });
  }
}
