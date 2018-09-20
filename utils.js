
var sqlite3 = require('sqlite3').verbose();
var terminal_p = require('child_process');
var db_name = "LazysAssignmentList.db";
var table_name = "TASK";

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
            if (arr.length > 0) {
                callback(arr[arr.length - 1].id + 1, db);
            } else {
                callback(0, db);
            }
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
            "select * from " + table_name + " where state = 2 or state = 1 and date = \"" + get_date() + "\";",
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

    // console.log("select * from " + table_name + " where state = 2 or state = 1 and date in " + daystr + ";");
    connect_to_database(function(db){
        db.all(
            "select * from " + table_name + " where state = 2 or state = 1 and date in " + daystr + ";",
            function(err, arr){
                if (!err) {
                    callback(arr);
                } else {
                    console.error(err);
                }
            });
    });
}

// require('util').inherits(DBHelper, EventEmitter);

// function DBHelper() {
//     this.receiveAssignment = receive_assignment;
//     this.startAssignment = start_assignment;
//     this.doneAssignment = done_assignment;
//     this.checkAssignment = check_assignment;
//     this.deleteAssignment = delete_assignment;
//     this.getAssignmentList = get_assignment_list;
//     this.getTodoList = get_todo_list;
//     this.getDoneListToday = get_done_list_of_today;
//     this.getDoneListofDays = get_done_list_of_day;
// }




var archive = require("./archive")
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
// var dbhelper = new DBHelper();

function is_last_work_day() {
    var today = new Date();
    if (today.getDay() == 5) {
        return true;
    } else {
        return false;
    }
}

function get_data() {
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

function get_first_day_of_week(param_offset) {
    var day_fix = [6, 0, 1, 2, 3, 4, 5];
    var lengtn_of_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30];
    var today = new Date();
    if ((today.getFullYear() % 4 == 0) || (today.getFullYear() % 400 == 0)) {
        lengtn_of_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30];
    }
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    var fisrt_day_of_week = day - day_fix[today.getDay()];

    if (fisrt_day_of_week <= 0) {
        if (month == 1) {
            year--;
            month = 12;
            fisrt_day_of_week = 31 + fisrt_day_of_week;
        } else {
            month--;
            fisrt_day_of_week = lengtn_of_month[month - 1] + fisrt_day_of_week;
        }
    }

    var offset_day = fisrt_day_of_week + param_offset;

    if (offset_day > lengtn_of_month[month - 1]) {
        if (month == 12) {
            year++;
            month = 1;
            offset_day = offset_day - 31;
        } else {
            month++;
            offset_day = offset_day - lengtn_of_month[month - 2];
        }
    }
    return year + "-" + month + "-" + offset_day;
}

function execute_command(command, succ_callback, fail_callback) {
    terminal_p.exec(command, function (err, stdout, stderr) {
        if (null == err) {

            succ_callback(stdout);
        } else {
            fail_callback(err + ":" + stderr);
        }
    });
}

function read_todays_list(callback) {
    if (false == is_last_work_day()) {
        
        get_done_list_of_today(function(list){
            var str = get_data() + ":\n";
            var counter = 1;

            str += "今日工作:\n";
            list.forEach(function(element){
                str += (counter++) + "." + element.assignment + "\n";
            });

            get_todo_list(function(list){
                var max = 3;
                counter = 1;
                str += "明日计划:\n";

                list.forEach(function(element){
                    if (counter <= max) {
                        str += (counter++) + "." + element.assignment + "\n";
                    }
                });

                callback(str);
            });
        });
    } else {

        var daylist = [];
        for (var i = 0; i < 7; ++i) {
            daylist[i] = get_first_day_of_week(i);
        }

        get_done_list_of_day(daylist, function(list){
            var str = get_data() + ":\n";
            var counter = 1;

            str += "本周工作:\n";
            list.forEach(function(element){
                str += (counter++) + "." + element.assignment + "\n";
            });

            get_todo_list(function(list){
                var max = 3;
                counter = 1;
                str += "下周计划:\n";

                list.forEach(function(element){
                    if (counter <= max) {
                        str += (counter++) + "." + element.assignment + "\n";
                    }
                });

                callback(str);
            });
        });
    }
}

