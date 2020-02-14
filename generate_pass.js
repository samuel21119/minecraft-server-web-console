const fs = require("fs");
const path = require("path")
const bcrypt = require("bcrypt");
const prompt = require("prompt");
//Hash
const saltRounds = 15;

// Password hash json file
var pass;
const pass_dir = path.join(__dirname, "password", "pass.json");

var prompt_attributes = [
    {
        name: 'username',
        validator: /^[a-zA-Z\s\-]+$/,
        warning: 'Username is not valid, it can only contains letters, spaces, or dashes'
    },
    {
        name: 'password',
        hidden: true
    }
];

fs.readFile(pass_dir, (err, data) => {
    if (err) {
        pass = {};
    }else {
        pass = JSON.parse(data);
    }
    prompt.start();
})
prompt.get(prompt_attributes, function (err, result) {
    if (err) {
        console.log(err);
        return 1;
    }else {
        // Get user input from result object.
        var username = result.username;
        var password = result.password;
        var message = "Username : " + username + " , Password : " + password;
        bcrypt.hash(password, saltRounds, function(err, hash) {
            pass[username] = hash;
            fs.writeFile(pass_dir, JSON.stringify(pass, null, '\t'), (err) => {
                if (err) {
                    console.log("Failed on saving file!");
                }else {
                    console.log("Hash file saved successfully!")
                }
            })
        });
   }
});