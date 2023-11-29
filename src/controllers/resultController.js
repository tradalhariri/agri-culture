/**
 * Created by : Deyaa
 *
 *
 */

const { AWS } = require("../config/aws");
const uniqid = require("uniqid");
const crudController = require("./crudController");

const DynamoDB = new AWS.DynamoDB.DocumentClient();

class ResultsController {
  create = async (req, res) => {
    try {
      let paramss = {
        TableName: "results",

        Item: {
          PK: new Date().toISOString().split("T")[0],
          SK: "result",
          ...req.body,
        },
      };

      let wrtiteNode = await DynamoDB.put(paramss).promise();
      return res.status(200).json(wrtiteNode);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  };

  get = async (req, res) => {
    try {
      const id = req.params.id;
      const params = {
        TableName: "results",
        KeyConditionExpression: "PK = :PK AND SK = :SK",
        ExpressionAttributeValues: {
          ":PK": id,
          ":SK": "result",
        },
      };
      DynamoDB.query(params, (err, data) => {
        if (!err) {
          return res.status(200).json({ status: true, message: data });
        } else {
          return res.status(500).json({ status: false, message: err.message });
        }
      });
    } catch (err) {
      return res.status(500).json(err.message);
    }
  };
}

module.exports = new ResultsController();