function fetch_commits_via_git() {
    execute_command(
        'cd ' + archive.path + ' && git log --pretty=format:"%s,%ai;" --author="make" --no-merges',
        function (succ) {

            var commit_list = succ.split(";");
            commit_list.forEach(function (comm) {
                var cur_time = get_data();
                var message = comm.toString().split(',')[0];
                var date = comm.toString().split(',')[1];

                var fetch = true;
                archive.commit_filter.forEach(function (filter) {
                    if (message.indexOf(filter) != -1) {
                        fetch = false;
                    }
                });

                if (fetch) {
                    if (typeof (date) == 'string' && date.toString().indexOf(cur_time.toString()) != -1) {
                        done_assignment(message.split('\n').join(''), function(){
                            console.log(message.split('\n').join('') + " add to done list");
                        });
                    }
                }
            });
        },
        function (err) {
            console.log("commit fail :" + err);
        }
    );
}

function write_todo(str) {
    receive_assignment(str, function () {
        console.log("job assigned:" + str);
    });
}

function write_done(str) {
    done_assignment(str, function(){

    });
}

function write_start(str) {
    start_assignment(str, function(){

    });
}

function sendConfirmEmail(confirm_str) {
    var transport = nodemailer.createTransport(smtpTransport({
        host: archive.host,
        secure: archive.secure,
        secureConnection: archive.secureConnection,
        port: archive.port,
        auth: {
            user: archive.email_addr,
            pass: archive.email_psd
        }
    }));

    var mailOptions = {
        from: archive.email_addr,
        to: archive.email_addr,
        subject: get_data() + " LazyBonesLog Report",
        text: confirm_str
    };

    transport.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function sendEmail() {
    var title = "";
    read_todays_list(function (str) {
        if (false == is_last_work_day()) {
            title += archive.title + "日报-" + get_data();
        } else {
            title += archive.title + "周报-" + get_data();
        }

        console.log("start sending email...");
        console.log("from:" + archive.email_addr);
        console.log("to:" + archive.target);
        console.log("cc:" + archive.cc);
        console.log("title:" + title);
        console.log(str);

        var transport = nodemailer.createTransport(smtpTransport({
            host: archive.host,
            secure: archive.secure,
            secureConnection: archive.secureConnection,
            port: archive.port,
            auth: {
                user: archive.email_addr,
                pass: archive.email_psd
            }
        }));

        var mailOptions = {
            from: archive.email_addr,
            to: archive.target,
            cc: archive.cc,
            subject: title,
            text: str
        };

        transport.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
                var confirm_str = "from:" + archive.email_addr + "\n"
                    + "to:" + archive.target + "\n"
                    + "cc:" + archive.cc + "\n"
                    + "title:" + title + "\n"
                    + str;
                sendConfirmEmail(confirm_str);
            }
        });
    });
}

function get_all_list(callback) {
    if (false == is_last_work_day()) {
        
        get_done_list_of_today(function(list){
            var str = get_data() + ":\n";
            var counter = 1;

            str += "今日工作:\n";
            list.forEach(function(element){
                str += (counter++) + "." + element.assignment + "\n";
            });

            get_todo_list(function(list){
                counter = 1;
                str += "明日计划:\n";

                list.forEach(function(element){
                    str += (counter++) + "." + element.assignment + "\n";
                });

                callback(str);
            });
        });
    } else {

        var daylist = [];
        for (var i = 0; i < 7; ++i) {
            daylist[i] = get_first_day_of_week(i);
        }

        get_done_list_of_day(daylist, function(list){
            var str = get_data() + ":\n";
            var counter = 1;

            str += "本周工作:\n";
            list.forEach(function(element){
                str += (counter++) + "." + element.assignment + "\n";
            });

            get_todo_list(function(list){
                counter = 1;
                str += "下周计划:\n";

                list.forEach(function(element){
                    str += (counter++) + "." + element.assignment + "\n";
                });

                callback(str);
            });
        });
    }
}

exports.getDate = get_data
exports.sendEmail = sendEmail
exports.readTodaysList = read_todays_list
exports.writeDone = write_done
exports.writeTodo = write_todo
exports.fetchCommits = fetch_commits_via_git
exports.readAllList = get_all_list
exports.writeStart = write_start