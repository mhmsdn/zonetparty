import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

const PORT = Number(process.env.PORT || 8787);
const MCP_PATH = "/mcp";

// Load the widget relative to this server.js file
const widgetHtml = readFileSync(
  new URL("./mcp-widget.html", import.meta.url),
  "utf8"
);

const profiles = new Map([
  ["demo_ali", {
    user_id: "demo_ali",
    display_name: "Ali",
    age: 26,
    interests: ["architecture", "gaming", "movies"],
    communication_style: ["direct", "humorous"],
    values: ["loyalty", "growth"],
    goals: ["friendship", "gaming"],
    availability: ["evening", "weekend"],
    games: [{
      game_id: "valorant",
      platform: "pc",
      region: "EU",
      rank: "Diamond",
      voice: true,
      style: "competitive",
      schedule: ["evening", "weekend"]
    }]
  }],

  ["demo_sam", {
    user_id: "demo_sam",
    display_name: "Sam",
    age: 25,
    interests: ["gaming", "movies", "music"],
    communication_style: ["direct", "humorous"],
    values: ["loyalty", "growth"],
    goals: ["friendship", "gaming"],
    availability: ["evening", "weekend"],
    games: [{
      game_id: "valorant",
      platform: "pc",
      region: "EU",
      rank: "Diamond",
      voice: true,
      style: "competitive",
      schedule: ["evening", "weekend"]
    }]
  }]
]);

const requests = new Map();
const blocks = new Set();

const overlap = (a = [], b = []) => {
  const A = new Set(a.map(x => String(x).toLowerCase()));
  const B = new Set(b.map(x => String(x).toLowerCase()));

  if (!A.size || !B.size) return 0;

  let n = 0;

  for (const x of A) {
    if (B.has(x)) n++;
  }

  return n / (new Set([...A, ...B]).size || 1);
};

function compatibility(a, b, zone) {
  const commonGames = (a.games || []).filter(x =>
    (b.games || []).some(y => y.game_id === x.game_id)
  );

  const gameScore = commonGames.length ? 0.9 : 0;

  const values = {
    interests: overlap(a.interests, b.interests),
    communication_style: overlap(
      a.communication_style,
      b.communication_style
    ),
    values: overlap(a.values, b.values),
    goals: overlap(a.goals, b.goals),
    availability: overlap(a.availability, b.availability),
    games: gameScore,
    age: Math.max(0, 1 - Math.abs(a.age - b.age) / 15)
  };

  const zoneWeights = {
    date: {
      interests: 0.15,
      communication_style: 0.20,
      values: 0.25,
      goals: 0.20,
      availability: 0.10,
      age: 0.10
    },

    friend: {
      interests: 0.30,
      communication_style: 0.25,
      values: 0.15,
      goals: 0.10,
      availability: 0.20
    },

    game: {
      games: 0.45,
      communication_style: 0.10,
      availability: 0.20,
      interests: 0.10,
      age: 0.05
    },

    study: {
      goals: 0.30,
      availability: 0.25,
      interests: 0.20,
      communication_style: 0.10,
      values: 0.10,
      age: 0.05
    },

    pro: {
      goals: 0.30,
      interests: 0.25,
      communication_style: 0.15,
      values: 0.15,
      availability: 0.10,
      age: 0.05
    },

    create: {
      interests: 0.35,
      goals: 0.25,
      communication_style: 0.15,
      availability: 0.15,
      values: 0.10
    }
  };

  const weights = zoneWeights[zone] || zoneWeights.friend;

  let total = 0;

  for (const [key, value] of Object.entries(weights)) {
    total += value * (values[key] || 0);
  }

  const reasons = [];

  if (values.interests >= 0.35) {
    reasons.push("shared interests");
  }

  if (values.communication_style >= 0.5) {
    reasons.push("similar communication style");
  }

  if (values.values >= 0.4) {
    reasons.push("compatible values");
  }

  if (values.availability >= 0.4) {
    reasons.push("overlapping schedule");
  }

  if (gameScore >= 0.55) {
    reasons.push("strong game compatibility");
  }

  return {
    compatibility: Math.round(total * 100),
    reasons: reasons.slice(0, 4),
    shared_games: commonGames.map(x => x.game_id)
  };
}

