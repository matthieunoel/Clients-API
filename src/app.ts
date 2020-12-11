import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { RootController } from './root/root.controller'
const express = require('express')
import Container from 'typedi'
import { ILogin } from './root/root.interfaces'

useContainer(Container)

export class Config {

  public static Port: number = 5000
  // public static Ip: string = '192.168.1.105'
  public static Ip: string = '127.0.0.1'
  public static OnLinux: boolean = false
  public static devToolsActivated: boolean = false
  // tslint:disable-next-line: ban-types
  public static authentication: boolean = require('../authentication.json').authentication
  public static tokenDuration: number = require('../authentication.json').tokenDuration
  public static loginList: ILogin[] = require('../authentication.json').loginList

}

const app = createExpressServer({
  cors: true,
  controllers: [RootController]
})

// app.use('/spec', express.static('src/global/settings/ARM-settings'))
app.use('/static', express.static('src/static'))

app.listen(Config.Port, Config.Ip)