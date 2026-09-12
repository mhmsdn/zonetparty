# ZonetParty MCP connection

The current OpenAI Apps quickstart uses an MCP server with an optional UI resource rendered inside ChatGPT. The server endpoint is `/mcp`.

## Local test
1. `npm install`
2. `npm start`
3. Test `http://localhost:8787/mcp` with MCP Inspector.
4. For ChatGPT Developer Mode, expose port 8787 through HTTPS (for example with ngrok) and use the resulting `https://.../mcp` URL.

The production app still needs:
- real authentication/OAuth
- production database
- persistent user consent records
- age/eligibility and safety controls
- moderation/reporting
- rate limiting and audit logs
- production hosting with HTTPS
- review/submission metadata

Do not put secrets or sensitive personal data in model-visible structured content.
