## Stack

- An _Identity Pool_ with "Allow unauthenticated identities"
- An _Unauthenticated_ role, to be assumed by unauthenticated identities.
- A `LambdaRestAPI` with a single `ANY` method on root authorized by IAM.
- A _Policy_ that allows _Unauthenticated_ to execute that single endpoint.

## Tooling
- CDK:
  - [AWS CDK v2](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- Client
  - [AWS SDK for JavaScript v3](https://github.com/aws/aws-sdk-js-v3):
    - `GetIdCommand`
    - `GetCredentialsForIdentityCommand`
  - [Axios](https://github.com/axios/axios) and [aws4](https://github.com/mhart/aws4)

## Setup

```sh
npm install
cdk bootstrap
npm run deploy
npm run client
```

### Notes

- `npm run deploy` instead of `cdk deploy` to run the `"postdeploy"` script. This will read the outputs and write them into the _.env_ file.
- The **client** is a demo on how to retrieve the identity and credentials to call the API.
