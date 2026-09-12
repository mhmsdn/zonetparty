# Deploy ZonetParty MCP on Render

## 1) Put this folder in a GitHub repository
Create a new GitHub repository (for example `zonetparty-mcp`) and upload all files in this folder.

## 2) Create the service
In Render, create a new **Web Service**, connect the GitHub repo, and use:
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: Free (for testing)

`render.yaml` is included for these defaults.

## 3) Confirm the server
After deployment, open:
`https://YOUR-RENDER-SUBDOMAIN.onrender.com/`

It should return:
`ZonetParty MCP server`

Your MCP endpoint is:
`https://YOUR-RENDER-SUBDOMAIN.onrender.com/mcp`

## 4) Connect to ChatGPT
Use ChatGPT Developer Mode / app development flow and add the MCP server using the HTTPS `/mcp` endpoint.

## Important
This v0.4 is a public demo deployment, not production-ready. Before real users:
- add OAuth/authentication
- replace in-memory storage with a production database
- persist consent, blocks, reports and moderation decisions
- add rate limits and abuse prevention
- avoid exposing sensitive profile data in tool output
- add privacy policy and data deletion controls
