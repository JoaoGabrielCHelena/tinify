#!/usr/bin/env node

const fs = require('fs')
const tinify = require("tinify")
const path = require('path')
const util = require('util')
const rename = util.promisify(fs.rename)
const commandLineUsage = require('command-line-usage')

const outputFolderName = "tinifyOutput"
const backupFolderName = "tinifyOriginalBackup"


/////////////////////////////////////////////////////////////////////////
// Values of the settings V
/////////////////////////////////////////////////////////////////////////
const key = "unset"
const mode = {name: 'webp', value:['image/webp']}
const outputMode = "output"
///////////////////////

tinify.key = ( process.env.TINIFY_KEY && key == "unset" ) ? process.env.TINIFY_KEY :  key 

if (process.argv[2] == "-k" || process.argv[2] == "--key") {
    if (process.argv[3]) {
        Rewrite("const key", `${process.argv[3]}`,`  Key has been updated.`)
        tinify.key = process.argv[3]
    } else {
        console.log(`  No key given.`)
    }
}

new Promise((resolve, reject) => {
    tinify.validate((err) => {
        if (err) return reject(err);
        resolve();
    })
}).then(handleArguments)
  .catch((e) => {
    console.error(`  API key has not been set or is invalid.\n  Set it with tinify -k {key} or\n  have and enviroment variable named TINIFY_KEY with it's value`)
  })

/////////////////////////////////////////////////////////////////////////
// Texts V
/////////////////////////////////////////////////////////////////////////
const helpBark = "\n  -h or --help for help"
const helpText = [
    {
        header: 'TinyPNG CLI',
        content: "{italic Using tinyPNG's API with node}"
    },
    {
        header: 'Usage',
        content: '$ node tinify.js [command] <argument>'
    },
    {
        header: 'Commands',
        optionList: [
            {
                name: 'help',
                alias: 'h',
                description: 'Displays this help text.\n',
                type: Boolean
            },
            {
                name: 'key',
                alias: 'k',
                description: 'Sets the API key.\n',
                type: String,
                typeLabel: '{underline.italic Key}'
            },
            {
                name: 'mode',
                alias: 'm',
                description: 'Changes the conversion/reduction mode.\n Possible Values: direct, png, webp, smallest.\nFor further detail: $ node tinify.js -m -h\n',
                type: String,
                typeLabel: '{underline.italic Option}',
            },
            {
                name: 'output',
                alias: 'o',
                description: 'Changes the output mode.\n Possible Values: backup, output, direct.\ndirect is not recommended.\nFor further detail: $ node tinify.js -o -h\n',
                type: String,
                typeLabel: '{underline.italic Option}',
            },
            {
                name: 'folder',
                alias: 'f',
                description: 'Processes all files in the folder of the given path.\n',
                type: String,
                typeLabel: '{underline.italic Path to folder}',
            },
            {
                name: 'single',
                alias: 's',
                description: 'Processes the file of the given path.\n',
                type: String,
                typeLabel: '{underline.italic Path to file(s)}',
            },
            {
                name: 'list',
                alias: 'l',
                description: 'Lists how options are currently set.\n',
                type: Boolean,
            },
            {
                name: 'conversions, --count',
                alias: 'c',
                description: 'Shows the amount of monthly conversions made.\n',
                type: Boolean,
            },
            {
                name: 'reset',
                description: 'Resets all options to their starting values.',
                type: Boolean,
            }
        ],
    }
]
const modeHelpText = [
    {
        header: 'Changing mode',
        content: "{italic Altering how tinyPNG's API does its thing}"
    },
    {
        header: 'Usage',
        content: '$ node tinify.js -m <argument>\nor\n$ node tinify.js --mode <argument>'
    },
    {
        header: 'Arguments',
        content: [
            { colA: '{bold -h, --help}', colB: 'Displays this help Text.\n'},
            { colA: '{bold webp}', colB: 'All output files are in the WebP image format.\nDoes both conversion and file size optimization.\n'},
            { colA: '{bold png}', colB: 'All output files are in the PNG image format.\nDoes both conversion and file size optimization.\n'},
            { colA: '{bold smallest}', colB: "Output files are either in the WebP or PNG image format.\nTinyPNG's API returns only the smallest of the two.\nDoes both conversion and file-size optimization.\n"},
            { colA: '{bold direct}', colB: 'Simply optimizes the image, maintaining the file type.'},
        ]
    }
]
const outputHelpText = [
    {
        header: 'Changing output',
        content: "{italic Altering where the output files go}"
    },
    {
        header: 'Usage',
        content: '$ node tinify.js -o <argument>\nor\n$ node tinify.js --output <argument>'
    },
    {
        header: 'Arguments',
        content: [
            { colA: '{bold -h, --help}', colB: 'Displays this help Text.\n'},
            { colA: '{bold output}', colB: `All output files are sent to a folder named "${outputFolderName}".\n`},
            { colA: '{bold backup}', colB: `All original files are sent to a folder named "${backupFolderName}".\nThe output files are placed in the original directory.\n`},
            { colA: '{bold direct}', colB: "!! {italic NOT RECOMMENDED} !!\nOutput files are placed in the original directory.\nIf the output has the same name and type as the original, the latter is overwritten."},
        ]
    }
]

