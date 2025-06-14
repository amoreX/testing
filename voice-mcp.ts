#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";
import { spawn } from "child_process";

const server = new McpServer({
  name: "voice-recorder",
  version: "1.0.0",
  description: "MCP server for voice recording and transcription using Whisper (Python backend)",
});

// Tool: record voice and transcribe
server.tool(
  "record_voice",
  {
    // No inputs needed
  },
  async () => {
    try {
      const transcription = await runPythonRecorder();
      return {
        content: [
          {
            type: "text",
            text: transcription,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Voice recording failed: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Function to call the Python script and capture stdout
async function runPythonRecorder(): Promise<string> {
  return new Promise((resolve, reject) => {
    const subprocess = spawn("python3", ["record_with_whisper.py"]);

    let output = "";
    let errorOutput = "";

    subprocess.stdout.on("data", (data) => {
      output += data.toString();
    });

    subprocess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    subprocess.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python exited with code ${code}. stderr: ${errorOutput}`));
      }
    });
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🎙️ Voice MCP server running...");
}

main().catch(console.error);
