import { Get, Res, ContentType, UploadedFile, BodyParam, Post, Body, UseBefore, JsonController, Param, Req, QueryParam } from 'routing-controllers'
import { Response } from 'express'
import { RootService } from './root.service'
import bodyParser = require('body-parser')
import { Logger } from './root.logSystem'

const fs = require('fs')

const version = require('../../package.json').version
const appName = require('../../package.json').name

// export interface IPrint {
//     first: string
//     last: string
//     file: any
//     top: string
//     host: string
//     corp: string
// }

// export interface ICard {
//     first: string
//     last: string
//     file: any
//     top: string
//     corp: string
//     guestId: string
//     host: string
// }

export interface IRootResult {
    name: any,
    version: any
}

export interface IResult {
    status: string
    durationMs: number
}

@JsonController()
export class RootController {

    private logger: Logger = new Logger()

    constructor(
        private rootService: RootService
    ) {
        this.rootService.checkFolders()
        // this.logger.checkLogFiles()
        this.rootService.InitDB()
    }

    @Get('/')
    root(@Res() response: Response): IRootResult {
        this.logger.reqLog('Request at "/"')
        return {
            name: appName,
            version
        }
    }

    // @Post('/print')
    // async print(
    //     @UploadedFile('file', { options: { limits: { fieldSize: 1024 * 1024 * 1024 }, required: true } }) file: any,
    //     @BodyParam('first', { required: true }) first: string,
    //     @BodyParam('last', { required: true }) last: string,
    //     @BodyParam('top', { required: true }) top: string,
    //     @BodyParam('host', { required: true }) host: string,
    //     @BodyParam('corp', { required: true }) corp: string
    // ): Promise<IResult> {
    //     this.logger.reqLog('Request at "/print"')
    //     const form: IPrint = { first, last, file, top, corp, host }
    //     const durationMs = await this.rootService.print(form)
    //     return {
    //         status: 'ok',
    //         durationMs
    //     }
    // }

    // @Post('/card')
    // @UseBefore(bodyParser.urlencoded())
    // @ContentType('text/html')
    // card(@Body() form: any): Promise<string> {
    //     this.logger.reqLog('Request at "/card"')
    //     const cardParams: ICard = { first: form.first, last: form.last, top: form.top, corp: form.corp, guestId: form.guestId, file: form.file, host: form.host }
    //     return this.rootService.card(cardParams)
    // }

    // @Get('/cardTest')
    // @ContentType('text/html')
    // cardGet(
    //     @QueryParam('host', { required: true }) host: string
    // ): Promise<string> {
    //     this.logger.reqLog('Request at "/cardTest"')
    //     const cardParams: ICard = { first: 'Prenom-Prenom', last: 'Nom-Nom-Nom', top: 'TOPTEXTTEST', corp: 'Entreprise Entreprise Entreprise', guestId: '00000000', host, file: 'https://img.over-blog-kiwi.com/3/01/95/52/20190211/ob_b5ce37_test-homme-profile-face.jpg' }
    //     return this.rootService.card(cardParams)
    // }

    // @Post('/exit')
    // async exit(
    //     // TODO: kick out the "X" file shit, but if you juste delete the line, it's not working anymore :/
    //     @UploadedFile('X', { options: { limits: { fieldSize: 1024 * 1024 * 1024 }, required: false } }) X: any,
    //     @BodyParam('guestId', { required: true }) guestId: string,
    // ): Promise<any> {
    //     this.logger.reqLog('Request at "/exit"')
    //     const durationMs = await this.rootService.exit(guestId)
    //     return {
    //         status: 'ok',
    //         durationMs
    //     }
    // }

    // @Get('/getPeople')
    // async getPeople(
    //     // @Param('onlyPeopleIn') onlyPeopleIn: boolean
    //     @QueryParam('onlyPeopleIn', { required: true }) onlyPeopleIn: boolean
    // ) {
    //     this.logger.reqLog('Request at "/getPeople"')
    //     return await this.rootService.getPeople(onlyPeopleIn)
    // }

    @ContentType('text/plain')
    @Get('/getLogs')
    async seeLogs(
        @QueryParam('guestId') guestId: number,
        @QueryParam('uuid') uuid: string,
        @QueryParam('dateStart') dateStart: string,
        @QueryParam('dateEnd') dateEnd: string,
        @QueryParam('all') all: boolean
    ) {
        this.logger.reqLog('Request at "/getLogs"')
        return await this.rootService.getLogs(guestId, uuid, all, dateStart, dateEnd)
    }

    // @Get('/getHosts')
    // async getHosts() {
    //     this.logger.reqLog('Request at "/getHosts"')
    //     return await this.rootService.getHosts()
    // }

}