const checkHelpTrigger = (checkedIndex, helpText) => {
    const helpTrigger = [undefined, "-h", "--help"]
    if (helpTrigger.includes(process.argv[checkedIndex])) {
        console.log(commandLineUsage(helpText))
        return true 
    }
    return false
}

const optionList = [
    {
        content: [
            { colA: '{bold Mode:}', colB: `${mode.name}`},
            { colA: '{bold Output Mode:}', colB: `${outputMode}`},
            { colA: '{bold Key:}', colB: `${key == "unset" ? !process.env.TINIFY_KEY ?  "unset" : "set" : "set"}`},
        ]
    }
]

/////////////////////////////////////////////////////////////////////////
// this processes all the commands and arguments V
/////////////////////////////////////////////////////////////////////////
function handleArguments() {
    if (process.argv[2] == "-k" || process.argv[2] == "--key") {
      process.exit()
    }
    if (!((process.argv[2] == "-s") || (process.argv[2] == "--single")) && process.argv[4]) {
        console.log(`  Too many arguments`)
    } else {
        if (checkHelpTrigger(2, helpText)) { 
            return
        }
        switch (process.argv[2]) {
            /////////////////////////////////////////////////////////////////////////
            case "-m":
            case "--mode":
                modeChange()
            break
            /////////////////////////////////////////////////////////////////////////
            case "-o":
            case "--output":
                OutputmodeChange()
            break
            /////////////////////////////////////////////////////////////////////////
            case "-s":
            case "--single":
                StartProcess()
            break
            /////////////////////////////////////////////////////////////////////////
            case "-f":
            case "--folder":
                StartProcess()
            break
            /////////////////////////////////////////////////////////////////////////
            case "-c":
            case "--conversions":
            case "--count":
                console.log(`  ${tinify.compressionCount} compressions out of 500 free monthly compressions.\n  ${500 - tinify.compressionCount} free monthly compressions left.`)
            break
            /////////////////////////////////////////////////////////////////////////
            case "-l":
            case "--list":
                console.log(commandLineUsage(optionList))
            break
            /////////////////////////////////////////////////////////////////////////
            case "--reset":
                Rewrite("const mode", "{name: 'webp', value:['image/webp']}", undefined, true, () => {
                    Rewrite("const key", `unset`, undefined, false, () => {
                        Rewrite("const outputMode", "output")
                    })
                })
                console.log(`  Options have been reset`)
            break
            /////////////////////////////////////////////////////////////////////////
            default:
                console.log(`  Invalid command.${helpBark}`)
            break
            /////////////////////////////////////////////////////////////////////////
        }
    }
}


