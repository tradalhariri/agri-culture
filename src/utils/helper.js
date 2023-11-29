const bcrypt = require("bcryptjs");
const { format } = require("date-fns");

const { AWS } = require("../config/aws");


const DynamoDB = new AWS.DynamoDB.DocumentClient();

class Helper {
  hashPassword = (password) => {
    const hashPassword = bcrypt.hash(password, 10);
    return hashPassword;
  };

  createItemForDynamoDB = async (tableName, body) => {
    let a;
    let items = body;
    let params = {
      TableName: tableName,
      Item: items,
    };

    await DynamoDB.put(params, (err, result) => {
      if (!err) {
        a = { status: true, message: params };
      } else {
        a = { status: false, message: err.message };
      }
    });
  };

  deleteItemFromDynamoDB = (tableName, email) => {
    const params = {
      TableName: tableName,
      Key: {
        email: email,
      },
    };

    DynamoDB.deleteItem(params, (err) => {
      if (!err) {
        console.log("deleted dynamo");
        // return res.status(200).json({ status: true, message: "Deleted!" })
      } else {
        console.log(err.message);

        // return res.status(500).json({ status: false, message: err.message })
      }
    });
  };

  sendNoti = async (req, res) => {
    const body = req.body;

    try {
      const result = await notificationHelper.pushNotification(
        body.title,
        body.body,
        body.token
      );
      this.appendNoti(body.id, { title : body.title, body:body.body ,date:format(Date.now(),'yyyy-MM-dd hh:mm')});
    //   this.appendNoti(body.id,{ title, body ,date:data.Items[i].starting})
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ status: false, message: e.message });
    }
  };



 
  appendNoti = async (id, objNoti) =>{

    return DynamoDB.update({
      TableName: 'User',
      Key: { id: id },
      ReturnValues: 'ALL_NEW',
      UpdateExpression: 'set #noti = list_append(if_not_exists(#noti, :empty_list), :objNoti)',
      ExpressionAttributeNames: {
        '#noti': 'noti'
      },
      ExpressionAttributeValues: {
        ':objNoti': [objNoti],
        ':empty_list': []
      }
    }).promise()
  }



  checkIfRegisterForEvent = async (eventId, userId) => {
    const params = {
      TableName: "registration",
      Key: {
        eventId: eventId,
        userId: userId,
      },
      AttributesToGet: ["eventId"],
    };
    let exist = false;

    const result = await DynamoDB.get(params).promise();
    if (result.Item !== undefined && result.Item !== null) {
      exist = true;
    }
    return exist

  };
}

module.exports = new Helper();
