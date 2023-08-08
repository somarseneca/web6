/*********************************************************************************
*  WEB322 – Assignment 06
* 
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Sumaya Omar Student ID: 127166221 Date: 7 August 2023
 * 
 *  Github link: https://github.com/somarseneca/assignment6
 *
 *  Online (Cyclic) Link: https://puzzled-helmet-fox.cyclic.app/login
 ********************************************************************************/

const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [ 
        { 
            "dateTime": Date, 
            "userAgent": String  
        } 
    ]
});

let User;

function initialize() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection("mongodb+srv://aryank1511:" + "computE1*" + "@web322-blog-app.mr1g2s5.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});
        db.on('error', (err)=>{
            reject(err);
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });

    })
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10).then((hash) => {
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save().then(() => {
                    resolve();
                }).catch((err) => {
                    if (err.code === 11000) {
                        reject("User Name already taken");
                    } else {
                        reject(`There was an error creating the user: ${err}`);
                    }
                })
            })
            .catch((err) => {
                console.log(err);
                reject("There was an error encrypting the password")
            });
        
        }
    })
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({ "userName": userData.userName }).exec()
        .then((users) => {
            if (users.length === 0) {
                reject(`Unable to find user: ${userData.userName}`);
            } else {
                bcrypt.compare(userData.password, users[0].password).then((result) => {
                    if (result === true) {
                        resolve(users[0]);
                    } else {
                        reject(`Incorrect Password for user: ${userData.userName}`);
                    }
                 });
                users[0].loginHistory.push({
                    "dateTime": new Date().toString(),
                    "userAgent": userData.userAgent
                })
                User.updateOne(
                    { "userName": users[0].userName },
                    { "$set": {"loginHistory": users[0].loginHistory} },
                    { "multi": false }
                ).exec().then(() => {
                    resolve(users[0]);
                }).catch((err) => {
                    reject(`There was an error verifying the user: ${err}`)
                })
            }
        }).catch(() => {
            reject(`Unable to find user: ${userData.userName}`);
        });
    })
}

module.exports = {
    initialize,
    registerUser,
    checkUser
}
