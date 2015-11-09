var fs = require('fs'),
    path = require('path'),
    chokidar = require('chokidar'),
    Sftp = require('sftp-upload'),
    Client = require('scp2').Client;
    // util = require('util');

/**
 * Live Uploader (SFTP)
 *
 * @param {object} conf     configuration
 *
 */
var LiveUploader = function (conf) {
    this.configFile = conf ? conf.configFile : null;
};

LiveUploader.prototype = {

    conf : {},
    configFile : null,

    drivePath : null,
    projectPath : null,
    host : null,
    remotePath : null,
    user : null,

    watcher : null,

    init : function () {
        var key = null;

        this.configFile = process.argv[2] || this.configFile;
        this.conf = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));

        this.logStart();

        for (key in this.conf) {
            if (this.conf.hasOwnProperty(key)) {
                this.log(key + ': ' + this.conf[key]);
            }
        }
        console.log('\n');
        this.initWatcher();
        this.initEvents();
    },

    logStart : function () {
        console.log('----------------------------');
        console.log('Upload monitor              ');
        console.log('----------------------------\n');
    },

    log : function (msg, type) {
        type = type ? ('[' + type + ']') : '[info]';
        console.log(type + ' ' + msg);
    },

    initWatcher : function () {
        var watchPath = this.conf.drivePath + this.conf.projectPath;

        this.watcher = chokidar.watch(watchPath, {
            persistent: true,
            ignored: /[\/\\]\./,
            ignoreInitial: false,
            followSymlinks: true,
            cwd: '.',
            usePolling: true,
            alwaysStat: false,
            depth: undefined,
            interval: 100,
            ignorePermissionErrors: false,
            atomic: true
        });
    },

    initEvents : function () {
        var me = this;

        this.watcher.on('change', function (relPath, event) {
            var startTime = new Date().getTime(),
                endTime = null,
                drivePath = me.conf.drivePath,
                projectPath = me.conf.projectPath,
                remotePath = me.conf.remotePath,
                filePath = path.resolve(relPath),
                remoteFilePath = remotePath + filePath.replace(drivePath.replace('\\\\', '\\'), '')
                    .replace(projectPath, '').replace(/\\/g, '/'),
                options = {
                    host : me.conf.host,
                    username : me.conf.username,
                    isFile : true,
                    path : filePath,
                    remoteDir: remoteFilePath,
                    privateKey: fs.readFileSync(me.conf.privateKey)
                },
                sftp = null;

            me.log(event.ctime);
            me.log(filePath + ' ...');

            options.client = new Client(options);
            sftp = new Sftp(options);

            sftp.on('error', function (err) {
                me.log(err, 'error');
            })
                // .on('uploading', function (pgs) {
                //     me.log('upload: ' + remoteFilePath);
                //     me.log('upload: ' + pgs.percent + '%');
                // })
                .on('completed', function () {
                    endTime = new Date().getTime();
                    me.log('uploaded in ' + (endTime - startTime) + ' ms\n');
                })
                .upload();

        }).on('error', function (err) {
            me.log(err, 'error');
        });
    }
};

var LiveUploader = new LiveUploader().init();