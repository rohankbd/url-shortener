# Advanced URL Shortener API


## Project Overview

A scalable URL shortening service with advanced features including:

- Google OAuth Authentication

- Custom URL Shortening

- Comprehensive Analytics Tracking

- Rate Limiting

- Redis Caching


## Features

- 🔐 Secure Google Sign-In Authentication

- 🔗 Custom URL Shortening

- 📊 Detailed Analytics Tracking

- Per-URL Statistics

- Topic-Based Insights

- Geolocation Tracking

- 🚀 High Performance with Redis Caching

- 🐳 Docker Support


## Prerequisites

- Node.js (v18+)

- Docker

- Redis

- Google Developer Account

- MaxMind GeoIP Database


## Documentation

- Postman Documentation: https://documenter.getpostman.com/view/25415099/2sAYX8H1B5

- Swagger Documentation: http://localhost:3000/api-docs


## Quick Start


### 1. Clone Repository

```bash

git  clone  https://github.com/yourusername/url-shortener.git

cd  url-shortener

```


### 2. Configuration

1. Ensure redis-server is set up on your local machine.


2. Create `.env` file:

```

PORT=3000

BASE_URL=http://localhost:3000

DATABASE_URL=./urlshortener.db

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

JWT_SECRET=your_random_secret

REDIS_HOST=localhost

REDIS_PORT=6379

```


### 3. Install Dependencies

```bash

npm  install

```


### 4. Run Application

#### Development Mode

```bash

npm  run  dev

```


#### Production Deployment

```bash

docker-compose  up  --build

```


## API Endpoints


### Authentication

-  `POST /api/auth/google-signin`: Google authentication and registration


### URL Management

-  `POST /api/shorten`: Create short URL

-  `GET /{alias}`: Redirect to original URL


### Analytics

-  `GET /api/analytics/{alias}`: Get URL-specific analytics

-  `GET /api/analytics/topic/{topic}`: Get topic-based analytics

-  `GET /api/analytics/overall`: Get comprehensive user analytics


## Testing

```bash

npm  test

```

## API Testing Guide

This guide provides instructions on how to test the APIs for the application. Follow these steps to ensure that the APIs are functioning as expected.

### Prerequisites

- Ensure the project is set up locally, or access the deployed version.
- Install Postman or any other API testing tool to send requests.

### Testing Google OAuth

#### 1. Setting Up Google OAuth Playground

- Navigate to the [Google OAuth Playground](https://developers.google.com/oauthplayground).
- Click on the settings icon to enter your `OAuth Client ID` and `OAuth Client Secret`.
- Under the "Select the Scope" section, input the following scopes:
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
  - `openid`
- Click "Authorize APIs" and complete the authentication steps.

#### 2. Obtaining Tokens

- After authorization, you will be redirected to a screen to exchange authorization codes for tokens.
- Click on the "Exchange authorization code for tokens" button to obtain your `Access Token` and `ID Token`.

#### 3. Testing API Authentication

- Use the `ID Token` obtained from the OAuth Playground as the bearer token.
- Make a POST request to `http://localhost:3000/api/auth/google-signin` with the `ID Token` included in the headers:
  ```plaintext
  Authorization: Bearer YOUR_ID_TOKEN_HERE
  ```
- This should authenticate the user and set a session cookie. Check the response for confirmation.

### Testing URL Shortening

#### 1. Shorten a URL

- Ensure you are authenticated and have the session cookie set by the previous steps.
- Send a POST request to `http://localhost:3000/api/shorten` with the following JSON body:
  ```json
  {
    "url": "https://example.com"
  }
  ```
- The response should include a shortened URL.

#### 2. Accessing the Shortened URL

- Use the shortened URL provided in the response of the previous step.
- Send a GET request to `http://localhost:3000/YOUR_SHORT_URL`
- It should redirect you to the original URL.

### Additional Tips

- Ensure all environment variables and configurations are set before testing.
- Use environment-specific base URLs for local and production testing.

## Troubleshooting

- If you encounter authentication errors, verify the correctness of your ID Token and ensure it hasn't expired.
- For issues with URL shortening, check the server logs for any error messages that might indicate what went wrong.

  

## Security Features

- JWT-based authentication

- Google OAuth integration

- Rate limiting

- URL validation

- Geolocation tracking

  

## Performance Optimizations

- Redis caching

- Efficient database queries

- Minimal dependency footprint

  

## Scalability Considerations

- Modular architecture

- Dockerized deployment

- Microservices-ready design

  

## Monitoring & Logging

- Comprehensive error handling

- Performance logging

- Detailed analytics tracking

  

## Contributing

1. Fork repository

2. Create feature branch

3. Commit changes

4. Push to branch

5. Create Pull Request


## Challenges and Solutions

### Challenge 1: Handling Environment-Specific Configurations

**Problem:** Initially, our application had hard-coded configurations, which made it difficult to manage different settings across development, testing, and production environments.

**Solution:** I implemented the use of environment variables through the `.env` files with the help of the `dotenv` package. This allowed us to separate sensitive information and environment-specific configurations from our codebase, making it easier to change settings without modifying the code and improving security by keeping sensitive data out of version control.

### Challenge 2: Efficiently Managing User Authentication

**Problem:** Our application required a secure and scalable way to handle user authentication and session management, which became complex as the user base grew.

**Solution:** I integrated Google OAuth for authentication, which simplified the login process for users and offloaded the security concerns to a reliable third-party service. I also used JSON Web Tokens (JWT) for maintaining user sessions, which provided a stateless and scalable method to manage user states across our distributed system.

### Challenge 3: Optimizing Application Performance

**Problem:** As the application scaled, I noticed a decline in performance, particularly in how quickly the server responded to requests due to heavy database queries.

**Solution:** I implemented several optimizations:
- **Database Indexing:** I added indexes to frequently queried database columns, significantly reducing query times.
- **Caching:** I introduced caching for commonly requested data using Redis, which decreased the load on our database and improved response times.

These solutions collectively enhanced the performance and scalability of our application, ensuring a smoother user experience even as traffic increased.


## License
MIT License