const fs = require("fs");
const path = require("path");
const multer = require("multer");
const bcrypt = require('bcrypt');
const express = require("express");
// const serveIndex = require('serve-index');
const bodyParser = require('body-parser');
const { spawn } = require("child_process");
const cookieParser = require('cookie-parser');
const fileManager = require('express-file-manager');

var pass;
try {
    pass = require(path.join(__dirname, "password", "pass.json"));
}catch(e) {
    console.log("Missing pass.json file, please run \'node gen_pass.js\' first");
    process.exit(1);
}
const config = require("./config.json")
//Hash
const saltRounds = 15;
//Minecraft
var status = false;
var MinecraftServer = undefined;
require('events').EventEmitter.defaultMaxListeners = 10000;

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use((req, res, next) =>{ // Check if login
    if (req.path === "/login") {
        console.log(req.path);
        next();
        return;
    }
    try {
        var token = req.cookies.token;
        if (typeof(token) !== "undefined") {
            token = token.split("//////");
            if (token.length === 2) {
                var hash = token[0];
                var username = token[1];
                if (hash === pass[username]) {
                    next();
                    return;
                }
            }
        }
    }catch(e) {}
    res.redirect("/login");
});
app.use('/filemanager', fileManager(path.join(__dirname, config["Server-location"])));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "main", "index.html"));
});
app.get("/msg", (req, res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream",
                     "Cache-control": "no-cache" });
    var end = false;

    // If process not started: open new process.
    if (typeof(MinecraftServer) === "undefined") {
        MinecraftServer = spawn("java", [`-Xmx${config["RAM"]}`, `-Xms${config["RAM"]}`, '-jar', config["Start-file"], "nogui"], {
            cwd: path.join(__dirname, config["Server-location"])
        });
        status = true;
        console.log("CREATED");
    }else {
        // Send previous logs
        fs.readFile(path.join(__dirname, config["Server-location"], "logs", "latest.log"), (err, data) => {
            if (err) {

            }else {
                var arr = data.toString().split("\n");
                var previous_logs = parseInt(config["Previous-logs"]);
                for (var i = (previous_logs > arr.length ? 0 : arr.length - previous_logs); i < arr.length; i++) {
                    res.write("data: " + arr[i] + "\n\n");
                }
            }
        });
    }
    // Add event listener to client
    var listener1, listener2, listener3;
    MinecraftServer.stdout.on("data", listener1 = (data) => {
        if (end) return;
        data = data.toString();
        data = data.split(/\r?\n/);
        try {
            for (var i = 0; i < data.length; i++)
                res.write("data: " + data[i] + "\n\n");
        } catch (err) {
            return;
        }
    })
    MinecraftServer.stderr.on("data", listener2 = (data) => {
        if (end) return;
        data = data.toString();
        data = data.split(/\r?\n/);
        try {
            for (var i = 0; i < data.length; i++)
                res.write("data: " + data[i] + "\n\n");
        } catch (err) {
            return;
        }
    });
    MinecraftServer.on("close", listener3 = () => {
        if (end) return;
        console.log("Closed");
        status = false;
        MinecraftServer = undefined;
        res.write("data: CLOSED\n\n");
        res.end();
    });
    req.on("close", () => {
        if (typeof(aniGamerPlus) !== "undefined") { // Remove listener when client closed
            MinecraftServer.stdout.removeListener("data", listener1);
            MinecraftServer.stderr.removeListener("data", listener2);
            MinecraftServer.removeListener("close", listener3);
        }
        end = true;
        res.end();
    });
})
app.get("/status", (req, res) => {
    res.send(status);
});
app.get("/plugins", (req, res) => {
    fs.readdir(path.join(__dirname, config["Server-location"], "plugins"), (err, list) => {
        if (typeof(list) == "undefined") {
            res.send(" ");
            res.end();
            return;
        }
        var send = [];
        for (var i = 0; i < list.length; i++)
            if (path.extname(list[i]) === ".jar")
                send.push(list[i]);
        res.send(send);
        res.end();
    })
});
app.get("/properties", (req, res) => {
    res.sendFile(path.join(__dirname, config["Server-location"], "server.properties"));
});
app.post("/properties", (req, res) => {
    if (req.body.value !== "") {
        fs.writeFile(path.join(__dirname, config["Server-location"], "server.properties"), req.body.value, (err) => {
            if (err)
                return console.log(err);
        });
    }    
});
app.post("/command", (req, res) => {
    if (status === true)
        MinecraftServer.stdin.write(req.body.command + "\r\n");
});
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "login", "index.html"))
});
app.post("/login", async (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    if (typeof(pass[username]) !== "undefined" && await bcrypt.compareSync(password, pass[username])) {
        res.cookie("token", `${pass[username]}//////${username}`);
    }
    res.redirect("/");
});
app.get("/logout", (req, res) => {
    res.clearCookie('token');
    res.redirect("/");
})
app.post("/delete", (req, res) => {
    // console.log(req.body);
    fs.unlink(path.join(__dirname, config["Server-location"], "plugins", req.body.file), (err) => {
        res.send("Done");
    });
});
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, config["Server-location"], "plugins"))
    }, 
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
var upload = multer({
    storage: storage
});
app.post('/upload_plugin', upload.single("plugin"), (req, res) => {
    res.redirect("/#setting");
})
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "html", req.url));
});


app.listen(config["Web-port"], () => console.log(`Application listening on port ${config["Web-port"]}!`));
