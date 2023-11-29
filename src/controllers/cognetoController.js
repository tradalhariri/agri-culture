const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
const { poolData } = require('../config/aws')
const pool_region = 'eu-central-1';
const AWS = require("aws-sdk");
const uniqid = require('uniqid');

const user = require('../utils/helper');
const { default: axios } = require('axios');
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

class Cognito {
    /**
     * 
     * Get all users 
     * route : http://localhost:3000/api/getAllCognito
     * @param req 
     * 
     * @httpMethod (get)
     * 
     * @param res 200 if was getting events , 500 if there is internal server error
     * 
     */
    getAll = (req, res) => {
        const params = {
            UserPoolId: poolData.UserPoolId,

        };

        const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

        cognitoidentityserviceprovider.listUsers(params, (err, data) => {
            if (!err) {
                return res.status(200).json({ status: true, message: data })
            } else {
                return res.status(500).json({ status: false, message: err.message })
            }
        });

    }


    /**
    * 
    * Register user to cognito
    * 
    * @param req request body with posted data
    *  route : http://localhost:3000/auth/registerCogneto
    *  body :{
    * email:deyaa2@gmail.com,
     password:xxx@1999,
     location:kkk,
     name:deyaa,
    *}
    * @httpMethod (post)
    * 
    * @param res 200 if create is done successfully , 500 if there is internal server error
    * 
    */

