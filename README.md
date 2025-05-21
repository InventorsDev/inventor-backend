<p  align="center">

<a  href="http://nestjs.com/"  target="blank"><img  src="https://nestjs.com/img/logo-small.svg"  width="200"  alt="Nest Logo" /></a>

</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p  align="center">A progressive <a  href="http://nodejs.org"  target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

<p  align="center">

<a  href="https://www.npmjs.com/~nestjscore"  target="_blank"><img  src="https://img.shields.io/npm/v/@nestjs/core.svg"  alt="NPM Version" /></a>

<a  href="https://www.npmjs.com/~nestjscore"  target="_blank"><img  src="https://img.shields.io/npm/l/@nestjs/core.svg"  alt="Package License" /></a>

<a  href="https://www.npmjs.com/~nestjscore"  target="_blank"><img  src="https://img.shields.io/npm/dm/@nestjs/common.svg"  alt="NPM Downloads" /></a>

<a  href="https://circleci.com/gh/nestjs/nest"  target="_blank"><img  src="https://img.shields.io/circleci/build/github/nestjs/nest/master"  alt="CircleCI" /></a>

<a  href="https://coveralls.io/github/nestjs/nest?branch=master"  target="_blank"><img  src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9"  alt="Coverage" /></a>

<a  href="https://discord.gg/G7Qnnhy"  target="_blank"><img  src="https://img.shields.io/badge/discord-online-brightgreen.svg"  alt="Discord"/></a>

<a  href="https://opencollective.com/nest#backer"  target="_blank"><img  src="https://opencollective.com/nest/backers/badge.svg"  alt="Backers on Open Collective" /></a>

<a  href="https://opencollective.com/nest#sponsor"  target="_blank"><img  src="https://opencollective.com/nest/sponsors/badge.svg"  alt="Sponsors on Open Collective" /></a>

<a  href="https://paypal.me/kamilmysliwiec"  target="_blank"><img  src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>

<a  href="https://opencollective.com/nest#sponsor"  target="_blank"><img  src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg"  alt="Support us"></a>

<a  href="https://twitter.com/nestframework"  target="_blank"><img  src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>

</p>

<!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)

[![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Setup the app

Setting up the project on your window/mac system involves various steps that will be discussed in the section

#### Clone The Project Repository

1. Click on this link to clone the projects from the GitHub repo ([https://github.com/InventorsDev/inventor-backend](https://github.com/InventorsDev/inventor-backend))

Once you have cloned the project on your system, you will have your copy of the project on your system.

2. Open the project on your code editor.

#### Setup Your Environment Variables

For the application to function properly when running it, you need to setup some necessary Environment Variables in your `.env` file

1. Create a file `.env` in your project root folder.
2. Copy the Environment Variables from your `.env.sample` to your newly created `.env`

```
NODE_ENV=development

PORT=3888

APP_DATABASE_URL=mongodb://localhost:27017/inventor_app?retryWrites=true&w=majority

LOG_DATABASE_URL=mongodb://localhost:27017/inventor_log?retryWrites=true&w=majority

JWT_SECRET=

JWT_EXPIRES=1h

RATE_LIMIT_REQUEST_SIZE=60

RATE_LIMIT_TTL=30
```

3. Create a Cloudinary account with this [link](https://cloudinary.com/users/register_free)
4. Navigate to your dashboard in your Cloudinary account and copy the following Environment Variables.

```
//Cloudinary Environment Variables

CLOUDINARY_NAME=[Enter your Cloudinary name here]

CLOUDINARY_KEY=[Enter your Cloudinary key here]

CLOUDINARY_SECRET= [Enter your Cloudinary secret here]
```

Once you have copied your unique Environment Variables, paste them into your `.env` file as shown in the code above.

## Installation

```bash

$  npm  install

```

## Running the app

```bash

# development

$  nest  start  --watch

# production mode

$  npm  run  start:prod

```

Once the application is running, your terminal should display a message similar to:

```
Inventor application is running on: http://[::1]:3888
```

Here, `3888` is the port number on which the application is running. This port number depends on the value you specify in your `.env` file under the `PORT` variable:

```
PORT=[YOUR_PORT_NUMBER]
```

To access the Swagger documentation for the API endpoints, open your web browser and navigate to the following URL, replacing `3888` with your specified port number:

```
http://[::1]:[YOUR_PORT_NUMBER]/docs/api
```

This URL will take you to the Swagger interface, where you can explore and interact with the API endpoints.

## Using the Provided Endpoints in Swagger Documentation

This guide will walk developers through the process of using the provided endpoints in the Swagger documentation. Follow the steps below to ensure you can successfully interact with the APIs.

## Prerequisites

- Ensure that your development environment is set up and that you have access to the Swagger documentation for the API.

## Steps to Use the Provided Endpoints

### 1. Register a New User

The first step is to register a new user. This is required to create an account that can be used for authentication.

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**

````
```json
{
"email": "string",
"password": "string",
"firstName": "string",
"lastName": "string",
"joinMethod": "SIGN_UP",
"location": {
  "type": "Point",
  "coordinates": [
    "longitude",
    "latitude"
  ]
},
"deviceId": "string",
"deviceToken": "string"
}
````

### 2. Verify the User

To verify the user using the Swagger documentation, you'll need to provide the **userId** (the `_id given to you in the response after registering`) and the **token** (the` emailVerificationCode` given to you in the response after registering). These inputs are fields in the Swagger interface.

**Endpoint:** `POST /api/v1/auth/{userId}/verify/{token}/email`

**Request Body:**

```

```

### 3. Log In

Once the user is verified, you can log in to obtain an authentication token.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**

```
{
  "email": "string",
  "password": "string"
}
```

**Response:** The response will contain an authentication token, which you will use for authenticated requests.

```
{
"access_token": "your_auth_token",
"_id": "your_userId",
"email": "your_email_address",
"firstName": "your_firstname",
"lastName": "your_lastname",
"role": [ "USER" ]
}
```

### 4. Add the Auth Token to Swagger

To interact with the secured endpoints in the Swagger documentation, you need to add the obtained authentication token.

1.  Open the Swagger documentation for your API.
2.  Click on the **Authorize** button (usually a padlock icon) at the top of the page.
3.  In the popup that appears, enter your authentication token in the appropriate field. The format usually is:

```
Bearer your_auth_token
```

4.  Click **Authorize** to apply the token.

With the authentication token added, you can now interact with the secured endpoints in the Swagger documentation. The token will be included in the `Authorization` header of your requests.

Ensure you replace placeholder values (e.g., `your_firstname`,`your_lastname`, `your_password`, `your_email_address`, `your_userId`,`your_verification_code`, `your_auth_token`) with actual data as per your API setup.

## Test

```bash

# unit tests

$  npm  run  test



# e2e tests

$  npm  run  test:e2e



# test coverage

$  npm  run  test:cov

```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)

- Website - [https://nestjs.com](https://nestjs.com/)

- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

