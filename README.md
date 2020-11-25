# Installation

```
npm i -g yarn
npm i -g nodemon
sudo yarn install
```

Then, edit "./src/app.ts", put you're ip address and set the config you want.

Finally,

```
yarn start
```

If you have some issues installing the server on windows, follow instructions of this :
https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/troubleshooting.md


# Request list :

- GET : "/" : Give you info about the server
- POST : "/print" (Params: first, last, top, corp, host, file) : Permit to print a card
- POST : "/card" x-www-form-urlencoded (Params: first, last, top, corp, host, file, guestId) : Permit to get a card visual
- GET : "/cardTest" (Param: host) : Permit to check the visual of a card and to do some tests
- POST : "/exit" (Params: guestId) : Permit to take note that a person exited the building
- GET: "/getPeople" (Params: onlyPeopleIn) : Permit to get a list of everyone in the base. If onlyPeopleIn is true, it will only give people in.
- GET: "/getHosts" : Permit to get a list of every hosting company available
- GET: "/getLogs" (Params(not required): all(boolean), guestId(number), uuid(string), dateStart(string), dateEnd(string)) : Permit to check logs, these parameters are options. "all" permit to see all logs, not only this month. guestId, uuid, dateStart, dateEnd are filters. dateStart and dateEnd have to be this way : "YYYY-MM-DDThh:mm:ss", for example, "2020-03-24T11:15:00"