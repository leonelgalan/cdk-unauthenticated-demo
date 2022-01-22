import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { CaStack } from '../lib/ca-stack';

const app = new cdk.App();
const stack = new CaStack(app, 'CaStack');
const template = Template.fromStack(stack);

test('Identity Pool Created', () => {
  const foo = template.hasResourceProperties('AWS::Cognito::IdentityPool', {
    AllowUnauthenticatedIdentities: true,
  });
});

test('Unauthenticated Role Can Be Assumed by Identity', () => {
  template.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        Match.objectLike({
          Action: 'sts:AssumeRoleWithWebIdentity',
          Principal: {
            Federated: 'cognito-identity.amazonaws.com',
          },
        }),
      ],
    },
  });
});

test('Unauthenticated Role is Attached', () => {
  template.hasResourceProperties('AWS::Cognito::IdentityPoolRoleAttachment', {
    IdentityPoolId: {
      Ref: 'CaIdentityPool',
    },
    Roles: {
      unauthenticated: Match.objectLike({}),
    },
  });
});

describe('LambdaApi', () => {
  const uriCapture = new Capture();

  test("Lambda's Handler and Runtime", () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs14.x',
    });
  });

  test("The ANY Method's Authorization Type", () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'ANY',
      AuthorizationType: 'AWS_IAM',
      Integration: Match.objectLike({
        Uri: uriCapture,
      }),
    });
  });

  test('ANY Method uses Lambda Integration', () => {
    expect(JSON.stringify(uriCapture.asObject())).toContain('CaFn');
  });

  describe('Policy that allows unauthenticated to invoke API', () => {
    const resourceCapture = new Capture();
    const roleCapture = new Capture();

    test('Unauthenticated is allowed to invoke ANY', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            Match.objectLike({
              Resource: resourceCapture,
            }),
          ],
        },
        Roles: roleCapture,
      });
    });

    test('ANY Method uses Lambda Integration', () => {
      expect(JSON.stringify(resourceCapture.asObject())).toContain(
        'CaLambdaApi'
      );
    });

    test('ANY Method uses Lambda Integration', () => {
      expect(JSON.stringify(roleCapture.asArray())).toContain(
        'CaUnauthenticatedRole'
      );
    });
  });
});
