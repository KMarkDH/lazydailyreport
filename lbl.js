#!/usr/local/bin/node
var program = require('commander');
var terminal_p = require('child_process');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();

function trim(str) {
  var trim_str = str.toString().split('\n').join('');
  trim_str = trim_str.toString().split(' ').join('');
  return trim_str;
};

function execute_command(command, succ_callback, fail_callback) {
  terminal_p.exec(command, function (err, stdout, stderr) {
    if (null == err) {
      succ_callback(stdout);
    } else {
      fail_callback(err + ":" + stderr);
    }
  });
}

require('util').inherits(Archive, EventEmitter);

function Archive() {
  this.gitConfig = {
    repo: "/Users/xianlai/Documents/workspace/yunnan/project",
    commitFilter: ['no message', 'fix', 'resolve conflict', 'fix bug', 'test', 'merge', 'Fix Bug', 'uncomment']
  };

  this.reporterConfig = {
    address: "make@xianlai-inc.com",
    password: "make",
    host: "mail.xianlai-inc.com",
    secure: true,
    secureConnection: true,
    port: 465
  };

  this.receiverConfig = {
    address: "leiting@xianlai-inc.com",
    cc: "liujinpeng@xianlai-inc.com;zhouwei@xianlai-inc.com;panwei@xianlai-inc.com"
  };

  this.contentConfig = {
    workDaySubject: "[项目一部-云南-客户端]马可日报-",
    workDayDone: "今日完成:",
    workDayTodo: "明日计划:",
    maxWorkTodo: 3,
    nonWorkDaySubject: "[项目一部-云南-客户端]马可周报-",
    nonWorkDayDone: "本周完成:",
    nonWorkDayTodo: "下周计划:",
    maxNonWorkDayTodo: 7
  };

  this.dataBaseConfig = {
    dbName: "LazysAssignmentList.db",
    tableName: "tasks"
  }
};



require('util').inherits(DateHelper, EventEmitter);

function DateHelper() {
  this.getDate = function () {
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
  };

  this.getDayOfCurrentWeek = function (param_offset) {
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

    if (month < 10) {
      month = "0" + month;
    }
    if (day < 10) {
      day = "0" + day;
    }
    return year + "-" + month + "-" + offset_day;
  };

  this.isLastWorkDay = function () {
    var today = new Date();
    if (today.getDay() == 5) {
      return true;
    } else {
      return false;
    }
  };
}

require('util').inherits(DBHelper, EventEmitter);

