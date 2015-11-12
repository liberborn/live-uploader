var fs = require('fs'),
    path = require('path'),
    chokidar = require('chokidar'),
    Sftp = require('sftp-upload'),
    Client = require('scp2').Client,
    nn = require('node-notifier');



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
    configFile  : null,

    drivePath   : null,
    projectPath : null,
    host        : null,
    remotePath  : null,
    user        : null,

    watcher     : null,

    init : function () {
        this.setConf().logStart().logConfig().initWatcher().initEvents();
    },

    setConf : function () {
        this.configFile = process.argv[2] || this.configFile;
        this.conf = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));

        return this;
    },

    log : function (msg, type) {
        type = type ? ('[' + type + ']') : '[info]';
        console.log(type + ' ' + msg);

        return this;
    },

    logStart : function () {
        console.log('----------------------------');
        console.log('Live Uploader               ');
        console.log('----------------------------\n');

        return this;
    },

    logConfig : function () {
        var key = null;

        for (key in this.conf) {
            if (this.conf.hasOwnProperty(key)) {
                this.log(key + ': ' + this.conf[key]);
            }
        }
        console.log('\n');

        return this;
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

        return this;
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
            });

            sftp.on('completed', function () {
                endTime = new Date().getTime();
                me.log('uploaded in ' + (endTime - startTime) + ' ms\n');

                if (me.conf.enableUploadNotification) {
                    nn.notify({
                        title: 'LiveUploader',
                        message : '\n' + filePath + '\n' + 'uploaded in ' + (endTime - startTime) + ' ms',
                        time: 2000,
                        wait: false
                    });
                }
            });

            sftp.upload();

        });

        this.watcher.on('error', function (err) {
            me.log(err, 'error');
        });

        process.on('uncaughtException', function (exception) { // global expections catch
            nn.notify({
                title: 'LiveUploader Exception',
                message : '\nError:\n' + exception,
                wait: false
            });
        });

        return me;
    }
};

var LiveUploader = new LiveUploader().init();