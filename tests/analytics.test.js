import request from "supertest";
import app from "../src/app.js";

describe("Analytics Endpoints", () => {
  let authToken;
  let shortUrl;

  beforeAll(async () => {
    // Authenticate and create short URL
    const authResponse = await request(app)
      .post("/api/auth/google-signin")
      .send({
        credential: "mock-google-token",
      });

    authToken = authResponse.body.token;

    const urlResponse = await request(app)
      .post("/api/url/shorten")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        longUrl: "https://example.com/analytics-test",
        topic: "test",
      });

    shortUrl = urlResponse.body.shortUrl;
  });

  it("should retrieve URL analytics", async () => {
    const alias = shortUrl.split("/").pop();
    const response = await request(app)
      .get(`/api/analytics/${alias}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.totalClicks).toBeDefined();
  });

  it("should retrieve overall analytics", async () => {
    const response = await request(app)
      .get("/api/analytics/overall")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.totalUrls).toBeDefined();
  });
});
