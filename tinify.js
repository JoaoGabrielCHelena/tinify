const fs = require('fs');
const { exec } = require('child_process');
const tinify = require("tinify");
const path = require('path');
const util = require('util');
const rename = util.promisify(fs.rename);

const outputFolderName = "tinifyOutput"
const backupFolderName = "tinifyOriginalBackup"

///////////////////////
// settings
const key = "unset";
const mode = {name: 'webp', value:['image/webp']};
const outputMode = "output";
///////////////////////
tinify.key = key;


if (process.argv[4]) {
    console.log("Too many arguments");
} else {
    switch (process.argv[2]) {
        case "-h" || "-help":
            console.log("help text");    
        break;
        case "-k" || "-key":
            Rewrite("const key", `${process.argv[3]}`,'Key has been updated.')
        break;
        case "-m" || "-mode":
            modeChange()
        break;
        case "-s" || "-single":
            if (key != "unset") {
                process.argv[3] ? Run(process.argv[3]) : console.log("No file given");
            } else { console.log("API key has not been set.\n-h or -help for help");}
        break;
        case "-o" || "-output":
            if (process.argv[3] == "output" || process.argv[3] == "backup" || process.argv[3] == "direct") {
                Rewrite("const outputMode", `${process.argv[3]}`,'Output Mode has been updated.')
            } else if (process.argv[3] == undefined) {
                console.log("No mode given.\nAvailable modes: output, backup, direct (not recommended)\n-h or -help for help");
            } else {
                console.log("Invalid output mode.\nAvailable modes: output, backup, direct (not recommended)\n-h or -help for help");
            }
        break;
        case "-f" || "-folder":
            if (key != "unset") {
                process.argv[3] ? Run(process.argv[3]) : console.log("No folder given");
            } else { console.log("API key has not been set.\n-h or -help for help");}
        break
        case "-reset":
            Rewrite("const mode", "{name: 'webp', value:['image/webp']}", undefined, true, () => {
                Rewrite("const key", `unset`, undefined, false, () => {
                    Rewrite("const outputMode", "output")
                })
            })
            console.log("Options have been reset");
        break
        case undefined:
            console.log("No command given.\n-h or -help for help");
        break
        default:
            console.log("Invalid command");
        break;
    }
}


function modeChange() {
    let returnMessage = "Mode changed"
    switch (process.argv[3]) {
        case undefined:
            console.log("mode list");
            break
        case "direct":
            Rewrite("const mode",  "{name: 'direct', value:'none'}", returnMessage, true)
            break
        case "png": 
            Rewrite("const mode", "{name: 'png', value:['image/png']}", returnMessage, true)
            break
        case "webp": 
            Rewrite("const mode", "{name: 'webp', value:['image/webp']}", returnMessage, true)
            break
        case "smallest": 
            Rewrite("const mode", "{name: 'none', value:['image/webp','image/png']}", returnMessage, true)
            break
        default:
            console.log("invalid mode");
            break;
    }
}

function Rewrite(alteredValue, newValue, logText, notString, callback) {
    fs.readFile(__filename, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    
    const regex = new RegExp(`${alteredValue} = .*`);
    let modifiedData
    if (notString) {
        modifiedData = data.replace(regex, `${alteredValue} = ${newValue};`);
    } else {
        modifiedData = data.replace(regex, `${alteredValue} = "${newValue}";`);
    }
    
    fs.writeFile(__filename, modifiedData, 'utf8', err => {
        if (err) {
        console.error('Error writing file:', err);
        return;
        }
        if (logText) {
            console.log(logText);
        }
        if (callback) {
            callback();
        }
    });
    });
}

