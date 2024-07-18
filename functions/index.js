const functions = require("firebase-functions");
const express = require("express");
const mysql = require("mysql");

const app = express();

// 使用中间件解析 JSON 请求体
app.use(express.json());

// 从环境变量中获取数据库连接信息
const host = functions.config().database.host;
const user = functions.config().database.user;
const password = functions.config().database.password;
const database = functions.config().database.database;
const port = 3306;

// 创建数据库连接
const connection = mysql.createConnection({
  host,
  user,
  password,
  database,
  port,
});

// 连接数据库
connection.connect((err) => {
  if (err) {
    console.error("数据库连接失败: ", err);
    return;
  }
  console.log("数据库连接成功!");
});

// 定义 API 端点
app.post("/fetchData", (req, res) => {
  // 查询数据表中前十条数据
  connection.query("SELECT content FROM iot_data LIMIT 10", (error, results) => {
    if (error) {
      console.error(`查询失败: ${error.stack}`);
      res.status(500).send({resCode: "1", resMsg: "查询失败"});
      return;
    }

    // 解析内容并提取 H 和 T 数据
    const dataX = [];
    const tValues = [];
    const hValues = [];

    results.forEach((row) => {
      const contentArray = JSON.parse(row.content);
      contentArray.forEach((entry) => {
        if (
          entry.properties.T !== undefined &&
          entry.properties.H !== undefined
        ) {
          dataX.push(entry.event_time);
          tValues.push(entry.properties.T);
          hValues.push(entry.properties.H);
        }
      });
    });

    // 构造响应数据
    const response = {
      resCode: "0",
      resMsg: "成功",
      result: [
        {
          order: {
            dataX: dataX.slice(0, 10), // 只取前 10 个数据
            dataValue: [
              {
                title: "T",
                value: tValues.slice(0, 10), // 只取前 10 个数据
              },
              {
                title: "H",
                value: hValues.slice(0, 10), // 只取前 10 个数据
              },
            ],
          },
        },
      ],
    };

    res.json(response);
  });
});

// 导出 API 函数
exports.api = functions.https.onRequest(app);
