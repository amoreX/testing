# 1. Clone this repo
# 2. Deatails about each file :
### - index.ts -> File for supabase user management system , has my Credentials hardcoded for now  
### - voice.ts -> MCP that allows claude to send text as parametere and it speaks it out loud 
### - calendar.ts -> MCP that allows communication with Google Calendar , currently only has 2 to 3 functions
## Procedure to use with Claude desktop :

- Turn on developer mode in Claude desktop
- Go to claude desktop config .json and copy paste claude_desktop_config.json from this repo into that , be sure to change the file locations according to your device
- Advised to once run all the files one by one e.g. npx tsx index.ts or npx tsx calendar.ts , as thats how claude will try to run them , so best to try khudse ek bar and see if any errors or shit
- Mainly 3 files only : calendar.ts , index.ts and voice.ts
- once pasted into claude_desktop_config , restart claude desktop and u should be able to go to claude dekstop settings and see the available tools , if errors check logs and put in gpt
- Claude runs all the files by itself so you dont need to specifically run each one , claude looks at its config_dekstop thingy and runs them with the specified arguements one by one by itself.
  ### IMPORTANT: IF ERRORS OR DK WHAT DOING CHECK HARKIRAT KA MCP WALA VIDEO , JUST CHECK MCP INTEGRATION KA PART ITS BARELY 7 MINS BUT VERY HELPFUL 
### ONLY ABOVE MENTIONED FILES WORJ AS OF NOW , VOICE PLAYBACK FUNC WORKS BUT VOICE RECORDING NOT YET SO IGNORE THAT FUNC IN CONFIG.JSON, IT GIVES NO ERRORS BUT DOESNT WORK AS WELL.

## Procedure to use with mcphost:
- Use the config.json file as --config file for mcphost , just again make sure to change the file location in config file to your location .

### IMPORTANT: Don't need to change any env variables , as its just for testing you can use my credentials , fine only.
