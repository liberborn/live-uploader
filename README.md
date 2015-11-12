# Live Uploader (SFTP)

Simple tool for web project live upload. The tool monitors project folder and immediately uploads changed files to remote host via SFTP.

Before running the tool please create **config.json** with project and SFTP connection configuration.

### Run Live Uploader
```cmd
node app.js config.example.json
```

### Example console output

```cmd
----------------------------
Live Upload
----------------------------

[info] drivePath: C:\
[info] appPath: C:\var\live-upload
[info] projectPath: var\example\public
[info] host: example.com
[info] remotePath: /var/www/example/public
[info] username: user
[info] privateKey: C:\home\.ssh\id_rsa


[info] Mon Nov 09 2015 14:49:51 GMT+0100 (W. Europe Standard Time)
[info] C:\var\example\public\js\main.js ...
[info] uploaded in 1641 ms

[info] Mon Nov 09 2015 15:15:31 GMT+0100 (W. Europe Standard Time)
[info] C:\var\example\public\css\main.css ...
[info] uploaded in 1779 ms
```
