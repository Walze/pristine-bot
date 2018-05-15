import { Requirements } from "../../classes/Requirements";
import { actionType } from '../../types';
import Act from '../../classes/Act';
import Axios from 'axios';
import { JSDOM } from 'jsdom';


const requirements: Requirements = {
  params: {
    obligatory: false,
    props: ['amount']
  }
}

const description = 'Give you the google definition of a word'

const action: actionType = async req => {
  return await Axios.get(`https://www.google.com.br/search?q=${req.text}+meaning`)
    .then(async res => {
      const dom = new JSDOM(res.data, {
        contentType: "text/html",
        includeNodeLocations: true
      })
      const doc = dom.window.document

      const nounsLIs = doc.querySelectorAll('#ires > ol > div:nth-child(1) > div > table:nth-child(2) > tbody > tr:nth-child(1) > td > ol li')
      const verbsLIs = doc.querySelectorAll('#ires > ol > div:nth-child(1) > div > table:nth-child(2) > tbody > tr:nth-child(2) > td > ol li')

      const nouns: string[] = []
      const verbs: string[] = []

      if (nounsLIs) nounsLIs.forEach(el => nouns.push(el.innerHTML))
      if (verbsLIs) verbsLIs.forEach(el => verbs.push(el.innerHTML))

      const all = nouns.concat(verbs)

      const embed = {
        embed: {
          author: {
            name: req.msg.author.username,
            icon_url: req.msg.author.avatarURL
          },
          title: "Google definitions on " + req.text,
          fields: all.map((def, i) => {
            return {
              name: `#${i + 1}`,
              value: def
            }
          }),
          timestamp: new Date()
        }
      }


      if (all.length > 0)
        return await req.msg.channel.send(embed)
      else
        throw new Error('Not Found 404\'d')
    })
}


const googleDef = new Act(requirements, action, description)

export default googleDef