function server() {
  const s = new McpServer({
    name: "ZonetParty",
    version: "0.4.0"
  });

  registerAppResource(
    s,
    "zonetparty-ui",
    "ui://widget/zonetparty.html",
    {},
    async () => ({
      contents: [{
        uri: "ui://widget/zonetparty.html",
        mimeType: RESOURCE_MIME_TYPE,
        text: widgetHtml
      }]
    })
  );

  registerAppTool(
    s,
    "search_matches",
    {
      title: "Search ZonetParty matches",
      description:
        "Find compatible people in a selected ZonetParty Zone. Only use profile data the user has explicitly chosen to share.",

      inputSchema: {
        user_id: z.string().min(1),
        zone: z.enum([
          "date",
          "friend",
          "game",
          "study",
          "pro",
          "create"
        ]),
        limit: z.number().int().min(1).max(20).default(10)
      },

      outputSchema: {
        matches: z.array(
          z.object({
            user_id: z.string(),
            display_name: z.string(),
            compatibility: z.number(),
            reasons: z.array(z.string()),
            shared_games: z.array(z.string())
          })
        )
      },

      _meta: {
        ui: {
          resourceUri: "ui://widget/zonetparty.html"
        }
      }
    },

    async ({ user_id, zone, limit }) => {
      const me = profiles.get(user_id);

      if (!me) {
        return {
          content: [{
            type: "text",
            text: "Profile not found."
          }],
          structuredContent: {
            matches: []
          }
        };
      }

      const matches = [...profiles.values()]
        .filter(
          p =>
            p.user_id !== user_id &&
            !blocks.has(`${user_id}:${p.user_id}`)
        )
        .map(p => ({
          user_id: p.user_id,
          display_name: p.display_name,
          ...compatibility(me, p, zone)
        }))
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, limit);

      return {
        content: [{
          type: "text",
          text: `Found ${matches.length} potential matches in ${zone} zone.`
        }],
        structuredContent: {
          matches
        }
      };
    }
  );

  registerAppTool(
    s,
    "create_profile",
    {
      title: "Create or update profile",
      description:
        "Create a ZonetParty profile using only information the user chooses to provide.",

      inputSchema: {
        profile: z.record(z.any())
      },

      _meta: {
        ui: {
          resourceUri: "ui://widget/zonetparty.html"
        }
      }
    },

    async ({ profile }) => {
      if (!profile?.user_id) {
        return {
          content: [{
            type: "text",
            text: "user_id is required."
          }]
        };
      }

      profiles.set(profile.user_id, profile);

      return {
        content: [{
          type: "text",
          text: "ZonetParty profile saved."
        }],
        structuredContent: {
          profile
        }
      };
    }
  );

  registerAppTool(
    s,
    "request_match",
    {
      title: "Request a match",
      description:
        "Send a connection request. Chat/connection should only become active after mutual consent.",

      inputSchema: {
        from_user: z.string(),
        to_user: z.string(),
        zone: z.string()
      },

      _meta: {
        ui: {
          resourceUri: "ui://widget/zonetparty.html"
        }
      }
    },

    async ({ from_user, to_user, zone }) => {
      if (!profiles.has(from_user) || !profiles.has(to_user)) {
        return {
          content: [{
            type: "text",
            text: "Both profiles must exist."
          }]
        };
      }

      if (blocks.has(`${from_user}:${to_user}`)) {
        return {
          content: [{
            type: "text",
            text: "This connection is blocked."
          }]
        };
      }

      requests.set(
        `${from_user}:${to_user}`,
        {
          from_user,
          to_user,
          zone,
          status: "pending"
        }
      );

      return {
        content: [{
          type: "text",
          text:
            "Match request sent. No chat is opened until both sides consent."
        }],
        structuredContent: {
          status: "pending"
        }
      };
    }
  );

  registerAppTool(
    s,
    "list_games",
    {
      title: "List supported games",
      description:
        "Return the current game catalog used by Game Zone.",

      inputSchema: {
        query: z.string().optional()
      },

      _meta: {
        ui: {
          resourceUri: "ui://widget/zonetparty.html"
        }
      }
    },

    async ({ query = "" }) => {
      const games = [
        ["valorant", "Valorant"],
        ["fortnite", "Fortnite"],
        ["minecraft", "Minecraft"],
        ["cs2", "Counter-Strike 2"],
        ["gta_online", "GTA Online"],
        ["roblox", "Roblox"],
        ["apex", "Apex Legends"],
        ["overwatch2", "Overwatch 2"],
        ["rocket_league", "Rocket League"]
      ]
        .filter(g =>
          g[1].toLowerCase().includes(query.toLowerCase())
        )
        .map(([id, name]) => ({
          id,
          name
        }));

      return {
        content: [{
          type: "text",
          text: `${games.length} games found.`
        }],
        structuredContent: {
          games
        }
      };
    }
  );

  return s;
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, {
        "content-type": "text/plain"
      })
      .end("ZonetParty MCP server");

    return;
  }

  if (
    url.pathname === MCP_PATH &&
    ["GET", "POST", "DELETE"].includes(req.method)
  ) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Expose-Headers",
      "Mcp-Session-Id"
    );

    const srv = server();

    const transport =
      new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
      });

    res.on("close", () => {
      transport.close();
      srv.close();
    });

    try {
      await srv.connect(transport);
      await transport.handleRequest(req, res);
    } catch (e) {
      console.error(e);

      if (!res.headersSent) {
        res
          .writeHead(500)
          .end("Internal server error");
      }
    }

    return;
  }

  if (
    req.method === "OPTIONS" &&
    url.pathname === MCP_PATH
  ) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "POST,GET,OPTIONS",
      "Access-Control-Allow-Headers":
        "content-type,mcp-session-id",
      "Access-Control-Expose-Headers":
        "Mcp-Session-Id"
    }).end();

    return;
  }

  res
    .writeHead(404)
    .end("Not Found");
});

// Render requires the server to listen on 0.0.0.0
httpServer.listen(
  PORT,
  "0.0.0.0",
  () =>
    console.log(
      `ZonetParty MCP: http://localhost:${PORT}${MCP_PATH}`
    )
);
