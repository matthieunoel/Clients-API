import { Browser, Page } from 'puppeteer'

const ejs = require('ejs')
const puppeteer = require('puppeteer')
const printer = require('pdf-to-printer')
const uuidv1 = require('uuid/v1')
const fs = require('fs')
const fsPromise = require('fs').promises
const Database = require('better-sqlite3')

import { performance } from 'perf_hooks'
import { IPrint, ICard } from './root.controller'
import { Config } from '../app'
import { NodeInterceptor } from '../global/subScripts/b64Treatment'
import { Logger } from './root.logSystem'

export class RootService {

    private logger: Logger = new Logger()

    async print(formData: IPrint): Promise<number> {

        const perfStart = performance.now()
        const uuid: string = uuidv1()

        try {

            let avoidPrinting: boolean = false

            const db = new Database('./db/facial.db'/*, { verbose: this.logger.log }*/)

            let request: string = 'CREATE TABLE IF NOT EXISTS guest(id INTEGER PRIMARY KEY AUTOINCREMENT, first TEXT, last TEXT, corpFrom TEXT, corpTo TEXT, status NUMERIC, enteredMoment DATETIME, exitMoment DATETIME, processUuid TEXT);'
            let info = db.prepare(request).run()
            // TODO: fix this please
            // if (info.changes > 0) {
            //     this.logger.log('#- TABLE CREATION', request, ` - (${performance.now() - perfStart}ms)`)
            // }

            request = `INSERT INTO guest (first, last, corpFrom, corpTo, status, processUuid) VALUES ('${formData.first}', '${formData.last}', '${formData.corp}', 'EVERIAL', 0, '${uuid}')`
            info = db.prepare(request).run()
            this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `SQLITE:"${request}": Ok` + ` - (${performance.now() - perfStart}ms)`)

            const guestId = info.lastInsertRowid
            this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `Guest ID : ${guestId}` + ` - (${performance.now() - perfStart}ms)`)

            const pictPath: string = './tmp/' + uuid + '.png'

