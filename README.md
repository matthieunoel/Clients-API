# Installation

```sh
npm i -g yarn
npm i -g nodemon
sudo yarn install
```

Then, edit "./src/app.ts", put you're ip address and set the config you want.

Finally, in function of the plateform you're using,

```sh
yarn start-wnd
yarn start-linux
```

# Auhtentication

You can configure the anthentication in "./authentication.json". The file should looks like this :

```json
{
  "authentication": true,
  "tokenDuration": 60,
  "loginList": [
    {
      "login": "mnoel",
      "password": "mdp",
      "authLevel": 0
    }
  ]
}
```

- "authentication" indicates if the API needs and anthentication system or not.
- "tokenDuration" indicates the time of validity of a token (in minutes)
- "loginList" is the list of every logins of the API. In this object you can find the login, the password and the authentication level ("authLevel"). The lower the number is, the higher its permissions are. 0 are for admins and 10 for basic users.

# Request list :

- GET : "/" : Give you info about the server.
  The response looks like :

  ```json
  {
    "name": "APINAME",
    "version": "1.0.0"
  }
  ```

- GET: "/getToken" (Params: login(string), password(string)): Give you a 60 minutes token.
  The response looks like :

  ```json
  {
    "status": "OK",
    "performanceMs": 15.70270100235939,
    "token": "5a3e9a10-3bdf-11eb-aef5-0b1bf8ec358c"
  }
  ```

- GET: "/getClients" (Params: token(string), id(?number), guid(?string), first(?string), last(?string), street(?string), city(?string), zip(?number)): Permit to get a list of the clients in functions of the parameters.
  The response looks like :

  ```json
  {
      "status": "OK",
      "performanceMs": 141.21329998970032,
      "responseSize": 1030,
      "response": [
          {
              "id": 1,
              "guid": "a6f56a46-b913-5519-9466-ea7c03ff21c7",
              "first": "Eugene",
              "last": "Love",
              "street": "Diere Lane",
              "city": "Ivsekeg",
              "zip": 54650
          },
          ...
      ]
  }
  ```

- GET: "/getLogs" (Params: token(string), all(?boolean), guestId(?number), uuid(?string), dateStart(?string), dateEnd(?string)) : Permit to check logs, these parameters are options. "all" permit to see all logs, not only this month. guestId, uuid, dateStart, dateEnd are filters. dateStart and dateEnd have to be this way : "YYYY-MM-DDThh:mm:ss", for example, "2020-03-24T11:15:00".
  The response looks like :

  ```
  1 - Req  [2020-12-11 13:57:24] Request at "/getClients". Parameters are : {id: undefined, guid: undefined, first: Eugene, last: undefined, street: undefined, city: undefined, zip: undefined}
  2 - Log  [2020-12-11 13:57:24] getClients[6a0fdf.] - Process completed successfully. - (141.21329998970032ms)
  3 - Req  [2020-12-11 13:57:28] Request at "/getLogs". Parameters are : {uuid: undefined, dateStart: undefined, dateEnd: undefined, all: true}
  4 - Log  [2020-12-11 13:57:28] getLogs[6c65b5.] - Parameter "all" used succesfully - (3.136598974466324ms)
  5 - Log  [2020-12-11 13:57:28] getLogs[6c65b5.] - Process completed successfully. - (17.92179998755455ms)
  6 - Req  [2020-12-11 13:57:45] Request at "/getLogs". Parameters are : {uuid: undefined, dateStart: undefined, dateEnd: undefined, all: true}
  7 - Log  [2020-12-11 13:57:45] getLogs[76711f.] - Parameter "all" used succesfully - (1.9009000062942505ms)
  8 - Log  [2020-12-11 13:57:45] getLogs[76711f.] - Process completed successfully. - (18.925298988819122ms)
  9 - Req  [2020-12-11 14:04:36] Request at "/".
  ```

# Liste des codes d'erreurs :

- 10: Miscancellous authentification error.
- 11: Authentification error, The login or password is incorrect.
- 12: Authentification error, The token is invalid or don't have the right permissions or the token is missing.
- 20: Miscancellous get error.
- 21-2N: Get error, The N parameters (token excluded) is invalid.

# Troubleshooting :

If you have some issues installing the server on windows, follow instructions of this :
https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/troubleshooting.md
