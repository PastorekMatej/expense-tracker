import express, { type Express, type Request, type Response } from "express";

const MOCK_CODE = "mock-code";
const MOCK_ACCESS_TOKEN = "mock-access-token";
const MOCK_JWT = "mock-session-jwt";

function renderHtmlPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#eef2ff; color:#111827;}
      body { display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0;}
      .card { background:white; padding:2.5rem 2rem; border-radius:1rem; box-shadow:0 24px 48px rgba(79,70,229,0.15); max-width:28rem; text-align:center;}
      h1 { margin-bottom:1rem; font-size:1.75rem; color:#4338ca;}
      p { margin-bottom:1.5rem; color:#4b5563;}
      a.button { display:inline-block; padding:0.75rem 1.5rem; background:#4f46e5; border-radius:0.75rem; color:white; text-decoration:none; font-weight:600;}
      a.button:hover { background:#4338ca;}
    </style>
  </head>
  <body>
    <div class="card">
      ${body}
    </div>
  </body>
</html>`;
}

function requireQueryParam(req: Request, key: string): string {
  const value = req.query[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  throw new Error(`Missing "${key}" query parameter`);
}

function startPortalRoutes(app: Express) {
  app.get("/app-auth", (req, res) => {
    let redirectUri: string;
    let state: string;
    try {
      redirectUri = requireQueryParam(req, "redirectUri");
      state = requireQueryParam(req, "state");
    } catch (error) {
      res
        .status(400)
        .send(
          renderHtmlPage(
            "Mock OAuth Error",
            `<h1>Mock OAuth</h1><p>${(error as Error).message}</p>`
          )
        );
      return;
    }

    const authorizeUrl = new URL("/authorize", `http://${req.headers.host}`);
    authorizeUrl.searchParams.set("redirectUri", redirectUri);
    authorizeUrl.searchParams.set("state", state);

    res.send(
      renderHtmlPage(
        "Mock OAuth",
        `<h1>Mock OAuth Portal</h1>
         <p>Authorize mock user access for <strong>${redirectUri}</strong>.</p>
         <a class="button" href="${authorizeUrl.toString()}">Authorize</a>`
      )
    );
  });

  app.get("/authorize", (req, res) => {
    const redirectUri = req.query.redirectUri;
    const state = req.query.state;
    if (typeof redirectUri !== "string" || typeof state !== "string") {
      res
        .status(400)
        .send(
          renderHtmlPage(
            "Mock OAuth Error",
            "<h1>Mock OAuth</h1><p>redirectUri and state are required.</p>"
          )
        );
      return;
    }

    const target = new URL(redirectUri);
    target.searchParams.set("code", MOCK_CODE);
    target.searchParams.set("state", state);
    res.redirect(target.toString());
  });
}

function startApiRoutes(app: Express) {
  app.post(
    "/webdev.v1.WebDevAuthPublicService/ExchangeToken",
    (req: Request, res: Response) => {
      const { code } = req.body ?? {};
      if (code !== MOCK_CODE) {
        res.status(400).json({ error: "invalid authorization code" });
        return;
      }

      res.json({
        accessToken: MOCK_ACCESS_TOKEN,
        tokenType: "Bearer",
        expiresIn: 3600,
        scope: "profile",
        idToken: "mock-id-token",
        refreshToken: "mock-refresh-token",
      });
    }
  );

  app.post(
    "/webdev.v1.WebDevAuthPublicService/GetUserInfo",
    (_req: Request, res: Response) => {
      res.json({
        openId: "mock-user-open-id",
        projectId: "mock-project",
        name: "Mock User",
        email: "mock.user@example.com",
        platform: "email",
        loginMethod: "email",
      });
    }
  );

  app.post(
    "/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt",
    (_req: Request, res: Response) => {
      res.json({
        openId: "mock-user-open-id",
        projectId: "mock-project",
        name: "Mock User",
        email: "mock.user@example.com",
        platform: "email",
        loginMethod: "email",
      });
    }
  );
}

export async function startMockOAuthServer(): Promise<Express> {
  const port = Number(process.env.MOCK_OAUTH_PORT ?? "4000");
  const app = express();
  app.use(express.json());

  startPortalRoutes(app);
  startApiRoutes(app);
  app.get("/", (_req, res) => {
    res.redirect("/app-auth");
  });

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`[Mock OAuth] Server running on http://localhost:${port}`);
      resolve();
    });
  });

  return app;
}

