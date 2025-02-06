import request from "supertest";
import app from "../src/app.js";

describe("URL Shortening Endpoints", () => {
  let authToken;
  let shortUrl;

  beforeAll(async () => {
    // Authenticate and get token
    const authResponse = await request(app)
      .post("/api/auth/google-signin")
      .send({
        credential: "mock-google-token",
      });

    authToken = authResponse.body.token;
  });

  it("should create a short URL", async () => {
    const response = await request(app)
      .post("/api/url/shorten")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        longUrl: "https://example.com/very/long/url",
        topic: "test",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.shortUrl).toBeTruthy();
    shortUrl = response.body.shortUrl;
  });

  it("should redirect short URL", async () => {
    const alias = shortUrl.split("/").pop();
    const response = await request(app).get(`/${alias}`);

    expect(response.statusCode).toBe(302); // Redirect
  });
});
