# User API Spec

## Register User
Endpoint: POST /api/users

Request Body:
```json
{
  "username": "khannedy",
  "passowrd": "rahasia",
  "name": "Eko Khannedy"
}
```

Response Body (success):
```json
{
  "data": {
    "username": "khannedy"
    "name": "Eko Khannedy"
  }
}
```
Response Body (failed):
```json
{
  "errors": "Username already registered"
}
```

## Login User
Endpoint: POST /api/users/login

Request Body:
```json
{
  "username": "khannedy",
  "passowrd": "rahasia"
}
```

Response Body (success):
```json
{
  "data": {
    "username": "khannedy",
    "name": "Eko Khannedy",
    "token": "session_id_generated"
  }
}
```
Response Body (failed):
```json
{
  "errors": "Username or password is wrong"
}
```

## Get User
Endpoint: GET /api/users/current

Headers:
- authorization : token

Response Body (success):
```json
{
  "data": {
    "username": "khannedy",
    "name": "Eko Khannedy"
  }
}
```
Response Body (failed):
```json
{
  "errors": "Unauthorized"
}
```

## Update User
Endpoint: PATCH /api/users/current

Headers:
- authorization : token

Request Body:
```json
{
  "passowrd": "rahasia", // Optional
  "name": "Eko Khannedy" // Optional
}
```

Response Body (success):
```json
{
  "data": {
    "username": "khannedy",
    "name": "Eko Khannedy"
  }
}
```
Response Body (failed):
```json
{
  "errors": "Update user failed"
}
```

## Logout User
Endpoint: DELETE /api/users/current

Headers:
- authorization : token

Response Body (success):
```json
{
  "data": true
}