/////////////////////////////////////////////////////////////////////////
// Functions used for configuring stuff V
/////////////////////////////////////////////////////////////////////////
function modeChange() {
    let returnMessage = `  Mode changed`

    if (checkHelpTrigger(3, modeHelpText)) {
        return   
    }

    switch (process.argv[3]) {
        /////////////////////////////////////////////////////////////////////////
        case "direct":
            Rewrite("const mode",  "{name: 'direct', value:'none'}", returnMessage, true)
            break
        /////////////////////////////////////////////////////////////////////////
        case "png": 
            Rewrite("const mode", "{name: 'png', value:['image/png']}", returnMessage, true)
            break
        /////////////////////////////////////////////////////////////////////////
        case "webp": 
            Rewrite("const mode", "{name: 'webp', value:['image/webp']}", returnMessage, true)
            break
        /////////////////////////////////////////////////////////////////////////
        case "smallest": 
            Rewrite("const mode", "{name: 'none', value:['image/webp','image/png']}", returnMessage, true)
            break
        /////////////////////////////////////////////////////////////////////////
        default:
            console.log(`  Invalid mode.\n  Available modes: direct, png, web, smallest${helpBark}`)
            break
        /////////////////////////////////////////////////////////////////////////
    }
}

function OutputmodeChange() {
    let validOptions = ["output", "backup", "direct"]

    if (checkHelpTrigger(3, outputHelpText)) {
        return
    }

    if (validOptions.includes(process.argv[3])) {
        Rewrite("const outputMode", `${process.argv[3]}`, `  Output Mode has been updated.`)
    } else {
        console.log(`  Invalid output mode.\n  Available modes: output, backup, direct (not recommended)${helpBark}`)
    }
}

function StartProcess() {
////////
/// This starts the Process
///////
    if (checkHelpTrigger(3, helpText)) {
        return
    }

    if (key != "unset" || process.env.TINIFY_KEY) {
        process.argv[3] ? directoryHandling(process.argv[3]) : console.log(`No path given.${helpBark}`)
    } else { 
        // this should never trigger
        console.log(`  API key has not been set.${helpBark}`)
    }
}

function Rewrite(alteredValue, newValue, logText, notString, callback) {
    fs.readFile(__filename, 'utf8', (err, data) => {
    if (err) {
        console.error(`  Error reading file:`, err)
        return
    }
    
    const regex = new RegExp(`${alteredValue} = .*`)
    let modifiedData
    if (notString) {
        modifiedData = data.replace(regex, `${alteredValue} = ${newValue}`)
    } else {
        modifiedData = data.replace(regex, `${alteredValue} = "${newValue}"`)
    }
    
    fs.writeFile(__filename, modifiedData, 'utf8', e => {
        if (e) {
        console.error(`  Error writing file:`, e)
        return
        }
        if (logText) {
            console.log(logText)
        }
        // exists to chain multiple rewrites correctly
        // if they happen asyncronously, things break
        if (callback) {
            callback()
        }
    })
    })
}



/////////////////////////////////////////////////////////////////////////
// Actually running the beast V
/////////////////////////////////////////////////////////////////////////
// Handles directory creation, if needed.
function directoryHandling(target) {
    // Need if multiple files are passed to single.
    let files = process.argv.splice(3)
    // Need to fix the target if single.
    if (process.argv[2] == "-s" || process.argv[2] == "--single") {
        files.forEach((element) => {
            try {
                if (!fs.statSync(element).isFile()) {
                    throw new Error(`${element} is not a file.`);
                }
                let fileObj = path.parse(element)
                files[files.indexOf(element)] = fileObj.base 
            } catch (e) {
                console.log(`  ${e}`)
                return
            }
        })
        target = path.dirname(target)
    }

    fs.readdir(target, (e, success) => {
        if (e) {
            return console.log(`  Error: ${e.message}`)
        }

        function execute() {
            process.argv[2] == "-f" || process.argv[2] == "--folder" ? folderWork(target, success) : folderWork(target, files) 
        }

        function createDirectory(directory) {
            fs.mkdir(`${target}/${directory}`, (e) => {
                if (e) {
                    if (e.code === 'EEXIST') {
                        console.error(`  Directory (${directory}) already exists\n`)
                        execute()
                    } else {
                        console.error(`  Directory Creation Error:`, e.message)
                    }
                    return
                }
                console.log(`  Output directory (${directory}) created\n`)
                execute() 
            })
        }

        switch (outputMode) {
            /////////////////////////////////////////////////////////////////////////
            case "output":
                createDirectory(outputFolderName)
            break
            /////////////////////////////////////////////////////////////////////////
            case "backup":
                createDirectory(backupFolderName)
            break
            /////////////////////////////////////////////////////////////////////////
            case "direct":
                execute() 
            break
            /////////////////////////////////////////////////////////////////////////
            default:
                // exists for safety
                console.log("Invalid output mode")
            break
        }
    })
}

