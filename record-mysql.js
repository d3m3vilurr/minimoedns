var config = require('./config.js'),
    mysql = require('mysql');
var pool  = '';

if (!config.mysqlsocket) {
    pool  = mysql.createPool({
        host     : config.mysqlhost,
        database : config.mysqldb,
        user     : config.mysqluser,
        password : config.mysqlpass,
        connectionLimit: 100
    });
} else {
    pool  = mysql.createPool({
        socketPath : config.mysqlsocket,
        database : config.mysqldb,
        user     : config.mysqluser,
        password : config.mysqlpass,
        connectionLimit: 100
    });
}


pool.getConnection(function(err, connection) {
    if (err) {
        console.log(err.stack);
        pool.releaseConnection();
    }

    // Ping database for every 1 hour as it may close connection while idle.
    setInterval(function() {
        keepAlive();
    }, 3600000);

    exports.queryRecord = function(name, type, callback) {
        connection.query('SELECT * from `records` WHERE `name` = ? AND (`type` = ? OR `type` = "CNAME")',
            [name, type],
            function(err, result) {
                if (err) {
                    connection.release();
                    return callback(err, null);
                }
                // console.log(result);
                connection.release();
                callback(null, result);
        });
    }

    exports.queryGeo = function(name, type, dest, callback) {
        if (dest === null) {
            return callback(null, []);
        }
        connection.query('SELECT * FROM `records` WHERE `name` = ? AND (`type` = ? OR `type` = "CNAME") AND (`geo` = ? OR `geo` = ? OR `geo` = ? OR `geo` = ?)',
            [name, type, dest.country_code, dest.country_code3, dest.country_name, dest.continent_code],
            function(err, result) {
                if (err) {
                    connection.release();
                    return callback(err, null);
                }
                connection.release();
                callback(null, result);
        });
    }

    function keepAlive() {
        connection.ping();
        connection.release();
    }

});
