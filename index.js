#!/usr/bin/env node

const inquirer = require("inquirer");
var colors = require("colors");
const shell = require("shelljs");
var fs = require("fs");

var startPath = process.cwd();

var minecraftsaveslocation = process.platform == 'win32' ? `~/AppData/Roaming/.minecraft/saves` : process.platform == 'darwin' ? `~/Library/Application Support/minecraft/saves` : `~/.minecraft`

function createDataPack(name, desc, ver, location) {
    // Generate data for files
    var file_pack_mcmeta = {
        "pack": {
            "pack_format": ver,
            "description": desc
        }
    }
    var file_gameloop_mcfunction = `## This file is run every game tick (20 times a second)\n\n# Core loading\nfunction ${name}:core\n\n# Add-ons`
    var file_tick_json = {
        "values": [`${name}:gameloop`]
    }

    var file_pack_mcmeta = JSON.stringify(file_pack_mcmeta, null, '    ')
    var file_tick_json = JSON.stringify(file_tick_json, null, '    ')

    var datapackdir = location;

    // File generating...
    console.log(`\nGenerating files...`.green.bold);
    shell.mkdir('-p', `${datapackdir}/${name}/data/${name}/functions/add-ons`);
    shell.touch(`${datapackdir}/${name}/pack.mcmeta`);
    shell.mkdir(`${datapackdir}/${name}/data/${name}/functions/required`);
    shell.touch(`${datapackdir}/${name}/data/${name}/functions/core.mcfunction`);
    shell.touch(`${datapackdir}/${name}/data/${name}/functions/gameloop.mcfunction`);
    shell.mkdir('-p', `${datapackdir}/${name}/data/minecraft/tags/functions`);
    shell.touch(`${datapackdir}/${name}/data/minecraft/tags/functions/tick.json`);

    // File writing
    console.log(`Writing data to files...\n`.green.bold);
    shell.cd(datapackdir)
    fs.writeFileSync(`./${name}/pack.mcmeta`, file_pack_mcmeta);
    fs.writeFileSync(`./${name}/data/${name}/functions/gameloop.mcfunction`, file_gameloop_mcfunction);
    fs.writeFileSync(`./${name}/data/minecraft/tags/functions/tick.json`, file_tick_json);

    // Done message
    console.log(` Done!\n`.black.bgGreen.bold)
}


// ask questions
async function askQuestions() {
    var __1;
    var __2;
    var __3;
    var name;
    var desc;
    var version;
    var location;
    __1 = await inquirer.prompt(
        [{
                name: "name",
                type: "input",
                message: "What do you want to call this datapack?"
            },
            {
                name: "desc",
                type: "input",
                message: "What do you want the description to be?"
            },
            {
                name: "ver",
                type: "input",
                message: "What do you want the datapack version to be? (This has to be a number)"
            },
            {
                name: "locationtype",
                type: "list",
                message: "Create datapack in local directory or choose from your saves (windows only)",
                choices: ["Local directory", "Choose from my saves"]
            }
        ]
    )
    name = __1.name
    desc = __1.desc
    try {
        version = JSON.parse(__1.ver)
    } catch (error) {
        console.log(`! Version value entered not a number, exiting...`.red.bold);
        process.exit()
    }
    if (__1.locationtype == 'Local directory') {
        location = `${process.cwd()}/${name}`
    } else {
        var saveslist = shell.ls(minecraftsaveslocation);
        for (let i = 0; i < saveslist.length; i++) {
            if (saveslist[i].match(/.*\..*/)) {
                saveslist.splice(i, 1);
            }
        }
        var __2 = await inquirer.prompt([{
            name: "location",
            type: "list",
            message: "In witch save do you want to create the datapack?",
            choices: saveslist
        }]);
        var location = `${minecraftsaveslocation}/${__2.location}/datapacks/${name}`
    }
    __3 = await inquirer.prompt([{
        name: "sure",
        type: "list",
        message: `\n\n  Please review these options:\n\nPack name: ${name}\nPack description: ${desc}\nPack version: ${version}\nPack directory: ${location.replace(/\\/g, '/')}\n\n  Is this correct?`,
        choices: ["Yes", "No"]
    }]);
    if(__3.sure == 'Yes'){
        var temploc = location.replace(/\\/g, '/').match(/.*(?=\/)/)
        shell.cd(temploc)
        return {
            "name": name,
            "description": desc,
            "version": version,
            "location": shell.pwd().stdout
        }
    } else {
        return 'exit'
    }
}

// run
(async () => {
    var datapack = await askQuestions();
    if(datapack == 'exit'){
        console.log(`\n\n`);
        process.exit()
    } else {
        createDataPack(datapack.name, datapack.description, datapack.version, datapack.location)
    }
})();