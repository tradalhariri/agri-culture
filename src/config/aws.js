const AWS = require("aws-sdk");

const accessKeyId = process.env.ACCESS_KEY_ID
const secretAccessKey = process.env.SECRET_ACCESS_KEY


// AWS sdk Config 
AWS.config.update({
    region: "eu-central-1",
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,

});

// PoolData of userpool from aws
const poolData = {
    UserPoolId: "eu-central-1_LIMhD2kXr" ,// Your user pool id here    
    ClientId: "2uk29ftnu4fauk5pokodjpnd4t" // Your client id here
};
// USER_POOL_ID =  eu-central-1_CK0A56gda
// CLIENT_ID = 1kuscgdurmbf21jsoepssi73j1

// S3 Config from aws 
const s3 = new AWS.S3({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
});

//kkkkjjgg
module.exports = { poolData, AWS, s3 };