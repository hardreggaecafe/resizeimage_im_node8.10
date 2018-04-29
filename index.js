'use strict';

const im = require('imagemagick');
const aws = require('aws-sdk');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const filename = event.path.replace(/^\//, "");
    var bucket = 'some-bucket';

    const width = event.queryStringParameters.w;
    console.log("file="+filename+" bucket="+bucket);
    const params = {
        Bucket: bucket,
        Key: 'images/' +filename
    };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            var message = "Error getting object " + filename + " from bucket " + bucket +
                ". Make sure they exist and your bucket is in the same region as this function.";
            context.fail(message);
        } else {
            var contentType = data.ContentType;
            var extension = contentType.split('/').pop();

            im.resize({
                srcData: data.Body,
                format: extension,
                width: width
            }, function(err, stdout, stderr) {
                if(err) {
                    context.fail(err);
                    return;
                }
                var contentType = filename.endsWith('jpg') ? "image/jpeg" : "image/png";
                callback(null, {
                    "isBase64Encoded": true,
                    "statusCode": 200,
                    "headers": { "Content-Type": contentType },
                    "body": new Buffer(stdout, 'binary').toString('base64')
                });
            });
        }
    });
};