    RegisterUser = async (req, res) => {
        const attributeList = [];
        const body = { ...req.body };
        body.id = uniqid();
        try {
            body.img = req.file.location
        } catch (e) {
            body.img = 'https://cdn-icons-png.flaticon.com/512/21/21104.png'
        }



        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "name", Value: body.name }));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: body.email }));




        userPool.signUp(body.email, body.password, attributeList, null, async (err, result) => {
            if (!err) {
                delete body.password;
                await user.createItemForDynamoDB("User", body)
                return res.status(200).json({ status: true, message: result })
            } else {
                return res.status(409).json({ status: false, message: err.message })
            }

        })

    }


    /**
    * 
    * Register sub-admin to cognito
    * 
    * @param req request body with posted data
    *  route : http://localhost:3000/auth/registerCogneto
    *  body :{
    * email:deyaa2@gmail.com,
     password:xxx@1999,
     location:kkk,
     name:deyaa,
    *}
    * @httpMethod (post)
    * 
    * @param res 200 if create is done successfully , 500 if there is internal server error
    * 
    */

    RegisterSubAdmins = async (req, res) => {
        const attributeList = [];
        const body = req.body

        body.id = uniqid();
        const cognito = new AWS.CognitoIdentityServiceProvider({
            apiVersion: "2016-04-18",
        });

        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "name", Value: body.name }));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: body.email }));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "phone_number", Value: body.phone }));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:id", Value: body.id }));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:type", Value: 'admin' }));
        const params = {
            UserPoolId: poolData.UserPoolId,
            Username: body.email,
            UserAttributes: attributeList,
            TemporaryPassword: uniqid(),
        };

        cognito.adminCreateUser(params, async (err, result) => {
            if (!err) {
                return res.status(200).json({ status: true, message: result })
            } else {
                return res.status(500).json({ status: false, message: err.message })
            }

        })
    }


    /**
     * 
     * confirm account
     * 
     * @param req request body with posted data
     *  route : http://localhost:3000/auth/registerCogneto
     *  body :{
     * email:deyaa2@gmail.com,
      password:xxx@1999,
      location:kkk,
      name:deyaa,
     *}
     * @httpMethod (post)
     * 
     * @param res 200 if create is done successfully , 500 if there is internal server error
     * 
     */
    confirm = (req, res) => {
        const body = req.body;
        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.confirmRegistration(body.code, true, (err, result) => {
            if (!err) {
                return res.status(200).json({ status: true, message: result })
            } else {
                return res.status(500).json({ status: false, message: err.message })
            }
        });
    }

    Login = (req, res) => {

        const body = req.body;

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: body.email,
            Password: body.password,
        });

        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: result => {
                return res.status(200).json({ status: true, message: result })
            },
            onFailure: err => {
                console.log(err);
                return res.status(500).json({ status: false, message: err.message })
            },

        });
    }

    LoginAdmin = (req, res) => {
        const body = req.body;
        axios.post('http://ec2-3-70-229-4.eu-central-1.compute.amazonaws.com:8080/api/internal/login', body).then(result => {
            return res.status(200).json({ status: true, message: result.data })
        }).catch(err => {
            return res.status(500).json({ status: false, message: err.message })

        })
    }


    update = (req, res) => {
        const body = req.body;

        const attributeList = [];
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(body));

        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.updateAttributes(attributeList, (err, result) => {
            if (!err) {
                return res.status(200).json({ status: true, message: result })
            } else {
                return res.status(500).json({ status: false, message: err.message })
            }
        });
    }

    ValidateToken = (req, res) => {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        request({
            url: `https://cognito-idp.${pool_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let pems = {};
                const keys = body['keys'];
                for (let i = 0; i < keys.length; i++) {
                    //Convert each key to PEM
                    const key_id = keys[i].kid;
                    const modulus = keys[i].n;
                    const exponent = keys[i].e;
                    const key_type = keys[i].kty;
                    const jwk = { kty: key_type, n: modulus, e: exponent };
                    const pem = jwkToPem(jwk);
                    pems[key_id] = pem;
                }
                //validate the token
                const decodedJwt = jwt.decode(token, { complete: true });
                if (!decodedJwt) {
                    return res.status(401).json({ status: false, message: "Not a valid JWT token" })

                }

                const kid = decodedJwt.header.kid;
                const pem = pems[kid];
                if (!pem) {
                    return res.status(401).json({ status: false, message: "Invalid token" })
                }

                jwt.verify(token, pem, (err, payload) => {
                    if (!err) {
                        return res.status(200).json({ status: true, message: payload })
                    } else {
                        return res.status(401).json({ status: false, message: "Invalid Token." })
                    }
                });
            } else {
                return res.status(response.statusCode).json({ status: false, message: error.message })
            }
        });
    }

    ValidateTokenAdmin  = (req, res) => {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        const decodedJwt = jwt.decode(token, { complete: true });
        if (!decodedJwt) {
            return res.status(401).json({ status: false, message: "Not a valid JWT token" })

        }else{
            return res.status(200).json({ status: true, message: 'Validate' })

        }

    }
    renew = (req, res) => {
        const body = req.body;

        const RefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: "your_refresh_token_from_a_previous_login" });

        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.refreshSession(RefreshToken, (err, session) => {
            if (!err) {
                let retObj = {
                    "access_token": session.accessToken.jwtToken,
                    "id_token": session.idToken.jwtToken,
                    "refresh_token": session.refreshToken.token,
                }
                return res.status(200).json({ status: true, message: retObj })
            } else {
                return res.status(500).json({ status: false, message: err.message })
            }
        })
    }


    reSendCode = (req, res) => {
        const body = req.body;

        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.resendConfirmationCode((err, session) => {
            if (!err) {
                // let retObj = {
                //     "access_token": session.accessToken.jwtToken,
                //     "id_token": session.idToken.jwtToken,
                //     "refresh_token": session.refreshToken.token,
                // }
                return res.status(200).json({ status: true, message: session })
            } else {
                return res.status(500).json({ status: false, message: err.message })
            }
        })
    }

    DeleteUser = (req, res) => {

        const body = req.body;


        const params = {
            Username: body.email,
            UserPoolId: userPool.getUserPoolId()
        };

        user.deleteItemFromDynamoDB("User", body.email)

        const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

        cognitoidentityserviceprovider.adminDeleteUser(params, (err, result) => {
            if (err) {
                return res.status(500).json({ status: false, message: err.message })
            } else {
                return res.status(200).json({ status: true, message: { message: "Successfully deleted the user.", result } })
            }
        });
    }

    deleteAttributes = (req, res) => {
        const body = req.body;
        const attributeList = [];
        attributeList.push(req.attr);

        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.deleteAttributes(attributeList, (err, result) => {
            if (!err) {
                return res.status(200).json({ status: true, message: result })
            } else {
                return res.status(500).json({ status: false, message: err.message })

            }
        });
    }



    ChangePassword = (req, res) => {
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: req.email,
            Password: req.password,
        });

        const userData = {
            Username: req.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: found => {
                cognitoUser.changePassword(password, newpassword, (err, result) => {
                    if (!err) {
                        return res.status(200).json({ status: true, message: { message: "Successfully changed password of the user.", result } })

                    } else {
                        return res.status(500).json({ status: false, message: err.message })

                    }
                });
            },
            onFailure: err => {
                return res.status(500).json({ status: false, message: err.message })
            },
        });
    }



    resetPassword = (req, res) => {
        const body = req.body;
        console.log(body, 'fdfdfd');
        // const poolData = { UserPoolId: xxxx, ClientId: xxxx };
        // userPool is const userPool = new AWSCognito.CognitoUserPool(poolData);

        // setup cognitoUser first
        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        // call forgotPassword on cognitoUser
        cognitoUser.forgotPassword({

            onSuccess: result => {
                console.log(result, 'rrr');
                return res.status(200).json({ status: true, message: result })

            },
            onFailure: err => {
                console.log(err.message, 'rrr');
                return res.status(500).json({ status: false, message: err.message })
            },

        });

    }



    confirmPassword = (req, res) => {
        const body = req.body;
        console.log(body);

        const userData = {
            Username: body.email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);


        cognitoUser.confirmPassword(body.token, body.password, {

            onSuccess: result => {
                console.log(result);

                return res.status(200).json({ status: true, message: result })

            },
            onFailure: err => {
                console.log(err);
                return res.status(500).json({ status: false, message: err.message })
            },

        });
    }
}

module.exports = new Cognito()