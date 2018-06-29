import * as Events from 'events'
import { isString } from 'util';
import Command from './Command';
import Action from './Action';

const event = new Events.EventEmitter()

export default class Commands {

  public static declarations: Command[] = []

  public static prefix = 's-'
  public static separator = '-'

  public static readonly events = event.eventNames()
  public static readonly event = event

  public static findEvent(name: string) {
    const found = this.event.eventNames().find((e) => {
      return isString(e) ? name.includes(e) : false
    })

    return found ? found : ''
  }

  public static includesCommand(text: string) {
    return this.declarations.find((cmd) => text.includes(cmd.name))
  }

  public static add(name: string, action: Action) {
    this.declarations.push(new Command(name, action))
  }

  public static find(name: string) {
    const found = this.declarations.find(cmd => cmd.name === name)

    if (!found) throw new Error(`Command "${name}" not found`)

    return found
  }

  public static log() {
    console.log(`Listening to ${this.declarations.length} Commands`)

    this.declarations.map((cmd, i) => {
      if (i % 2 === 0 && i + 1 < this.declarations.length)
        console.log(`| ${cmd.name} || ${this.declarations[i + 1].name} |`)
      else if (i + 1 === this.declarations.length)
        console.log(`| ${cmd.name} |`)
    })

  }
}