function Run(TargetFolder) {
    if (process.argv[2] == "-s" || process.argv[2] == "-single") {
        var file = path.basename(TargetFolder)
        TargetFolder = path.dirname(TargetFolder)
    }
    fs.readdir(TargetFolder, (error, succes) => {
        if (error) {
            return console.log(error)
        }
        switch (outputMode) {
            /////////////////////////////////////////////////////////////////////////
            case "output":
                fs.mkdir(`${TargetFolder}/${outputFolderName}`, (err) => {
                    if (err) {
                        if (err.code === 'EEXIST') {
                            console.error(`Directory (${outputFolderName}) already exists`);
                            process.argv[2] == "-f" ? folderFileWork(TargetFolder, succes) : fileHandler(TargetFolder, file) 
                        } else {
                            console.error('Error:', err);
                        }
                        return;
                    }
                    console.log(`Output directory (${outputFolderName}) created`);
                    process.argv[2] == "-f" ? folderFileWork(TargetFolder, succes) : fileHandler(TargetFolder, file) 
                });
            break;
            /////////////////////////////////////////////////////////////////////////
            case "backup":
                fs.mkdir(`${TargetFolder}/${backupFolderName}`, (err) => {
                    if (err) {
                        if (err.code === 'EEXIST') {
                            console.error(`Directory (${backupFolderName}) already exists`);
                            process.argv[2] == "-f" ? folderFileWork(TargetFolder, succes) : fileHandler(TargetFolder, file) 
                        } else {
                            console.error('Error:', err);
                        }
                        return;
                    }
                    console.log(`Output directory (${backupFolderName}) created`);
                    process.argv[2] == "-f" ? folderFileWork(TargetFolder, succes) : fileHandler(TargetFolder, file) 
                });
            break;
            case "direct":
                process.argv[2] == "-f" ? folderFileWork(TargetFolder, succes) : fileHandler(TargetFolder, file)
            break
            default:
                console.log("Invalid output mode");
            break;
        }



    })
}

async function folderFileWork(TargetFolder, data) {
    const files =  await data.filter(file => file.endsWith('png') || file.endsWith('jpeg') || file.endsWith('jpg') || file.endsWith('webp'))

    if (outputMode == "backup") {
        try {
            // Moving all files asynchronously
            await Promise.all(files.map(async (fileName) => {
                const sourcePath = `${TargetFolder}/${fileName}`;
                const destinationPath = `${TargetFolder}/${backupFolderName}/${fileName}`;
                await rename(sourcePath, destinationPath);
            }));
            
            console.log(`All moved to backup folder (${backupFolderName})`);
            TargetFolder = `${TargetFolder}/${backupFolderName}`

            files.forEach(async (element) => {
                fileHandler(TargetFolder, element)
            })
        } catch (error) {
            console.error('Error moving files:', error);
        }
    } else {
        files.forEach(async (element) => {
            fileHandler(TargetFolder, element)
        })
    }
}

async function fileHandler(TargetFolder, element) {
    let outputPath
    switch (outputMode) {
        /////////////////////////////////////////////////////////////////////////
        case "output":
            outputPath = `/${outputFolderName}`
        break;
        /////////////////////////////////////////////////////////////////////////
        case "backup":
            outputPath = `/..`
        break;
        case "direct":
            outputPath = ""
        break
        default:
            console.log("Invalid output mode");
        break;
    }

    if ((process.argv[2] == "-s" || process.argv[2] == "-single") && outputMode == "backup") {
        await rename(`${TargetFolder}/${element}`, `${TargetFolder}/${outputFolderName}/${element}`);
        TargetFolder = `${TargetFolder}/${outputFolderName}`
    }


    var imageFilePath = `${TargetFolder}/${element}`
    try {
        console.log(`Processing ${imageFilePath}`);
        const originalImageFilePrefix = element.substring(
          0,
          element.lastIndexOf('.')
        );
    
        const source = tinify.fromFile(imageFilePath);
        if (mode.name != "direct") {
            const converted = source.convert({ type: mode.value });
            const convertedExtension = await converted.result().extension();
            await converted.toFile(`${TargetFolder}${outputPath}/${originalImageFilePrefix}.${convertedExtension}`);
        } else {
            await source.toFile(`${TargetFolder}${outputPath}/${element}`);
        }
        console.log(`${element} processed. Compression Count: ${tinify.compressionCount} `);
      } catch (e) {
        console.log(`\nFailed to process ${imageFilePath}`);
      }
    
    }