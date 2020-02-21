# Minecraft server web console
Run and control your minecraft server in this web.  

## Features
1. Start/Stop minecraft server  
2. Send command to minecraft server console  
3. Upload/Delete Bukkit plugins
4. Change server.properties
5. Server file manager

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.  

## Prerequisites
 - NodeJS
 - npm
 - Java JDK

## Installing

  `$ npm install`

## Running

### Generate user account

To prevent your server getting modified by other users, you need to create an account:  
  `$ node gen_pass.js`  

You can run excute this command serveral times to create multiple accounts.  

### Add minecraft server launcher

Put minecraft server launcher in `./server/` folder.  
You can change the folder name by editing `config.json`.

### Host website

After creating accounts, you can host this website:  

  `$ npm start`

## Config

 - Server-port: port for web hosting  
 - Server-location: place for minecraft server launcher  
 - Start-file: Minecraft server launcher file name  
 - RAM: RAM for minecraft server  
 - Launch-parameters: Additions parameters for optimzing java runtime. 

## Webpage

Using google material design, modified from [Android.com](https://getmdl.io/templates/android-dot-com/index.html)

## Authors

 - Samuel21119

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
