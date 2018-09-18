//----------------- git仓库本地路径
var repo_path = "";
//----------------- 邮箱地址
var email_address = "";
//----------------- 邮箱密码
var email_pass = "";
//----------------- 发送到地址
var target_email = "";
//----------------- 抄送
var cc_email = "";
//----------------- 标题
var title_email = "";
//----------------- 备份文件存放路径
var work_space = "";
//----------------- git commit消息中的过滤字段
var filter = ['no message','fix','resolve conflict','fix bug','test','merge','Fix Bug','uncomment'];

var host = "";
var secure = true;
var secureConnection = true;
var port = 465;

exports.email_addr = email_address;
exports.email_psd = email_pass;
exports.path = repo_path;
exports.target = target_email;
exports.cc = cc_email;
exports.title = title_email;
exports.workspace = work_space;
exports.commit_filter = filter;

exports.host = host;
exports.secure = secure;
exports.secureConnection = secureConnection;
exports.port = port;