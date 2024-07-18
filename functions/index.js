const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// 使用中间件解析JSON请求体
app.use(express.json());

// 创建数据库连接
const connection = mysql.createConnection({
  host: '114.116.203.217',
  user: 'root',
  password: 'a15558437825+',
  database: 'iot_data',
  port: 3306
});

// 连接数据库
connection.connect(err => {
  if (err) {
    console.error(`数据库连接失败: ${err.stack}`);
    return;
  }
  console.log('连接数据库成功');
});

// 定义API端点
app.post('/fetchData', (req, res) => {
  // 查询数据表中前十条数据
  connection.query('SELECT content FROM iot_data LIMIT 10', (error, results) => {
    if (error) {
      console.error(`查询失败: ${error.stack}`);
      res.status(500).send({ resCode: '1', resMsg: '查询失败' });
      return;
    }

    // 解析内容并提取H和T数据
    let dataX = [];
    let T_values = [];
    let H_values = [];

    results.forEach(row => {
      let contentArray = JSON.parse(row.content);
      contentArray.forEach(entry => {
        if (entry.properties.T !== undefined && entry.properties.H !== undefined) {
          dataX.push(entry.event_time);
          T_values.push(entry.properties.T);
          H_values.push(entry.properties.H);
        }
      });
    });

    // 构造响应数据
    const response = {
      resCode: '0',
      resMsg: '成功',
      result: [
        {
          order: {
            dataX: dataX.slice(0, 10),  // 只取前10个数据
            dataValue: [
              {
                title: 'T',
                value: T_values.slice(0, 10),  // 只取前10个数据
              },
              {
                title: 'H',
                value: H_values.slice(0, 10),  // 只取前10个数据
              }
            ]
          }
        }
      ]
    };

    res.json(response);
  });
});

// 启动服务器
const server = app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});

// 捕获进程终止信号，确保关闭数据库连接
process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器和数据库连接');
  connection.end(err => {
    if (err) {
      console.error(`关闭连接失败: ${err.stack}`);
      process.exit(1);
    }
    console.log('关闭连接成功');
    server.close(() => {
      console.log('Express 服务器已关闭');
      process.exit(0);
    });
  });
});
