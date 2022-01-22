import { Stack, StackProps, CfnOutput, CfnResource } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class CaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const identityPool = new cognito.CfnIdentityPool(this, 'CaIdentityPool', {
      allowUnauthenticatedIdentities: true,
    });

    new CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
    });

    const unauthenticated = new iam.Role(this, 'CaUnauthenticatedRole', {
      assumedBy: new iam.WebIdentityPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
        }
      ),
    });

    new cognito.CfnIdentityPoolRoleAttachment(this, 'CaDefaultPolicy', {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticated.roleArn,
      },
    });

    const fn = new lambda.Function(this, 'CaFn', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    const lambdaApi = new apigateway.LambdaRestApi(this, 'CaLambdaApi', {
      handler: fn,
      proxy: false,
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.IAM,
      },
    });

    // https://github.com/aws/aws-cdk/issues/15664#issuecomment-883708301
    (lambdaApi.node.tryFindChild('Endpoint') as CfnResource).overrideLogicalId(
      'Endpoint'
    );

    const method = lambdaApi.root.addMethod('ANY');

    unauthenticated.attachInlinePolicy(
      new iam.Policy(this, 'CaAllowAny', {
        statements: [
          new iam.PolicyStatement({
            actions: ['execute-api:Invoke'],
            effect: iam.Effect.ALLOW,
            resources: [method.methodArn],
          }),
        ],
      })
    );
  }
}
