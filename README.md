# lazydailyreport
Since I am too lazy to write a email everyday to my boss.

I made a little tool to simplify the job.



# installing

This tool only works on macOS.

Run commands blow:

```bash
brew node

npm install commander

npm install nodemailer

npm install nodemailer-smtp-transport

npm install -g pkg
```

Then open archive.js and fill in you information.

After you can build lbl.js with command like this:

```bash
pkg -t macos lbl.js
```



Then you will get a executable file named lbl.

Copy lbl to /usr/local/bin and run command:

```bash
sudo chmod a+x /usr/local/bin/lbl
```

Open  terminal and enter:

```
lbl -h
```



If everything is ok,you will see something like this:

```bash
Usage: lbl [options]

Options:

  -V, --version            output the version number
  -m, --message [message]  填写今日完成的工作 (default: )
  -p, --plan [plan]        填写明日计划完成的工作 (default: )
  -s, --send               发送日(周)报
  -l, --list               预览日(周)报
  -i, --info               显示信息
  -f, --fetch              从git获取commit并填写到今日完成工作中
  -h, --help               output usage information
```

# Usage

```bash
  lbl -V, --version            output the version number
  lbl -m, --message [message]  write what has done.
  lbl -p, --plan [plan]        assigned a job to todo-list.
  lbl -s, --send               send it by email
  lbl -l, --list               show done list and todo list
  lbl -i, --info               show infomation
  lbl -f, --fetch              fetch commit jobs using git
  lbl -h, --help               output usage information
```

# Finally

Thanks **Andris Reinman** for nodemailer.

Thanks **TJ Holowaychuk** for commander.

I could not done this without their talented jobs.