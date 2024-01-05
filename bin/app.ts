#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {ApiStack} from '../lib/apiStack';

const app = new cdk.App();
new ApiStack(app, 'ApiStack', {
  stage: app.node.tryGetContext('stage'),
});
