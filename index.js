#! /usr/bin/env node
const fs = require("fs");
const fsExtra = require("fs-extra")
const path = require("path");
const prompts = require("prompts");
const consola = require("consola");
const internal = require("stream");
const argv = require("minimist")(process.argv.slice(2))
//config for token
var config = require(path.join(__dirname, "config.json"))


const botToken = getToken();

var choices = getTemplates();
var cwd = process.cwd();


//options
const questions = [
    {
        type: "text",
        name: "projectName",
        message: "What is the name of the project?"
    },
    {
        
        type: "text",
        name: "description",
        message: "Description?"
    },
    {
        type: "select",
        name: "template",
        message: "Pick a template?",
        choices: choices
    }
];


(async () => {
    const response = await prompts(questions);

    var destDir = path.join(cwd, response.projectName);

    if(fs.existsSync(destDir)) {
        consola.error(new Error("Directory already exists"));
        (async () => { 
            let res_op = await prompts({
                type: "confirm",
                name: "delete",
                message: "Do you want to remove this directory?",
                initial: true
            });

            console.log(" ")
            
            if(res_op.delete) {
                fsExtra.removeSync(destDir);
                consola.info(`${destDir} replaced`);
                fs.mkdirSync(path.join(cwd, response.projectName))
                init(response.template, response.projectName, response.description)
            }
        })();
    }else {
        fs.mkdirSync(path.join(cwd, response.projectName))
        init(response.template, response.projectName, response.description)
    }
})();


//functions

function getTemplates() {
    var ok = fs.readdirSync(path.join(__dirname, "templates")).map((value) => {
        return {title: value, value: path.join(__dirname, "templates", value),}
    });

    return ok;
}

function getToken() {
    if(config.token) {
        return config.token;
    }else if(argv.t || argv.token) {
        if(typeof argv.t != "string" && typeof argv.token != "string") {
            consola.error(new Error('Type of token must be a string'));
            process.exit();
        }
        return argv.t || argv.token
    }
}

function copy(template, cwd) {
    fs.copyFileSync(template, cwd, fs.constants.COPYFILE_EXCL);
}

function init(template, name, des) {
    fs.readdirSync(template).forEach((value) => {
        copy(path.join(template, value), path.join(cwd,name,value))
    });

    //changing package.json
    let packagePath = path.join(cwd, name, "package.json")
    let stuff = require(packagePath)
    stuff.name = name;
    stuff.description = des;

    fs.writeFileSync(packagePath, JSON.stringify(stuff));

    //end
    console.log(` `)
    console.log(` cd ${name}`)
    console.log(` npm install`)
    console.log(` npm test`)
}