#!/usr/local/bin/node
var program = require('commander');
var utils = require('./utils')

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
    utils.fetchCommits();
  }
  
  if (program.plan.toString().length > 0) {
    var text = program.plan;
    utils.writeTodo(text);
  }

  if (program.message.toString().length > 0) {
    var text = program.message;
    utils.writeDone(text);
  }

  if (program.all) {
    utils.readAllList(function(text){
      console.log(text);
    });
  }

  if (program.begin.toString().length > 0) {
    var text = program.begin;
    utils.writeStart(text);
  }

  if (program.list) {
    utils.readTodaysList(function(text){
      console.log(text);
    });
  }

  if (program.send) {
    utils.sendEmail();
  }

  if (program.info) {
    console.log("\n\
写周报是不可能的写的，这辈子都不可能写周报\n\
做管理又不会，只有做做偷懒工具，才能维持得了生活的样子\n");
  }