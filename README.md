# Installation

```
npm i -g yarn
npm i -g nodemon
sudo yarn install
```

Then, edit "./src/app.ts", put you're ip address and set the config you want.

Finally, in function of the plateform you're using,

```
yarn start-wnd
yarn start-linux
```

# Request list :

- GET : "/" : Give you info about the server.
  The response looks like :

```json
{
  "name": "APINAME",
  "version": "1.0.0"
}
```

- GET: "/getClients" (Params(not required): id(number), guid(string), first(string), last(string), street(string), city(string), zip(number)): Permit to get a list of the clients in functions of the parameters.
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

- GET: "/getLogs" (Params(not required): all(boolean), guestId(number), uuid(string), dateStart(string), dateEnd(string)) : Permit to check logs, these parameters are options. "all" permit to see all logs, not only this month. guestId, uuid, dateStart, dateEnd are filters. dateStart and dateEnd have to be this way : "YYYY-MM-DDThh:mm:ss", for example, "2020-03-24T11:15:00".

# Troubleshooting :

If you have some issues installing the server on windows, follow instructions of this :
https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/troubleshooting.md
