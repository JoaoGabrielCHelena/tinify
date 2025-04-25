# Tinify CLI
Install as a global CLI command with 'npm install -g'.   
Best way to set a [key](https://tinypng.com/developers) is to have it as an enviroment variable named TINIFY_KEY   
   
'tinify --help' returns:

```
TinyPNG CLI

  Using tinyPNG's API with node 

Usage

  $ node tinify.js [command] <argument> 

Commands

  -h, --help                     Displays this help text.                       
                                                                                
  -k, --key Key                  Sets the API key.                              
                                                                                
  -m, --mode Option              Changes the conversion/reduction mode.         
                                 Possible Values: direct, png, webp, smallest.  
                                 For further detail: $ node tinify.js -m -h     
                                                                                
  -o, --output Option            Changes the output mode.                       
                                 Possible Values: backup, output, direct.       
                                 direct is not recommended.                     
                                 For further detail: $ node tinify.js -o -h     
                                                                                
  -f, --folder Path to folder    Processes all files in the folder of the given 
                                 path.                                          
                                                                                
  -s, --single Path to file(s)   Processes the file of the given path.          
                                                                                
  -l, --list                     Lists how options are currently set.           
                                                                                
  -c, --conversions, --count     Shows the amount of monthly conversions made.  
                                                                                
  --reset                        Resets all options to their starting values.   
```