            await fsPromise.writeFile(pictPath, '')
            this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `File ${pictPath} has been created successfully.` + ` - (${performance.now() - perfStart}ms)`)

            let browser: Browser

            if (Config.devToolsActivated) {
                if (Config.OnLinux) {
                    browser = await puppeteer.launch({ devtools: true, executablePath: 'chromium-browser' })
                } else {
                    browser = await puppeteer.launch({ devtools: true })
                }
            } else {
                if (Config.OnLinux) {
                    browser = await puppeteer.launch({ executablePath: 'chromium-browser' })
                } else {
                    browser = await puppeteer.launch()
                }
            }

            const page: Page = await browser.newPage()

            const url: string = `http://${Config.Ip}:${Config.Port}/card`

            let pictDataString: string = ''

            if (formData.file.buffer.toString().startsWith('data:')) {
                pictDataString = encodeURIComponent(formData.file.buffer.toString())
                this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + 'Info : picture is already formated for webdisplay')
            }
            else {
                pictDataString = encodeURIComponent(`data:${formData.file.mimetype};base64,${formData.file.buffer.toString('base64')}`)
                this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `Picture formating successfull (${decodeURIComponent(pictDataString).slice(0, 64)}...)` + ` - (${performance.now() - perfStart}ms)`)
            }

            const subResult = NodeInterceptor.b64UTF8PostTreatmentPicture(formData)
            if (subResult !== '') {
                pictDataString = subResult
            }

            let intercept: boolean = true
            await page.setRequestInterception(true)

            let postParams: string = ''

            page.on('request', interceptedRequest => {
                if (intercept) {
                    interceptedRequest.continue({
                        'method': 'POST',
                        'postData': postParams,
                        'headers': {
                            ...interceptedRequest.headers(),
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                    this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + 'Request alteration success' + ` - (${performance.now() - perfStart}ms)`)
                    intercept = false
                }
                else {
                    interceptedRequest.continue()
                }
            })


            this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `Request sent to "${url}"` + ` - (${performance.now() - perfStart}ms)`)

            postParams = `first=${formData.first}&last=${formData.last}&corp=${formData.corp}&top=${formData.top}&guestId=${await this.extendNumber(guestId, 8)}&host=${formData.host}&file=${pictDataString}`
            await page.goto(url)
            this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + 'Request answered' + ` - (${performance.now() - perfStart}ms)`)


            await page.screenshot({
                path: pictPath,
                clip: {
                    x: 0,
                    y: 0,
                    height: 582.336,
                    width: 367.236
                }
            })
            this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `File ${pictPath} has been written successfully.` + ` - (${performance.now() - perfStart}ms)`)

            if (!Config.devToolsActivated) {
                await browser.close()
            }
            // TODO : in the v2, get a buffer from screenshot and send this buffer to the printer, to avoid filesystem access

            if (!avoidPrinting) {

                await printer.print(pictPath)
                this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `File ${pictPath} has been sent to printer successfully.` + ` - (${performance.now() - perfStart}ms)`)

                request = `UPDATE guest SET status = 1, enteredMoment = CURRENT_TIMESTAMP WHERE id = ${guestId}`
                info = db.prepare(request).run()
                this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `SQLITE:"${request}": Ok` + ` - (${performance.now() - perfStart}ms)`)
            }
            else {
                this.logger.warn(`print[${uuid.slice(0, 6)}.] - ` + 'Printing aborted')
            }

            await fsPromise.unlink(pictPath)
            this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `File ${pictPath} has been deleted successfully.` + ` - (${performance.now() - perfStart}ms)`)

            db.close()

            return await new Promise<number>((resolve, reject) => {
                const perfEnd: number = performance.now() - perfStart
                resolve(perfEnd)
                this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
            })

        } catch (error) {

            this.logger.error(`print[${uuid.slice(0, 6)}.] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
            throw error

        }
    }

    async card(postData: ICard): Promise<string> {

        // await this.logger.checkLogFiles()
        const perfStart = performance.now()
        const uuid: string = uuidv1()

        try {

            // TODO: Make a link the DB to know which logo and css apply to the card
            // const hostLogo: string = '/static/everial.png'


            // TODO : Makes dates in function of culture
            const today = new Date()

            let day: string = today.getDate().toString()
            if (day.length === 1) {
                day = '0' + day
            }

            let month: string = (today.getMonth() + 1).toString()
            if (month.length === 1) {
                month = '0' + month
            }

            const year: string = today.getFullYear().toString()

            const date = `${day}/${month}/${year}`


            const params = {
                first: postData.first,
                last: postData.last,
                file: postData.file,
                top: postData.top,
                corp: postData.corp,
                date,
                guestId: postData.guestId,
                hostCss: `/static/customDesigns/${postData.host}/style.css`,
                hostLogo: `/static/customDesigns/${postData.host}/logo.png`
            }

            return new Promise<string>(async (resolve, reject) => {

                await ejs.renderFile('./src/root/card.html', params, { async: true }, (err: any, str: any) => {
                    const perfEnd: number = performance.now() - perfStart
                    resolve(str)
                    this.logger.log(`card[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
                })
            }
            )

        } catch (error) {

            this.logger.error(`card[${uuid.slice(0, 6)}.] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
            throw error

        }
    }

    async exit(guestId: string): Promise<number> {

        // await this.logger.checkLogFiles()
        const perfStart = performance.now()
        const uuid: string = uuidv1()

        try {

            const db = new Database('./db/facial.db'/*, { verbose: this.logger.log }*/)
            // this.logger.log(`print[${uuid.slice(0, 6)}.] - ` + '"./db/facial.db" opened succesfully ' + ` - (${performance.now() - perfStart}ms)`)

            let request = `SELECT status FROM guest WHERE id = ${guestId}`
            let guest = db.prepare(request).get()
            if (guest.status !== 1) {
                throw new Error('This guest status isn\'t 1') // Wich mean he isn't inside ...
            }

            request = `UPDATE guest SET status = 2, exitMoment = CURRENT_TIMESTAMP WHERE id = ${guestId}`
            let info = db.prepare(request).run()
            this.logger.log(`exit[${uuid.slice(0, 6)}.] - ` + `[${request}]: Ok` + ` - (${performance.now() - perfStart}ms)`)

            db.close()
            // this.logger.log('#- "./db/facial.db" closed succesfully ' + ` - (${performance.now() - perfStart}ms)`)


            return await new Promise<number>((resolve, reject) => {
                const perfEnd: number = performance.now() - perfStart
                resolve(perfEnd)
                this.logger.log(`exit[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
            })

        } catch (error) {

            this.logger.error(`exit[${uuid.slice(0, 6)}.] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
            throw error

        }

    }

    async getPeople(onlyPeopleIn: boolean): Promise<any> {

        // await this.logger.checkLogFiles()
        const perfStart = performance.now()
        const uuid: string = uuidv1()

        try {

            let result: any

            const db = new Database('./db/facial.db'/*, { verbose: this.logger.log }*/)
            // this.logger.log('#- "./db/facial.db" opened succesfully ' + ` - (${performance.now() - perfStart}ms)`)

            if (onlyPeopleIn) {

                let request = `SELECT * FROM guest WHERE status = 1`
                result = db.prepare(request).all()
                this.logger.log(`getPeople[${uuid.slice(0, 6)}.] - ` + `SQLITE:"${request}": Ok` + ` - (${performance.now() - perfStart}ms)`)

            }
            else {

                let request = `SELECT * FROM guest`
                result = db.prepare(request).all()
                this.logger.log(`getPeople[${uuid.slice(0, 6)}.] - ` + `SQLITE:"${request}": Ok` + ` - (${performance.now() - perfStart}ms)`)

            }

            db.close()
            // this.logger.log('#- "./db/facial.db" closed succesfully ' + ` - (${performance.now() - perfStart}ms)`)

            const perfEnd: number = performance.now() - perfStart
            this.logger.log(`getPeople[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
            return result

        } catch (error) {

            this.logger.error(`getPeople[${uuid.slice(0, 6)}.] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
            throw error

        }

    }

    async getHosts() {

        // await this.logger.checkLogFiles()
        const perfStart = performance.now()
        const uuid: string = uuidv1()

        try {

            const files = await fsPromise.readdir('./src/static/customDesigns/')
            const ignore = (await fsPromise.readFile('./.hostignore')).toString().replace(/\r/g, '').split('\n')
            const response: string[] = []
            files.forEach((file: any) => {
                if (!ignore.includes(file.toString())) {
                    response.push(file.toString())
                }
            })

            const perfEnd: number = performance.now() - perfStart
            this.logger.log(`getHosts[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
            return response

        } catch (error) {

            this.logger.error(`getHosts[${uuid.slice(0, 6)}.] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
            throw error

        }

    }

    async getLogs(guestId: number, paramUuid: string, all: boolean, dateStart: string, dateEnd: string) {

        const perfStart = performance.now()
        const uuid: string = uuidv1()

        try {

            let res: string = ''
            const month = await this.extendNumber(parseInt(('0' + (new Date(Date.now()).getMonth() + 1)).slice(-2), 10), 2)
            const year = await this.extendNumber(new Date(Date.now()).getFullYear(), 4)
            const actualLogPath: string = `./log/facial-server-${year}-${month}.log`

            let logsList: string[] = []

            if (all) {

                const files = await fsPromise.readdir('./log/')

                for (let index = 0; index < files.length; index++) {
                    const file = files[index]
                    logsList.push(...(await fsPromise.readFile(`./log/${file}`)).toString().split('\r\n'))
                }

                this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameter "all" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

            }
            else {

                logsList.push(...(await fsPromise.readFile(actualLogPath)).toString().split('\r\n'))

            }

            if (guestId != undefined || paramUuid != undefined) {

                if (paramUuid == undefined) {

                    console.log(guestId)
                    const db = new Database('./db/facial.db')
                    const request = `SELECT processUuid FROM guest WHERE id=${guestId}`
                    paramUuid = db.prepare(request).get().processUuid
                    this.logger.log(`onlyPeopleIn[${uuid.slice(0, 6)}.] - ` + `SQLITE:"${request}": Ok` + ` - (${performance.now() - perfStart}ms)`)
                    db.close()
                }

                const tmpList: string[] = logsList
                logsList = []

                for (let index = 0; index < tmpList.length; index++) {
                    const log = tmpList[index]
                    if (log.toString().includes(`[${paramUuid.slice(0, 6)}.]`)) {
                        logsList.push(log)
                    }
                }

                this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameters "guestId" or "uuid" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

            }

            if (dateStart != undefined) {

                const dateReference: Date = new Date(dateStart)

                const tmpList: string[] = logsList
                logsList = []

                for (let index = 0; index < tmpList.length; index++) {
                    const log = tmpList[index]
                    const comparedDate: Date = new Date(tmpList[index].slice(6, 25).replace(' ', 'T'))
                    if (comparedDate >= dateReference) {
                        logsList.push(log)
                    }
                }

                this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameter "dateStart" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

            }

            if (dateEnd != undefined) {

                const dateReference: Date = new Date(dateEnd)

                const tmpList: string[] = logsList
                logsList = []

                for (let index = 0; index < tmpList.length; index++) {
                    const log = tmpList[index]
                    const comparedDate: Date = new Date(tmpList[index].slice(6, 25).replace(' ', 'T'))
                    if (comparedDate <= dateReference) {
                        logsList.push(log)
                    }
                }

                this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameter "dateEnd" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

            }

            if (logsList.length > 0) {

                for (let index = 0; index < logsList.length; index++) {
                    const log = logsList[index]
                    if (log !== '') {
                        res += `${await this.extendNumber(index + 1, (logsList.length + 1).toString().split('').length)} - ${log}\r\n`
                    }
                }

            } else {
                res = 'There are no logs'
            }

            const perfEnd: number = performance.now() - perfStart
            this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)

            return res

        } catch (error) {

            this.logger.error(`getLogs[${uuid.slice(0, 6)}.] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
            throw error

        }

    }

    public async checkFolders() {

        try {
            fs.mkdirSync('./db/')
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error
            }
        }

        try {
            fs.mkdirSync('./tmp/')
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error
            }
        }

        try {
            fs.mkdirSync('./log/')
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error
            }
        }

    }

    // public async checkLogFiles() {
    //     console.log('Changing !')
    //     await fsPromise.copyFile('./log/facial-server.log', './log/old-facial-server.log')
    //     await fsPromise.unlink('./log/facial-server.log')
    //     setTimeout(() => { this.checkLogFiles() }, 60000)
    // }

    private async extendNumber(value: number, extraZero: any) {
        // await this.logger.checkLogFiles()
        const valueStr: string = value.toString()
        if (valueStr.length < extraZero) {
            let zeroStr: string = ''
            for (let index = 0; index < extraZero - valueStr.length; index++) {
                zeroStr += '0'
            }
            return zeroStr + valueStr
        }
        else {
            // this.logger.warn(`It would be time to purge the base, this warning appears only if the id value is higher than a number with ${extraZero} numerals`)
            return valueStr
        }
    }

}
