#! /usr/bin/env node
const fs = require("fs");
const fsExtra = require("fs-extra")
const path = require("path");
const prompts = require("prompts");
const consola = require("consola");
const internal = require("stream");
const { default: consolaGlobalInstance } = require("consola");
const argv = require("minimist")(process.argv.slice(2))

//other commands 
if(argv._[0] === "token") {
    if(typeof argv._[1] !== "string") {
        consola.error(new Error('Type of token must be a string'));
        process.exit();
    }

    let token = argv._[1]
    let json = 
    `{\n    "token": "${token}"\n}`

    fs.writeFileSync(path.join(__dirname, "config.json"), json);

    consola.info("New token set")
    process.exit();
} else if(argv._[0] === "templates") {
    consola.info("Templates location: " + __dirname + "\\templates")

    console.log("\n")

    for(let i of getTemplates()) {
        consola.success(i.title)
    }

    process.exit()
}

if(argv._[0] === "version") {
    console.log(require(path.join(__dirname, "package.json")).version)
    process.exit();
}

//config for token
var config = require(path.join(__dirname, "config.json"))


var botToken = getToken();

var choices = getTemplates();
var cwd = process.cwd();

//additional features
var optionChoices = [
    {title: "git", value: ".gitignore"},
    {title: "node_fetch", value: "node_fetch"},
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
        type: prev => !!botToken? null: "password",
        name: "token",
        message: "What is the bot token?",
    },
    {
        type: "multiselect",
        name: "options",
        message: "Select any additional options?",
        choices: optionChoices,
        hint: "- > Space to select. Return to submit"
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
                init(response.template, response.projectName, response.description, response.options, response.token)
            }
        })();
    }else {
        fs.mkdirSync(path.join(cwd, response.projectName))
        init(response.template, response.projectName.trim(), response.description, response.options, response.token)
    }
})();


//functions


//get a list of templates
function getTemplates() {
    return fs.readdirSync(path.join(__dirname, "templates")).map((value) => { return {title: value, value: path.join(__dirname, "templates", value),} });
}

function getToken() {
    if(argv.t || argv.token) {
        if(typeof argv.t != "string" && typeof argv.token != "string") {
            consola.error(new Error('Type of token must be a string'));
            process.exit();
        }
        return argv.t || argv.token
    }else if(config.token) {
        return config.token;
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

function init(template, name, des, options, token) {
    fs.readdirSync(template).forEach((value) => {

        //check if the user wants to use git
        if(value === ".gitignore"){
            if(options.includes(".gitignore")) {
                copy(path.join(template, value), path.join(cwd,name,value));
            }else {
                return;
            }
        }else {
            copy(path.join(template, value), path.join(cwd,name,value))
        }
    });

    //changing package.json
    let packagePath = path.join(cwd, name, "package.json");
    let stuff = require(packagePath);
    stuff.name = name;
    stuff.description = des;
    let writeContent = [];



    options.forEach( value => {
        if (value === "node_fetch") {
            stuff.dependencies["node-fetch"] = "2.6.7"
            writeContent.push(`const fetch = require("node-fetch");\n`);
        }
    })


    fs.writeFileSync(packagePath, JSON.stringify(stuff, null, "\t"));

    if(botToken === undefined && token) {
        botToken = token
    }else {
        botToken = "PUT_TOKEN_HERE"
    }

    //Writing in env
    fs.writeFileSync(path.join(cwd, name, ".env"), `DISCORD_TOKEN=${botToken}`)

    if(writeContent.length > 0) {
        writeInFile(path.join(cwd, name, "index.js"), writeContent)
    }

    //end of program
    console.log(` `)
    console.log(` cd ${name}`)
    console.log(` npm install`)
    console.log(` npm test`)
}