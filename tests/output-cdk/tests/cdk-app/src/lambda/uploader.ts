import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class UploaderFunction extends NodejsFunction {
    constructor(scope: Construct, id: string) {
        super(scope, id, {
            runtime: Runtime.NODEJS_22_X,
            entry: 'src/lambda/uploader.ts',
            handler: 'handler',
        });
        console.log('UploaderFunction initialized');
    }
}
