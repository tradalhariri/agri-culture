const express = require("express");

const router = express.Router();

const Cognito = require("./controllers/cognetoController");
const upload = require("./utils/s3.helper").uploadImg;

let SensorController = require("./controllers/sensorController");
SensorController = new SensorController("Agricultiral");

let NodeController = require("./controllers/nodeController");
NodeController = new NodeController("Agricultiral");

let UserController = require("./controllers/userController");
UserController = new UserController("Agricultiral");

let ResultController = require("./controllers/resultController");

// Cognito api
router.post(
  "/auth/registerCognito",
  upload("test/img").single("img"),
  Cognito.RegisterUser
);

router.post("/auth/reSendCode", Cognito.reSendCode);

router.post("/auth/registerSubAdminCognito", Cognito.RegisterSubAdmins);

router.post("/auth/loginCognito", Cognito.Login);

router.post("/auth/LoginAdmin", Cognito.LoginAdmin);

router.put("/api/updateCognito", Cognito.update);

router.get("/api/ValidateToken", Cognito.ValidateToken);

router.get("/api/ValidateTokenAdmin", Cognito.ValidateTokenAdmin);

router.patch("/api/confirm", Cognito.confirm);

router.delete("/api/deleteUserCognito", Cognito.DeleteUser);

router.get("/api/getAllCognito", Cognito.getAll);

router.post("/api/resetPassword", Cognito.resetPassword);

router.post("/api/confirmPassword", Cognito.confirmPassword);

// sensor api
router.post(
  "/api/createSensor",
  upload("test/img").single("img"),
  SensorController.create
);
router.get("/api/getSensorsNotSet", SensorController.getSensorsNotSet);
router.get(
  "/api/getSensorsForNode/:nodeId",
  SensorController.getSensorsForNode
);
router.get("/api/getAllSensors", SensorController.getAllSensors);
router.delete("/api/deleteSensor", SensorController.deleteSensor);

// node api
router.post(
  "/api/createNode",
  upload("test/img").single("img"),
  NodeController.create
);
router.put(
  "/api/addSensorforNode",
  upload("test/img").single("img"),
  NodeController.addSensorforNode
);
router.get("/api/getNodesNotSet", NodeController.getNodesNotSet);
router.get("/api/getAllNodes", NodeController.getAllNode);
router.delete("/api/deleteNode", NodeController.deleteNode);

router.get("/api/getDailyAverageReadingsForEveryNode/:nodeId", NodeController.getDailyAverageReadingsForEveryNode);
router.get("/api/getDailyAverageReadingsForAllNodes/:userId", NodeController.getDailyAverageReadingsForAllNodes);
router.post("/api/addNewReadingForNode/:nodeId", NodeController.addNewReadingForNode);
router.get("/api/getLastTenReadForNode/:nodeId", NodeController.getLastTenReadForNode);
router.post("/api/getReadingsBetweenTwoDates/:nodeId", NodeController.getReadingsBetweenTwoDates);




// user api
router.post(
  "/api/createUser",
  upload("test/img").single("img"),
  UserController.RegisterUser
);
router.put("/api/addNodeforUser", UserController.addNodeforUser);
router.get("/api/getAllUsers", UserController.getAllUser);
router.get("/api/getNodesForUser/:userId", UserController.getNodesForUser);
router.delete("/api/deleteUser", UserController.deleteUser);

router.get("/api/dashboard", UserController.dashboardData);



router.post("/api/createResult", ResultController.create);

router.get("/api/getResult/:id", ResultController.get);

module.exports = router;
