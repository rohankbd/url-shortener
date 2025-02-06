import request from "supertest";
import app from "../src/app.js";

describe("Authentication Endpoints", () => {
  let authToken;

  beforeAll(async () => {
    // Mock Google Sign-In for registration
    const response = await request(app).post("/api/auth/google-signin").send({
      credential: "mock-google-token-new-user",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeTruthy();
    expect(response.body.message).toContain("registration successful");
    authToken = response.body.token;
  });

  it("should authenticate an existing user with Google Sign-In", async () => {
    // Mock Google Sign-In for existing user
    const response = await request(app).post("/api/auth/google-signin").send({
      credential: "mock-google-token-existing-user",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeTruthy();
    expect(response.body.message).toContain("Login successful");
    authToken = response.body.token;
  });

  it("should reject invalid Google token", async () => {
    const response = await request(app).post("/api/auth/google-signin").send({
      credential: "invalid-token",
    });

    expect(response.statusCode).toBe(401);
  });
});