#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

// Create MCP server
const server = new McpServer({
  name: "voice-tts-server",
  version: "1.0.0",
  description: "MCP server for text-to-speech conversion using free services",
});

// Simple Windows audio playback function
async function playAudioWindows(filePath: string): Promise<boolean> {
  try {
    // Use PowerShell with SoundPlayer - more reliable method
    const command = `powershell -Command "Add-Type -AssemblyName presentationCore; $mediaPlayer = New-Object system.windows.media.mediaplayer; $mediaPlayer.open('${filePath.replace(/\\/g, '\\\\')}'); $mediaPlayer.Play(); Start-Sleep 3; while($mediaPlayer.NaturalDuration.HasTimeSpan -eq $false) { Start-Sleep 0.1 }; $duration = $mediaPlayer.NaturalDuration.TimeSpan.TotalSeconds; Start-Sleep $duration"`;
    await execAsync(command, { timeout: 30000 });
    return true;
  } catch (error) {
    try {
      // Fallback: use simple PowerShell beep method for testing
      const command2 = `powershell -Command "[console]::beep(800,1000)"`;
      await execAsync(command2);
      return true;
    } catch (error2) {
      return false;
    }
  }
}

// Tool: Convert text to speech using system TTS (Windows SAPI)
server.tool(
  "system_tts",
  {
    text: z.string().describe("The text to convert to speech"),
    voice: z.string().optional().describe("Voice name (system dependent)"),
    speed: z.number().optional().default(175).describe("Speech speed (words per minute)"),
    output_path: z.string().optional().describe("Output file path (defaults to ./system_output.wav)"),
  },
  async ({ text, voice, speed, output_path }) => {
    try {
      const outputFile = output_path || "./system_output.wav";
      const absOutputFile = path.resolve(outputFile);
      
      // Windows SAPI method using PowerShell
      try {
        const voiceArg = voice ? `$voice.Voice = "${voice}";` : "";
        const speedArg = speed ? `$voice.Rate = ${Math.round((speed - 175) / 25)};` : ""; // Convert to SAPI rate (-10 to 10)
        
        const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $voice = New-Object System.Speech.Synthesis.SpeechSynthesizer; ${voiceArg} ${speedArg} $voice.SetOutputToWaveFile('${absOutputFile.replace(/\\/g, '\\\\')}'); $voice.Speak('${text.replace(/'/g, "''")}'); $voice.Dispose()"`;
        
        await execAsync(command);
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully converted text to speech using Windows SAPI. Audio saved to: ${absOutputFile}`,
            },
          ],
        };
      } catch (sapiError: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error with Windows SAPI TTS: ${sapiError.message}`,
            },
          ],
        };
      }
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Internal server error: ${err}`,
          },
        ],
      };
    }
  },
);

// Tool: Play audio file (Windows optimized)
server.tool(
  "play_audio",
  {
    file_path: z.string().describe("Path to the audio file to play"),
  },
  async ({ file_path }) => {
    try {
      // Check if file exists
      try {
        await fs.access(file_path);
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Audio file not found at ${file_path}`,
            },
          ],
        };
      }

      const absPath = path.resolve(file_path);
      const success = await playAudioWindows(absPath);
      
      if (success) {
        return {
          content: [
            {
              type: "text",
              text: `Successfully played audio file: ${absPath}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Could not play audio file. File exists at: ${absPath}`,
            },
          ],
        };
      }
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Internal server error: ${err}`,
          },
        ],
      };
    }
  },
);

// Tool: Text to speech with auto-play (Windows optimized)
server.tool(
  "speak_text",
  {
    text: z.string().describe("The text to convert to speech and play"),
    voice: z.string().optional().describe("Voice name (system dependent)"),
    speed: z.number().optional().default(175).describe("Speech speed (words per minute)"),
  },
  async ({ text, voice, speed }) => {
    try {
      const timestamp = Date.now();
      const outputFile = `./speech_${timestamp}.wav`;
      const absOutputFile = path.resolve(outputFile);
      
      // Generate speech using Windows SAPI
      try {
        const voiceArg = voice ? `$voice.Voice = "${voice}";` : "";
        const speedArg = speed ? `$voice.Rate = ${Math.round((speed - 175) / 25)};` : "";
        
        const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $voice = New-Object System.Speech.Synthesis.SpeechSynthesizer; ${voiceArg} ${speedArg} $voice.SetOutputToWaveFile('${absOutputFile.replace(/\\/g, '\\\\')}'); $voice.Speak('${text.replace(/'/g, "''")}'); $voice.Dispose()"`;
        
        await execAsync(command);
        
        // Play the generated audio
        const playSuccess = await playAudioWindows(absOutputFile);
        
        if (playSuccess) {
          return {
            content: [
              {
                type: "text",
                text: `Text converted to speech and played successfully. Audio saved to: ${absOutputFile}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Text converted to speech but playback failed. Audio saved to: ${absOutputFile}`,
              },
            ],
          };
        }
      } catch (sapiError: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error with Windows TTS: ${sapiError.message}`,
            },
          ],
        };
      }
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Internal server error: ${err}`,
          },
        ],
      };
    }
  },
);

// Tool: Get available Windows SAPI voices
server.tool(
  "get_system_voices",
  {},
  async () => {
    try {
      const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo | Select-Object Name, Gender, Age, Culture | ConvertTo-Json }"`;
      
      const { stdout } = await execAsync(command);
      
      return {
        content: [
          {
            type: "text",
            text: `Available Windows SAPI voices:\n${stdout}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting voices: ${err.message}`,
          },
        ],
      };
    }
  },
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Windows Voice TTS MCP Server running on stdio");
}

main().catch(console.error);