function DBHelper() {
  var archive = new Archive();
  var dateHelper = new DateHelper();

  this.connectToDB = function (callback) {
    terminal_p.exec("cd ~&&pwd", function (err, stdout, errout) {
      if (!err) {
        var db = new sqlite3.Database(trim(stdout) + '/Documents/' + archive.dataBaseConfig.dbName, function (err, res) {
          if (!err) {
            db.get("select tbl_name from sqlite_master where type = 'table' and name = \'" + archive.dataBaseConfig.tableName + "\';", function (err, res) {
              if (!err) {
                if (!res || res.tbl_name.toString().indexOf(archive.dataBaseConfig.tableName) == -1) {
                  db.run("create table " + archive.dataBaseConfig.tableName + "(id int primary key not null, assignment char(50) not null, state int, date char(10));", function (err, res) {
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
  };

  this.isAssignmentExist = function (job, callback) {
    this.connectToDB(function (fd) {
      db.get("select assignment from " + archive.dataBaseConfig.tableName + " where assignment = \'" + job + "\';", function (err, res) {
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
  };

  this.getMaxId = function (callback) {
    this.connectToDB(function (db) {
      db.all("select id from " + archive.dataBaseConfig.tableName + " order by id;", function (err, arr) {
        if (arr.length > 0) {
          callback(arr[arr.length - 1].id + 1, db);
        } else {
          callback(0, db);
        }
      });
    });
  };

  this.receiveAssignment = function (job, callback) {

    this.isAssignmentExist.apply(this, job, function (exist, db) {
      if (!exist) {
        this.getMaxId.apply(this, function (id, db) {
          db.run(
            "insert into " + archive.dataBaseConfig.tableName + " (id, assignment, state, date) values(" + id + ", \"" + job + "\", " + "0,\"" + dateHelper.getDate() + "\");",
            function (err) {
              if (!err) {
                callback();
              } else {
                console.error(err);
              }
            });
        });
      }
    });
  };

  this.startAssignment = function (job, callback) {
    this.isAssignmentExist(job, function (exist, db) {
      if (exist) {
        db.run(
          "update " + archive.dataBaseConfig.tableName + " set state = 1,date=\"" + dateHelper.getDate() + "\" where assignment=\"" + job + "\";",
          function (err) {
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
  };

  this.doneAssignment = function (job, callback) {
    this.isAssignmentExist(job, function (exist, db) {
      if (exist) {
        db.run(
          "update " + archive.dataBaseConfig.tableName + " set state = 2,date=\"" + dateHelper.getDate() + "\" where assignment=\"" + job + "\";",
          function (err) {
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
  };

  this.deleteAssignment = function (job, callback) {
    thiss.isAssignmentExist(job, function (exist, db) {
      if (exist) {
        db.get(
          "delete from " + archive.dataBaseConfig.tableName + " where assignment=\"" + job + "\";",
          function (err, res) {
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
  };

  this.getAssignmentList = function (callback) {
    this.connectToDB(function (db) {
      db.all(
        "select * from " + archive.dataBaseConfig.tableName + ";",
        function (err, arr) {
          if (!err) {
            callback(arr);
          } else {
            console.error(err);
          }
        });
    });
  };

  this.getTodoList = function (callback) {
    this.connectToDB(function (db) {
      db.all(
        "select * from " + archive.dataBaseConfig.tableName + " where state = 0 or state = 1;",
        function (err, arr) {
          if (!err) {
            callback(arr);
          } else {
            console.error(err);
          }
        });
    });
  };

  this.getAssignmentListDoneToday = function (callback) {
    this.connectToDB(function (db) {
      db.all(
        "select * from " + archive.dataBaseConfig.tableName + " where (state = 2 or state = 1) and date = \"" + dateHelper.getDate() + "\";",
        function (err, arr) {
          if (!err) {
            callback(arr);
          } else {
            console.error(err);
          }
        });
    });
  };

  this.getAssignmentListDone = function (days, callback) {
    var daystr = "(";
    days.forEach(element => {
      daystr += "\"" + element + "\"" + ",";
    });
    daystr += "\"\")";

    this.connectToDB(function (db) {
      db.all(
        "select * from " + archive.dataBaseConfig.tableName + " where (state = 1 or state = 2) and date in " + daystr + ";",
        function (err, arr) {
          if (!err) {
            callback(arr);
          } else {
            console.error(err);
          }
        });
    });
  }
}

require('util').inherits(EmailHelper, EventEmitter)

function EmailHelper() {
  var dbHelper = new DBHelper();
  var archive = new Archive();
  var dateHelper = new DateHelper();

  this.readTodayList = function (all, callback) {
    if (false == dateHelper.isLastWorkDay()) {

      dbHelper.getAssignmentListDoneToday(function (list) {
        var str = dateHelper.getDate() + ":\n";
        var counter = 1;

        str += archive.contentConfig.workDayDone + "\n";
        list.forEach(function (element) {
          str += (counter++) + "." + element.assignment + "\n";
        });

        dbHelper.getTodoList(function (list) {
          var max = archive.contentConfig.maxWorkTodo;
          counter = 1;
          str += archive.contentConfig.workDayTodo + "\n";

          list.forEach(function (element) {
            if (all || (counter <= max)) {
              str += (counter++) + "." + element.assignment + "\n";
            }
          });

          callback(str);
        });
      });
    } else {

      var daylist = [];
      for (var i = 0; i < 7; ++i) {
        daylist[i] = dateHelper.getDayOfCurrentWeek(i);
      }

      dbHelper.getAssignmentListDone(daylist, function (list) {
        var str = dateHelper.getDate() + ":\n";
        var counter = 1;

        str += archive.contentConfig.nonWorkDayDone + "\n";
        list.forEach(function (element) {
          str += (counter++) + "." + element.assignment + "\n";
        });

        dbHelper.getTodoList(function (list) {
          var max = archive.contentConfig.maxNonWorkDayTodo;
          counter = 1;
          str += archive.contentConfig.nonWorkDayTodo + "\n";

          list.forEach(function (element) {
            if (all || (counter <= max)) {
              str += (counter++) + "." + element.assignment + "\n";
            }
          });

          callback(str);
        });
      });
    }
  };

  this.sendEmail = function () {
    var title = "";
    this.readTodayList(false, function (str) {
      if (false == dateHelper.isLastWorkDay()) {
        title = archive.contentConfig.workDaySubject + dateHelper.getDate();
      } else {
        title = archive.contentConfig.nonWorkDaySubject + dateHelper.getDate();
      }

      console.log("\e[31mstart \e[31msending \e[31memail...");
      console.log("\e[31mfrom:" + archive.email_addr);
      console.log("\e[31mto:" + archive.target);
      console.log("\e[31mcc:" + archive.cc);
      console.log("\e[31mtitle:" + title);
      console.log("\e[31m" + str);

      var transport = nodemailer.createTransport(smtpTransport({
        host: archive.reporterConfig.host,
        secure: archive.reporterConfig.secure,
        secureConnection: archive.reporterConfig.secureConnection,
        port: archive.reporterConfig.port,
        auth: {
          user: archive.reporterConfig.address,
          pass: archive.reporterConfig.password
        }
      }));

      var mailOptions = {
        from: archive.reporterConfig.address,
        to: archive.receiverConfig.address,
        cc: archive.receiverConfig.cc,
        subject: title,
        text: str
      };

      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('\e[31mEmail \e[31msent: \e[31m' + info.response);
          var confirm_str = "from:" + archive.reporterConfig.address + "\n"
            + "to:" + archive.reporterConfig.address + "\n"
            + "cc:" + archive.reporterConfig.cc + "\n"
            + "title:" + title + "\n"
            + str;
          this.sendConfirmEmail(confirm_str);
        }
      });
    });
  };

  this.sendConfirmEmail = function (str) {
    var transport = nodemailer.createTransport(smtpTransport({
      host: archive.reporterConfig.host,
      secure: archive.reporterConfig.secure,
      secureConnection: archive.reporterConfig.secureConnection,
      port: archive.reporterConfig.port,
      auth: {
        user: archive.reporterConfig.address,
        pass: archive.reporterConfig.password
      }
    }));

    var mailOptions = {
      from: archive.reporterConfig.address,
      to: archive.reporterConfig.address,
      cc: "",
      subject: title,
      text: str
    };

    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('\e[31mConfirm \e[31mEmail \e[31msent: \e[31m' + info.response);
      }
    });
  };
}

require('util').inherits(lbl, EventEmitter);

function lbl() {
  var dbHelper = new DBHelper();
  var archive = new Archive();
  var dateHelper = new DateHelper();
  var emailHelper = new EmailHelper();

  this.fetchGitCommitDoneAssignment = function () {
    execute_command(
      'cd ' + archive.gitConfig.repo + ' && git log --pretty=format:"%s,%ai;" --author="make" --no-merges',
      function (succ) {

        var commit_list = succ.split(";");
        commit_list.forEach(function (comm) {
          var cur_time = dateHelper.getDate();
          var message = comm.toString().split(',')[0];
          var date = comm.toString().split(',')[1];

          var fetch = true;
          archive.gitConfig.commitFilter.forEach(function (filter) {
            if (message.indexOf(filter) != -1) {
              fetch = false;
            }
          });

          if (fetch) {
            if (typeof (date) == 'string' && date.toString().indexOf(cur_time.toString()) != -1) {
              dbHelper.doneAssignment(message.split('\n').join(''), function () {
                console.log(message.split('\n').join('') + " add to done list");
              });
            }
          }
        });
      },
      function (err) {
        console.log("fetch fail :" + err);
      }
    );
  };

  program
    .version('0.0.1')
    .option('-a, --all', '查看所有工作列表')
    .option('-b, --begin [message]', '填写今日开始的工作', '')
    .option('-m, --message [message]', '填写今日完成的工作', '')
    .option('-p, --plan [plan]', '填写明日计划完成的工作', '')
    .option('-s, --send', "发送日(周)报")
    .option('-l, --list', "预览日(周)报")
    .option('-i, --info', "显示信息")
    .option('-f, --fetch', "从git获取commit并填写到今日完成工作中")
    .parse(process.argv);

  if (program.fetch) {
    this.fetchGitCommitDoneAssignment();
  }

  if (program.plan.toString().length > 0) {
    var text = program.plan;
    dbHelper.receiveAssignment(text, function () {

    });
  }

  if (program.message.toString().length > 0) {
    var text = program.message;
    dbHelper.doneAssignment(text, function () {

    });
  }

  if (program.all) {
    emailHelper.readTodayList(true, function (text) {
      console.log(text);
    });
  }

  if (program.begin.toString().length > 0) {
    var text = program.begin;
    dbHelper.startAssignment(text, function () {

    });
  }

  if (program.list) {
    emailHelper.readTodayList(false, function (text) {
      console.log(text);
    });
  }

  if (program.send) {
    emailHelper.sendEmail();
  }

  if (program.info) {
    console.log("\n\
写周报是不可能的写的，这辈子都不可能写周报\n\
做管理又不会，只有做做偷懒工具，才能维持得了生活的样子\n");
  }
}

new lbl();