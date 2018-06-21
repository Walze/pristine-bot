import { Message } from "discord.js"
import { at } from "../types"
import Commands from "./Commands"
import { log } from 'console'
import { indexObj } from '../helpers/obj_array'
import { Performances } from './Performances'

export interface DefaultParams { [key: string]: string }


// s-debug argument-value
// Eg. s-debug event-MEMBER_ADD_BAN amount-5 @wiva#9996
// params.argument will equals to value

export interface commandInfoType {
  name: string | null,
  hasPrefix: boolean
}

export interface propsType {
  command: commandInfoType;
  params: indexObj;
  text: string;
  ats: at[];
}

export default class Request {

  public command: string | null = null
  public text: string = ''
  public ats: at[] = []
  public params: DefaultParams = {}
  public hasPrefix: boolean = false

  private readonly _commandRegex = new RegExp(`^${Commands.prefix}(\\w+)`)
  private readonly _atsRegexGlobal = new RegExp(`<@!?(\\d+)>`, 'g')
  private readonly _atsRegex = new RegExp(`<@!?(\\d+)>`)
  private readonly _rolesRegexGlobal = new RegExp(`<@&(\\d+)>`, 'g')
  //private readonly _rolesRegex = new RegExp(`<@&(\\d+)>`)

  constructor(public readonly msg: Message) {
    if (this.msg.author.id === this.msg.client.user.id) return

    Performances.start('request')
    Performances.start('command')

    const props = this._filterProps()
    if (!props || !props.command.name) return

    this._setProperties(props)
    this._emit(props.command.name)
  }

  private _emit(command: string) {
    console.log(`\n\n|| emiting "${command}" request...`)
    Performances.find('request').end()

    Commands.event.emit(command, this)
  }

  private _setProperties(props: propsType) {
    this.command = props.command.name
    this.hasPrefix = props.command.hasPrefix
    this.params = props.params
    this.text = props.text
    this.ats = props.ats
  }

  private _filterProps(): propsType | void {
    const splits = this.msg.content.split(' ')

    let commandRegex = splits[0].match(this._commandRegex)
    let command: commandInfoType = { name: null, hasPrefix: false }

    if (commandRegex) {
      command.name = commandRegex[1]
      command.hasPrefix = true
    }
    else {
      // if no regex, tries to find non-prefix command
      command.name = this._getNonPrefixCommand()

      // if no non-prefix command found, returns
      if (!command.name) return
    }

    // remove command from split
    splits.splice(0, 1)

    // gets props
    const { params, ats } = this._getProps(splits)

    // joins remaining splits
    const filteredText = splits.filter(el => !!el).map(split => split.trim())
    const text = filteredText.join(' ')

    return {
      command,
      params,
      text,
      ats
    }
  }

  public getAt(pos: number): at {
    const at = this.ats.find((at, i) => i === pos && at.type === 'AT')
    if (!at) throw new Error('@ not found')

    return at
  }

  public getAtRole(pos: number): at {
    const at = this.ats.find((at, i) => i === pos && at.type === 'ROLE')
    if (!at) throw new Error('Role @ not found')

    return at
  }

  private _getNonPrefixCommand() {
    const command = Commands.includesCommand(this.msg.content)

    if (!command) return null
    if (command.action.required.prefix) return null

    return command.name
  }

  private _getProps(splits: string[]) {
    // starts props
    const params: indexObj = {}
    const ats: at[] = []

    // using array to pass reference so i won't have to do i = func()
    let i = [0];

    // get props and remove them from splits
    while (i[0] < splits.length) {
      const split = splits[i[0]];

      this._getParams(split, params, splits, i);
      this._getAts(split, ats, splits, i);
      this._getRoleAts(split, ats, splits, i);

      i[0]++;
    }

    return {
      params,
      ats
    }
  }

  private _getRoleAts(split: string, ats: at[], splits: string[], i: number[]) {
    if (!this._rolesRegexGlobal.test(split)) return false

    ats.push({
      type: 'ROLE',
      tag: split,
      id: split.replace(/<@&!?/g, '').replace(/>/g, '')
    })
    splits.splice(i[0], 1)
    i[0]--

    return true
  }

  private _getAts(split: string, ats: at[], splits: string[], i: number[]) {
    if (!this._atsRegexGlobal.test(split)) return false

    const match = split.match(this._atsRegexGlobal)
    const match2 = split.match(this._atsRegex)

    if (!match || !match2) return false

    ats.push({
      type: 'AT',
      tag: split,
      id: match2[1]
    })
    splits.splice(i[0], 1)
    i[0]--

    return true
  }

  private _getParams(split: string, params: indexObj, splits: string[], i: number[]) {
    const param = split.split(Commands.separator)

    if (!param[1]) return false

    params[param[0]] = param[1]
    splits.splice(i[0], 1)
    i[0]--

    return true
  }

  public log(logBool?: boolean, ...args: any[]): object {
    const filtered: any = {}

    for (let prop in this)
      if (prop[0] != '_' && prop != 'msg')
        filtered[prop] = this[prop]

    if (logBool)
      log(filtered, ...args)

    return filtered
  }
}