// Horribly named.
// Recieves all files and handles passing them to the fileHandler 
async function folderWork(target, data) {
    const files =  await data.filter(file => file.endsWith('png') || file.endsWith('jpeg') || file.endsWith('jpg') || file.endsWith('webp'))

    files.forEach(async (element) => {
        fileHandler(target, element)
    })
}

// Actually uses tinyPNGs systems and generates the output images 
async function fileHandler(target, element) {

    // this is used in the output's filepath
    let outputPath
    switch (outputMode) {
        /////////////////////////////////////////////////////////////////////////
        case "output":
            outputPath = `/${outputFolderName}`
        break
        /////////////////////////////////////////////////////////////////////////
        case "backup":
            outputPath = `/..`
        break
        /////////////////////////////////////////////////////////////////////////
        case "direct":
            outputPath = ""
        break
        /////////////////////////////////////////////////////////////////////////
        default:
            // exists for safety
            console.log("Invalid output mode")
        break
    }

    // moving files to the buckup folder (if thats the mode)
    if (outputMode == "backup") {
        await rename(`${target}/${element}`, `${target}/${backupFolderName}/${element}`)
        target = `${target}/${backupFolderName}`
    }

    var imageFilePath = `${target}/${element}`
    var startingSize = await getFileSize(imageFilePath)

    try {
        console.log(`  Processing ${imageFilePath}`)
        const originalImageFilePrefix = element.substring(0,element.lastIndexOf('.'))
        
        const source = tinify.fromFile(imageFilePath)
        let convertedExtension = ""

        if (mode.name != "direct") {
            const converted = source.convert({ type: mode.value })
            convertedExtension = await converted.result().extension()
            let newPath = `${target}${outputPath}/${originalImageFilePrefix}.${convertedExtension}`
            await converted.toFile(newPath)
            var newSize = await getFileSize(newPath)
        } else {
            let newPath = `${target}${outputPath}/${element}`
            await source.toFile(newPath)
            var newSize = await getFileSize(newPath)
        }

        // this is way too long but this is already a write-only thing overall really
        console.log(`  ${element} processed. Compression Count: ${tinify.compressionCount}. ${mode.name != "direct" ? "(Output: " + originalImageFilePrefix + "." + convertedExtension + ")" : ""}\n  From ${startingSize[0]} to ${newSize[0]}. ${startingSize[1] - newSize[1] < 0 ? '!! Increased by ' + formatBytes(Math.abs(startingSize[1] - newSize[1])) : 'Reduced by ' + formatBytes(startingSize[1] - newSize[1]) }.\n`)
    } catch (e) {
        console.log(`\n  Failed to process ${imageFilePath}: ${e}`)
    }
}


function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i >= sizes.length) return (bytes / Math.pow(1024, 2)).toFixed(2) + ' MB';
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// index 0 is the formatted size, index 1 is the size in bytes
async function getFileSize(filePath) {
    try {
        const stats = await fs.promises.stat(filePath);
        const humanReadableSize = formatBytes(stats.size);
        return [humanReadableSize, stats.size];
    } catch (err) {
        console.error(`Filesize reader broke`);
        throw err;
    }
}
