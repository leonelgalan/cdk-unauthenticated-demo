import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import * as aws4 from 'aws4';
import axios, { AxiosRequestConfig } from 'axios';
import { config } from 'dotenv';
import { parse } from 'url';

config();

const IDENTITY_POOL_ID = process.env.IDENTITY_POOL_ID as string;
const ENDPOINT = process.env.ENDPOINT as string;

const client = new CognitoIdentityClient({
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({}),
    identityPoolId: IDENTITY_POOL_ID,
  }),
});

const getMessage = async () => {
  try {
    const identityResponse = await client.send(
      new GetIdCommand({
        IdentityPoolId: IDENTITY_POOL_ID,
      })
    );
    const { IdentityId } = identityResponse;

    const credentialsResponse = await client.send(
      new GetCredentialsForIdentityCommand({
        IdentityId,
      })
    );

    if (credentialsResponse.Credentials === undefined)
      return console.error('No credentials');
    const { AccessKeyId, SecretKey, SessionToken, Expiration } =
      credentialsResponse.Credentials;

    const url = ENDPOINT;
    const { host, path } = parse(ENDPOINT);

    const method = 'GET';

    let request = {
      method,
      host,
      path,
      url,
    };

    let signedRequest = aws4.sign(request, {
      secretAccessKey: SecretKey,
      accessKeyId: AccessKeyId,
      sessionToken: SessionToken,
    });

    if (signedRequest.headers) {
      delete signedRequest.headers['Host'];
      delete signedRequest.headers['Content-Length'];
    }

    let response = await axios(signedRequest as AxiosRequestConfig);
    console.log(response.data);
  } catch (err) {
    console.error({ error: err });
  }
};

getMessage();
