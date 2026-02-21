import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UploaderFunction } from '../src/lambda/uploader';

export class StorageStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        new UploaderFunction(this, 'Uploader');
        console.log('StorageStack created with UploaderFunction');
    }
}
