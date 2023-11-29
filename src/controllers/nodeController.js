/**
 * Created by : Deyaa
 *
 *
 */

const { AWS } = require("../config/aws");
const uniqid = require("uniqid");
const crudController = require("./crudController");

const DynamoDB = new AWS.DynamoDB.DocumentClient();

class SensorController extends crudController {
  constructor(tableName) {
    super(tableName);
  }

  create = (req, res) => {
    const body = { ...req.body };

    if (body.PK == undefined) {
      body.SK = `node_${body.nodeId}`;
      body.PK = "node";
      body.GSI1PK = "node";
      if (body.dfSensor) {
      }
      try {
        body.img = req.file.location;
      } catch (e) {
        body.img =
          "https://www.kindpng.com/picc/m/226-2261816_sensors-png-transparent-png.png";
      }
    }

    let params = {
      TableName: this.tableName,
      Item: body,
    };
    DynamoDB.put(params, (err, result) => {
      if (!err) {
        this.addDefulteSensorforNode(body.SK, body.name);
        return res.status(200).json({ status: true, message: params });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  addSensorforNode = (req, res) => {
    const body = { ...req.body };
    const params = {
      TableName: this.tableName,
      Key: {
        PK: body.PK,
        SK: body.SK,
      },
      UpdateExpression: "set GSI1PK = :GSI1PK",
      ExpressionAttributeValues: {
        ":GSI1PK": body.nodeId,
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

  addDefulteSensorforNode = (nodeId, nodeName) => {
    let body = {};

    body.SK = `sensor_${uniqid()}`;
    body.PK = "sensor";
    body.GSI1PK = nodeId;
    body.name = "Default sensor for " + nodeName;

    try {
      body.img = req.file.location;
    } catch (e) {
      body.img =
        "https://www.kindpng.com/picc/m/226-2261816_sensors-png-transparent-png.png";
    }

    let params = {
      TableName: this.tableName,
      Item: body,
    };
    DynamoDB.put(params).promise();
  };

  getAllNode = (req, res) => {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK",
      ExpressionAttributeValues: {
        ":PK": "node",
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

  getNodesNotSet = (req, res) => {
    const params = {
      TableName: this.tableName,
      IndexName: "GSI1PK-index",
      KeyConditionExpression: "GSI1PK = :node",
      ExpressionAttributeValues: {
        ":node": "node",
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
  deleteNode = (req, res) => {
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

  // getNodesForUser = (req, res) => {
  //   const userId = req.params.userId;

  //   const params = {
  //     TableName: this.tableName,
  //     IndexName: "GSI1PK-index",
  //     KeyConditionExpression: "GSI1PK = :userId",
  //     ExpressionAttributeValues: {
  //       ":userId": userId,
  //     },
  //   };
  //   DynamoDB.query(params, (err, data) => {
  //     if (!err) {
  //       return res.status(200).json({ status: true, message: data });
  //     } else {
  //       return res.status(500).json({ status: false, message: err.message });
  //     }
  //   });
  // };

  getDailyAverageReadingsForEveryNode = (req, res) => {
    const nodeId = req.params.nodeId;
    const params = {
      ProjectionExpression: "reading",
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK AND SK = :SK",
      ExpressionAttributeValues: {
        ":PK": "node",
        ":SK": nodeId,
      },
    };

    DynamoDB.query(params, (err, data) => {
      if (!err) {
        return res
          .status(200)
          .json({ status: true, message: data.Items[0]?.reading || {} });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  getDailyAverageReadingsForAllNodes = (req, res) => {
    const userId = req.params.userId;
    const params = {
      ProjectionExpression: "reading",
      TableName: this.tableName,
      IndexName: "GSI1PK-index",
      KeyConditionExpression: "GSI1PK = :user",
      ExpressionAttributeValues: {
        ":user": userId,
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

  addNewReadingForNode = async (req, res) => {
    const nodeId = req.params.nodeId;
    const paramsOneNode = {
      ProjectionExpression: "reading",
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK AND SK = :SK",
      ExpressionAttributeValues: {
        ":PK": "node",
        ":SK": nodeId,
      },
    };

    let readForNode = await DynamoDB.query(paramsOneNode).promise();
    readForNode = readForNode.Items[0].reading;

    let body = req.body;

    const paramsForLastTenRead = {
      TableName: this.tableName,
      Key: {
        ["PK"]: "node",
        ["SK"]: nodeId,
      },
      ReturnValues: "ALL_NEW",
      UpdateExpression:
        "set #lastTenRead = list_append(if_not_exists(#lastTenRead, :empty_list), :read)",
      ExpressionAttributeNames: {
        "#lastTenRead": "lastTenRead",
      },
      ExpressionAttributeValues: {
        ":read": [body],
        ":empty_list": [],
      },
    };

    if (
      readForNode.publishedAt.split("T")[0] == body.publishedAt.split("T")[0]
    ) {
      delete readForNode.publishedAt;
      for (const property in readForNode) {
        let item = `{"${property}": ${
          readForNode[property] + body[property] / (readForNode.number + 1)
        }}`;

        item = JSON.parse(item);

        body = { ...body, ...item };
      }

      DynamoDB.update(paramsForLastTenRead).promise();
      body.number = readForNode.number + 1;
    } else {
      delete paramsForLastTenRead.ExpressionAttributeNames;
      delete paramsForLastTenRead.ExpressionAttributeValues;

      paramsForLastTenRead.UpdateExpression = "remove lastTenRead";
      DynamoDB.update(paramsForLastTenRead).promise();
    }

    const params = {
      TableName: this.tableName,
      Key: {
        ["PK"]: "node",
        ["SK"]: nodeId,
      },
      UpdateExpression: `set reading = :keyValue`,
      ExpressionAttributeValues: {
        ":keyValue": body,
      },
      ReturnValues: "UPDATED_NEW",
    };

    DynamoDB.update(params, (err, data) => {
      if (!err) {
        return res.status(200).json({ status: true, message: data });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  getLastTenReadForNode = (req, res) => {
    const nodeId = req.params.nodeId;
    const params = {
      ProjectionExpression: "lastTenRead",
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK AND SK = :SK",
      ExpressionAttributeValues: {
        ":PK": "node",
        ":SK": nodeId,
      },
    };

    DynamoDB.query(params, (err, data) => {
      if (!err) {
        let arr = data.Items[0]?.lastTenRead;
        let len = arr?.length ? arr.length : 0;
        let ten = 10;
        let newArr = [];

        while (len != 0 && ten != 0) {
          newArr.push(arr[len - 1]);
          len--;
          ten--;
        }

        return res.status(200).json({ status: true, message: newArr });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };


  
  getReadingsBetweenTwoDates = (req, res) => {
    let nodeId = req.params.nodeId;
    let start = req.body.from;
    let to = req.body.to;
console.log(req.body);
    // nodeId = nodeId.split('_')[1]
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK AND SK BETWEEN :start AND :to",
      ExpressionAttributeValues: {
        ":PK": nodeId,
        ":start": start,
        ":to": to
      },
      ScanIndexForward: false,
    };
    DynamoDB.query(params, (err, data) => {
      if (!err) {
        return res
          .status(200)
          .json({ status: true, message: data.Items });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

}

// "reading": {
//   "avgPluviometer": 0,
//   "avgAnemometer": 0,
//   "avgLuxes": 0,
//   "number": 1,
//   "avgBettery": 0,
//   "avgPressure": 0,
//   "avgRHumidity": 0,
//   "publishedAt": "2022-03-19T21:03:27.038342892Z",
//   "avgWindDirection": 0,
//   "avgBytlength": 0,
//   "avgDailyTmp": 0,
//   "avgSoilMoisture": 0
//  }
// {
//   "PK": "node",
//   "SK": "node_dc7bfcgmcl22fb6l0",
//   "img": "https://www.kindpng.com/picc/m/226-2261816_sensors-png-transparent-png.png",
//   "avgLuxes": 0,
//   "dfSensor": true,
//   "attribute5": "ATTRIBUTE",
//   "avgSoilMoisture": 0,
//   "avgPressure": 0,
//   "attribute3": "ATTRIBUTE",
//   "name": "ahmad",
//   "avgAnemometer": 0,
//   "avgBytlength": 0,
//   "avgDailyTmp": 0,
//   "GSI1PK": "node",
//   "avgBettery": 0,
//   "avgPluviometer": 0,
//   "avgRHumidity": 0,
//   "avgWindDirection": 0,
//   "publishedAt": "2022-03-19T21:03:27.038342892Z",
//    number:0
//  }

module.exports = SensorController;
