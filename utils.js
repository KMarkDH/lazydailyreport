var archive = require("./archive")
var fs = require("fs");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var terminal_p = require('child_process');

var assets_path = archive.workspace + "/logs/"

function wirte_to(file_path, text, callback) {
    fs.open(file_path, "a", 0644, function (e, fd) {
        if (e) throw e;
        fs.write(fd, text + ";", function (e) {
            if (e) throw e;
            callback(text);
            fs.closeSync(fd);
        })
    });
}

function read_from(file_path, callback) {
    fs.readFile(file_path, function (err, data) {
        if (err) {
            return console.error(err);
        }

        callback(data.toString());
    });
}

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

function read_file_sync(path) {
    return fs.readFileSync(path).toString();
}

function read_todays_list(callback) {
    var str = get_data() + ":\n";
    if (false == is_last_work_day()) {
        var done_path = assets_path + "done_" + get_data() + ".txt";
        var todo_path = assets_path + "todolist.txt";

        execute_command(
            "touch " + done_path + "&& touch " + todo_path,
            function (succ) {
                var i = 1;
                str += "今日工作\n";
                var done_list = read_file_sync(done_path).split(";");
                done_list.forEach(function (sub) {
                    if (sub.toString().length > 0) {
                        str += i + "." + sub.toString() + '\n';
                        i++;
                    }
                });

                str += "明日计划\n";
                i = 1;
                var todo_list = read_file_sync(todo_path).split(";");
                todo_list.forEach(function (sub) {
                    if (sub.toString().length > 0) {
                        str += i + "." + sub.toString() + '\n';
                        i++;
                    }
                });

                callback(str);
            },
            function (err) {
                console.error(err);
            });
    } else {
        var touch_list = "";
        var todo_path = assets_path + "todolist.txt";
        for (var i = 0; i < 7; ++i) {
            touch_list += 'touch ' + assets_path + "done_" + get_first_day_of_week(i) + ".txt";
            touch_list += '&&';
        }
        touch_list += 'touch ' + todo_path;

        execute_command(
            touch_list,
            function (succ) {
                str += "本周工作\n";
                var _i = 1;

                for (var i = 0; i < 7; ++i) {
                    var done_path = assets_path + "done_" + get_first_day_of_week(i) + ".txt";
                    var done_list = read_file_sync(done_path).split(";");
                    done_list.forEach(function (sub) {
                        if (sub.toString().length > 0) {
                            str += _i + "." + sub.toString() + '\n';
                            _i++;
                        }
                    });
                }

                str += "下周计划\n";
                var i = 1;
                var todo_list = read_file_sync(todo_path).split(";");
                todo_list.forEach(function (sub) {
                    if (sub.toString().length > 0) {
                        str += i + "." + sub.toString() + '\n';
                        i++;
                    }
                });

                callback(str);
            },
            function (err) {
                console.error(err);
            }
        )
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
                        write_done(message.split('\n').join(''));
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
    var todo_path = assets_path + "todolist.txt";
    wirte_to(todo_path, str, function () {
        console.log("job assigned:" + str);
    });
}

function write_done(str) {
    var done_path = assets_path + "done_" + get_data() + ".txt";
    var filter_check = read_file_sync(done_path);

    if (filter_check.indexOf(str) == -1) {
        wirte_to(done_path, str, function () {
            console.log("job done :" + str);

            var todo_list = read_file_sync(assets_path + "todolist.txt").split(";");
            var newstr = "";
            todo_list.forEach(function (sub, index) {
                if ((sub.indexOf(str) != -1) || (str.indexOf(sub) != -1)) {

                } else {
                    newstr += sub + ";";
                }
            });

            execute_command(
                "rm -f " + assets_path + "todolist.txt",
                function (succ) {
                    wirte_to(assets_path + "todolist.txt", newstr, function () {
                        console.log("update todo list:" + newstr);
                    });
                },
                function (err) {

                });
        });
    } else {
        console.log("done duplicate job:" + str);
    }
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

exports.sendEmail = sendEmail
exports.readTodaysList = read_todays_list
exports.writeDone = write_done
exports.writeTodo = write_todo
exports.fetchCommits = fetch_commits_via_git