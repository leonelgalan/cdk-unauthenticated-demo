#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { CaStack } from '../lib/ca-stack';

const app = new cdk.App();
new CaStack(app, 'CaStack', {});
