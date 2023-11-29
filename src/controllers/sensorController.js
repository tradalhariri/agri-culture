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
    if (body.PK==undefined) {
      body.SK = `sensor_${body.sensorId}`;
      body.PK = "sensor";
      body.GSI1PK = "sensor";
      
      try {
        body.img = req.file.location;
      } catch (e) {
        body.img = "https://www.kindpng.com/picc/m/226-2261816_sensors-png-transparent-png.png";
      }
    }

    let params = {
      TableName: this.tableName,
      Item: body,
    };
    DynamoDB.put(params, (err, result) => {
      if (!err) {
        return res.status(200).json({ status: true, message: params });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  getSensorsNotSet = (req, res) => {

    const params = {
      TableName: this.tableName,
      IndexName: "GSI1PK-index",
      KeyConditionExpression: "GSI1PK = :sensor",
      ExpressionAttributeValues: {
        ":sensor": "sensor",
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

  getSensorsForNode = (req, res) => {
    const nodeId = req.params.nodeId;

    const params = {
      TableName: this.tableName,
      IndexName: "GSI1PK-index",
      KeyConditionExpression: "GSI1PK = :nodeId",
      ExpressionAttributeValues: {
        ":nodeId": nodeId,
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

  getAllSensors = (req, res) => {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK",
      ExpressionAttributeValues: {
        ":PK": "sensor",
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

  deleteSensor = (req, res) => {
    const {SK,PK} = req.query;
    
    const params = {
      TableName: this.tableName,
      Key: {
        PK: PK,
        SK:SK
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
}

module.exports = SensorController;
