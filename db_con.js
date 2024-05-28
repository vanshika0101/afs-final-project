var mysql = require('mysql');
const pool = mysql.createPool({
    port: process.env.DB_PORT || 3306,
    host:  'localhost',
    user:'root',
    password: 'password',
    database: 'DonarDrive',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
}).on("error", (err) => {
    console.log("Failed to connect to Database - ", err);
});

module.exports = pool;
