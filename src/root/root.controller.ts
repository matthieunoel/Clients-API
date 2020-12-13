import { Get, Res, ContentType, JsonController, QueryParam } from 'routing-controllers'
import { Response } from 'express'
import { RootService } from './root.service'
import bodyParser = require('body-parser')
import { Logger } from './root.logSystem'
import { IRootResult, IClient, IClientResult, ITokenResult, ITolenValidityResponse } from './root.interfaces'

const fs = require('fs')

const version = require('../../package.json').version
const appName = require('../../package.json').name

@JsonController()
export class RootController {

    private logger: Logger = new Logger()

    constructor(
        private rootService: RootService
    ) {
        this.rootService.checkFolders()
        this.rootService.InitDB()
    }

    @Get('/')
    root(@Res() response: Response): IRootResult {
        this.logger.reqLog('Request at "/".')
        return {
            name: appName,
            version
        }
    }

    @Get('/getToken')
    async getToken(
        @QueryParam('login', { required: false }) login: string,
        @QueryParam('password', { required: false }) password: string
    ): Promise<ITokenResult> {
        this.logger.reqLog(`Request at "/getToken". Parameters are : {login: ${login}, password: }`)
        return await this.rootService.getToken(login, password)
    }

    @Get('/getTokenValidity')
    async getTokenValidity(
        @QueryParam('token', { required: false }) token: string
    ): Promise<ITolenValidityResponse> {
        this.logger.reqLog(`Request at "/getTokenValidity". Parameters are : {token: ${token}}`)
        return await this.rootService.getTokenValidity(token)
    }



    @Get('/getClients')
    async getClients(
        @QueryParam('token', { required: false }) token: string,
        @QueryParam('id', { required: false }) id: number,
        @QueryParam('guid', { required: false }) guid: string,
        @QueryParam('first', { required: false }) first: string,
        @QueryParam('last', { required: false }) last: string,
        @QueryParam('street', { required: false }) street: string,
        @QueryParam('city', { required: false }) city: string,
        @QueryParam('zip', { required: false }) zip: number
    ): Promise<IClientResult> {
        this.logger.reqLog(`Request at "/getClients". Parameters are : {id: ${id}, guid: ${guid}, first: ${first}, last: ${last}, street: ${street}, city: ${city}, zip: ${zip}}`)
        return await this.rootService.getClients(token, id, guid, first, last, street, city, zip)
    }

    @ContentType('text/plain')
    @Get('/getLogs')
    async seeLogs(
        @QueryParam('token', { required: false }) token: string,
        @QueryParam('uuid') uuid: string,
        @QueryParam('dateStart') dateStart: string,
        @QueryParam('dateEnd') dateEnd: string,
        @QueryParam('all') all: boolean
    ): Promise<string> {
        this.logger.reqLog(`Request at "/getLogs". Parameters are : {uuid: ${uuid}, dateStart: ${dateStart}, dateEnd: ${dateEnd}, all: ${all}}`)
        return await this.rootService.getLogs(token, uuid, all, dateStart, dateEnd)
    }

}