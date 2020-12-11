export interface IRootResult {
    name: any,
    version: any
}

export interface IClient {
    id?: number,
    guid: string,
    first: string,
    last: string,
    street: string,
    city: string,
    zip: number
}

export interface IClientResult {
    status: string,
    performanceMs: number,
    responseSize: number,
    response: IClient[]
}