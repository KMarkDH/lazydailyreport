
var sqlite3 = require('sqlite3').verbose();
var terminal_p = require('child_process');
var db_name = "LazysAssignmentList.db";
var table_name = "TASK";
var EventEmitter = require('events').EventEmitter;

function get_date() {
    var today = new Date();
    var year = today.getFullYear().toString();
    var month = today.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var day = today.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    return year + "-" + month + "-" + day;
}

function trim(str) {
    var trim_str = str.toString().split('\n').join('');
    trim_str = trim_str.toString().split(' ').join('');
    return trim_str;
}

function connect_to_database(callback) {
    terminal_p.exec("cd ~&&pwd", function(err, stdout, errout){
        if (!err) {
            var db = new sqlite3.Database(trim(stdout) + '/Documents/' + db_name, function(err, res){
                if (!err) {
                    db.get("select tbl_name from sqlite_master where type = 'table' and name = \'" + table_name + "\';", function(err, res) {
                        if (!err) {
                            if (!res || res.tbl_name.toString().indexOf(table_name) == -1) {
                                db.run("create table " + table_name + "(id int primary key not null, assignment char(50) not null, state int, date char(10));", function(err, res) {
                                    if (!err) {
                                        callback(db);
                                    } else {
                                        console.error(err);
                                    }
                                });
                            } else {
                                callback(db);
                            }
                        } else {
                            console.error(err);
                        }
                    });
                } else {
                    console.error(err);
                }
            });
        } else {
            console.error(err);
        }
    });
}

function check_assignment_exist(job, callback) {
    connect_to_database(function(db) {
        db.get("select assignment from " + table_name + " where assignment = \'" + job + "\';", function(err, res){
            if (!err) {
                if (res) {
                    callback(true, db);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    });
}

function get_max_id(callback) {
    connect_to_database(function(db) {
        db.all("select id from " + table_name + " order by id;", function(err, arr){
            callback(arr[arr.length - 1].id + 1, db);
        });
    });
}

function receive_assignment(job, callback) {
    check_assignment_exist(job, function(exist, db){
        if (!exist) {
            get_max_id(function(id, db){
                db.run(
                    "insert into " + table_name + " (id, assignment, state, date) values(" + id + ", \"" + job + "\", " + "0,\"" + get_date() + "\");",
                    function(err){
                        if (!err) {
                            callback();
                        } else {
                            console.error(err);
                        }
                    });
            });
        }
    });
}

function start_assignment(job, callback) {
    check_assignment_exist(job, function(exist, db){
        if (exist) {
            db.run(
                "update " + table_name + " set state = 1,date=\"" + get_date() + "\" where assignment=\"" + job + "\";" ,
                function(err){
                    if (!err) {
                        callback();
                    } else {
                        console.error(err);
                    }
                });
        } else {
            console.error("assignment : " + job + " doesn't exist.");
        }
    });
}

function done_assignment(job, callback) {
    check_assignment_exist(job, function(exist, db){
        if (exist) {
            db.run(
                "update " + table_name + " set state = 2,date=\"" + get_date() + "\" where assignment=\"" + job + "\";" ,
                function(err){
                    if (!err) {
                        callback();
                    } else {
                        console.error(err);
                    }
                });
        } else {
            console.error("assignment : " + job + " doesn't exist.");
        }
    });
}

function check_assignment(job, callback) {
    check_assignment_exist(job, function(exist, db){
        if (exist) {
            db.get(
                "select * from " + table_name + " where assignment=\"" + job + "\";" ,
                function(err, res){
                    if (!err) {
                        callback(res);
                    } else {
                        console.error(err);
                    }
                });
        } else {
            console.error("assignment : " + job + " doesn't exist.");
        }
    });
}

function delete_assignment(job, callback) {
    check_assignment_exist(job, function(exist, db){
        if (exist) {
            db.get(
                "delete from " + table_name + " where assignment=\"" + job + "\";" ,
                function(err, res){
                    if (!err) {
                        callback(res);
                    } else {
                        console.error(err);
                    }
                });
        } else {
            console.error("assignment : " + job + " doesn't exist.");
        }
    });
}

function get_assignment_list(callback) {
    connect_to_database(function(db){
        db.all(
            "select * from " + table_name + ";",
            function(err, arr){
                if (!err) {
                    callback(arr);
                } else {
                    console.error(err);
                }
            });
    });
}

function get_todo_list(callback) {
    connect_to_database(function(db){
        db.all(
            "select * from " + table_name + " where state = 0 or state = 1;",
            function(err, arr){
                if (!err) {
                    callback(arr);
                } else {
                    console.error(err);
                }
            });
    });
}

function get_done_list_of_today(callback) {
    connect_to_database(function(db){
        db.all(
            "select * from " + table_name + " where state = 2 and date = \"" + get_date() + "\";",
            function(err, arr){
                if (!err) {
                    callback(arr);
                } else {
                    console.error(err);
                }
            });
    });
}

function get_done_list_of_day(days, callback) {
    var daystr = "(";
    days.forEach(element => {
        daystr += "\"" + element + "\"" + ",";
    });
    daystr += "\"\")"

    console.log("select * from " + table_name + " where state = 2 and date in " + daystr + ";");
    connect_to_database(function(db){
        db.all(
            "select * from " + table_name + " where state = 2 and date in " + daystr + ";",
            function(err, arr){
                if (!err) {
                    callback(arr);
                } else {
                    console.error(err);
                }
            });
    });
}

require('util').inherits(DBHelper, EventEmitter);


exports = module.exports = new DBHelper();

function DBHelper() {
    this.receiveAssignment = receive_assignment;
    this.startAssignment = start_assignment;
    this.doneAssignment = done_assignment;
    this.checkAssignment = check_assignment;
    this.deleteAssignment = delete_assignment;
    this.getAssignmentList = get_assignment_list;
    this.getTodoList = get_todo_list;
    this.getDoneListToday = get_done_list_of_today;
    this.getDoneListofDays = get_done_list_of_day;
}