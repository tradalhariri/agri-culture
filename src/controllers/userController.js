/**
 * Created by : Deyaa
 *
 *
 */

const { AWS } = require("../config/aws");
const uniqid = require("uniqid");
const crudController = require("./crudController");
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const request = require("request");
const jwkToPem = require("jwk-to-pem");
const jwt = require("jsonwebtoken");
const { poolData } = require("../config/aws");
const pool_region = "eu-central-1";
const sendEmail = require("../utils/mailer.helper");
// const uniqid = require('uniqid');

const user = require("../utils/helper");
const { default: axios } = require("axios");
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const DynamoDB = new AWS.DynamoDB.DocumentClient();

class SensorController extends crudController {
  constructor(tableName) {
    super(tableName);
  }

  create = async (body) => {

    if (body.PK == undefined) {
      body.SK = `user_${body.id}`;
      body.PK = "user";
      body.GSI1PK = "user";
      try {
        body.img = req.file.location;
      } catch (e) {
        body.img = "https://cdn-icons-png.flaticon.com/512/21/21104.png";
      }
    }

    delete body.id;
    if (body.dfNode) {
      console.log(body);
      for (let i = 0; i < body.countNodes; i++) {
        const response = await axios.post('http://ec2-3-70-229-4.eu-central-1.compute.amazonaws.com:8080/api/device-profiles', {
          deviceProfile: {
            name: body.name,
            networkServerID: 1,
            organizationID: 1
          }

        },
        {headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhcyIsImV4cCI6MTY1Mjk5OTY1OSwiaWQiOjEsImlzcyI6ImFzIiwibmJmIjoxNjUyOTEzMjU5LCJzdWIiOiJ1c2VyIiwidXNlcm5hbWUiOiJhZG1pbiJ9.nrQgoyD_AKA_LO1GRsYBhXvF_Ap9CcecvvGb_uD1XIk`
        }})
        console.log(response.data, 'response');
        let paramsNode = {
          TableName: this.tableName,
          Item: {
            PK:`node`,
            SK:`node_${response?.data?.id}`,
            GSI1PK:body.SK ,
            name:`defulte node for ${body.name} `
          },
        };
        DynamoDB.put(paramsNode).promise();

      }

      // let paramsSensor = {
      //   TableName: this.tableName,
      //   Item: {
      //     PK:`sensor`,
      //     SK:`sensor_${body.sensorId}`,
      //     GSI1PK:`node_${body.nodeId}`,
      //     name:`defulte sensor for ${body.name} `

      //   },
      // };

      // DynamoDB.put(paramsSensor).promise();
    }
    let params = {
      TableName: this.tableName,
      Item: body,
    };

    DynamoDB.put(params).promise();
  };

  addNodeforUser = (req, res) => {
    const body = { ...req.body };
    const params = {
      TableName: this.tableName,
      Key: {
        PK: body.PK,
        SK: body.SK,
      },
      UpdateExpression: "set GSI1PK = :GSI1PK",
      ExpressionAttributeValues: {
        ":GSI1PK": body.userId,
      },
    };

    DynamoDB.update(params, (err, result) => {
      if (!err) {
        return res.status(200).json({ status: true, message: params });
      } else {

        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  getAllUser = (req, res) => {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK",
      ExpressionAttributeValues: {
        ":PK": "user",
      },
    };
    DynamoDB.query(params, (err, data) => {
      if (!err) {
        return res.status(200).json({ status: true, message: data });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };
  getNodesForUser = (req, res) => {
    const userId = req.params.userId;

    const params = {
      TableName: this.tableName,
      IndexName: "GSI1PK-index",
      KeyConditionExpression: "GSI1PK = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };
    DynamoDB.query(params, (err, data) => {
      if (!err) {
        return res.status(200).json({ status: true, message: data });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  deleteUser = (req, res) => {
    const { SK, PK } = req.query;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: PK,
        SK: SK,
      },
    };
    DynamoDB.delete(params, (err) => {
      if (!err) {
        return res.status(200).json({ status: true, message: "Deleted!" });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  RegisterUser = async (req, res) => {
    console.log("rtrt");
    const attributeList = [];
    const body = { ...req.body };
    console.log(body);

    body.id = uniqid();
    try {
      body.img = req.file.location;
    } catch (e) {
      body.img = "https://cdn-icons-png.flaticon.com/512/21/21104.png";
    }

    // attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "name", Value: body.name }));
    attributeList.push(
      new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: "email",
        Value: body.email,
      })
    );
    attributeList.push(
      new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: "custom:id",
        Value: body.id,
      })
    );

    let pass = uniqid();
    let sendEmailParam = {
      email: body.email,
      password: pass,
      name: body.name,
      lang: "en",
      nameFile: "otp",
      subject: "Password for user",
    };

    console.log(pass);
    userPool.signUp(
      body.email,
      pass,
      attributeList,
      null,
      async (err, result) => {
        if (!err) {
          sendEmail(sendEmailParam);
          delete body.password;
          await this.create(body);
          return res.status(200).json({ status: true, message: result });
        } else {
          console.log(err.message);

          return res.status(409).json({ status: false, message: err.message });
        }
      }
    );
  };
}

module.exports = SensorController;
