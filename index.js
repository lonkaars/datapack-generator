#!/usr/bin/env node

const inquirer = require("inquirer");
var colors = require("colors");
const shell = require("shelljs");
var fs = require("fs");
var minecraftsaveslocation = `~/AppData/Roaming/.minecraft/saves`

function createDataPack(name, description, version, location) {
    // Generate data for files
    var newver;
    try {
        newver = JSON.parse(version)
    } catch (error) {
        console.log(`! Version value entered not a number, exiting...`.red.bold);
        process.exit()
    }
    var file_pack_mcmeta = {
        "pack": {
            "pack_format": newver,
            "description": description
        }
    }
    var file_gameloop_mcfunction = `## This file is run every game tick (20 times a second)\n\n# Core loading\nfunction ${name}:core\n\n# Add-ons`
    var file_tick_json = {
        "values": [`${name}:gameloop`]
    }

    var datapckdir = `${minecraftsaveslocation}/${location}/datapacks`

    // File generating...
    console.log(`\nGenerating files...`.green.bold);
    shell.mkdir('-p', `${datapckdir}/${name}/data/${name}/functions/add-ons`);
    shell.touch(`${datapckdir}/${name}/pack.mcmeta`);
    shell.mkdir(`${datapckdir}/${name}/data/${name}/functions/required`);
    shell.touch(`${datapckdir}/${name}/data/${name}/functions/core.mcfunction`);
    shell.touch(`${datapckdir}/${name}/data/${name}/functions/gameloop.mcfunction`);
    shell.mkdir('-p', `${datapckdir}/${name}/data/minecraft/tags/functions`);
    shell.touch(`${datapckdir}/${name}/data/minecraft/tags/functions/tick.json`);

    // File writing
    console.log(`Writing data to files...\n`.green.bold);
    shell.cd(datapckdir)
    fs.writeFileSync(`./${name}/pack.mcmeta`, JSON.stringify(file_pack_mcmeta, null, `    `));
    fs.writeFileSync(`./${name}/data/${name}/functions/gameloop.mcfunction`, file_gameloop_mcfunction);
    fs.writeFileSync(`./${name}/data/minecraft/tags/functions/tick.json`, JSON.stringify(file_tick_json, null, `    `));

    // Done message
    console.log(` Done!\n`.black.bgGreen.bold)
}

const askQuestions = () => {
    const questions = [{
            name: "DATAPACKNAME",
            type: "input",
            message: "What do you want to call this datapack?"
        },
        {
            name: "DATAPACKDESC",
            type: "input",
            message: "What do you want the description to be?"
        },
        {
            name: "DATAPACKVERN",
            type: "input",
            message: "What do you want the datapack version to be? (This has to be a number)"
        },
        {
            name: "LOCATIONTYPE",
            type: "list",
            message: "Create datapack in local directory or choose from your saves (windows only)",
            choices: ["Local directory", "Choose from my saves"]
        }
    ];
    return inquirer.prompt(questions);
};

const localPath = () => {
    var saveslist = shell.ls(minecraftsaveslocation);
    for (let i = 0; i < saveslist.length; i++) {
        if (saveslist[i].match(/.*\..*/)) {
            saveslist.splice(i, 1);
        }
    }
    const questions = [{
        name: "LOCATION",
        type: "list",
        message: "In witch save do you want to create the datapack?",
        choices: saveslist
    }]
    return inquirer.prompt(questions);
}

const sure = (name, description, version, path) => {
    shell.cd(`${minecraftsaveslocation}/${path}`)
    const questions = [{
        name: "SURE",
        type: "list",
        message: `\n\n  Please review these options:\n\nPack name: ${name}\nPack description: ${description}\nPack version: ${version}\nPack directory: ${shell.pwd()}/datapacks/${name}\n\n  Is this correct?`,
        choices: ["Yes", "No"]
    }];
    return inquirer.prompt(questions);
};

const run = async () => {
    // Welcome message
    console.log("Hi there, welcome to Loekaars' datapack generator!\nTo use this generator, just type in the required information when prompted!\n\n".green);

    // Questions
    var answers = await askQuestions();
    var {
        DATAPACKNAME,
        DATAPACKDESC,
        DATAPACKVERN,
        LOCATIONTYPE
    } = answers;
    var location;
    if(answers.LOCATIONTYPE == "Local directory"){
        location = process.cwd();
    } else {
        var location = await localPath();
        var {
            LOCATION
        } = location;
    }

    // Are you sure?
    var issure = await sure(answers.DATAPACKNAME, answers.DATAPACKDESC, answers.DATAPACKVERN, location);
    var {
        SURE
    } = issure;

    // Make the datapack
    if (issure.SURE == "Yes") {
        createDataPack(answers.DATAPACKNAME, answers.DATAPACKDESC, answers.DATAPACKVERN, location);
    } else {
        console.log(`\n\n\n`);
    }
};

if (process.platform == 'win32') {
    run();
} else {
    console.log(`You need to be on windows for this generator to function properly!`.bold.red)
}