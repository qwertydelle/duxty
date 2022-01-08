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


var optionChoices = [
    {title: "git", value: "git"},
    {title: "node_fetch", value: "node_fetch"},
    {title: "interactions", value: "interactions"},
]

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
    },
    {
        type: "multiselect",
        name: "options",
        message: "Select any additional options?",
        choices: optionChoices,
        hint: '- > Space to select. Return to submit'
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
                init(response.template, response.projectName, response.description, response.options)
            }
        })();
    }else {
        fs.mkdirSync(path.join(cwd, response.projectName))
        init(response.template, response.projectName, response.description, response.options)
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

function writeInFile(filePath, content) {
    var data = fs.readFileSync(filePath)
    var stream = fs.createWriteStream(filePath);


    let final = content.join("\r\n")

    stream.write(final + data)
}

function init(template, name, des, options) {
    fs.readdirSync(template).forEach((value) => {

        //check if the user wants to use git
        if(value === ".gitignore"){
            if(options[0]) {
                copy(path.join(template, value), path.join(cwd,name,value));
            }else {
                return
            }
        }else {
            copy(path.join(template, value), path.join(cwd,name,value))
        }
    });

    //changing package.json
    let packagePath = path.join(cwd, name, "package.json")
    let stuff = require(packagePath)
    stuff.name = name;
    stuff.description = des;
    let writeContent = [];



    options.forEach( value => {
        if (value === "node_fetch") {
            stuff.dependencies["node_fetch"] = "latest"
            writeContent.push(`const fetch = require("node_fetch);\n`)
        }else if(value === "interactions") {
            //quick
        }
    })


    fs.writeFileSync(packagePath, JSON.stringify(stuff));

    //Writing in env
    fs.writeFileSync(path.join(cwd, name, ".env"), `DISCORD_TOKEN=${botToken}`)

    if(writeContent.length > 0) {
        writeInFile(path.join(cwd, name, "index.js"), writeContent)
    }

    //end
    console.log(` `)
    console.log(` cd ${name}`)
    console.log(` npm install`)
    console.log(` npm test`)
}