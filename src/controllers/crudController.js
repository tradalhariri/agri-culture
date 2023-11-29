/**
 * Created by : Deyaa
 *
 *
 */

const { AWS } = require("../config/aws");
const uniqid = require("uniqid");

const DynamoDB = new AWS.DynamoDB.DocumentClient();

class crudController {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
     * 
     * Add new item to database
     * 
     * @param req request body with posted data
     *  route : http://localhost:3000/api/createEvent
     *  body :{
      "title":"event3",
      "starting":"165498454",
      "img":"file",
      "rounds":"5"
     }
     *
     * @httpMethod (post)
     * 
     * @param res 200 if create is done successfully , 500 if there is internal server error
     * 
     */

  create = (req, res) => {
    const body = { ...req.body };
    body.id = uniqid();

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

  /**
   *
   * Get all items with pagination and filter
   * route : http://localhost:3000/api/getEvents?id=1&limit&grid=open
   * @param req
   *
   * @httpMethod (get)
   *
   * @param res 200 if was getting events , 500 if there is internal server error
   *
   */

  getAll = (req, res) => {
    const { limit, id, grid, game } = req.query;
    let and = "";
    let expressionAttributeValues = {};
    let filterExpression = "";
    let params = {
      TableName: this.tableName,
    };
    if (grid) {
      expressionAttributeValues[":Registration"] = grid;
      filterExpression += "Registration = :Registration";
      params.ExpressionAttributeValues = expressionAttributeValues;
      params.FilterExpression = filterExpression;
      and = " AND ";
    }
    if (game) {
      expressionAttributeValues[":game"] = game;
      filterExpression += and + "game = :game";
      params.ExpressionAttributeValues = expressionAttributeValues;
      params.FilterExpression = filterExpression;
      and = " AND ";
    }
    if (!params.ExpressionAttributeValues) {
      params.Limit = limit;
    }
    if (id) {
      params.ExclusiveStartKey = { id: id };
    }
    DynamoDB.scan(params, (err, data) => {
      if (!err) {
        const result = id == -1 ? [] : data.Items;

        const lastItem = data.LastEvaluatedKey
          ? data.LastEvaluatedKey
          : { id: -1 };

        return res.status(200).json({
          status: true,
          message: { items: result, lastItem: lastItem },
        });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  /**
   *
   * Get item
   * route : http://localhost:3000/api/getEvent/:id
   * @param req
   *
   * @httpMethod (get)
   *
   * @param res 200 if was getting events , 500 if there is internal server error
   *
   */
  getItem = (req, res) => {
    const id = req.params.id;
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :PK AND begins_with(SK,:SK)",
      ExpressionAttributeValues: {
        ":PK": id,
        ":SK": req.query.SK,
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

  /**
    * 
    * update field in item  
    * 
    * @param req request body with posted data
    *  route : http://localhost:3000/api/updateOnEvent/:id
      {
     "title":"event3",
     "starting":"165498454",
     "img":".../fffffffxf.png",
     "rounds":"9"
     .....
      }
    * 
    * @httpMethod (patch)
    *  
    * @param res 200 if was Query successfully , 500 if there is internal server error
    * 
    */

  updateAttributesInItem = (req, res) => {
    const id = req.params.id;
    const body = req.body;
    const key = Object.keys(body)[0];
    let val = Object.values(body)[0];

    const params = {
      TableName: this.tableName,
      Key: {
        ["id"]: id,
      },
      UpdateExpression: `set ${key} = :keyValue`,
      ExpressionAttributeValues: {
        ":keyValue": val,
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

  /**
    * 
    * update item  
    * 
    * @param req request body with posted data
    *  route : http://localhost:3000/api/updateEvent/:id
      {
     "title":"event3",
     "starting":"165498454",
     "img":"fffffffxf",
     "rounds":"9"
      .....
      }
    * 
    * @httpMethod (put)
    *  
    * @param res 200 if was Query successfully , 500 if there is internal server error
    * 
    */
  updateItem = (req, res) => {
    const id = req.params.id;
    const body = req.body;
    body.id = id;

    const item = body;

    const params = {
      TableName: this.tableName,
      Item: item,
    };
    DynamoDB.put(params, (err, result) => {
      if (!err) {
        return res.status(200).json({ status: true, message: params });
      } else {
        return res.status(500).json({ status: false, message: err.message });
      }
    });
  };

  /**
   *
   * delete item
   *
   * @param req request param
   *  route : http://localhost:3000/api/deleteEvent/:id
   *
   * @httpMethod (delete)
   *
   * @param res 200 if was Query successfully , 500 if there is internal server error
   *
   *
   */
  deleteItem = (req, res) => {
    const id = req.params.id;
    const params = {
      TableName: this.tableName,
      Key: {
        id: id,
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

  dashboardData = async (req, res) => {
    let arr = []
      const params1 = {
        TableName: this.tableName,
        Select: "COUNT",
        KeyConditionExpression: "PK = :PK",
        FilterExpression: "GSI1PK = :PK" ,
        ExpressionAttributeValues: {
          ":PK": "sensor"
        },
      };
      arr.push(await DynamoDB.query(params1).promise()) ;


     const params2 = {
        TableName: this.tableName,
        Select: "COUNT",
        KeyConditionExpression: "PK = :PK",
        FilterExpression: "GSI1PK = :PK" ,
        ExpressionAttributeValues: {
          ":PK": "node"
        },
      };
      arr.push(await DynamoDB.query(params2).promise()) ;

    

     const params3 = {
        TableName: this.tableName,
        Select: "COUNT",
        KeyConditionExpression: "PK = :PK",
        FilterExpression: "GSI1PK <> :PK" ,

        ExpressionAttributeValues: {
          ":PK": "user"
        },
      };
      arr.push(await DynamoDB.query(params3).promise()) ;


    const params4 = {
      TableName: this.tableName,
      IndexName: "GSI1PK-index",
      
      KeyConditionExpression: "GSI1PK = :sensor",
      ExpressionAttributeValues: {
        ":sensor": "sensor",
      },
      Limit:4
    };
    arr.push( (await DynamoDB.query(params4).promise()).Items) ;





  const params5 = {
    TableName: this.tableName,
    IndexName: "GSI1PK-index",
    
    KeyConditionExpression: "GSI1PK = :node",
    ExpressionAttributeValues: {
      ":node": "node",
    },
    Limit:4
  };

  arr.push( (await DynamoDB.query(params5).promise()).Items) ;

  return res.status(200).json({ status: true, message: arr });


  }
}

module.exports = crudController;
